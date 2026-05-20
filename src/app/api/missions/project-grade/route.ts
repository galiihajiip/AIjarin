import { NextResponse } from 'next/server';
import { z } from 'zod';

import { parseProjectContent } from '@/lib/missions/parse-project-content';
import { gradeProjectSubmission } from '@/lib/missions/project-grader';
import type { JsonValue } from '@/types';

const projectGradeSchema = z.object({
  kontenJson: z.unknown(),
  promptText: z.string().min(1),
  expectedOutput: z.string().default(''),
  outputEvaluation: z.string().default(''),
});

export async function POST(request: Request) {
  const payload = projectGradeSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Payload penilaian proyek tidak valid.',
      },
      { status: 400 }
    );
  }

  const content = parseProjectContent(payload.data.kontenJson as JsonValue);
  if (!content) {
    return NextResponse.json(
      {
        success: false,
        error: 'Konten misi proyek tidak valid.',
      },
      { status: 400 }
    );
  }

  try {
    const result = await gradeProjectSubmission(content, {
      promptText: payload.data.promptText,
      expectedOutput: payload.data.expectedOutput,
      outputEvaluation: payload.data.outputEvaluation,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal menilai proyek dengan auto-grader.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
