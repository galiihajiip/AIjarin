'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useMemo } from 'react';

import {
  buildStreakWeekDays,
  isStreakAtRiskToday,
} from '@/lib/gamification/streak-calendar';
import { cn } from '@/lib/utils';

type StreakWidgetProps = {
  currentStreak: number;
  lastActiveDate?: string | null;
  className?: string;
};

export function StreakWidget({
  currentStreak,
  lastActiveDate = null,
  className,
}: StreakWidgetProps) {
  const reduceMotion = useReducedMotion();
  const safeStreak = Math.max(0, currentStreak);

  const weekDays = useMemo(
    () => buildStreakWeekDays(safeStreak, lastActiveDate),
    [safeStreak, lastActiveDate]
  );

  const atRiskToday = useMemo(
    () => isStreakAtRiskToday(safeStreak, lastActiveDate),
    [safeStreak, lastActiveDate]
  );

  const streakLabel =
    safeStreak > 0
      ? `🔥 ${safeStreak} hari berturut-turut!`
      : '🔥 Mulai streak-mu hari ini!';

  return (
    <section
      className={cn(
        'rounded-xl border border-slate-700/80 bg-slate-900/90 p-4',
        atRiskToday &&
          'ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.15)]',
        className
      )}
      aria-label={`Streak belajar: ${safeStreak} hari berturut-turut`}
    >
      <div className="flex items-center gap-3">
        <motion.div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
            safeStreak > 0
              ? 'bg-orange-500/20 text-orange-400'
              : 'bg-slate-800 text-slate-500'
          )}
          animate={
            safeStreak > 0 && !reduceMotion
              ? { scale: [1, 1.08, 1], opacity: [1, 0.92, 1] }
              : undefined
          }
          transition={
            safeStreak > 0 && !reduceMotion
              ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
        >
          <Flame
            className={cn('h-7 w-7', safeStreak > 0 && 'fill-orange-400/30')}
            aria-hidden
          />
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-tight text-white">
            {streakLabel}
          </p>
          {atRiskToday ? (
            <p className="mt-1 text-xs text-amber-300/90">
              Belum ada misi hari ini — selesaikan satu misi agar streak tetap
              hidup!
            </p>
          ) : safeStreak > 0 ? (
            <p className="mt-1 text-xs text-slate-400">
              Kamu sudah aktif hari ini. Pertahankan ya!
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              Selesaikan misi hari ini untuk memulai streak.
            </p>
          )}
        </div>
      </div>

      <div
        className="mt-4 flex justify-between gap-1"
        role="group"
        aria-label="Kalender streak minggu ini"
      >
        {weekDays.map((day) => (
          <motion.div
            key={day.date}
            className="flex flex-1 flex-col items-center gap-1.5"
            title={`${day.label}: ${day.isActive ? 'Aktif' : 'Belum aktif'}`}
          >
            <span className="text-[10px] font-medium uppercase text-slate-500">
              {day.label}
            </span>
            <motion.span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                day.isActive
                  ? 'border-orange-400 bg-orange-500/30 text-orange-200'
                  : 'border-slate-600 bg-slate-800 text-slate-600',
                day.isToday &&
                  'ring-2 ring-sigma-cyan/60 ring-offset-1 ring-offset-slate-900'
              )}
              initial={false}
              animate={
                day.isActive && !reduceMotion
                  ? { scale: [1, 1.06, 1] }
                  : { scale: 1 }
              }
              transition={
                day.isActive && !reduceMotion
                  ? {
                      duration: 2,
                      repeat: Infinity,
                      delay: (day.label.charCodeAt(0) % 5) * 0.1,
                    }
                  : undefined
              }
              aria-label={`${day.label} ${day.isActive ? 'aktif' : 'tidak aktif'}${day.isToday ? ', hari ini' : ''}`}
            >
              {day.isActive ? '✓' : ''}
            </motion.span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
