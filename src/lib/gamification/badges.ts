import type { SupabaseClient } from '@supabase/supabase-js';

import { createAdminClient } from '@/lib/supabase/admin';
import type { JsonValue } from '@/types';

/** Significant actions that can unlock badges */
export type BadgeEventType =
  | 'misi_selesai'
  | 'streak'
  | 'xp_milestone'
  | 'level_clear'
  | 'boss'
  | 'ngain'
  | 'chatbot_free'
  | 'perfect_streak';

export type BadgeEvent =
  | {
      type: 'misi_selesai';
      payload: {
        totalMisiCompleted?: number;
        levelNomor?: number;
        isBoss?: boolean;
        bossDefeatedCount?: number;
      };
    }
  | {
      type: 'streak';
      payload: { currentStreak?: number };
    }
  | {
      type: 'xp_milestone';
      payload: { totalXp?: number };
    }
  | {
      type: 'level_clear';
      payload: { levelNomor: number };
    }
  | {
      type: 'boss';
      payload: { bossDefeatedCount?: number };
    }
  | {
      type: 'ngain';
      payload: { kategori: string; levelNomor?: number };
    }
  | {
      type: 'chatbot_free';
      payload: Record<string, never>;
    }
  | {
      type: 'perfect_streak';
      payload: { consecutiveCorrect: number };
    };

export type EarnedBadge = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  icon_url: string | null;
  earned_at: string;
};

type BadgeRow = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  icon_url: string | null;
  trigger_type: string;
  trigger_value: JsonValue;
  is_active: boolean | null;
};

type SiswaStatsRow = {
  total_xp: number | null;
  current_streak: number | null;
  total_misi_completed: number | null;
};

type BadgeEvaluationContext = {
  totalXp: number;
  currentStreak: number;
  totalMisiCompleted: number;
  bossDefeatedCount: number;
  consecutiveCorrect: number | null;
  clearedLevelNomor: number | null;
  ngainKategori: string | null;
};

function asRecord(value: JsonValue): Record<string, JsonValue> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, JsonValue>)
    : {};
}

function readNumber(
  record: Record<string, JsonValue>,
  key: string
): number | null {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readString(
  record: Record<string, JsonValue>,
  key: string
): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

function mergeContextFromEvent(
  stats: SiswaStatsRow,
  event: BadgeEvent
): BadgeEvaluationContext {
  const base: BadgeEvaluationContext = {
    totalXp: stats.total_xp ?? 0,
    currentStreak: stats.current_streak ?? 0,
    totalMisiCompleted: stats.total_misi_completed ?? 0,
    bossDefeatedCount: 0,
    consecutiveCorrect: null,
    clearedLevelNomor: null,
    ngainKategori: null,
  };

  switch (event.type) {
    case 'misi_selesai':
      return {
        ...base,
        totalMisiCompleted:
          event.payload.totalMisiCompleted ?? base.totalMisiCompleted,
        bossDefeatedCount: event.payload.bossDefeatedCount ?? 0,
        clearedLevelNomor: event.payload.levelNomor ?? null,
      };
    case 'streak':
      return {
        ...base,
        currentStreak: event.payload.currentStreak ?? base.currentStreak,
      };
    case 'xp_milestone':
      return {
        ...base,
        totalXp: event.payload.totalXp ?? base.totalXp,
      };
    case 'level_clear':
      return {
        ...base,
        clearedLevelNomor: event.payload.levelNomor,
      };
    case 'boss':
      return {
        ...base,
        bossDefeatedCount: event.payload.bossDefeatedCount ?? 0,
      };
    case 'ngain':
      return {
        ...base,
        ngainKategori: event.payload.kategori,
      };
    case 'perfect_streak':
      return {
        ...base,
        consecutiveCorrect: event.payload.consecutiveCorrect,
      };
    case 'chatbot_free':
      return base;
  }
}

async function countBossDefeated(
  supabase: SupabaseClient,
  siswaId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('siswa_progress')
    .select('id, misi!inner(is_boss_challenge)', {
      count: 'exact',
      head: true,
    })
    .eq('siswa_id', siswaId)
    .eq('status', 'completed')
    .eq('misi.is_boss_challenge', true);

  if (error) {
    throw new Error(`Gagal menghitung boss yang dikalahkan: ${error.message}`);
  }

  return count ?? 0;
}

async function isLevelCleared(
  supabase: SupabaseClient,
  siswaId: string,
  levelNomor: number
): Promise<boolean> {
  const { data: level, error: levelError } = await supabase
    .from('levels')
    .select('id')
    .eq('nomor', levelNomor)
    .maybeSingle();

  if (levelError) {
    throw new Error(`Gagal membaca level: ${levelError.message}`);
  }

  if (!level) {
    return false;
  }

  const { count: totalMisi, error: misiError } = await supabase
    .from('misi')
    .select('id', { count: 'exact', head: true })
    .eq('level_id', level.id);

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
    .eq('status', 'completed')
    .eq('misi.level_id', level.id);

  if (progressError) {
    throw new Error(`Gagal menghitung progres level: ${progressError.message}`);
  }

  return completedMisi === totalMisi;
}

async function hasNgainKategori(
  supabase: SupabaseClient,
  siswaId: string,
  kategori: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('ngain_scores')
    .select('id', { count: 'exact', head: true })
    .eq('siswa_id', siswaId)
    .ilike('kategori', kategori);

  if (error) {
    throw new Error(`Gagal membaca skor N-Gain: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

async function hasChatbotFreeCompletion(
  supabase: SupabaseClient,
  siswaId: string
): Promise<boolean> {
  const { count: chatCount, error: chatError } = await supabase
    .from('chatbot_logs')
    .select('id', { count: 'exact', head: true })
    .eq('siswa_id', siswaId);

  if (chatError) {
    throw new Error(`Gagal membaca log chatbot: ${chatError.message}`);
  }

  if ((chatCount ?? 0) > 0) {
    return false;
  }

  for (let levelNomor = 1; levelNomor <= 7; levelNomor += 1) {
    const cleared = await isLevelCleared(supabase, siswaId, levelNomor);
    if (!cleared) {
      return false;
    }
  }

  return true;
}

async function evaluateBadgeTrigger(
  supabase: SupabaseClient,
  siswaId: string,
  badge: BadgeRow,
  ctx: BadgeEvaluationContext
): Promise<boolean> {
  const trigger = asRecord(badge.trigger_value);

  switch (badge.trigger_type) {
    case 'misi_selesai': {
      const required = readNumber(trigger, 'count') ?? 1;
      return ctx.totalMisiCompleted >= required;
    }
    case 'streak': {
      const requiredDays = readNumber(trigger, 'days') ?? 1;
      return ctx.currentStreak >= requiredDays;
    }
    case 'xp_milestone': {
      const requiredXp = readNumber(trigger, 'xp') ?? 0;
      return ctx.totalXp >= requiredXp;
    }
    case 'level_clear': {
      const levelNomor = readNumber(trigger, 'level');
      if (levelNomor == null) {
        return false;
      }
      if (ctx.clearedLevelNomor === levelNomor) {
        return true;
      }
      return isLevelCleared(supabase, siswaId, levelNomor);
    }
    case 'boss': {
      const required = readNumber(trigger, 'count') ?? 1;
      const bossCount =
        ctx.bossDefeatedCount > 0
          ? ctx.bossDefeatedCount
          : await countBossDefeated(supabase, siswaId);
      return bossCount >= required;
    }
    case 'ngain': {
      const kategori = readString(trigger, 'kategori');
      if (!kategori) {
        return false;
      }
      if (
        ctx.ngainKategori &&
        ctx.ngainKategori.toLowerCase() === kategori.toLowerCase()
      ) {
        return true;
      }
      return hasNgainKategori(supabase, siswaId, kategori);
    }
    case 'chatbot_free':
      return hasChatbotFreeCompletion(supabase, siswaId);
    case 'perfect_streak': {
      const required = readNumber(trigger, 'count') ?? 1;
      return (ctx.consecutiveCorrect ?? 0) >= required;
    }
    default:
      return false;
  }
}

async function fetchUnearnedBadges(
  supabase: SupabaseClient,
  siswaId: string
): Promise<BadgeRow[]> {
  const [
    { data: badges, error: badgesError },
    { data: earned, error: earnedError },
  ] = await Promise.all([
    supabase
      .from('badges')
      .select(
        'id, kode, nama, deskripsi, icon_url, trigger_type, trigger_value, is_active'
      )
      .eq('is_active', true),
    supabase.from('siswa_badges').select('badge_id').eq('siswa_id', siswaId),
  ]);

  if (badgesError) {
    throw new Error(`Gagal membaca daftar badge: ${badgesError.message}`);
  }

  if (earnedError) {
    throw new Error(`Gagal membaca badge siswa: ${earnedError.message}`);
  }

  const earnedIds = new Set((earned ?? []).map((row) => row.badge_id));

  return (badges ?? []).filter(
    (badge) => !earnedIds.has(badge.id)
  ) as BadgeRow[];
}

/**
 * Evaluates all unearned badge triggers after a significant action and awards matches.
 */
export async function checkAndAwardBadges(
  siswaId: string,
  event: BadgeEvent
): Promise<EarnedBadge[]> {
  const supabase = createAdminClient();

  const [{ data: stats, error: statsError }, unearnedBadges] =
    await Promise.all([
      supabase
        .from('siswa_stats')
        .select('total_xp, current_streak, total_misi_completed')
        .eq('siswa_id', siswaId)
        .single<SiswaStatsRow>(),
      fetchUnearnedBadges(supabase, siswaId),
    ]);

  if (statsError) {
    throw new Error(`Gagal membaca statistik siswa: ${statsError.message}`);
  }

  if (!stats) {
    throw new Error('Statistik siswa tidak ditemukan.');
  }

  if (unearnedBadges.length === 0) {
    return [];
  }

  let ctx = mergeContextFromEvent(stats, event);

  if (
    event.type === 'boss' ||
    event.type === 'misi_selesai' ||
    unearnedBadges.some((badge) => badge.trigger_type === 'boss')
  ) {
    const bossDefeatedCount = await countBossDefeated(supabase, siswaId);
    ctx = { ...ctx, bossDefeatedCount };
  }

  const matched: BadgeRow[] = [];

  for (const badge of unearnedBadges) {
    const qualifies = await evaluateBadgeTrigger(supabase, siswaId, badge, ctx);
    if (qualifies) {
      matched.push(badge);
    }
  }

  if (matched.length === 0) {
    return [];
  }

  const earnedAt = new Date().toISOString();
  const { error: insertError } = await supabase.from('siswa_badges').insert(
    matched.map((badge) => ({
      siswa_id: siswaId,
      badge_id: badge.id,
      earned_at: earnedAt,
    }))
  );

  if (insertError) {
    throw new Error(`Gagal menyimpan badge siswa: ${insertError.message}`);
  }

  return matched.map((badge) => ({
    id: badge.id,
    kode: badge.kode,
    nama: badge.nama,
    deskripsi: badge.deskripsi,
    icon_url: badge.icon_url,
    earned_at: earnedAt,
  }));
}
