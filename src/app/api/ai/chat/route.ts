import { NextResponse } from 'next/server';
import { z } from 'zod';

import { callGemini } from '@/lib/ai/gemini';
import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/types';

const RATE_LIMIT_PER_HOUR = 10;

const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  misiId: z.string().uuid(),
  context: z.string().trim().min(1).max(8000),
});

function buildSystemPrompt(context: string): string {
  return [
    'Kamu adalah "SIGMA-Bot", asisten AI yang ramah, sabar, dan super pintar di AIjarin.',
    'Kamu membantu siswa SMA memahami logika komputasi.',
    '',
    'Aturan:',
    '- SELALU gunakan Bahasa Indonesia yang santai dan ramah.',
    '- SELALU gunakan kata "kamu" (bukan "Anda" atau "lo").',
    '- JANGAN pernah langsung memberikan jawaban. Berikan petunjuk bertahap.',
    '- Gunakan analogi kehidupan sehari-hari yang dekat dengan siswa SMA Indonesia.',
    '- Jika siswa frustrasi, validasi perasaannya dulu sebelum membantu.',
    '- Maksimal 3 kalimat per respons. Singkat tapi bermakna.',
    `- Konteks misi saat ini: ${context}`,
  ].join('\n');
}

function sendSse(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: string,
  payload: unknown
) {
  const encoder = new TextEncoder();
  controller.enqueue(
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
  );
}

function splitIntoReadableChunks(text: string): string[] {
  const words = text.split(/(\s+)/);
  const chunks: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + word).length > 48 && current.trim()) {
      chunks.push(current);
      current = word;
    } else {
      current += word;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function enforceRateLimit(siswaId: string): Promise<boolean> {
  const supabase = createClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('chatbot_logs')
    .select('id', { count: 'exact', head: true })
    .eq('siswa_id', siswaId)
    .gte('created_at', oneHourAgo);

  if (error) {
    throw new Error(`Gagal memeriksa limit chat: ${error.message}`);
  }

  return (count ?? 0) < RATE_LIMIT_PER_HOUR;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Kamu harus masuk dulu untuk memakai SIGMA-Bot.' },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== UserRole.Siswa) {
    return NextResponse.json(
      { error: 'SIGMA-Bot hanya tersedia untuk siswa.' },
      { status: 403 }
    );
  }

  const body = chatRequestSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json(
      { error: 'Payload chat tidak valid.' },
      { status: 400 }
    );
  }

  const allowed = await enforceRateLimit(user.id);

  if (!allowed) {
    return NextResponse.json(
      {
        error:
          'Limit chat kamu sudah habis untuk jam ini. Coba lagi sebentar lagi ya!',
      },
      { status: 429 }
    );
  }

  const { message, misiId, context } = body.data;
  const systemPrompt = buildSystemPrompt(context);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        sendSse(controller, 'start', {
          message: 'SIGMA-Bot sedang berpikir...',
        });

        const result = await callGemini({
          systemPrompt,
          userMessage: message,
          maxTokens: 240,
          temperature: 0.6,
        });

        const { error: logError } = await supabase.from('chatbot_logs').insert({
          siswa_id: user.id,
          misi_id: misiId,
          pesan_siswa: message,
          respons_ai: result.text,
          tokens_used: result.tokensUsed,
          latency_ms: result.latencyMs,
        });

        if (logError) {
          throw new Error(`Gagal menyimpan log chat: ${logError.message}`);
        }

        for (const chunk of splitIntoReadableChunks(result.text)) {
          sendSse(controller, 'chunk', { text: chunk });
        }

        sendSse(controller, 'done', {
          message: result.text,
          tokensUsed: result.tokensUsed,
        });
      } catch (error) {
        sendSse(controller, 'error', {
          error:
            error instanceof Error
              ? error.message
              : 'SIGMA-Bot belum bisa menjawab saat ini.',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
