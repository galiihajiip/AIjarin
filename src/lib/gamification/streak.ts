import { parseISO, subDays, format } from 'date-fns';

import { createClient } from '@/lib/supabase/server';

const JAKARTA_TIMEZONE = 'Asia/Jakarta';

type SiswaStatsStreakRow = {
  current_streak: number | null;
  longest_streak: number | null;
  last_active_date: string | null;
};

export type StreakUpdateResult = {
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  /** Whether streak fields were written to the database */
  updated: boolean;
};

function formatCalendarDateInJakarta(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getYesterdayDateString(today: string): string {
  return format(subDays(parseISO(today), 1), 'yyyy-MM-dd');
}

/**
 * Pure streak transition from the previous active date (WIB calendar day).
 */
function computeStreakUpdate(
  lastActiveDate: string | null,
  currentStreak: number,
  longestStreak: number,
  today: string,
  yesterday: string
): StreakUpdateResult {
  const safeCurrent = Math.max(0, currentStreak);
  const safeLongest = Math.max(0, longestStreak);

  if (lastActiveDate === today) {
    return {
      current_streak: safeCurrent,
      longest_streak: safeLongest,
      last_active_date: today,
      updated: false,
    };
  }

  let nextStreak: number;
  if (lastActiveDate === yesterday) {
    nextStreak = safeCurrent + 1;
  } else {
    nextStreak = 1;
  }

  const nextLongest = Math.max(safeLongest, nextStreak);

  return {
    current_streak: nextStreak,
    longest_streak: nextLongest,
    last_active_date: today,
    updated: true,
  };
}

/**
 * Updates daily streak after a mission completion.
 * Uses WIB (Asia/Jakarta) calendar days for last_active_date comparison.
 */
export async function updateStreak(
  siswaId: string
): Promise<StreakUpdateResult> {
  const supabase = createClient();
  const today = formatCalendarDateInJakarta(new Date());
  const yesterday = getYesterdayDateString(today);

  const { data, error } = await supabase
    .from('siswa_stats')
    .select('current_streak, longest_streak, last_active_date')
    .eq('siswa_id', siswaId)
    .single<SiswaStatsStreakRow>();

  if (error) {
    throw new Error(`Gagal membaca streak siswa: ${error.message}`);
  }

  if (!data) {
    throw new Error('Statistik siswa tidak ditemukan.');
  }

  const next = computeStreakUpdate(
    data.last_active_date,
    data.current_streak ?? 0,
    data.longest_streak ?? 0,
    today,
    yesterday
  );

  if (!next.updated) {
    return next;
  }

  const { error: updateError } = await supabase
    .from('siswa_stats')
    .update({
      current_streak: next.current_streak,
      longest_streak: next.longest_streak,
      last_active_date: next.last_active_date,
      updated_at: new Date().toISOString(),
    })
    .eq('siswa_id', siswaId);

  if (updateError) {
    throw new Error(`Gagal memperbarui streak siswa: ${updateError.message}`);
  }

  return next;
}
