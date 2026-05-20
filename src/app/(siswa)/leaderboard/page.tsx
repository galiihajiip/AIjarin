import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Trophy } from 'lucide-react';
import { redirect } from 'next/navigation';

import { LeaderboardList } from '@/components/gamification/LeaderboardList';
import { LeaderboardPodium } from '@/components/gamification/LeaderboardPodium';
import { fetchSchoolLeaderboard } from '@/lib/gamification/fetch-leaderboard';
import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/types';

export const metadata = {
  title: 'Leaderboard — AIjarin',
  description: 'Peringkat XP siswa di sekolahmu',
};

function formatUpdatedAt(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return format(parseISO(iso), 'd MMMM yyyy, HH:mm', { locale: localeId });
  } catch {
    return null;
  }
}

export default async function LeaderboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/leaderboard');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, sekolah_id, nama_lengkap')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/login?redirect=/leaderboard');
  }

  if (profile.role !== UserRole.Siswa) {
    redirect('/login?redirect=/leaderboard');
  }

  if (!profile.sekolah_id) {
    return (
      <div className="space-y-4">
        <LeaderboardHeader />
        <p className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-4 py-8 text-center text-sm text-slate-400">
          Sekolahmu belum terhubung ke leaderboard. Hubungi guru untuk
          mengaktifkan fitur ini.
        </p>
      </div>
    );
  }

  let entries: Awaited<ReturnType<typeof fetchSchoolLeaderboard>>['entries'] =
    [];
  let updatedAt: string | null = null;

  try {
    const result = await fetchSchoolLeaderboard(profile.sekolah_id);
    entries = result.entries;
    updatedAt = result.updatedAt;
  } catch {
    return (
      <div className="space-y-4">
        <LeaderboardHeader />
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-8 text-center text-sm text-amber-100">
          Leaderboard belum bisa dimuat. Coba refresh halaman ya!
        </p>
      </div>
    );
  }

  const topThree = entries.filter((entry) => entry.rank <= 3);
  const formattedUpdated = formatUpdatedAt(updatedAt);

  return (
    <div className="space-y-6 pb-8">
      <LeaderboardHeader />

      {entries.length === 0 ? (
        <p className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-4 py-10 text-center text-sm text-slate-400">
          Belum ada data leaderboard di sekolahmu. Selesaikan misi pertama dan
          jadilah yang memimpin!
        </p>
      ) : (
        <>
          <LeaderboardPodium topThree={topThree} currentUserId={user.id} />
          <LeaderboardList entries={entries} currentUserId={user.id} />
        </>
      )}

      <p className="text-center text-xs text-slate-500">
        Data diperbarui setiap malam
        {formattedUpdated ? ` · Terakhir: ${formattedUpdated}` : ''}
      </p>
    </div>
  );
}

function LeaderboardHeader() {
  return (
    <header className="space-y-1">
      <div className="flex items-center gap-2">
        <Trophy className="h-7 w-7 text-sigma-gold" aria-hidden />
        <h1 className="text-2xl font-bold text-white">Leaderboard Sekolah</h1>
      </div>
      <p className="text-sm text-slate-400">
        Adu XP dengan sesama Agen SIGMA di sekolahmu!
      </p>
    </header>
  );
}
