import { createClient } from '@/lib/supabase/server';
import { getAssessmentType } from '@/lib/missions/assessment-flow';
import type { JsonValue } from '@/types';
import { MisiStatus, UserRole } from '@/types';

export type AssessmentGateReason =
  | 'pretest_required'
  | 'posttest_locked'
  | null;

export type AssessmentGate = {
  blocked: boolean;
  reason: AssessmentGateReason;
  levelId: string;
  levelNomor: number;
  levelNama: string;
  pretestMisiId: string | null;
  posttestMisiId: string | null;
};

type MisiRow = {
  id: string;
  level_id: string;
  urutan: number;
  is_assessment: boolean | null;
  is_boss_challenge: boolean | null;
  konten_json: JsonValue;
  levels:
    | { id: string; nomor: number; nama: string }
    | { id: string; nomor: number; nama: string }[]
    | null;
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

async function isLevelCleared(
  supabase: ReturnType<typeof createClient>,
  siswaId: string,
  levelId: string
): Promise<boolean> {
  const { count: totalMisi, error: misiError } = await supabase
    .from('misi')
    .select('id', { count: 'exact', head: true })
    .eq('level_id', levelId)
    .eq('is_assessment', false);

  if (misiError || !totalMisi) {
    return false;
  }

  const { count: completedMisi, error: progressError } = await supabase
    .from('siswa_progress')
    .select('id, misi!inner(level_id)', { count: 'exact', head: true })
    .eq('siswa_id', siswaId)
    .eq('status', MisiStatus.Completed)
    .eq('misi.level_id', levelId)
    .eq('misi.is_assessment', false);

  if (progressError) {
    return false;
  }

  return completedMisi === totalMisi;
}

export async function getAssessmentGateForMission(
  misiId: string,
  siswaId: string
): Promise<AssessmentGate | null> {
  const supabase = createClient();

  const { data: misi, error } = await supabase
    .from('misi')
    .select(
      `
      id,
      level_id,
      urutan,
      is_assessment,
      is_boss_challenge,
      konten_json,
      levels ( id, nomor, nama )
    `
    )
    .eq('id', misiId)
    .single<MisiRow>();

  if (error || !misi) {
    return null;
  }

  const level = getLevelMeta(misi.levels);
  const assessmentType = getAssessmentType(misi.konten_json);

  const { data: levelMissions } = await supabase
    .from('misi')
    .select('id, konten_json, is_assessment')
    .eq('level_id', misi.level_id)
    .order('urutan', { ascending: true });

  const pretestMisi =
    levelMissions?.find(
      (row) => getAssessmentType(row.konten_json as JsonValue) === 'pretest'
    ) ?? null;
  const posttestMisi =
    levelMissions?.find(
      (row) => getAssessmentType(row.konten_json as JsonValue) === 'posttest'
    ) ?? null;

  const gate: AssessmentGate = {
    blocked: false,
    reason: null,
    levelId: level.id,
    levelNomor: level.nomor,
    levelNama: level.nama,
    pretestMisiId: pretestMisi?.id ?? null,
    posttestMisiId: posttestMisi?.id ?? null,
  };

  if (assessmentType === 'pretest' || assessmentType === 'posttest') {
    return gate;
  }

  const { data: pretestResult } = await supabase
    .from('pretest_results')
    .select('id')
    .eq('siswa_id', siswaId)
    .eq('level_id', misi.level_id)
    .maybeSingle();

  if (!pretestResult) {
    return {
      ...gate,
      blocked: true,
      reason: 'pretest_required',
    };
  }

  return gate;
}

export async function canAccessPosttest(
  siswaId: string,
  levelId: string
): Promise<boolean> {
  const supabase = createClient();
  return isLevelCleared(supabase, siswaId, levelId);
}

export async function assertStudentCanPlayMission(
  misiId: string
): Promise<{ allowed: boolean; gate: AssessmentGate | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, gate: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== UserRole.Siswa) {
    return { allowed: false, gate: null };
  }

  const { data: misi } = await supabase
    .from('misi')
    .select('id, level_id, konten_json, is_assessment')
    .eq('id', misiId)
    .maybeSingle();

  if (!misi) {
    return { allowed: false, gate: null };
  }

  const assessmentType = getAssessmentType(misi.konten_json as JsonValue);

  if (assessmentType === 'posttest') {
    const cleared = await canAccessPosttest(user.id, misi.level_id);
    if (!cleared) {
      const gate = await getAssessmentGateForMission(misiId, user.id);
      return {
        allowed: false,
        gate: gate
          ? { ...gate, blocked: true, reason: 'posttest_locked' }
          : null,
      };
    }
    return { allowed: true, gate: null };
  }

  if (assessmentType === 'pretest') {
    return { allowed: true, gate: null };
  }

  const gate = await getAssessmentGateForMission(misiId, user.id);
  if (gate?.blocked) {
    return { allowed: false, gate };
  }

  return { allowed: true, gate: null };
}
