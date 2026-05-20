'use client';

import { useCallback, useMemo, useState } from 'react';
import hljs from 'highlight.js/lib/common';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { MissionPlayerData } from '@/lib/missions/fetch-mission-player';
import type { JsonValue } from '@/types';
import { cn } from '@/lib/utils';

type ChoiceOption = {
  id: string;
  label: string;
};

type MultipleChoiceContent = {
  instruksi?: string;
  skenario?: string;
  pertanyaan: string;
  kodeTampil?: string;
  bahasaKode: string;
  pilihan: ChoiceOption[];
  jawabanBenar: string;
  penjelasan: string;
};

type MultipleChoiceMissionProps = {
  kontenJson: MissionPlayerData['kontenJson'];
  className?: string;
  onContinue?: () => void;
};

function getRecord(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, JsonValue>;
}

function parseOptions(value: JsonValue | undefined): ChoiceOption[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index): ChoiceOption | null => {
      if (typeof item === 'string') {
        return {
          id: String.fromCharCode(97 + index),
          label: item,
        };
      }

      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }

      const option = item as Record<string, JsonValue>;
      const id =
        typeof option.id === 'string'
          ? option.id
          : String.fromCharCode(97 + index);
      const label =
        typeof option.label === 'string'
          ? option.label
          : typeof option.teks === 'string'
            ? option.teks
            : typeof option.text === 'string'
              ? option.text
              : null;

      return label ? { id, label } : null;
    })
    .filter((option): option is ChoiceOption => option !== null);
}

function parseMultipleChoiceContent(
  kontenJson: MissionPlayerData['kontenJson']
): MultipleChoiceContent | null {
  const data = getRecord(kontenJson);
  if (!data) return null;

  const pilihan = parseOptions(data.pilihan ?? data.options);
  const jawabanBenar =
    typeof data.jawaban_benar === 'string'
      ? data.jawaban_benar
      : typeof data.correct_answer === 'string'
        ? data.correct_answer
        : null;

  const pertanyaan =
    typeof data.pertanyaan === 'string'
      ? data.pertanyaan
      : typeof data.instruksi === 'string'
        ? data.instruksi
        : null;

  if (!pertanyaan || !jawabanBenar || pilihan.length === 0) {
    return null;
  }

  const kodeTampil =
    typeof data.kode_tampil === 'string'
      ? data.kode_tampil
      : typeof data.kode_awal === 'string'
        ? data.kode_awal
        : typeof data.code === 'string'
          ? data.code
          : typeof data.kode === 'string'
            ? data.kode
            : undefined;

  return {
    instruksi:
      typeof data.instruksi === 'string' && data.instruksi !== pertanyaan
        ? data.instruksi
        : undefined,
    skenario: typeof data.skenario === 'string' ? data.skenario : undefined,
    pertanyaan,
    kodeTampil,
    bahasaKode:
      typeof data.bahasa_kode === 'string'
        ? data.bahasa_kode
        : typeof data.language === 'string'
          ? data.language
          : 'python',
    pilihan,
    jawabanBenar,
    penjelasan:
      typeof data.penjelasan === 'string'
        ? data.penjelasan
        : 'Baca lagi pertanyaan dan pilihan jawabannya dengan teliti.',
  };
}

function highlightCode(code: string, language: string): string {
  if (hljs.getLanguage(language)) {
    return hljs.highlight(code, { language, ignoreIllegals: true }).value;
  }

  return hljs.highlightAuto(code).value;
}

export function MultipleChoiceMission({
  kontenJson,
  className,
  onContinue,
}: MultipleChoiceMissionProps) {
  const content = useMemo(
    () => parseMultipleChoiceContent(kontenJson),
    [kontenJson]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const highlightedCode = useMemo(() => {
    if (!content?.kodeTampil) return null;
    return highlightCode(content.kodeTampil, content.bahasaKode);
  }, [content?.bahasaKode, content?.kodeTampil]);

  const handleSubmit = useCallback(() => {
    if (!selectedId) return;
    setSubmitted(true);
  }, [selectedId]);

  if (!content) {
    return (
      <div
        className={cn(
          'rounded-xl border border-red-500/40 bg-red-950/20 p-4 text-sm text-red-200',
          className
        )}
      >
        Konten misi pilihan ganda tidak valid atau masih berupa paket tes.
        Hubungi guru atau admin ya.
      </div>
    );
  }

  const isCorrect = selectedId === content.jawabanBenar;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5',
        className
      )}
    >
      <style jsx>{`
        .mc-code :global(.hljs-keyword),
        .mc-code :global(.hljs-built_in),
        .mc-code :global(.hljs-selector-tag) {
          color: #67e8f9;
        }

        .mc-code :global(.hljs-string),
        .mc-code :global(.hljs-title),
        .mc-code :global(.hljs-name) {
          color: #fbbf24;
        }

        .mc-code :global(.hljs-number),
        .mc-code :global(.hljs-literal) {
          color: #86efac;
        }

        .mc-code :global(.hljs-comment) {
          color: #94a3b8;
          font-style: italic;
        }
      `}</style>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sigma-cyan">
          Pilihan Ganda
        </p>
        {content.instruksi ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-200">
            {content.instruksi}
          </p>
        ) : null}
        {content.skenario ? (
          <p className="mt-2 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs leading-relaxed text-slate-400">
            {content.skenario}
          </p>
        ) : null}
      </div>

      {highlightedCode ? (
        <pre className="mc-code overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm leading-6 text-slate-100">
          <code
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            aria-label="Blok kode pertanyaan"
          />
        </pre>
      ) : null}

      <div>
        <h2 className="text-base font-semibold leading-relaxed text-white">
          {content.pertanyaan}
        </h2>

        <div className="mt-4 grid gap-3">
          {content.pilihan.map((option) => {
            const selected = selectedId === option.id;
            const correct = option.id === content.jawabanBenar;
            const showCorrect = submitted && correct;
            const showWrong = submitted && selected && !correct;

            return (
              <button
                key={option.id}
                type="button"
                className={cn(
                  'flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigma-cyan',
                  selected &&
                    !submitted &&
                    'border-sigma-cyan bg-sigma-cyan/10 text-white',
                  !selected &&
                    !submitted &&
                    'border-slate-700 bg-slate-950/40 text-slate-200 hover:border-slate-500 hover:bg-slate-800/80',
                  showCorrect &&
                    'border-emerald-500 bg-emerald-950/40 text-emerald-100',
                  showWrong && 'border-red-500 bg-red-950/40 text-red-100',
                  submitted &&
                    !showCorrect &&
                    !showWrong &&
                    'border-slate-800 bg-slate-950/30 text-slate-500'
                )}
                onClick={() => {
                  if (!submitted) setSelectedId(option.id);
                }}
                disabled={submitted}
                aria-pressed={selected}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold uppercase',
                    selected || showCorrect
                      ? 'border-current'
                      : 'border-slate-600 text-slate-400'
                  )}
                >
                  {option.id}
                </span>
                <span className="flex-1">{option.label}</span>
                {submitted ? (
                  correct ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                  ) : selected ? (
                    <XCircle className="h-5 w-5 shrink-0 text-red-300" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-slate-600" />
                  )
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {submitted ? (
        <div
          className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            isCorrect
              ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
              : 'border-red-500/40 bg-red-950/30 text-red-100'
          )}
          role="status"
        >
          <p className="font-semibold">
            {isCorrect ? 'Jawaban kamu benar!' : 'Jawaban kamu belum tepat.'}
          </p>
          <p className="mt-1 leading-relaxed">{content.penjelasan}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {submitted ? (
          <Button
            type="button"
            className="w-full bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90 sm:w-auto"
            onClick={onContinue}
          >
            Lanjut
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90 sm:w-auto"
            onClick={handleSubmit}
            disabled={!selectedId}
          >
            Periksa Jawaban
          </Button>
        )}
      </div>
    </div>
  );
}
