'use client';

import { useCallback, useMemo, useState } from 'react';
import hljs from 'highlight.js/lib/common';
import { AlertTriangle, CheckCircle2, Loader2, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { MissionPlayerData } from '@/lib/missions/fetch-mission-player';
import type { JsonValue } from '@/types';
import { cn } from '@/lib/utils';

type CodeTypingContent = {
  instruksi: string;
  skenario?: string;
  kodeAwal: string;
  barisTarget: string;
  petunjuk?: string;
  penjelasan: string;
  abaikanSpasiEkstra: boolean;
  lineLimit: number;
};

type GradeResult = {
  success: boolean;
  score: number;
  output?: string;
  error?: string;
  feedback?: string;
};

type CodeTypingMissionProps = {
  kontenJson: MissionPlayerData['kontenJson'];
  className?: string;
};

const DEFAULT_GUIDED_CODE = '# Tulis di sini';

function getRecord(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, JsonValue>;
}

function countLines(value: string): number {
  if (!value) return 1;
  return value.split('\n').length;
}

function parseCodeTypingContent(
  kontenJson: MissionPlayerData['kontenJson']
): CodeTypingContent | null {
  const data = getRecord(kontenJson);

  if (
    !data ||
    typeof data.instruksi !== 'string' ||
    typeof data.baris_target !== 'string'
  ) {
    return null;
  }

  const kodeAwal = typeof data.kode_awal === 'string' ? data.kode_awal : '';
  const targetLineCount = countLines(data.baris_target);
  const starterLineCount = countLines(kodeAwal.trimEnd());

  return {
    instruksi: data.instruksi,
    skenario: typeof data.skenario === 'string' ? data.skenario : undefined,
    kodeAwal,
    barisTarget: data.baris_target,
    petunjuk: typeof data.petunjuk === 'string' ? data.petunjuk : undefined,
    penjelasan:
      typeof data.penjelasan === 'string'
        ? data.penjelasan
        : 'Perhatikan struktur, nama variabel, dan indentasi kode.',
    abaikanSpasiEkstra: data.abaikan_spasi_ekstra !== false,
    lineLimit:
      typeof data.batas_baris === 'number'
        ? data.batas_baris
        : Math.max(4, starterLineCount + targetLineCount + 2),
  };
}

function highlightPython(code: string): string {
  return hljs.highlight(code, { language: 'python', ignoreIllegals: true })
    .value;
}

function codeWithoutGuideComment(code: string): string {
  return code
    .split('\n')
    .filter((line) => line.trim() !== DEFAULT_GUIDED_CODE)
    .join('\n')
    .trimEnd();
}

export function CodeTypingMission({
  kontenJson,
  className,
}: CodeTypingMissionProps) {
  const content = useMemo(
    () => parseCodeTypingContent(kontenJson),
    [kontenJson]
  );
  const [userCode, setUserCode] = useState(DEFAULT_GUIDED_CODE);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);

  const fullCode = useMemo(() => {
    if (!content) return userCode;
    const cleanedUserCode = codeWithoutGuideComment(userCode);
    return `${content.kodeAwal}${cleanedUserCode}`.trimEnd();
  }, [content, userCode]);

  const highlightedFullCode = useMemo(
    () => highlightPython(fullCode || content?.kodeAwal || ''),
    [content?.kodeAwal, fullCode]
  );

  const userLineCount = countLines(userCode);
  const lineNumbers = useMemo(
    () =>
      Array.from(
        { length: Math.max(userLineCount, 1) },
        (_, index) => index + 1
      ),
    [userLineCount]
  );

  const overLineLimit = content ? userLineCount > content.lineLimit : false;

  const handleRun = useCallback(async () => {
    if (!content) return;

    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch('/api/missions/code-grader', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: fullCode,
          userCode: codeWithoutGuideComment(userCode),
          targetCode: content.barisTarget,
          ignoreExtraWhitespace: content.abaikanSpasiEkstra,
          language: 'python',
        }),
      });

      const payload = (await response.json()) as GradeResult;
      setResult(payload);
    } catch {
      setResult({
        success: false,
        score: 0,
        error:
          'Auto-grader belum bisa dihubungi. Coba jalankan lagi sebentar ya.',
      });
    } finally {
      setIsRunning(false);
    }
  }, [content, fullCode, userCode]);

  if (!content) {
    return (
      <div
        className={cn(
          'rounded-xl border border-red-500/40 bg-red-950/20 p-4 text-sm text-red-200',
          className
        )}
      >
        Konten misi ketik kode tidak valid. Hubungi guru atau admin ya.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5',
        className
      )}
    >
      <style jsx>{`
        .code-preview :global(.hljs-keyword),
        .code-preview :global(.hljs-built_in),
        .code-preview :global(.hljs-selector-tag) {
          color: #67e8f9;
        }

        .code-preview :global(.hljs-string),
        .code-preview :global(.hljs-title),
        .code-preview :global(.hljs-name) {
          color: #fbbf24;
        }

        .code-preview :global(.hljs-number),
        .code-preview :global(.hljs-literal) {
          color: #86efac;
        }

        .code-preview :global(.hljs-comment) {
          color: #94a3b8;
          font-style: italic;
        }
      `}</style>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sigma-cyan">
          Ketik Kode
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">
          {content.instruksi}
        </p>
        {content.skenario ? (
          <p className="mt-2 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs leading-relaxed text-slate-400">
            {content.skenario}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <section className="min-w-0 space-y-3">
          {content.kodeAwal ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Template Kode
              </p>
              <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-sm leading-6 text-slate-300">
                <code>{content.kodeAwal}</code>
              </pre>
            </div>
          ) : null}

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Area Ketik
              </p>
              <span
                className={cn(
                  'rounded-full border px-2 py-1 text-xs tabular-nums',
                  overLineLimit
                    ? 'border-red-500/50 bg-red-950/30 text-red-200'
                    : 'border-slate-700 bg-slate-950/40 text-slate-400'
                )}
              >
                Baris {userLineCount} / {content.lineLimit}
              </span>
            </div>

            <div className="flex max-h-[42dvh] min-h-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 focus-within:border-sigma-cyan sm:max-h-none">
              <div className="select-none border-r border-slate-800 bg-slate-900/80 px-3 py-3 text-right font-mono text-sm leading-6 text-slate-600">
                {lineNumbers.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
              <textarea
                value={userCode}
                onChange={(event) => {
                  setUserCode(event.target.value);
                  setResult(null);
                }}
                spellCheck={false}
                className="min-h-48 flex-1 resize-y scroll-mb-28 bg-transparent p-3 pb-24 font-mono text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 sm:pb-3"
                aria-label="Editor kode Python"
              />
            </div>
          </div>
        </section>

        <aside className="min-w-0 space-y-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Preview Highlight
            </p>
            <pre className="code-preview max-h-72 overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm leading-6 text-slate-100">
              <code dangerouslySetInnerHTML={{ __html: highlightedFullCode }} />
            </pre>
          </div>

          {content.petunjuk ? (
            <details className="rounded-lg border border-slate-700 bg-slate-950/30 px-3 py-2 text-xs text-slate-400">
              <summary className="cursor-pointer text-slate-300">
                Petunjuk
              </summary>
              <p className="mt-2 leading-relaxed">{content.petunjuk}</p>
            </details>
          ) : null}
        </aside>
      </div>

      <div
        className={cn(
          'rounded-xl border px-3 py-3 text-sm',
          result?.success
            ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100'
            : result
              ? 'border-red-500/40 bg-red-950/30 text-red-100'
              : 'border-slate-700 bg-slate-950/30 text-slate-400'
        )}
      >
        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-100">
          {result?.success ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          ) : result ? (
            <AlertTriangle className="h-4 w-4 text-red-300" />
          ) : (
            <Play className="h-4 w-4 text-sigma-cyan" />
          )}
          Hasil
        </div>
        {result ? (
          <div className="space-y-2">
            <p>{result.output ?? result.error ?? result.feedback}</p>
            <p className="text-xs opacity-80">
              Skor auto-grader: {result.score}
            </p>
            <p className="text-xs opacity-80">{content.penjelasan}</p>
          </div>
        ) : (
          <p>Tekan Jalankan untuk mengirim kode ke auto-grader.</p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          className="min-h-11 w-full bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90 sm:w-auto"
          onClick={handleRun}
          disabled={isRunning || overLineLimit}
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
          Jalankan
        </Button>
      </div>
    </div>
  );
}
