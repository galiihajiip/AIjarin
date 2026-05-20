'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  Play,
  Send,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { MissionPlayerData } from '@/lib/missions/fetch-mission-player';
import { parseProjectContent } from '@/lib/missions/parse-project-content';
import type { ProjectGradeResult } from '@/lib/missions/project-grader';
import { cn } from '@/lib/utils';

type ProjectMissionProps = {
  kontenJson: MissionPlayerData['kontenJson'];
  className?: string;
};

const STANDARD_RUBRIC = [
  { key: 'kejelasan', label: 'Kejelasan', weight: 25 },
  { key: 'spesifikasi', label: 'Spesifikasi', weight: 25 },
  { key: 'konteks', label: 'Konteks', weight: 25 },
  { key: 'hasil', label: 'Hasil', weight: 25 },
] as const;

export function ProjectMission({ kontenJson, className }: ProjectMissionProps) {
  const content = useMemo(() => parseProjectContent(kontenJson), [kontenJson]);

  const [promptText, setPromptText] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [outputEvaluation, setOutputEvaluation] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<ProjectGradeResult | null>(null);
  const [gradeResult, setGradeResult] = useState<ProjectGradeResult | null>(
    null
  );
  const [testError, setTestError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      kontenJson,
      promptText,
      expectedOutput,
      outputEvaluation,
    }),
    [kontenJson, expectedOutput, outputEvaluation, promptText]
  );

  const handleTest = useCallback(async () => {
    if (!promptText.trim()) return;

    setIsTesting(true);
    setTestError(null);

    try {
      const response = await fetch('/api/missions/project-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ProjectGradeResult & {
        error?: string;
      };

      if (!response.ok) {
        setTestError(result.error ?? 'Uji prompt gagal.');
        return;
      }

      setTestResult(result);
    } catch {
      setTestError('Tidak bisa menghubungi server uji prompt.');
    } finally {
      setIsTesting(false);
    }
  }, [payload, promptText]);

  const handleSubmit = useCallback(async () => {
    if (!promptText.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/missions/project-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ProjectGradeResult & {
        error?: string;
      };

      if (!response.ok) {
        setSubmitError(result.error ?? 'Penilaian proyek gagal.');
        return;
      }

      setGradeResult(result);
    } catch {
      setSubmitError('Tidak bisa menghubungi auto-grader proyek.');
    } finally {
      setIsSubmitting(false);
    }
  }, [payload, promptText]);

  if (!content) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-4 text-sm text-red-200">
        Konten misi proyek tidak valid. Hubungi guru atau admin ya.
      </div>
    );
  }

  const activeRubric = gradeResult?.rubricScores ?? testResult?.rubricScores;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5',
        className
      )}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sigma-cyan">
          Proyek Prompt
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">
          {content.instruksi}
        </p>
      </div>

      <article className="rounded-xl border border-slate-700 bg-gradient-to-b from-slate-800/80 to-slate-950/70 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-sigma-gold">
          <ClipboardList className="h-4 w-4" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Briefing Proyek
          </h2>
        </div>

        {content.skenario ? (
          <p className="text-sm leading-relaxed text-slate-300">
            {content.skenario}
          </p>
        ) : null}

        <p className="mt-3 text-sm leading-relaxed text-slate-200">
          {content.tugas}
        </p>

        {content.konteksWajib.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {content.konteksWajib.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-sigma-cyan/30 bg-sigma-cyan/10 px-2.5 py-1 text-xs text-sigma-cyan"
              >
                {keyword}
              </span>
            ))}
          </div>
        ) : null}

        {content.promptLemah ? (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs text-red-200">
            <p className="font-semibold">Prompt lemah (referensi):</p>
            <p className="mt-1 font-mono">{content.promptLemah}</p>
          </div>
        ) : null}

        {content.contohPromptKuat ? (
          <details className="mt-4 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
            <summary className="cursor-pointer text-slate-300">
              Lihat contoh prompt kuat
            </summary>
            <p className="mt-2 leading-relaxed">{content.contohPromptKuat}</p>
          </details>
        ) : null}
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">
            Prompt kamu
          </span>
          <textarea
            value={promptText}
            onChange={(event) => {
              setPromptText(event.target.value);
              setGradeResult(null);
            }}
            rows={8}
            className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-sigma-cyan"
            placeholder="Tulis prompt lengkap di sini..."
          />
        </label>

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">
              Apa yang kamu harapkan?
            </span>
            <textarea
              value={expectedOutput}
              onChange={(event) => setExpectedOutput(event.target.value)}
              rows={4}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-100 outline-none focus:border-sigma-cyan"
              placeholder="Contoh: jawaban bullet 3 poin, bahasa Indonesia, ringkas..."
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">
              Evaluasi output
            </span>
            <textarea
              value={outputEvaluation}
              onChange={(event) => setOutputEvaluation(event.target.value)}
              rows={4}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm leading-6 text-slate-100 outline-none focus:border-sigma-cyan"
              placeholder="Jelaskan bagaimana kamu menilai apakah output sudah bagus..."
            />
          </label>
        </div>
      </div>

      <section className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
        <h3 className="text-sm font-semibold text-white">Rubrik Penilaian</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {STANDARD_RUBRIC.map((item) => {
            const score = activeRubric?.find((row) => row.key === item.key);

            return (
              <div
                key={item.key}
                className="rounded-lg border border-slate-800 bg-slate-900/70 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-100">
                    {item.label}
                  </p>
                  <span className="text-xs text-slate-500">{item.weight}%</span>
                </div>
                {score ? (
                  <>
                    <Progress
                      value={score.score}
                      className="mt-2 h-2 bg-slate-800 [&>div]:bg-sigma-cyan"
                    />
                    <p className="mt-2 text-xs tabular-nums text-sigma-cyan">
                      {score.score}/100
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {score.feedback}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Dinilai saat uji prompt atau submit.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {content.rubrik.length > 0 ? (
          <details className="mt-4 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
            <summary className="cursor-pointer text-xs text-slate-400">
              Rubrik detail misi ({content.rubrik.length} kriteria)
            </summary>
            <ul className="mt-2 space-y-2 text-xs text-slate-400">
              {content.rubrik.map((item) => (
                <li key={item.kriteria}>
                  <span className="font-semibold text-slate-300">
                    {item.kriteria}
                  </span>{' '}
                  ({item.bobot}%): {item.deskripsi}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      {(testResult?.sandboxResponse || testError) && (
        <section
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            testError
              ? 'border-red-500/40 bg-red-950/30 text-red-100'
              : 'border-slate-700 bg-slate-950/60 text-slate-200'
          )}
        >
          <p className="mb-2 font-semibold text-slate-100">Hasil Uji Prompt</p>
          {testError ? (
            <p>{testError}</p>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {testResult?.sandboxResponse}
            </pre>
          )}
          {testResult?.mode ? (
            <p className="mt-2 text-xs text-slate-500">
              Mode: {testResult.mode === 'anthropic' ? 'Claude API' : 'Demo'}
            </p>
          ) : null}
        </section>
      )}

      {submitError ? (
        <section className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-100">
          <p className="font-semibold">Penilaian gagal</p>
          <p className="mt-1">{submitError}</p>
        </section>
      ) : null}

      {gradeResult ? (
        <section
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            gradeResult.passed
              ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100'
              : 'border-amber-500/40 bg-amber-950/30 text-amber-100'
          )}
          role="status"
        >
          <div className="flex items-center gap-2 font-semibold">
            {gradeResult.passed ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            Skor akhir: {gradeResult.totalScore}/100
          </div>
          <p className="mt-2 leading-relaxed">{gradeResult.summary}</p>
        </section>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="w-full border-slate-600 bg-slate-900/60 text-slate-100 hover:bg-slate-800 sm:w-auto"
          onClick={handleTest}
          disabled={isTesting || isSubmitting || !promptText.trim()}
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
          Uji Prompt
        </Button>
        <Button
          type="button"
          className="w-full bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90 sm:w-auto"
          onClick={handleSubmit}
          disabled={isSubmitting || isTesting || !promptText.trim()}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="h-4 w-4" aria-hidden />
          )}
          Kirim untuk Dinilai
        </Button>
      </div>
    </div>
  );
}
