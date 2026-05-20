import { NextResponse } from 'next/server';
import { z } from 'zod';

import { completeMission } from '@/app/actions/completeMission';
import { gradeMissionWithAi } from '@/lib/ai/grader';
import { createClient } from '@/lib/supabase/server';
import type { JsonValue } from '@/types';
import { MisiType, UserRole } from '@/types';

const gradeRequestSchema = z.object({
  misiType: z.enum([MisiType.CodeTyping, MisiType.Project]),
  userAnswer: z.unknown(),
  kontenJson: z.unknown(),
  siswaId: z.string().uuid(),
  misiId: z.string().uuid(),
});

type MisiRow = {
  id: string;
  tipe: string;
  konten_json: JsonValue;
};

export async function POST(request: Request) {
  const payload = gradeRequestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Payload auto-grader tidak valid.',
      },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Kamu harus masuk dulu untuk dinilai.' },
      { status: 401 }
    );
  }

  if (payload.data.siswaId !== user.id) {
    return NextResponse.json(
      { success: false, error: 'Siswa tidak sesuai dengan sesi login.' },
      { status: 403 }
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== UserRole.Siswa) {
    return NextResponse.json(
      { success: false, error: 'Hanya siswa yang bisa mengirim jawaban.' },
      { status: 403 }
    );
  }

  const { data: misi, error: misiError } = await supabase
    .from('misi')
    .select('id, tipe, konten_json')
    .eq('id', payload.data.misiId)
    .single<MisiRow>();

  if (misiError || !misi) {
    return NextResponse.json(
      { success: false, error: 'Misi tidak ditemukan.' },
      { status: 404 }
    );
  }

  if (misi.tipe !== payload.data.misiType) {
    return NextResponse.json(
      { success: false, error: 'Tipe misi tidak sesuai.' },
      { status: 400 }
    );
  }

  try {
    const grading = await gradeMissionWithAi({
      misiType: payload.data.misiType,
      userAnswer: payload.data.userAnswer,
      // Konten dari DB dipakai sebagai sumber kebenaran agar rubrik tidak bisa dimanipulasi client.
      kontenJson: misi.konten_json ?? (payload.data.kontenJson as JsonValue),
    });

    const completion = await completeMission({
      misiId: payload.data.misiId,
      score: grading.skor,
    });

    return NextResponse.json({
      success: true,
      grading,
      completion,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Auto-grader belum bisa menilai jawaban kamu.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
