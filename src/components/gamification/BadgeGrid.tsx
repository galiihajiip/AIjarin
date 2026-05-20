'use client';

import {
  BadgeCard,
  type BadgeDisplay,
} from '@/components/gamification/BadgeCard';
import { cn } from '@/lib/utils';

export type BadgeGridItem = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  icon_url: string | null;
  earned_at?: string | null;
};

type BadgeGridProps = {
  /** All badge definitions from the catalog */
  allBadges: BadgeGridItem[];
  /** IDs of badges the student has earned */
  earnedBadgeIds: string[];
  /** Map badge id → earned_at ISO string */
  earnedAtByBadgeId?: Record<string, string>;
  className?: string;
  emptyMessage?: string;
};

export function BadgeGrid({
  allBadges,
  earnedBadgeIds,
  earnedAtByBadgeId = {},
  className,
  emptyMessage = 'Belum ada badge di katalog.',
}: BadgeGridProps) {
  const earnedSet = new Set(earnedBadgeIds);

  const items: BadgeDisplay[] = allBadges
    .map((badge) => ({
      ...badge,
      isEarned: earnedSet.has(badge.id),
      earned_at: earnedAtByBadgeId[badge.id] ?? badge.earned_at ?? null,
    }))
    .sort((a, b) => {
      if (a.isEarned !== b.isEarned) {
        return a.isEarned ? -1 : 1;
      }
      return a.nama.localeCompare(b.nama, 'id');
    });

  if (items.length === 0) {
    return (
      <p className={cn('text-center text-sm text-slate-400', className)}>
        {emptyMessage}
      </p>
    );
  }

  const earnedCount = items.filter((item) => item.isEarned).length;

  return (
    <section className={cn('space-y-4', className)} aria-label="Koleksi badge">
      <p className="text-sm text-slate-400">
        {earnedCount} dari {items.length} badge kamu kumpulkan
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
        {items.map((badge) => (
          <li key={badge.id}>
            <BadgeCard
              badge={badge}
              className={cn(
                'h-full',
                !badge.isEarned && 'grayscale opacity-70'
              )}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
