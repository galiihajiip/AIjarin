import Anthropic from '@anthropic-ai/sdk';

import type { ProjectContent } from '@/lib/missions/parse-project-content';

export type RubricDimension = 'kejelasan' | 'spesifikasi' | 'konteks' | 'hasil';

export type RubricScore = {
  key: RubricDimension;
  label: string;
  weight: number;
  score: number;
  feedback: string;
};

export type ProjectGradeResult = {
  success: boolean;
  totalScore: number;
  passed: boolean;
  rubricScores: RubricScore[];
  summary: string;
  sandboxResponse?: string;
  mode: 'anthropic' | 'heuristic';
};

export type ProjectSubmission = {
  promptText: string;
  expectedOutput: string;
  outputEvaluation: string;
};

const RUBRIC_LABELS: Record<RubricDimension, string> = {
  kejelasan: 'Kejelasan',
  spesifikasi: 'Spesifikasi',
  konteks: 'Konteks',
  hasil: 'Hasil',
};

const RUBRIC_WEIGHTS: Record<RubricDimension, number> = {
  kejelasan: 25,
  spesifikasi: 25,
  konteks: 25,
  hasil: 25,
};

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    return null;
  }

  return new Anthropic({ apiKey });
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function includesKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildHeuristicScores(
  content: ProjectContent,
  submission: ProjectSubmission
): RubricScore[] {
  const combined = `${submission.promptText}\n${submission.expectedOutput}\n${submission.outputEvaluation}`;
  const wordCount = countWords(submission.promptText);
  const minWords = content.minPanjangKata;

  const claritySignals = [
    /\b(jelaskan|buat|tulis|minta|tolong|bantu)\b/i.test(submission.promptText),
    submission.promptText.includes('?') || submission.promptText.includes('.'),
    wordCount >= minWords,
  ];

  const specificitySignals = [
    content.konteksWajib.some((keyword) =>
      includesKeyword(submission.promptText, keyword)
    ),
    /\b(format|bullet|langkah|jadwal|contoh|fungsi|python)\b/i.test(
      submission.promptText
    ),
    countWords(submission.expectedOutput) >= 8,
  ];

  const contextCoverage =
    content.konteksWajib.length === 0
      ? 1
      : content.konteksWajib.filter((keyword) =>
          includesKeyword(combined, keyword)
        ).length / content.konteksWajib.length;

  const outputSignals = [
    countWords(submission.expectedOutput) >= 10,
    countWords(submission.outputEvaluation) >= 12,
    /\b(terstruktur|ringkas|jelas|mudah dibaca|sesuai)\b/i.test(
      submission.outputEvaluation
    ),
  ];

  const toScore = (signals: boolean[]) =>
    clampScore((signals.filter(Boolean).length / signals.length) * 100);

  const scores: Record<RubricDimension, { score: number; feedback: string }> = {
    kejelasan: {
      score: toScore(claritySignals),
      feedback:
        wordCount >= minWords
          ? 'Permintaanmu cukup jelas dan terstruktur.'
          : `Perjelas permintaanmu — target minimal ${minWords} kata.`,
    },
    spesifikasi: {
      score: toScore(specificitySignals),
      feedback:
        specificitySignals.filter(Boolean).length >= 2
          ? 'Detail tugas dan output sudah cukup spesifik.'
          : 'Tambahkan detail topik, format, atau batasan yang lebih konkret.',
    },
    konteks: {
      score: clampScore(contextCoverage * 100),
      feedback:
        contextCoverage >= 0.75
          ? 'Konteks wajib misi sudah tercakup dengan baik.'
          : 'Lengkapi konteks siswa, level, atau latar belakang misi.',
    },
    hasil: {
      score: toScore(outputSignals),
      feedback:
        outputSignals.filter(Boolean).length >= 2
          ? 'Ekspektasi output dan evaluasi sudah masuk akal.'
          : 'Jelaskan output yang diharapkan dan cara menilai kualitasnya.',
    },
  };

  return (Object.keys(RUBRIC_LABELS) as RubricDimension[]).map((key) => ({
    key,
    label: RUBRIC_LABELS[key],
    weight: RUBRIC_WEIGHTS[key],
    score: scores[key].score,
    feedback: scores[key].feedback,
  }));
}

function calculateTotalScore(rubricScores: RubricScore[]): number {
  const totalWeight = rubricScores.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;

  const weighted = rubricScores.reduce(
    (sum, item) => sum + item.score * item.weight,
    0
  );

  return clampScore(weighted / totalWeight);
}

function parseJsonFromText(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
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

function mapAiRubricScores(
  parsed: Record<string, unknown> | null,
  fallback: RubricScore[]
): RubricScore[] {
  if (!parsed || typeof parsed.rubricScores !== 'object') {
    return fallback;
  }

  const rubric = parsed.rubricScores as Record<string, unknown>;

  return fallback.map((item) => {
    const row = rubric[item.key];
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return item;
    }

    const data = row as Record<string, unknown>;
    return {
      ...item,
      score:
        typeof data.score === 'number' ? clampScore(data.score) : item.score,
      feedback:
        typeof data.feedback === 'string' ? data.feedback : item.feedback,
    };
  });
}

export async function runSandboxPromptTest(
  content: ProjectContent,
  submission: ProjectSubmission
): Promise<ProjectGradeResult> {
  const client = getAnthropicClient();
  const heuristic = buildHeuristicScores(content, submission);

  if (!client) {
    return {
      success: true,
      totalScore: calculateTotalScore(heuristic),
      passed: true,
      rubricScores: heuristic,
      summary:
        'Mode demo: respons simulasi ditampilkan karena API key belum dikonfigurasi.',
      sandboxResponse: [
        'SIGMA (simulasi): Baik, Agen! Berikut ringkasan respons berdasarkan prompt kamu:',
        '',
        submission.expectedOutput.trim() ||
          'Saya akan menjawab sesuai instruksi prompt kamu dengan gaya mentor yang empatik.',
        '',
        'Catatan: sambungkan ANTHROPIC_API_KEY asli untuk respons Claude langsung.',
      ].join('\n'),
      mode: 'heuristic',
    };
  }

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-latest',
    max_tokens: 500,
    temperature: 0.3,
    system: [
      'Kamu adalah SIGMA, mentor AI untuk siswa SMA informatika di Indonesia.',
      'Jawab singkat, empatik, pakai sapaan kamu, Bahasa Indonesia.',
      'Jangan bantu kecurangan ujian. Jangan keluar dari konteks pendidikan.',
    ].join(' '),
    messages: [
      {
        role: 'user',
        content: [
          `Konteks misi: ${content.tugas}`,
          `Prompt siswa:\n${submission.promptText}`,
          submission.expectedOutput
            ? `Output yang diharapkan siswa:\n${submission.expectedOutput}`
            : null,
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  const sandboxResponse =
    textBlock && textBlock.type === 'text'
      ? textBlock.text
      : 'SIGMA tidak mengembalikan teks respons.';

  return {
    success: true,
    totalScore: calculateTotalScore(heuristic),
    passed: true,
    rubricScores: heuristic,
    summary: 'Respons uji coba dari Claude siap ditinjau.',
    sandboxResponse,
    mode: 'anthropic',
  };
}

export async function gradeProjectSubmission(
  content: ProjectContent,
  submission: ProjectSubmission
): Promise<ProjectGradeResult> {
  const heuristic = buildHeuristicScores(content, submission);
  const client = getAnthropicClient();

  if (!client) {
    const totalScore = calculateTotalScore(heuristic);
    const passed = totalScore >= 70;

    return {
      success: passed,
      totalScore,
      passed,
      rubricScores: heuristic,
      summary: passed
        ? (content.penjelasanSukses ??
          'Prompt kamu memenuhi rubrik minimal. Keren!')
        : 'Prompt belum memenuhi rubrik. Perbaiki kejelasan, konteks, dan format output.',
      mode: 'heuristic',
    };
  }

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-latest',
    max_tokens: 700,
    temperature: 0.2,
    system: [
      'Kamu adalah penilai prompt engineering untuk misi AIjarin.',
      'Nilai submission siswa dengan rubrik: kejelasan, spesifikasi, konteks, hasil (masing-masing 0-100).',
      'Balas HANYA JSON valid tanpa markdown.',
      'Format: {"rubricScores":{"kejelasan":{"score":0,"feedback":"..."},"spesifikasi":{"score":0,"feedback":"..."},"konteks":{"score":0,"feedback":"..."},"hasil":{"score":0,"feedback":"..."}},"summary":"..."}',
    ].join(' '),
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          misi: {
            instruksi: content.instruksi,
            skenario: content.skenario,
            tugas: content.tugas,
            konteks_wajib: content.konteksWajib,
            min_panjang_kata: content.minPanjangKata,
            rubrik_misi: content.rubrik,
          },
          submission,
        }),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  const raw = textBlock && textBlock.type === 'text' ? textBlock.text : '{}';
  const parsed = parseJsonFromText(raw);
  const rubricScores = mapAiRubricScores(parsed, heuristic);
  const totalScore = calculateTotalScore(rubricScores);
  const passed = totalScore >= 70;

  return {
    success: passed,
    totalScore,
    passed,
    rubricScores,
    summary:
      typeof parsed?.summary === 'string'
        ? parsed.summary
        : passed
          ? (content.penjelasanSukses ?? content.penjelasan)
          : content.penjelasan,
    mode: 'anthropic',
  };
}
