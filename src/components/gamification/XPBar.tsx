'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { calculateLevelFromXP, getXpProgress } from '@/lib/gamification/xp';
import { cn } from '@/lib/utils';

type XPBarProps = {
  totalXP: number;
  /** Prior XP total — used to animate fill and detect level-up */
  previousXP?: number;
  className?: string;
  onLevelUpDismiss?: () => void;
};

type LevelUpCelebrationProps = {
  level: number;
  onDismiss: () => void;
};

function LevelUpCelebration({ level, onDismiss }: LevelUpCelebrationProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, reduceMotion ? 1200 : 3200);
    return () => window.clearTimeout(timer);
  }, [onDismiss, reduceMotion]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-sigma-navy/90 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
    >
      {!reduceMotion &&
        Array.from({ length: 12 }).map((_, index) => (
          <motion.span
            key={index}
            className="pointer-events-none absolute h-2 w-2 rounded-full bg-sigma-gold"
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0.4],
              x: Math.cos((index / 12) * Math.PI * 2) * 140,
              y: Math.sin((index / 12) * Math.PI * 2) * 140,
            }}
            transition={{
              duration: 1.2,
              delay: index * 0.04,
              ease: 'easeOut',
            }}
          />
        ))}

      <motion.div
        className="relative max-w-sm rounded-2xl border border-sigma-cyan/40 bg-slate-900 p-8 text-center shadow-2xl shadow-sigma-cyan/20"
        initial={reduceMotion ? { opacity: 0 } : { scale: 0.6, opacity: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <motion.div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sigma-gold/20 text-sigma-gold"
          animate={
            reduceMotion
              ? undefined
              : { rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }
          }
          transition={{ duration: 0.8, repeat: 2 }}
        >
          <Sparkles className="h-9 w-9" aria-hidden />
        </motion.div>
        <p className="text-sm font-medium uppercase tracking-widest text-sigma-cyan">
          Naik Level!
        </p>
        <h2 id="level-up-title" className="mt-2 text-3xl font-bold text-white">
          Level {level}
        </h2>
        <p className="mt-3 text-sm text-slate-300">
          Keren banget, Agen! Terus semangat ya!
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 rounded-lg bg-sigma-cyan px-5 py-2 text-sm font-semibold text-sigma-navy transition-colors hover:bg-sigma-cyan/90"
        >
          Lanjutkan
        </button>
      </motion.div>
    </motion.div>
  );
}

export function XPBar({
  totalXP,
  previousXP,
  className,
  onLevelUpDismiss,
}: XPBarProps) {
  const reduceMotion = useReducedMotion();
  const progress = getXpProgress(totalXP);
  const lastXpRef = useRef(totalXP);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [celebrationLevel, setCelebrationLevel] = useState(progress.level);

  useEffect(() => {
    const baselineXp = previousXP ?? lastXpRef.current;
    const oldLevel = calculateLevelFromXP(baselineXp);
    const newLevel = calculateLevelFromXP(totalXP);

    if (newLevel > oldLevel && totalXP > baselineXp) {
      setCelebrationLevel(newLevel);
      setShowLevelUp(true);
    }

    lastXpRef.current = totalXP;
  }, [totalXP, previousXP]);

  const handleDismissLevelUp = () => {
    setShowLevelUp(false);
    onLevelUpDismiss?.();
  };

  const progressLabel =
    progress.nextLevelXp != null
      ? `Level ${progress.level} • ${progress.currentXp} / ${progress.nextLevelXp} XP`
      : `Level ${progress.level} • ${progress.currentXp} XP (Maks)`;

  const ariaNow = progress.currentXp - progress.levelFloorXp;
  const ariaMax =
    progress.nextLevelXp != null
      ? progress.nextLevelXp - progress.levelFloorXp
      : Math.max(ariaNow, 1);

  return (
    <>
      <motion.div
        className={cn('w-full space-y-2', className)}
        layout
        initial={false}
      >
        <motion.div
          className="flex items-center justify-between gap-2 text-sm"
          key={progressLabel}
          initial={false}
          animate={{ opacity: 1 }}
        >
          <span className="font-semibold text-slate-100">{progressLabel}</span>
          {progress.nextLevelXp != null && progress.xpNeededForNextLevel > 0 ? (
            <span className="shrink-0 text-slate-400">
              {progress.xpNeededForNextLevel} XP lagi
            </span>
          ) : null}
        </motion.div>

        <motion.div
          className="h-3 w-full overflow-hidden rounded-full bg-slate-800 ring-1 ring-slate-700/80"
          role="progressbar"
          aria-valuenow={Math.round(ariaNow)}
          aria-valuemin={0}
          aria-valuemax={Math.max(ariaMax, 1)}
          aria-label={progressLabel}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-sigma-cyan via-cyan-400 to-sigma-gold"
            initial={false}
            animate={{ width: `${progress.progressPercent}%` }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 90, damping: 18 }
            }
          />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showLevelUp ? (
          <LevelUpCelebration
            level={celebrationLevel}
            onDismiss={handleDismissLevelUp}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
