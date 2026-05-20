const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type CallGeminiParams = {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
};

export type CallGeminiResult = {
  text: string;
  tokensUsed: number;
  latencyMs: number;
};

type GeminiTextPart = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiTextPart[];
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: {
    message?: string;
  };
};

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey.includes('placeholder')) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi.');
  }

  return apiKey;
}

function getText(response: GeminiResponse): string {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim() ?? ''
  );
}

function getTokensUsed(response: GeminiResponse): number {
  const usage = response.usageMetadata;
  if (!usage) return 0;

  return (
    usage.totalTokenCount ??
    (usage.promptTokenCount ?? 0) + (usage.candidatesTokenCount ?? 0)
  );
}

export async function callGemini(
  params: CallGeminiParams
): Promise<CallGeminiResult> {
  const start = Date.now();
  const apiKey = getGeminiApiKey();

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: params.systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: params.userMessage }],
        },
      ],
      generationConfig: {
        maxOutputTokens: params.maxTokens ?? 500,
        temperature: params.temperature ?? 0.7,
      },
    }),
  });

  const latencyMs = Date.now() - start;
  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Gagal memanggil Gemini API.');
  }

  return {
    text: getText(data),
    tokensUsed: getTokensUsed(data),
    latencyMs,
  };
}
