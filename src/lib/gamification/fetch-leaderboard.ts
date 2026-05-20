import { createClient } from '@/lib/supabase/server';

export type LeaderboardEntry = {
  siswaId: string;
  rank: number;
  totalXp: number;
  currentStreak: number;
  nama: string;
  avatarUrl: string | null;
};

type LeaderboardRow = {
  siswa_id: string;
  rank: number | null;
  total_xp: number | null;
  current_streak: number | null;
  updated_at: string | null;
  profiles:
    | { nama_lengkap: string; avatar_url: string | null }
    | { nama_lengkap: string; avatar_url: string | null }[]
    | null;
};

function mapRow(row: LeaderboardRow, index: number): LeaderboardEntry | null {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  if (!profile?.nama_lengkap) {
    return null;
  }

  return {
    siswaId: row.siswa_id,
    rank: row.rank ?? index + 1,
    totalXp: row.total_xp ?? 0,
    currentStreak: row.current_streak ?? 0,
    nama: profile.nama_lengkap,
    avatarUrl: profile.avatar_url,
  };
}

export async function fetchSchoolLeaderboard(sekolahId: string): Promise<{
  entries: LeaderboardEntry[];
  updatedAt: string | null;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('leaderboard_cache')
    .select(
      `
      siswa_id,
      rank,
      total_xp,
      current_streak,
      updated_at,
      profiles (
        nama_lengkap,
        avatar_url
      )
    `
    )
    .eq('sekolah_id', sekolahId)
    .order('rank', { ascending: true, nullsFirst: false })
    .order('total_xp', { ascending: false });

  if (error) {
    throw new Error(`Gagal memuat leaderboard: ${error.message}`);
  }

  const entries = (data ?? [])
    .map((row, index) => mapRow(row as LeaderboardRow, index))
    .filter((entry): entry is LeaderboardEntry => entry !== null);

  const updatedAt =
    data?.reduce<string | null>((latest, row) => {
      const rowUpdated = row.updated_at as string | null;
      if (!rowUpdated) return latest;
      if (!latest || rowUpdated > latest) return rowUpdated;
      return latest;
    }, null) ?? null;

  return { entries, updatedAt };
}
