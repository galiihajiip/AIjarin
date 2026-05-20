'use client';

import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { MissionPlayerData } from '@/lib/missions/fetch-mission-player';
import type { JsonValue } from '@/types';
import { cn } from '@/lib/utils';

type BlankType = 'text' | 'number' | 'dropdown' | 'boolean';

type BlankConfig = {
  type: BlankType;
  label: string;
  answer: string | number | boolean | null;
  options: string[];
  explanation: string;
};

type FillBlankContent = {
  instruksi: string;
  skenario?: string;
  template: string;
  penjelasan: string;
  contohBenar?: string;
  validasiTipe: boolean;
  blanks: BlankConfig[];
};

type BlankStatus = 'idle' | 'correct' | 'incorrect';

type FillBlankMissionProps = {
  kontenJson: MissionPlayerData['kontenJson'];
  className?: string;
};

const BLANK_MARKER = '___';
const HINT_COST_XP = 5;

function getRecord(value: JsonValue): Record<string, JsonValue> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, JsonValue>;
}

function asStringArray(value: JsonValue | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function getNestedOptions(
  value: JsonValue | undefined,
  index: number
): string[] {
  if (!Array.isArray(value)) return [];

  const row = value[index];
  if (Array.isArray(row)) {
    return row.filter((item): item is string => typeof item === 'string');
  }

  if (row && typeof row === 'object') {
    const record = row as Record<string, JsonValue>;
    return asStringArray(record.options ?? record.opsi ?? record.pilihan);
  }

  return [];
}

function inferDropdownOptions(type: BlankType, explicit: string[]): string[] {
  if (explicit.length > 0) return explicit;
  if (type === 'boolean') return ['true', 'false'];
  return [];
}

function parseFillBlankContent(
  kontenJson: MissionPlayerData['kontenJson']
): FillBlankContent | null {
  const data = getRecord(kontenJson);

  if (
    !data ||
    typeof data.template !== 'string' ||
    typeof data.instruksi !== 'string'
  ) {
    return null;
  }

  const blankCount = data.template.split(BLANK_MARKER).length - 1;
  if (blankCount <= 0) return null;

  const typeRows = asStringArray(data.tipe_input);
  const labelRows = asStringArray(data.label_input);
  const answerRows = Array.isArray(data.jawaban_benar)
    ? data.jawaban_benar
    : [];
  const explanationRows =
    asStringArray(data.penjelasan_salah) ||
    asStringArray(data.penjelasan_input);

  const blanks = Array.from({ length: blankCount }, (_, index) => {
    const rawType = typeRows[index];
    const type: BlankType =
      rawType === 'number' ||
      rawType === 'dropdown' ||
      rawType === 'select' ||
      rawType === 'boolean'
        ? rawType === 'select'
          ? 'dropdown'
          : rawType
        : 'text';
    const explicitOptions = getNestedOptions(
      data.opsi_input ?? data.options ?? data.pilihan_input,
      index
    );

    return {
      type,
      label: labelRows[index] ?? `Jawaban ${index + 1}`,
      answer:
        answerRows[index] === undefined
          ? null
          : (answerRows[index] as string | number | boolean | null),
      options: inferDropdownOptions(type, explicitOptions),
      explanation:
        explanationRows[index] ??
        (typeof data.penjelasan === 'string'
          ? data.penjelasan
          : 'Cek lagi konsep dan contoh yang diberikan.'),
    };
  });

  return {
    instruksi: data.instruksi,
    skenario: typeof data.skenario === 'string' ? data.skenario : undefined,
    template: data.template,
    penjelasan:
      typeof data.penjelasan === 'string'
        ? data.penjelasan
        : 'Lengkapi bagian kosong sesuai instruksi.',
    contohBenar:
      typeof data.contoh_benar === 'string' ? data.contoh_benar : undefined,
    validasiTipe: data.validasi_tipe !== false,
    blanks,
  };
}

function normalizeText(value: string): string {
  const trimmed = value.trim();
  const unquoted = trimmed.replace(/^["'](.+)["']$/, '$1');
  return unquoted.toLowerCase();
}

function isNumberLike(value: string): boolean {
  return value.trim() !== '' && Number.isFinite(Number(value));
}

function validateInputType(value: string, type: BlankType): boolean {
  if (!value.trim()) return false;
  if (type === 'number') return isNumberLike(value);
  if (type === 'boolean')
    return ['true', 'false'].includes(normalizeText(value));
  return true;
}

function compareAnswer(value: string, blank: BlankConfig): boolean {
  if (blank.answer == null) {
    return validateInputType(value, blank.type);
  }

  if (blank.type === 'number' || typeof blank.answer === 'number') {
    return isNumberLike(value) && Number(value) === Number(blank.answer);
  }

  if (typeof blank.answer === 'boolean') {
    return normalizeText(value) === String(blank.answer);
  }

  return normalizeText(value) === normalizeText(String(blank.answer));
}

function getHintCharacter(answer: BlankConfig['answer']): string | null {
  if (answer == null) return null;
  const normalized = String(answer)
    .trim()
    .replace(/^["'](.+)["']$/, '$1');
  return normalized.charAt(0) || null;
}

export function FillBlankMission({
  kontenJson,
  className,
}: FillBlankMissionProps) {
  const content = useMemo(
    () => parseFillBlankContent(kontenJson),
    [kontenJson]
  );
  const [values, setValues] = useState<string[]>(() =>
    Array(content?.blanks.length ?? 0).fill('')
  );
  const [statuses, setStatuses] = useState<BlankStatus[]>(() =>
    Array(content?.blanks.length ?? 0).fill('idle')
  );
  const [hints, setHints] = useState<(string | null)[]>(() =>
    Array(content?.blanks.length ?? 0).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);

  const templateParts = useMemo(
    () => content?.template.split(BLANK_MARKER) ?? [],
    [content?.template]
  );

  const score = useMemo(() => {
    if (!content || !submitted) return null;
    const correct = statuses.filter((status) => status === 'correct').length;
    return {
      correct,
      total: content.blanks.length,
      percent: Math.round((correct / content.blanks.length) * 100),
    };
  }, [content, statuses, submitted]);

  const updateValue = useCallback((index: number, value: string) => {
    setValues((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
    setStatuses((current) => {
      const next = [...current];
      next[index] = 'idle';
      return next;
    });
    setSubmitted(false);
  }, []);

  const validateBlank = useCallback(
    (index: number) => {
      if (!content) return;
      setStatuses((current) => {
        const next = [...current];
        next[index] = compareAnswer(values[index] ?? '', content.blanks[index])
          ? 'correct'
          : 'incorrect';
        return next;
      });
    },
    [content, values]
  );

  const revealHint = useCallback(
    (index: number) => {
      if (!content) return;
      const hint = getHintCharacter(content.blanks[index].answer);
      if (!hint) return;

      setHints((current) => {
        if (current[index]) return current;
        const next = [...current];
        next[index] = hint;
        return next;
      });
    },
    [content]
  );

  const handleSubmit = useCallback(() => {
    if (!content) return;
    setStatuses(
      content.blanks.map((blank, index) =>
        compareAnswer(values[index] ?? '', blank) ? 'correct' : 'incorrect'
      )
    );
    setSubmitted(true);
  }, [content, values]);

  if (!content) {
    return (
      <div
        className={cn(
          'rounded-xl border border-red-500/40 bg-red-950/20 p-4 text-sm text-red-200',
          className
        )}
      >
        Konten misi isi bagian kosong tidak valid. Hubungi guru atau admin ya.
      </div>
    );
  }

  const xpSpent = hints.filter(Boolean).length * HINT_COST_XP;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5',
        className
      )}
    >
      <style jsx>{`
        @keyframes fill-blank-shake {
          10%,
          90% {
            transform: translateX(-1px);
          }
          20%,
          80% {
            transform: translateX(2px);
          }
          30%,
          50%,
          70% {
            transform: translateX(-4px);
          }
          40%,
          60% {
            transform: translateX(4px);
          }
        }

        .fill-blank-shake {
          animation: fill-blank-shake 0.35s ease-in-out;
        }
      `}</style>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sigma-cyan">
          Isi Bagian Kosong
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

      <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 font-mono text-sm leading-10 text-slate-100">
        {templateParts.map((part, index) => (
          <span key={`${part}-${index}`}>
            {part}
            {index < content.blanks.length ? (
              <span className="inline-flex flex-col align-middle">
                <span
                  className={cn(
                    'mx-1 inline-flex items-center gap-1 rounded-md',
                    statuses[index] === 'incorrect' && 'fill-blank-shake'
                  )}
                >
                  {content.blanks[index].type === 'dropdown' ||
                  content.blanks[index].type === 'boolean' ? (
                    <select
                      value={values[index] ?? ''}
                      onChange={(event) =>
                        updateValue(index, event.target.value)
                      }
                      onBlur={() => validateBlank(index)}
                      aria-label={content.blanks[index].label}
                      className={cn(
                        'min-h-10 min-w-32 rounded-md border bg-slate-900 px-2 text-sm text-white outline-none transition-colors',
                        statuses[index] === 'correct' &&
                          'border-emerald-500 ring-1 ring-emerald-500/40',
                        statuses[index] === 'incorrect' &&
                          'border-red-500 ring-1 ring-red-500/40',
                        statuses[index] === 'idle' &&
                          'border-slate-600 focus:border-sigma-cyan'
                      )}
                    >
                      <option value="">Pilih...</option>
                      {content.blanks[index].options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={values[index] ?? ''}
                      type={
                        content.blanks[index].type === 'number'
                          ? 'number'
                          : 'text'
                      }
                      inputMode={
                        content.blanks[index].type === 'number'
                          ? 'decimal'
                          : 'text'
                      }
                      onChange={(event) =>
                        updateValue(index, event.target.value)
                      }
                      onBlur={() => validateBlank(index)}
                      aria-label={content.blanks[index].label}
                      placeholder={content.blanks[index].label}
                      className={cn(
                        'min-h-10 w-40 rounded-md border bg-slate-900 px-2 text-sm text-white outline-none transition-colors placeholder:text-slate-600',
                        statuses[index] === 'correct' &&
                          'border-emerald-500 ring-1 ring-emerald-500/40',
                        statuses[index] === 'incorrect' &&
                          'border-red-500 ring-1 ring-red-500/40',
                        statuses[index] === 'idle' &&
                          'border-slate-600 focus:border-sigma-cyan'
                      )}
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10 px-2 text-xs text-sigma-gold hover:bg-sigma-gold/10 hover:text-sigma-gold"
                    onClick={() => revealHint(index)}
                    disabled={Boolean(hints[index])}
                    title={`Petunjuk memakai ${HINT_COST_XP} XP`}
                  >
                    Petunjuk
                  </Button>
                </span>
                {hints[index] ? (
                  <span className="mx-1 mt-1 rounded bg-sigma-gold/10 px-2 py-1 font-sans text-[11px] leading-4 text-sigma-gold">
                    Huruf pertama: {hints[index]} (-{HINT_COST_XP} XP)
                  </span>
                ) : null}
                {submitted && statuses[index] === 'incorrect' ? (
                  <span className="mx-1 mt-1 max-w-xs rounded bg-red-950/40 px-2 py-1 font-sans text-[11px] leading-4 text-red-200">
                    {content.blanks[index].explanation}
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>
        ))}
      </div>

      {content.contohBenar ? (
        <details className="rounded-lg border border-slate-700 bg-slate-950/30 px-3 py-2 text-xs text-slate-400">
          <summary className="cursor-pointer text-slate-300">
            Lihat contoh format
          </summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-slate-400">
            {content.contohBenar}
          </pre>
        </details>
      ) : null}

      {score ? (
        <div
          className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            score.correct === score.total
              ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
              : 'border-amber-500/40 bg-amber-950/30 text-amber-100'
          )}
          role="status"
        >
          Skor parsial: {score.correct}/{score.total} ({score.percent}%).
          {xpSpent > 0 ? ` Petunjuk terpakai: -${xpSpent} XP.` : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Petunjuk membuka huruf pertama jawaban dan memakai {HINT_COST_XP} XP.
        </p>
        <Button
          type="button"
          className="w-full bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90 sm:w-auto"
          onClick={handleSubmit}
        >
          Periksa Jawaban
        </Button>
      </div>
    </div>
  );
}
