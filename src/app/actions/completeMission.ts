'use server';

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  checkAndAwardBadges,
  type EarnedBadge,
} from '@/lib/gamification/badges';
import { updateStreak } from '@/lib/gamification/streak';
import { calculateLevelFromXP, calculateXP } from '@/lib/gamification/xp';
import { createClient } from '@/lib/supabase/server';
import { MisiStatus, UserRole } from '@/types';

export type CompleteMissionInput = {
  misiId: string;
  score: number;
  timeSpentSeconds?: number;
};

export type CompleteMissionResult = {
  xpEarned: number;
  newBadges: EarnedBadge[];
  streakUpdated: boolean;
  levelUp: boolean;
};

type MisiRow = {
  id: string;
  level_id: string;
  urutan: number;
  xp_reward: number | null;
  time_limit_seconds: number | null;
  is_boss_challenge: boolean | null;
  levels: { nomor: number } | { nomor: number }[] | null;
};

type ProgressRow = {
  status: string;
  attempts: number | null;
  best_score: number | null;
  time_spent_seconds: number | null;
  xp_earned: number | null;
};

type StatsRow = {
  total_xp: number | null;
  total_misi_completed: number | null;
  current_level: number | null;
};

function getLevelNomor(misi: MisiRow): number {
  const levels = misi.levels;
  if (Array.isArray(levels)) {
    return levels[0]?.nomor ?? 1;
  }
  return levels?.nomor ?? 1;
}

async function isLevelCleared(
  supabase: SupabaseClient,
  siswaId: string,
  levelId: string
): Promise<boolean> {
  const { count: totalMisi, error: misiError } = await supabase
    .from('misi')
    .select('id', { count: 'exact', head: true })
    .eq('level_id', levelId);

  if (misiError) {
    throw new Error(`Gagal menghitung misi level: ${misiError.message}`);
  }

  if (!totalMisi) {
    return false;
  }

  const { count: completedMisi, error: progressError } = await supabase
    .from('siswa_progress')
    .select('id, misi!inner(level_id)', { count: 'exact', head: true })
    .eq('siswa_id', siswaId)
    .eq('status', MisiStatus.Completed)
    .eq('misi.level_id', levelId);

  if (progressError) {
    throw new Error(`Gagal menghitung progres level: ${progressError.message}`);
  }

  return completedMisi === totalMisi;
}

async function assertMissionUnlocked(
  supabase: SupabaseClient,
  siswaId: string,
  misi: MisiRow
): Promise<void> {
  const { data: progress, error } = await supabase
    .from('siswa_progress')
    .select('status')
    .eq('siswa_id', siswaId)
    .eq('misi_id', misi.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memvalidasi progres misi: ${error.message}`);
  }

  if (progress?.status === MisiStatus.Locked) {
    throw new Error(
      'Misi ini masih terkunci. Selesaikan misi sebelumnya dulu ya!'
    );
  }

  if (progress) {
    return;
  }

  const { data: priorMisi, error: priorError } = await supabase
    .from('misi')
    .select('id')
    .eq('level_id', misi.level_id)
    .lt('urutan', misi.urutan)
    .order('urutan', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (priorError) {
    throw new Error(`Gagal memvalidasi urutan misi: ${priorError.message}`);
  }

  if (!priorMisi) {
    return;
  }

  const { data: priorProgress, error: priorProgressError } = await supabase
    .from('siswa_progress')
    .select('status')
    .eq('siswa_id', siswaId)
    .eq('misi_id', priorMisi.id)
    .maybeSingle();

  if (priorProgressError) {
    throw new Error(
      `Gagal memvalidasi progres misi sebelumnya: ${priorProgressError.message}`
    );
  }

  if (priorProgress?.status !== MisiStatus.Completed) {
    throw new Error(
      'Misi ini masih terkunci. Selesaikan misi sebelumnya dulu ya!'
    );
  }
}

async function unlockMissionAsAvailable(
  supabase: SupabaseClient,
  siswaId: string,
  misiId: string
): Promise<void> {
  const { data: existing, error: readError } = await supabase
    .from('siswa_progress')
    .select('status')
    .eq('siswa_id', siswaId)
    .eq('misi_id', misiId)
    .maybeSingle();

  if (readError) {
    throw new Error(`Gagal membaca progres unlock: ${readError.message}`);
  }

  if (existing?.status === MisiStatus.Completed) {
    return;
  }

  const { error } = await supabase.from('siswa_progress').upsert(
    {
      siswa_id: siswaId,
      misi_id: misiId,
      status: MisiStatus.Available,
    },
    { onConflict: 'siswa_id,misi_id' }
  );

  if (error) {
    throw new Error(`Gagal membuka misi berikutnya: ${error.message}`);
  }
}

async function unlockFollowingMissions(
  supabase: SupabaseClient,
  siswaId: string,
  misi: MisiRow
): Promise<boolean> {
  const levelCleared = await isLevelCleared(supabase, siswaId, misi.level_id);

  if (!levelCleared) {
    const { data: nextInLevel, error: nextError } = await supabase
      .from('misi')
      .select('id')
      .eq('level_id', misi.level_id)
      .gt('urutan', misi.urutan)
      .order('urutan', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextError) {
      throw new Error(`Gagal mencari misi berikutnya: ${nextError.message}`);
    }

    if (nextInLevel) {
      await unlockMissionAsAvailable(supabase, siswaId, nextInLevel.id);
    }

    return false;
  }

  const levelNomor = getLevelNomor(misi);
  const { data: nextLevel, error: levelError } = await supabase
    .from('levels')
    .select('id')
    .eq('nomor', levelNomor + 1)
    .maybeSingle();

  if (levelError) {
    throw new Error(`Gagal membaca level berikutnya: ${levelError.message}`);
  }

  if (!nextLevel) {
    return true;
  }

  const { data: firstMisi, error: firstMisiError } = await supabase
    .from('misi')
    .select('id')
    .eq('level_id', nextLevel.id)
    .order('urutan', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstMisiError) {
    throw new Error(
      `Gagal mencari misi level berikutnya: ${firstMisiError.message}`
    );
  }

  if (firstMisi) {
    await unlockMissionAsAvailable(supabase, siswaId, firstMisi.id);
  }

  return true;
}

function scheduleLeaderboardRefresh(
  supabase: SupabaseClient,
  sekolahId: string | null
): void {
  void supabase
    .rpc('refresh_leaderboard', { p_sekolah_id: sekolahId })
    .then(({ error }) => {
      if (error) {
        console.error(
          '[completeMission] refresh_leaderboard gagal:',
          error.message
        );
      }
    });
}

export async function completeMission(
  input: CompleteMissionInput
): Promise<CompleteMissionResult> {
  const { misiId, score, timeSpentSeconds } = input;

  if (!misiId) {
    throw new Error('ID misi wajib diisi.');
  }

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error('Skor harus antara 0 dan 100.');
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Kamu harus masuk dulu untuk menyelesaikan misi.');
  }

  const siswaId = user.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, sekolah_id')
    .eq('id', siswaId)
    .single();

  if (profileError || !profile) {
    throw new Error('Profil siswa tidak ditemukan.');
  }

  if (profile.role !== UserRole.Siswa) {
    throw new Error('Hanya siswa yang bisa menyelesaikan misi.');
  }

  const { data: misi, error: misiError } = await supabase
    .from('misi')
    .select(
      'id, level_id, urutan, xp_reward, time_limit_seconds, is_boss_challenge, levels(nomor)'
    )
    .eq('id', misiId)
    .single<MisiRow>();

  if (misiError || !misi) {
    throw new Error('Misi tidak ditemukan.');
  }

  await assertMissionUnlocked(supabase, siswaId, misi);

  const { data: existingProgress, error: progressReadError } = await supabase
    .from('siswa_progress')
    .select('status, attempts, best_score, time_spent_seconds, xp_earned')
    .eq('siswa_id', siswaId)
    .eq('misi_id', misiId)
    .maybeSingle<ProgressRow>();

  if (progressReadError) {
    throw new Error(`Gagal membaca progres misi: ${progressReadError.message}`);
  }

  const wasAlreadyCompleted = existingProgress?.status === MisiStatus.Completed;
  const attempt = (existingProgress?.attempts ?? 0) + 1;
  const xpEarned = calculateXP(
    misi.xp_reward ?? 0,
    attempt,
    score,
    timeSpentSeconds,
    misi.time_limit_seconds ?? undefined
  );

  const now = new Date().toISOString();
  const progressPayload: {
    siswa_id: string;
    misi_id: string;
    status: MisiStatus;
    attempts: number;
    best_score: number;
    time_spent_seconds: number;
    xp_earned: number;
    completed_at: string;
    started_at?: string;
  } = {
    siswa_id: siswaId,
    misi_id: misiId,
    status: MisiStatus.Completed,
    attempts: attempt,
    best_score: Math.max(existingProgress?.best_score ?? 0, score),
    time_spent_seconds:
      (existingProgress?.time_spent_seconds ?? 0) + (timeSpentSeconds ?? 0),
    xp_earned: Math.max(existingProgress?.xp_earned ?? 0, xpEarned),
    completed_at: now,
  };

  if (!existingProgress) {
    progressPayload.started_at = now;
  }

  const { error: progressWriteError } = await supabase
    .from('siswa_progress')
    .upsert(progressPayload, { onConflict: 'siswa_id,misi_id' });

  if (progressWriteError) {
    throw new Error(
      `Gagal menyimpan progres misi: ${progressWriteError.message}`
    );
  }

  const { data: stats, error: statsError } = await supabase
    .from('siswa_stats')
    .select('total_xp, total_misi_completed, current_level')
    .eq('siswa_id', siswaId)
    .single<StatsRow>();

  if (statsError || !stats) {
    throw new Error(`Gagal membaca statistik siswa: ${statsError?.message}`);
  }

  const previousTotalXp = stats.total_xp ?? 0;
  const newTotalXp = previousTotalXp + xpEarned;
  const previousAgentLevel = calculateLevelFromXP(previousTotalXp);
  const newAgentLevel = calculateLevelFromXP(newTotalXp);
  const levelUp = newAgentLevel > previousAgentLevel;

  const statsUpdate: {
    total_xp: number;
    current_level: number;
    total_misi_completed?: number;
    updated_at: string;
  } = {
    total_xp: newTotalXp,
    current_level: newAgentLevel,
    updated_at: now,
  };

  if (!wasAlreadyCompleted) {
    statsUpdate.total_misi_completed = (stats.total_misi_completed ?? 0) + 1;
  }

  const { error: statsUpdateError } = await supabase
    .from('siswa_stats')
    .update(statsUpdate)
    .eq('siswa_id', siswaId);

  if (statsUpdateError) {
    throw new Error(`Gagal memperbarui statistik: ${statsUpdateError.message}`);
  }

  const streakResult = await updateStreak(siswaId);
  const levelCleared = await unlockFollowingMissions(supabase, siswaId, misi);
  const levelNomor = getLevelNomor(misi);

  const newBadges = await checkAndAwardBadges(siswaId, {
    type: 'misi_selesai',
    payload: {
      totalMisiCompleted:
        statsUpdate.total_misi_completed ?? stats.total_misi_completed ?? 0,
      levelNomor: levelCleared ? levelNomor : undefined,
      isBoss: misi.is_boss_challenge ?? false,
    },
  });

  scheduleLeaderboardRefresh(supabase, profile.sekolah_id);

  return {
    xpEarned,
    newBadges,
    streakUpdated: streakResult.updated,
    levelUp,
  };
}
