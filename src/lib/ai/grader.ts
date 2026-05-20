import { callGemini } from '@/lib/ai/gemini';
import type { JsonValue } from '@/types';
import { MisiType } from '@/types';

export type AutoGradeInput = {
  misiType: MisiType.CodeTyping | MisiType.Project;
  userAnswer: unknown;
  kontenJson: JsonValue;
};

export type AutoGradeResult = {
  skor: number;
  feedback: string;
  specific_errors: string[];
  tokensUsed: number;
  latencyMs: number;
};

type RubricItem = {
  kriteria: string;
  bobot: number;
  deskripsi: string;
};

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function sanitizeFeedback(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

function stringifyAnswer(answer: unknown): string {
  if (typeof answer === 'string') return answer;

  try {
    return JSON.stringify(answer, null, 2);
  } catch {
    return String(answer);
  }
}

function readString(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function parseRubric(value: unknown): RubricItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): RubricItem | null => {
      const row = getRecord(item);
      if (!row) return null;

      const kriteria =
        typeof row.kriteria === 'string'
          ? row.kriteria
          : typeof row.criteria === 'string'
            ? row.criteria
            : null;
      const deskripsi =
        typeof row.deskripsi === 'string'
          ? row.deskripsi
          : typeof row.description === 'string'
            ? row.description
            : '';
      const bobot =
        typeof row.bobot === 'number'
          ? row.bobot
          : typeof row.weight === 'number'
            ? row.weight
            : 0;

      return kriteria ? { kriteria, bobot, deskripsi } : null;
    })
    .filter((item): item is RubricItem => item !== null);
}

function parseJsonFromText(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? text;

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    try {
      return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function normalizeModelResult(
  raw: string,
  tokensUsed: number,
  latencyMs: number
): AutoGradeResult {
  const parsed = parseJsonFromText(raw);
  const errors = Array.isArray(parsed?.specific_errors)
    ? parsed.specific_errors
        .filter((item): item is string => typeof item === 'string')
        .map(sanitizeFeedback)
        .filter(Boolean)
        .slice(0, 6)
    : [];

  return {
    skor: clampScore(typeof parsed?.skor === 'number' ? parsed.skor : 0),
    feedback: sanitizeFeedback(
      typeof parsed?.feedback === 'string'
        ? parsed.feedback
        : 'Auto-grader belum mengembalikan feedback yang valid.'
    ),
    specific_errors: errors,
    tokensUsed,
    latencyMs,
  };
}

function buildCodePrompt(kontenJson: JsonValue, userAnswer: unknown): string {
  const data = getRecord(kontenJson) ?? {};
  const taskDescription =
    readString(data, ['instruksi', 'tugas', 'skenario', 'pertanyaan']) ||
    'Nilai kode siswa berdasarkan tugas misi.';
  const expectedBehavior =
    readString(data, [
      'expected_behavior',
      'perilaku_diharapkan',
      'baris_target',
      'contoh_benar',
      'penjelasan',
    ]) || 'Kode menjalankan instruksi misi dengan benar.';

  return [
    'Nilai jawaban code_typing siswa berikut.',
    '',
    `Deskripsi tugas:\n${taskDescription}`,
    '',
    `Kode siswa:\n${stringifyAnswer(userAnswer)}`,
    '',
    `Expected behavior:\n${expectedBehavior}`,
    '',
    'Rubrik penilaian:',
    '- Correctness: 60%',
    '- Code structure: 20%',
    '- Readability: 20%',
    '',
    'Balas HANYA JSON valid tanpa markdown:',
    '{"skor": number, "feedback": string, "specific_errors": string[]}',
  ].join('\n');
}

function buildProjectPrompt(
  kontenJson: JsonValue,
  userAnswer: unknown
): string {
  const data = getRecord(kontenJson) ?? {};
  const taskDescription =
    readString(data, ['tugas', 'instruksi', 'skenario']) ||
    'Nilai proyek prompt engineering siswa.';
  const rubric = parseRubric(data.rubric ?? data.rubrik);
  const rubricText =
    rubric.length > 0
      ? rubric
          .map(
            (item) => `- ${item.kriteria} (${item.bobot}%): ${item.deskripsi}`
          )
          .join('\n')
      : [
          '- Kejelasan (25%): instruksi mudah dipahami.',
          '- Spesifikasi (25%): format dan batasan jelas.',
          '- Konteks (25%): konteks misi tercakup.',
          '- Hasil (25%): output yang diharapkan bisa dievaluasi.',
        ].join('\n');

  return [
    'Nilai jawaban project mission siswa Level 7.',
    '',
    `Deskripsi tugas:\n${taskDescription}`,
    '',
    `Jawaban siswa:\n${stringifyAnswer(userAnswer)}`,
    '',
    `Rubrik misi:\n${rubricText}`,
    '',
    'Gunakan skor 0-100 berdasarkan bobot rubrik. Feedback harus ramah, spesifik, dan memakai kata "kamu".',
    'Balas HANYA JSON valid tanpa markdown:',
    '{"skor": number, "feedback": string, "specific_errors": string[]}',
  ].join('\n');
}

export async function gradeMissionWithAi(
  input: AutoGradeInput
): Promise<AutoGradeResult> {
  const isCodeMission = input.misiType === MisiType.CodeTyping;
  const prompt = isCodeMission
    ? buildCodePrompt(input.kontenJson, input.userAnswer)
    : buildProjectPrompt(input.kontenJson, input.userAnswer);

  const result = await callGemini({
    systemPrompt: [
      'Kamu adalah auto-grader AIjarin untuk siswa SMA.',
      'Nilai secara adil berdasarkan rubrik.',
      'Jangan memberi jawaban lengkap yang bisa langsung disalin.',
      'Semua respons wajib JSON valid sesuai format yang diminta.',
    ].join(' '),
    userMessage: prompt,
    maxTokens: 700,
    temperature: 0.2,
  });

  return normalizeModelResult(result.text, result.tokensUsed, result.latencyMs);
}
