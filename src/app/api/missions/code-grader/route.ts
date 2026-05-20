import { NextResponse } from 'next/server';
import { z } from 'zod';

const gradeCodeSchema = z.object({
  code: z.string(),
  userCode: z.string(),
  targetCode: z.string(),
  ignoreExtraWhitespace: z.boolean().default(true),
  language: z.string().default('python'),
});

function normalizeCode(code: string, ignoreExtraWhitespace: boolean): string {
  const trimmed = code.trim();

  if (!ignoreExtraWhitespace) {
    return trimmed;
  }

  return trimmed
    .split('\n')
    .map((line) => line.trimEnd().replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function countMatchingLines(userCode: string, targetCode: string): number {
  const userLines = userCode
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const targetLines = targetCode
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return targetLines.filter((line, index) => userLines[index] === line).length;
}

export async function POST(request: Request) {
  const payload = gradeCodeSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      {
        success: false,
        score: 0,
        error: 'Payload auto-grader tidak valid.',
      },
      { status: 400 }
    );
  }

  const { userCode, targetCode, ignoreExtraWhitespace } = payload.data;
  const normalizedUser = normalizeCode(userCode, ignoreExtraWhitespace);
  const normalizedTarget = normalizeCode(targetCode, ignoreExtraWhitespace);
  const success = normalizedUser === normalizedTarget;

  if (success) {
    return NextResponse.json({
      success: true,
      score: 100,
      output: 'Kode kamu cocok dengan target misi. Mantap, Agen!',
      feedback: 'Auto-grader guided berhasil memvalidasi struktur kode.',
    });
  }

  const targetLineCount = Math.max(normalizedTarget.split('\n').length, 1);
  const matchingLines = countMatchingLines(normalizedUser, normalizedTarget);
  const score = Math.round((matchingLines / targetLineCount) * 100);

  return NextResponse.json({
    success: false,
    score,
    error:
      'Kode belum sesuai target. Periksa nama fungsi/variabel, indentasi, dan isi barisnya.',
    feedback: `${matchingLines}/${targetLineCount} baris sudah berada di posisi yang benar.`,
  });
}
