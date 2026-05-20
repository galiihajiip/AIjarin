'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AgentExpression = 'happy' | 'serious' | 'confused';

const CHAR_DELAY_MS = 32;
const COMPLETE_PAUSE_MS = 900;

export function inferExpressionFromStory(text: string): AgentExpression {
  const lower = text.toLowerCase();

  if (/\?|bingung|gimana|apa itu|tidak tahu|hmm|heran|aneh|kok\b/.test(lower)) {
    return 'confused';
  }

  if (
    /penting|waspada|hati-hati|tes awal|ujian|boss|rahasia|peringatan|serius|jangan|bahaya|wajib/.test(
      lower
    )
  ) {
    return 'serious';
  }

  return 'happy';
}

type StoryCutsceneProps = {
  text: string;
  expression?: AgentExpression;
  onComplete: () => void;
  className?: string;
};

type SigmaAgentSpriteProps = {
  expression: AgentExpression;
  className?: string;
};

function SigmaAgentSprite({ expression, className }: SigmaAgentSpriteProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `sigma-agent-grad-${uid}`;

  const mouth =
    expression === 'happy' ? (
      <path
        d="M44 78 Q52 86 60 78"
        stroke="#06b6d4"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    ) : expression === 'serious' ? (
      <line
        x1="46"
        y1="82"
        x2="58"
        y2="82"
        stroke="#06b6d4"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    ) : (
      <path
        d="M46 80 Q52 84 58 79"
        stroke="#06b6d4"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    );

  const leftEye =
    expression === 'happy' ? (
      <path
        d="M40 62 Q44 58 48 62"
        stroke="#06b6d4"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    ) : (
      <ellipse cx="44" cy="62" rx="4" ry="3.5" fill="#06b6d4" />
    );

  const rightEye =
    expression === 'happy' ? (
      <path
        d="M56 62 Q60 58 64 62"
        stroke="#06b6d4"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    ) : (
      <ellipse cx="60" cy="62" rx="4" ry="3.5" fill="#06b6d4" />
    );

  const browOffset =
    expression === 'confused' ? -3 : expression === 'serious' ? 1 : 0;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 104 160"
      aria-hidden
      className={cn('h-auto w-28 shrink-0 sm:w-32', className)}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Bayangan */}
      <ellipse cx="52" cy="152" rx="28" ry="6" fill="#000" opacity="0.25" />

      {/* Jubah / mantel agen */}
      <path
        d="M20 95 Q52 88 84 95 L78 148 Q52 154 26 148 Z"
        fill="#1e293b"
        stroke="#334155"
        strokeWidth="1.5"
      />

      {/* Tubuh */}
      <path
        d="M32 72 L32 100 Q52 108 72 100 L72 72 Z"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="1.5"
      />

      {/* Lencana SIGMA */}
      <circle cx="52" cy="88" r="10" fill={`url(#${gradId})`} opacity={0.9} />
      <path d="M52 82 L48 90 L52 88 L56 90 Z" fill="#0f172a" opacity={0.85} />

      {/* Kepala / helm */}
      <ellipse
        cx="52"
        cy="52"
        rx="26"
        ry="28"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="1.5"
      />

      {/* Visor */}
      <path
        d="M28 48 Q52 38 76 48 L74 58 Q52 66 30 58 Z"
        fill="#06b6d4"
        opacity={0.35}
      />
      <path
        d="M30 50 Q52 42 74 50"
        stroke="#06b6d4"
        strokeWidth="1.5"
        fill="none"
        opacity={0.8}
      />

      {/* Wajah di balik visor */}
      <g transform={expression === 'confused' ? 'rotate(-4 52 62)' : undefined}>
        <path
          d={`M36 ${48 + browOffset} L48 ${44 + browOffset}`}
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={expression === 'confused' ? 1 : 0.7}
        />
        <path
          d={`M56 ${44 + browOffset} L68 ${48 + browOffset}`}
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={expression === 'confused' ? 0.5 : 0.7}
        />
        {leftEye}
        {rightEye}
        {mouth}
      </g>

      {/* Antena helm */}
      <line
        x1="52"
        y1="24"
        x2="52"
        y2="32"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="52" cy="22" r="3" fill="#f59e0b" />
    </svg>
  );
}

export function StoryCutscene({
  text,
  expression: expressionProp,
  onComplete,
  className,
}: StoryCutsceneProps) {
  const trimmed = text.trim();
  const expression =
    expressionProp ?? inferExpressionFromStory(trimmed || text);

  const [charIndex, setCharIndex] = useState(0);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    setCharIndex(trimmed.length);
    finish();
  }, [trimmed.length, finish]);

  useEffect(() => {
    completedRef.current = false;
    setCharIndex(0);
  }, [trimmed]);

  useEffect(() => {
    if (!trimmed) {
      finish();
      return;
    }

    if (charIndex >= trimmed.length) {
      const pause = window.setTimeout(finish, COMPLETE_PAUSE_MS);
      return () => window.clearTimeout(pause);
    }

    const tick = window.setTimeout(
      () => setCharIndex((prev) => prev + 1),
      CHAR_DELAY_MS
    );
    return () => window.clearTimeout(tick);
  }, [charIndex, trimmed, finish]);

  const displayed = trimmed.slice(0, charIndex);
  const isTyping = charIndex < trimmed.length;

  const expressionLabel: Record<AgentExpression, string> = {
    happy: 'Agen SIGMA — semangat',
    serious: 'Agen SIGMA — fokus',
    confused: 'Agen SIGMA — bingung',
  };

  return (
    <div
      className={cn(
        'flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-4 py-8',
        className
      )}
      role="dialog"
      aria-label="Cutscene cerita misi"
      aria-live="polite"
    >
      <div className="relative w-full max-w-lg">
        <div className="absolute right-2 top-2 z-10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={handleSkip}
          >
            Lewati
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-800/90 to-slate-950/95 p-5 shadow-xl sm:p-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-sigma-gold">
            Briefing Misi
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-5">
            <SigmaAgentSprite
              expression={expression}
              className={cn(
                'transition-transform duration-300',
                expression === 'happy' && 'scale-105',
                expression === 'confused' && '-rotate-2'
              )}
            />

            <div className="relative min-h-[5rem] flex-1">
              {/* Ekor gelembung */}
              <div
                className="absolute -left-2 bottom-6 hidden h-4 w-4 rotate-45 border-b border-l border-slate-600 bg-slate-800 sm:block"
                aria-hidden
              />
              <div className="relative rounded-xl border border-slate-600 bg-slate-800/90 px-4 py-3 shadow-inner">
                <p className="min-h-[4.5rem] text-sm leading-relaxed text-slate-100 sm:text-base">
                  {displayed}
                  {isTyping ? (
                    <span
                      className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-sigma-cyan align-middle"
                      aria-hidden
                    />
                  ) : null}
                </p>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-500 sm:text-left">
                {expressionLabel[expression]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
