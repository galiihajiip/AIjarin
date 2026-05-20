'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  buildAssessmentQuestions,
  getAssessmentType,
  scoreAssessment,
  type AssessmentType,
} from '@/lib/missions/assessment-flow';
import { canAccessPosttest } from '@/lib/missions/fetch-assessment-access';
import { createClient } from '@/lib/supabase/server';
import type { JsonValue } from '@/types';
import { UserRole } from '@/types';

const submitSchema = z.object({
  misiId: z.string().uuid(),
  answers: z.record(z.string(), z.string()),
  timeSpentSeconds: z.number().int().min(0).optional(),
});

export type SubmitAssessmentResult = {
  success: boolean;
  assessmentType: AssessmentType;
  score: number;
  correctCount: number;
  totalQuestions: number;
  ngainKategori?: string | null;
  ngainValue?: number | null;
  pretestScore?: number | null;
  posttestScore?: number | null;
  error?: string;
};

type MisiRow = {
  id: string;
  level_id: string;
  konten_json: JsonValue;
  levels: { nomor: number; nama: string } | { nomor: number; nama: string }[];
};

type SoalRow = {
  id: string;
  urutan: number;
  pertanyaan: string;
  pilihan_json: JsonValue | null;
  jawaban_benar: JsonValue;
};

function getLevelMeta(levels: MisiRow['levels']): {
  nomor: number;
  nama: string;
} {
  const level = Array.isArray(levels) ? levels[0] : levels;
  return {
    nomor: level?.nomor ?? 1,
    nama: level?.nama ?? 'Level SIGMA',
  };
}

function formatKategoriLabel(kategori: string | null | undefined): string {
  if (!kategori) return 'Sedang';
  const normalized = kategori.toLowerCase();
  if (normalized === 'tinggi') return 'Tinggi';
  if (normalized === 'rendah') return 'Rendah';
  return 'Sedang';
}

export async function submitAssessment(
  input: z.infer<typeof submitSchema>
): Promise<SubmitAssessmentResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      assessmentType: 'pretest',
      score: 0,
      correctCount: 0,
      totalQuestions: 0,
      error: 'Data tes tidak valid.',
    };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      assessmentType: 'pretest',
      score: 0,
      correctCount: 0,
      totalQuestions: 0,
      error: 'Kamu harus masuk dulu untuk mengirim tes.',
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== UserRole.Siswa) {
    return {
      success: false,
      assessmentType: 'pretest',
      score: 0,
      correctCount: 0,
      totalQuestions: 0,
      error: 'Hanya siswa yang bisa mengirim tes.',
    };
  }

  const { data: misi, error: misiError } = await supabase
    .from('misi')
    .select('id, level_id, konten_json, levels(nomor, nama)')
    .eq('id', parsed.data.misiId)
    .single<MisiRow>();

  if (misiError || !misi) {
    return {
      success: false,
      assessmentType: 'pretest',
      score: 0,
      correctCount: 0,
      totalQuestions: 0,
      error: 'Misi tes tidak ditemukan.',
    };
  }

  const assessmentType = getAssessmentType(misi.konten_json);
  if (!assessmentType) {
    return {
      success: false,
      assessmentType: 'pretest',
      score: 0,
      correctCount: 0,
      totalQuestions: 0,
      error: 'Misi ini bukan pre-test atau post-test.',
    };
  }

  if (assessmentType === 'posttest') {
    const canTake = await canAccessPosttest(user.id, misi.level_id);
    if (!canTake) {
      return {
        success: false,
        assessmentType: 'posttest',
        score: 0,
        correctCount: 0,
        totalQuestions: 0,
        error:
          'Post-test baru terbuka setelah semua misi level dan boss challenge selesai.',
      };
    }
  }

  const { data: soalRows } = await supabase
    .from('soal')
    .select('id, urutan, pertanyaan, pilihan_json, jawaban_benar')
    .eq('misi_id', misi.id)
    .order('urutan', { ascending: true })
    .returns<SoalRow[]>();

  const level = getLevelMeta(misi.levels);
  const questions = buildAssessmentQuestions(
    soalRows ?? [],
    level.nomor,
    level.nama,
    assessmentType
  );

  const { score, correctCount, totalQuestions } = scoreAssessment(
    questions,
    parsed.data.answers
  );

  const jawabanJson = {
    answers: parsed.data.answers,
    questionIds: questions.map((q) => q.id),
    timeSpentSeconds: parsed.data.timeSpentSeconds ?? null,
  };

  if (assessmentType === 'pretest') {
    const { error: insertError } = await supabase
      .from('pretest_results')
      .upsert(
        {
          siswa_id: user.id,
          level_id: misi.level_id,
          skor: score,
          jawaban_json: jawabanJson,
          taken_at: new Date().toISOString(),
        },
        { onConflict: 'siswa_id,level_id' }
      );

    if (insertError) {
      return {
        success: false,
        assessmentType: 'pretest',
        score: 0,
        correctCount: 0,
        totalQuestions: 0,
        error: `Gagal menyimpan pre-test: ${insertError.message}`,
      };
    }

    revalidatePath('/dashboard');
    revalidatePath(`/misi/${misi.id}`);

    return {
      success: true,
      assessmentType: 'pretest',
      score,
      correctCount,
      totalQuestions,
    };
  }

  const { error: postError } = await supabase.from('posttest_results').insert({
    siswa_id: user.id,
    level_id: misi.level_id,
    skor: score,
    jawaban_json: jawabanJson,
    taken_at: new Date().toISOString(),
  });

  if (postError) {
    return {
      success: false,
      assessmentType: 'posttest',
      score: 0,
      correctCount: 0,
      totalQuestions: 0,
      error: `Gagal menyimpan post-test: ${postError.message}`,
    };
  }

  const { data: ngainRow } = await supabase
    .from('ngain_scores')
    .select('ngain, kategori, skor_pretest, skor_posttest')
    .eq('siswa_id', user.id)
    .eq('level_id', misi.level_id)
    .maybeSingle();

  revalidatePath('/dashboard');
  revalidatePath(`/misi/${misi.id}`);

  return {
    success: true,
    assessmentType: 'posttest',
    score,
    correctCount,
    totalQuestions,
    ngainKategori: formatKategoriLabel(ngainRow?.kategori ?? null),
    ngainValue: ngainRow?.ngain ?? null,
    pretestScore: ngainRow?.skor_pretest ?? null,
    posttestScore: ngainRow?.skor_posttest ?? score,
  };
}
