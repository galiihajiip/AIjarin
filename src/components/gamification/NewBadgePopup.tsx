'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';

import { BadgeCard } from '@/components/gamification/BadgeCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { EarnedBadge } from '@/lib/gamification/badges';
import { playBadgeEarnedSound } from '@/lib/gamification/play-badge-sound';

type NewBadgePopupProps = {
  /** Newly earned badges to celebrate (shown one at a time) */
  badges: EarnedBadge[];
  onClose?: () => void;
};

export function NewBadgePopup({ badges, onClose }: NewBadgePopupProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const open = badges.length > 0;
  const current = badges[index];

  useEffect(() => {
    setIndex(0);
  }, [badges]);

  useEffect(() => {
    if (open && current && !reduceMotion) {
      playBadgeEarnedSound();
    }
  }, [open, current?.id, reduceMotion]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        return;
      }

      if (index < badges.length - 1) {
        setIndex((value) => value + 1);
        return;
      }

      setIndex(0);
      onClose?.();
    },
    [badges.length, index, onClose]
  );

  if (!current) {
    return null;
  }

  const celebrationText = `Luar biasa! Kamu mendapatkan badge baru: ${current.nama}! 🏅`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="relative overflow-hidden border-sigma-gold/30 bg-slate-900 text-slate-100 sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-xl text-white">Badge Baru!</DialogTitle>
          <DialogDescription className="text-slate-300">
            {celebrationText}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="flex justify-center py-2"
          initial={
            reduceMotion ? false : { scale: 0.5, opacity: 0, rotate: -12 }
          }
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <BadgeCard
                badge={{
                  id: current.id,
                  kode: current.kode,
                  nama: current.nama,
                  deskripsi: current.deskripsi,
                  icon_url: current.icon_url,
                  earned_at: current.earned_at,
                  isEarned: true,
                }}
                variant="featured"
                className="w-full max-w-xs border-sigma-gold/40 bg-slate-800/80"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {!reduceMotion ? (
          <motion.div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg"
            aria-hidden
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/3 h-1.5 w-1.5 rounded-full bg-sigma-gold"
                initial={{ opacity: 0, x: '-50%', y: '-50%' }}
                animate={{
                  opacity: [0, 1, 0],
                  x: `calc(-50% + ${Math.cos((i / 8) * Math.PI * 2) * 100}px)`,
                  y: `calc(-50% + ${Math.sin((i / 8) * Math.PI * 2) * 80}px)`,
                }}
                transition={{ duration: 0.9, delay: 0.1 + i * 0.05 }}
              />
            ))}
          </motion.div>
        ) : null}

        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="bg-sigma-cyan font-semibold text-sigma-navy hover:bg-sigma-cyan/90"
          >
            {index < badges.length - 1
              ? `Lanjut (${index + 1}/${badges.length})`
              : 'Mantap!'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
