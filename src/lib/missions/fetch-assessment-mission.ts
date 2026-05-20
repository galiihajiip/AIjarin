import {
  buildAssessmentQuestions,
  getAssessmentType,
  toPublicQuestions,
  type AssessmentType,
  type PublicAssessmentQuestion,
} from '@/lib/missions/assessment-flow';
import { canAccessPosttest } from '@/lib/missions/fetch-assessment-access';
import { createClient } from '@/lib/supabase/server';
import type { JsonValue } from '@/types';
import { UserRole } from '@/types';

export type AssessmentMissionData = {
  misiId: string;
  misiNama: string;
  assessmentType: AssessmentType;
  levelId: string;
  levelNomor: number;
  levelNama: string;
  storyText: string;
  questions: PublicAssessmentQuestion[];
  timeLimitSeconds: number;
};

const DEFAULT_ASSESSMENT_SECONDS = 600;

type MisiRow = {
  id: string;
  level_id: string;
  nama: string;
  time_limit_seconds: number | null;
  konten_json: JsonValue;
  cerita_cutscene: string | null;
  levels:
    | { id: string; nomor: number; nama: string }
    | { id: string; nomor: number; nama: string }[]
    | null;
};

type SoalRow = {
  id: string;
  urutan: number;
  pertanyaan: string;
  pilihan_json: JsonValue | null;
  jawaban_benar: JsonValue;
};

function getLevelMeta(levels: MisiRow['levels']): {
  id: string;
  nomor: number;
  nama: string;
} {
  const level = Array.isArray(levels) ? levels[0] : levels;
  return {
    id: level?.id ?? '',
    nomor: level?.nomor ?? 1,
    nama: level?.nama ?? 'Level SIGMA',
  };
}

function getStoryText(misi: MisiRow): string {
  if (misi.cerita_cutscene?.trim()) {
    return misi.cerita_cutscene.trim();
  }

  if (misi.konten_json && typeof misi.konten_json === 'object') {
    const content = misi.konten_json as Record<string, JsonValue>;
    if (typeof content.instruksi === 'string' && content.instruksi.trim()) {
      return content.instruksi.trim();
    }
  }

  return 'Kerjakan semua soal dengan tenang. Tidak ada petunjuk atau chatbot pada tes ini.';
}

export async function fetchAssessmentMission(
  misiId: string
): Promise<AssessmentMissionData | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== UserRole.Siswa) {
    return null;
  }

  const { data: misi, error } = await supabase
    .from('misi')
    .select(
      `
      id,
      level_id,
      nama,
      time_limit_seconds,
      konten_json,
      cerita_cutscene,
      levels ( id, nomor, nama )
    `
    )
    .eq('id', misiId)
    .single<MisiRow>();

  if (error || !misi) {
    return null;
  }

  const assessmentType = getAssessmentType(misi.konten_json);
  if (!assessmentType) {
    return null;
  }

  if (assessmentType === 'posttest') {
    const allowed = await canAccessPosttest(user.id, misi.level_id);
    if (!allowed) {
      return null;
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

  return {
    misiId: misi.id,
    misiNama: misi.nama,
    assessmentType,
    levelId: level.id,
    levelNomor: level.nomor,
    levelNama: level.nama,
    storyText: getStoryText(misi),
    questions: toPublicQuestions(questions),
    timeLimitSeconds:
      misi.time_limit_seconds && misi.time_limit_seconds > 0
        ? misi.time_limit_seconds
        : DEFAULT_ASSESSMENT_SECONDS,
  };
}
