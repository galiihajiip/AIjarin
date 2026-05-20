'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  Lock,
  Send,
  Target,
} from 'lucide-react';

import { submitAssessment } from '@/app/actions/submitAssessment';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type {
  AssessmentType,
  PublicAssessmentQuestion,
} from '@/lib/missions/assessment-flow';
import { cn } from '@/lib/utils';

type AssessmentFlowProps = {
  misiId: string;
  misiNama: string;
  assessmentType: AssessmentType;
  levelNomor: number;
  levelNama: string;
  storyText: string;
  questions: PublicAssessmentQuestion[];
  timeLimitSeconds: number;
};

type AssessmentGateProps = {
  levelNomor: number;
  levelNama: string;
  pretestMisiId: string;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AssessmentGate({
  levelNomor,
  levelNama,
  pretestMisiId,
}: AssessmentGateProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-5 rounded-3xl border border-amber-500/30 bg-amber-500/10 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/15">
        <Lock className="h-7 w-7 text-amber-200" aria-hidden />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
          Pre-Test Wajib
        </p>
        <h1 className="mt-2 text-xl font-bold text-white">
          Level {levelNomor}: {levelNama}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-amber-100/90">
          Sebelum masuk misi level ini, kamu harus menyelesaikan pre-test dulu.
          Tidak ada petunjuk, tidak ada chatbot, dan kamu tidak bisa kembali ke
          soal sebelumnya.
        </p>
      </div>
      <Button
        asChild
        className="bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90"
      >
        <Link href={`/misi/${pretestMisiId}`}>
          Mulai Pre-Test
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>
      <Button asChild variant="outline" className="border-slate-600">
        <Link href="/dashboard">Kembali ke Dashboard</Link>
      </Button>
    </div>
  );
}

export function PosttestLockedGate({
  levelNomor,
  levelNama,
}: {
  levelNomor: number;
  levelNama: string;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-5 rounded-3xl border border-slate-700 bg-slate-900/70 px-6 py-10 text-center">
      <Ban className="h-10 w-10 text-slate-400" aria-hidden />
      <div>
        <h1 className="text-xl font-bold text-white">Post-Test Terkunci</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Post-test Level {levelNomor} ({levelNama}) baru terbuka setelah kamu
          menyelesaikan semua misi level dan boss challenge.
        </p>
      </div>
      <Button asChild variant="outline" className="border-slate-600">
        <Link href="/dashboard">Kembali ke Dashboard</Link>
      </Button>
    </div>
  );
}

export function AssessmentFlow({
  misiId,
  misiNama,
  assessmentType,
  levelNomor,
  levelNama,
  storyText,
  questions,
  timeLimitSeconds,
}: AssessmentFlowProps) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(timeLimitSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    ngainKategori?: string | null;
    ngainValue?: number | null;
    pretestScore?: number | null;
    posttestScore?: number | null;
  } | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent =
    totalQuestions > 0
      ? Math.round(((currentIndex + (result ? 1 : 0)) / totalQuestions) * 100)
      : 0;

  const title =
    assessmentType === 'pretest'
      ? `Pre-Test Level ${levelNomor}`
      : `Post-Test Level ${levelNomor}`;

  const finalizeAssessment = useCallback(
    async (finalAnswers: Record<string, string>) => {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await submitAssessment({
        misiId,
        answers: finalAnswers,
        timeSpentSeconds: timeLimitSeconds - secondsLeft,
      });

      if (!response.success) {
        setErrorMessage(response.error ?? 'Gagal mengirim jawaban tes.');
        setIsSubmitting(false);
        return;
      }

      setResult({
        score: response.score,
        correctCount: response.correctCount,
        totalQuestions: response.totalQuestions,
        ngainKategori: response.ngainKategori,
        ngainValue: response.ngainValue,
        pretestScore: response.pretestScore,
        posttestScore: response.posttestScore,
      });
      setIsSubmitting(false);
      router.refresh();
    },
    [misiId, router, secondsLeft, timeLimitSeconds]
  );

  useEffect(() => {
    if (!started || result || isSubmitting) return;

    if (secondsLeft <= 0) {
      void finalizeAssessment(answers);
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [answers, finalizeAssessment, isSubmitting, result, secondsLeft, started]);

  const handleStart = useCallback(() => {
    setStarted(true);
    setSecondsLeft(timeLimitSeconds);
  }, [timeLimitSeconds]);

  const handleNext = useCallback(() => {
    if (!currentQuestion || !selectedId) return;

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: selectedId,
    };
    setAnswers(nextAnswers);

    if (currentIndex >= totalQuestions - 1) {
      void finalizeAssessment(nextAnswers);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setSelectedId(null);
  }, [
    answers,
    currentIndex,
    currentQuestion,
    finalizeAssessment,
    selectedId,
    totalQuestions,
  ]);

  if (result) {
    const isPretest = assessmentType === 'pretest';

    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col gap-6 rounded-3xl border border-slate-700/80 bg-slate-900/70 p-6 sm:p-8">
        <div className="text-center">
          <CheckCircle2
            className="mx-auto h-12 w-12 text-emerald-400"
            aria-hidden
          />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-sigma-cyan">
            {isPretest ? 'Pre-Test Selesai' : 'Post-Test Selesai'}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">
            Skor kamu: {result.score}/100
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {result.correctCount} dari {result.totalQuestions} jawaban benar
          </p>
        </div>

        {!isPretest && result.ngainKategori ? (
          <div className="rounded-2xl border border-sigma-gold/40 bg-sigma-gold/10 px-5 py-4 text-center">
            <Target className="mx-auto h-6 w-6 text-sigma-gold" aria-hidden />
            <p className="mt-3 text-lg font-semibold text-white">
              Peningkatanmu: Kategori {result.ngainKategori}! 🎯
            </p>
            {result.ngainValue != null ? (
              <p className="mt-2 text-sm text-slate-300">
                N-Gain: {result.ngainValue} · Pre-test{' '}
                {result.pretestScore ?? '-'} → Post-test{' '}
                {result.posttestScore ?? result.score}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-700 bg-slate-950/50 px-5 py-4 text-center text-sm text-slate-300">
            Hasil pre-test sudah disimpan. Kamu bisa mulai misi Level{' '}
            {levelNomor} sekarang!
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            asChild
            className="bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90"
          >
            <Link href="/dashboard">Ke Dashboard</Link>
          </Button>
          {isPretest ? (
            <Button asChild variant="outline" className="border-slate-600">
              <Link href="/dashboard">Lanjutkan Misi Level</Link>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col gap-6 rounded-3xl border border-slate-700/80 bg-slate-900/70 p-6 sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sigma-gold">
            {title}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">{misiNama}</h1>
          <p className="mt-1 text-sm text-slate-400">{levelNama}</p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4 text-sm leading-relaxed text-slate-300">
          {storyText}
        </div>

        <ul className="space-y-2 text-sm text-slate-400">
          <li>· {totalQuestions} soal pilihan ganda</li>
          <li>· Tanpa petunjuk dan tanpa chatbot</li>
          <li>· Tidak bisa kembali ke soal sebelumnya</li>
          <li>· Waktu: {formatTime(timeLimitSeconds)}</li>
        </ul>

        <Button
          type="button"
          className="bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90"
          onClick={handleStart}
        >
          Mulai {assessmentType === 'pretest' ? 'Pre-Test' : 'Post-Test'}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-4 text-sm text-red-200">
        Soal tes belum tersedia. Hubungi guru atau admin ya.
      </div>
    );
  }

  const timeExpired = secondsLeft <= 0;

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col gap-5">
      <header className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sigma-cyan">
              {title}
            </p>
            <h1 className="mt-1 text-lg font-bold text-white">{misiNama}</h1>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold tabular-nums',
              timeExpired
                ? 'border-red-500/50 bg-red-500/10 text-red-300'
                : secondsLeft <= 60
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
                  : 'border-slate-600 bg-slate-800/80 text-slate-200'
            )}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {timeExpired ? 'Waktu habis' : formatTime(secondsLeft)}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Soal{' '}
              <span className="font-semibold text-white">
                {currentIndex + 1}
              </span>{' '}
              dari{' '}
              <span className="font-semibold text-white">{totalQuestions}</span>
            </span>
            <span className="tabular-nums">{progressPercent}%</span>
          </div>
          <Progress
            value={progressPercent}
            className="h-2 bg-slate-800 [&>div]:bg-sigma-cyan"
          />
        </div>
      </header>

      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5">
        <h2 className="text-base font-semibold leading-relaxed text-white">
          {currentQuestion.pertanyaan}
        </h2>

        <div className="mt-4 grid gap-3">
          {currentQuestion.pilihan.map((option) => {
            const selected = selectedId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                disabled={isSubmitting || timeExpired}
                onClick={() => setSelectedId(option.id)}
                className={cn(
                  'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigma-cyan',
                  selected
                    ? 'border-sigma-cyan bg-sigma-cyan/10 text-white'
                    : 'border-slate-700 bg-slate-950/50 text-slate-200 hover:border-slate-500'
                )}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-600 text-xs uppercase">
                  {option.id}
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-100">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Ban className="h-3.5 w-3.5" aria-hidden />
          Petunjuk & chatbot dinonaktifkan
        </span>
        <span>Tidak bisa kembali ke soal sebelumnya</span>
      </div>

      <Button
        type="button"
        className="w-full bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90 sm:ml-auto sm:w-auto"
        onClick={handleNext}
        disabled={!selectedId || isSubmitting || timeExpired}
      >
        {isSubmitting ? (
          'Mengirim...'
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden />
            {currentIndex >= totalQuestions - 1
              ? 'Kirim Jawaban Tes'
              : 'Soal Berikutnya'}
          </>
        )}
      </Button>
    </div>
  );
}
