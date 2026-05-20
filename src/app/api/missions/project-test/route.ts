import { NextResponse } from 'next/server';
import { z } from 'zod';

import { parseProjectContent } from '@/lib/missions/parse-project-content';
import { runSandboxPromptTest } from '@/lib/missions/project-grader';
import type { JsonValue } from '@/types';

const projectTestSchema = z.object({
  kontenJson: z.unknown(),
  promptText: z.string().min(1),
  expectedOutput: z.string().default(''),
  outputEvaluation: z.string().default(''),
});

export async function POST(request: Request) {
  const payload = projectTestSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Payload uji prompt tidak valid.',
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
    const result = await runSandboxPromptTest(content, {
      promptText: payload.data.promptText,
      expectedOutput: payload.data.expectedOutput,
      outputEvaluation: payload.data.outputEvaluation,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal menghubungi Claude untuk uji prompt.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
