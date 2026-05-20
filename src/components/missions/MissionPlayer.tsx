'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Send, Sparkles } from 'lucide-react';

import { ChatbotWidget } from '@/components/chatbot/ChatbotWidget';
import { MissionChallenge } from '@/components/missions/MissionChallenge';
import { StoryCutscene } from '@/components/missions/StoryCutscene';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { MissionPlayerData } from '@/lib/missions/fetch-mission-player';
import { cn } from '@/lib/utils';

type MissionPlayerProps = MissionPlayerData;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MissionPlayer({
  misiId,
  misiNama,
  misiTipe,
  xpReward,
  timeLimitSeconds,
  levelNama,
  levelNomor,
  storyText,
  kontenJson,
  totalSoal,
}: MissionPlayerProps) {
  const [cutsceneDone, setCutsceneDone] = useState(false);
  const [currentSoal, setCurrentSoal] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    timeLimitSeconds
  );

  useEffect(() => {
    if (!cutsceneDone) return;

    if (timeLimitSeconds == null || timeLimitSeconds <= 0) {
      setSecondsLeft(null);
      return;
    }

    setSecondsLeft(timeLimitSeconds);
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev == null || prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timeLimitSeconds, misiId, cutsceneDone]);

  const progressPercent =
    totalSoal > 0 ? Math.round((currentSoal / totalSoal) * 100) : 0;

  const handleSubmit = useCallback(() => {
    if (currentSoal < totalSoal) {
      setCurrentSoal((n) => n + 1);
      return;
    }
    // Pengiriman jawaban & grading AI diimplementasikan pada tugas berikutnya.
  }, [currentSoal, totalSoal]);

  const timeExpired = secondsLeft === 0;
  const showTimer = timeLimitSeconds != null && timeLimitSeconds > 0;

  if (!cutsceneDone && storyText.trim()) {
    return (
      <StoryCutscene
        text={storyText}
        onComplete={() => setCutsceneDone(true)}
      />
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <header className="shrink-0 border-b border-slate-700/80 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link
              href="/dashboard"
              className="mb-2 inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-sigma-cyan"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Kembali
            </Link>
            <p className="text-xs font-medium uppercase tracking-wide text-sigma-cyan">
              Level {levelNomor} · {levelNama}
            </p>
            <h1 className="mt-1 truncate text-lg font-bold text-white sm:text-xl">
              {misiNama}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-sigma-gold/40 bg-sigma-gold/10 px-3 py-1 text-xs font-semibold text-sigma-gold">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />+{xpReward} XP
            </span>
            {showTimer ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold tabular-nums',
                  timeExpired
                    ? 'border-red-500/50 bg-red-500/10 text-red-300'
                    : secondsLeft != null && secondsLeft <= 30
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
                      : 'border-slate-600 bg-slate-800/80 text-slate-200'
                )}
              >
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {timeExpired
                  ? 'Waktu habis'
                  : formatTime(secondsLeft ?? timeLimitSeconds)}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 py-4 md:grid md:grid-cols-[minmax(240px,300px)_1fr] md:items-stretch md:gap-6">
        <aside
          className="order-1 shrink-0 md:order-none"
          aria-label="Cerita dan konteks misi"
        >
          <div className="h-full rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-800/80 to-slate-900/60 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-sigma-gold">
              Briefing Agen
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              {storyText}
            </p>
          </div>
        </aside>

        <main className="order-2 flex min-h-0 flex-1 flex-col md:order-none">
          <MissionChallenge
            misiTipe={misiTipe}
            kontenJson={kontenJson}
            className="flex-1"
          />
        </main>
      </div>

      <footer className="sticky bottom-0 z-10 -mx-4 shrink-0 border-t border-slate-700/80 bg-sigma-navy/95 px-4 py-3 backdrop-blur-sm sm:-mx-0 sm:rounded-t-xl sm:px-0">
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              Soal{' '}
              <span className="font-semibold text-white">{currentSoal}</span>{' '}
              dari <span className="font-semibold text-white">{totalSoal}</span>
            </span>
            <span className="tabular-nums">{progressPercent}%</span>
          </div>
          <Progress
            value={progressPercent}
            className="h-2 bg-slate-800 [&>div]:bg-sigma-cyan"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            className="w-full bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90 sm:w-auto"
            onClick={handleSubmit}
            disabled={timeExpired}
          >
            <Send className="h-4 w-4" aria-hidden />
            {currentSoal < totalSoal ? 'Soal Berikutnya' : 'Kirim Jawaban'}
          </Button>
        </div>
      </footer>

      <ChatbotWidget
        misiId={misiId}
        missionName={misiNama}
        context={`Level ${levelNomor}: ${levelNama}. Misi: ${misiNama}. Briefing: ${storyText}`}
      />
    </div>
  );
}
