import { Flame } from 'lucide-react';

import { LeaderboardAvatar } from '@/components/gamification/LeaderboardAvatar';
import type { LeaderboardEntry } from '@/lib/gamification/fetch-leaderboard';
import { cn } from '@/lib/utils';

const LIST_TOP_RANK = 10;

type LeaderboardListProps = {
  entries: LeaderboardEntry[];
  currentUserId: string;
};

function LeaderboardRow({
  entry,
  isCurrentUser,
  sticky,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  sticky?: boolean;
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2.5 sm:px-4',
        isCurrentUser
          ? 'border-sigma-cyan/50 bg-sigma-cyan/10'
          : 'border-slate-700/60 bg-slate-900/50',
        sticky && 'shadow-lg shadow-black/30'
      )}
    >
      <span
        className={cn(
          'w-8 shrink-0 text-center text-sm font-bold tabular-nums',
          isCurrentUser ? 'text-sigma-cyan' : 'text-slate-400'
        )}
      >
        #{entry.rank}
      </span>
      <LeaderboardAvatar
        nama={entry.nama}
        avatarUrl={entry.avatarUrl}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-semibold',
            isCurrentUser ? 'text-sigma-cyan' : 'text-white'
          )}
        >
          {entry.nama}
          {isCurrentUser ? ' (Kamu)' : ''}
        </p>
        <p className="flex items-center gap-2 text-xs text-slate-400">
          <span>{entry.totalXp.toLocaleString('id-ID')} XP</span>
          <span className="inline-flex items-center gap-0.5">
            <Flame className="h-3 w-3 text-orange-400" aria-hidden />
            {entry.currentStreak}
          </span>
        </p>
      </div>
    </li>
  );
}

export function LeaderboardList({
  entries,
  currentUserId,
}: LeaderboardListProps) {
  const listEntries = entries.filter((entry) => entry.rank > 3);
  const visibleList = listEntries.filter(
    (entry) => entry.rank <= LIST_TOP_RANK
  );

  const currentUser = entries.find((entry) => entry.siswaId === currentUserId);
  const showStickySelf =
    currentUser != null &&
    (currentUser.rank > LIST_TOP_RANK ||
      !visibleList.some((entry) => entry.siswaId === currentUserId));

  if (listEntries.length === 0 && !showStickySelf) {
    return (
      <p className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-6 text-center text-sm text-slate-400">
        Belum ada peringkat lain di sekolahmu. Ajak teman untuk bersaing!
      </p>
    );
  }

  return (
    <section aria-label="Daftar peringkat leaderboard">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Peringkat lengkap
      </h2>

      <div className="relative">
        <ol className="space-y-2">
          {visibleList.map((entry) => (
            <LeaderboardRow
              key={entry.siswaId}
              entry={entry}
              isCurrentUser={entry.siswaId === currentUserId}
            />
          ))}
        </ol>

        {showStickySelf && currentUser ? (
          <div className="sticky bottom-4 z-10 mt-3 border-t border-slate-700/80 bg-sigma-navy/95 pt-3 backdrop-blur-sm">
            <p className="mb-2 text-center text-xs text-slate-400">
              Peringkatmu
            </p>
            <LeaderboardRow entry={currentUser} isCurrentUser sticky />
          </div>
        ) : null}
      </div>
    </section>
  );
}
