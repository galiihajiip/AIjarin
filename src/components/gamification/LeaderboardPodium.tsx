import { Crown } from 'lucide-react';

import { LeaderboardAvatar } from '@/components/gamification/LeaderboardAvatar';
import type { LeaderboardEntry } from '@/lib/gamification/fetch-leaderboard';
import { cn } from '@/lib/utils';

type LeaderboardPodiumProps = {
  topThree: LeaderboardEntry[];
  currentUserId: string;
};

/** Visual order: 2nd, 1st, 3rd */
const PODIUM_SLOT_INDEX = [1, 0, 2] as const;

const podiumStyles = [
  {
    rank: 1,
    label: 'Juara 1',
    bar: 'h-28 bg-gradient-to-t from-amber-600/80 to-amber-400/90',
    ring: 'ring-amber-400',
    text: 'text-amber-300',
  },
  {
    rank: 2,
    label: 'Juara 2',
    bar: 'h-20 bg-gradient-to-t from-slate-500/80 to-slate-300/80',
    ring: 'ring-slate-300',
    text: 'text-slate-200',
  },
  {
    rank: 3,
    label: 'Juara 3',
    bar: 'h-16 bg-gradient-to-t from-orange-800/80 to-orange-500/70',
    ring: 'ring-orange-400',
    text: 'text-orange-300',
  },
] as const;

export function LeaderboardPodium({
  topThree,
  currentUserId,
}: LeaderboardPodiumProps) {
  if (topThree.length === 0) {
    return null;
  }

  const slots = PODIUM_SLOT_INDEX.map((index) => topThree[index] ?? null);

  return (
    <section className="mb-8" aria-label="Podium tiga besar leaderboard">
      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {slots.map((entry, slotIndex) => {
          const style = podiumStyles[slotIndex];
          const isFirst = style.rank === 1;

          if (!entry) {
            return (
              <div
                key={`empty-${style.rank}`}
                className="flex w-[30%] max-w-[8.5rem] flex-col items-center opacity-40"
              />
            );
          }

          const isCurrentUser = entry.siswaId === currentUserId;

          return (
            <div
              key={entry.siswaId}
              className={cn(
                'flex w-[30%] max-w-[8.5rem] flex-col items-center',
                isFirst && 'sm:-mt-2'
              )}
            >
              <div
                className={cn(
                  'relative mb-3 flex flex-col items-center rounded-2xl px-2 py-3',
                  isCurrentUser && 'bg-sigma-cyan/10 ring-2 ring-sigma-cyan/50'
                )}
              >
                {isFirst ? (
                  <Crown className="mb-1 h-6 w-6 text-amber-400" aria-hidden />
                ) : null}
                <LeaderboardAvatar
                  nama={entry.nama}
                  avatarUrl={entry.avatarUrl}
                  size={isFirst ? 'lg' : 'md'}
                  className={cn('ring-2', style.ring)}
                />
                <p
                  className={cn(
                    'mt-2 max-w-full truncate text-center text-sm font-semibold text-white',
                    isCurrentUser && 'text-sigma-cyan'
                  )}
                >
                  {entry.nama}
                  {isCurrentUser ? ' (Kamu)' : ''}
                </p>
                <p className={cn('text-xs font-medium', style.text)}>
                  {entry.totalXp.toLocaleString('id-ID')} XP
                </p>
                <p className="text-[10px] text-slate-400">
                  🔥 {entry.currentStreak} hari
                </p>
              </div>

              <div
                className={cn(
                  'flex w-full flex-col items-center justify-end rounded-t-lg px-2 pb-2 pt-3',
                  style.bar
                )}
              >
                <span className="text-lg font-bold text-white">
                  #{entry.rank}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-white/80">
                  {style.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
