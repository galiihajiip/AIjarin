'use client';

import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Award, Lock } from 'lucide-react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

export type BadgeDisplay = {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  icon_url: string | null;
  earned_at?: string | null;
  isEarned: boolean;
};

type BadgeCardProps = {
  badge: BadgeDisplay;
  className?: string;
  /** Larger layout for popups */
  variant?: 'default' | 'featured';
};

function formatEarnedDate(earnedAt: string): string {
  try {
    return format(parseISO(earnedAt), 'd MMM yyyy', { locale: localeId });
  } catch {
    return earnedAt;
  }
}

export function BadgeCard({
  badge,
  className,
  variant = 'default',
}: BadgeCardProps) {
  const isFeatured = variant === 'featured';

  return (
    <article
      className={cn(
        'flex flex-col items-center rounded-xl border p-4 text-center transition-colors',
        badge.isEarned
          ? 'border-sigma-cyan/30 bg-slate-900/80 shadow-sm shadow-sigma-cyan/10'
          : 'border-slate-700/60 bg-slate-900/40',
        className
      )}
      aria-label={
        badge.isEarned
          ? `Badge ${badge.nama}, diperoleh ${badge.earned_at ? formatEarnedDate(badge.earned_at) : ''}`
          : `Badge ${badge.nama}, terkunci`
      }
    >
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full',
          isFeatured ? 'mb-4 h-24 w-24' : 'mb-3 h-16 w-16',
          badge.isEarned
            ? 'bg-sigma-gold/15 ring-2 ring-sigma-gold/40'
            : 'bg-slate-800 ring-1 ring-slate-600'
        )}
      >
        {badge.icon_url ? (
          <Image
            src={badge.icon_url}
            alt=""
            width={isFeatured ? 64 : 40}
            height={isFeatured ? 64 : 40}
            className={cn(
              'rounded-full object-cover',
              !badge.isEarned && 'grayscale opacity-50'
            )}
          />
        ) : (
          <Award
            className={cn(
              isFeatured ? 'h-12 w-12' : 'h-8 w-8',
              badge.isEarned ? 'text-sigma-gold' : 'text-slate-500 grayscale'
            )}
            aria-hidden
          />
        )}
        {!badge.isEarned ? (
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 ring-2 ring-slate-900">
            <Lock className="h-3 w-3 text-slate-400" aria-hidden />
          </span>
        ) : null}
      </div>

      <h3
        className={cn(
          'font-semibold leading-tight',
          isFeatured ? 'text-lg text-white' : 'text-sm text-slate-100',
          !badge.isEarned && 'text-slate-500'
        )}
      >
        {badge.nama}
      </h3>

      <p
        className={cn(
          'mt-1 line-clamp-3',
          isFeatured ? 'text-sm text-slate-300' : 'text-xs text-slate-400',
          !badge.isEarned && 'text-slate-600'
        )}
      >
        {badge.deskripsi}
      </p>

      {badge.isEarned && badge.earned_at ? (
        <p className="mt-2 text-xs text-sigma-cyan">
          Diperoleh {formatEarnedDate(badge.earned_at)}
        </p>
      ) : !badge.isEarned ? (
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-600">
          Terkunci
        </p>
      ) : null}
    </article>
  );
}
