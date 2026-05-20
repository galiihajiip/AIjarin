import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const CLAUDE_HAIKU_MODEL = 'claude-3-5-haiku-latest';

export type CallClaudeParams = {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
};

export type CallClaudeResult = {
  text: string;
  tokensUsed: number;
  latencyMs: number;
};

export async function callClaude(
  params: CallClaudeParams
): Promise<CallClaudeResult> {
  const start = Date.now();

  const message = await client.messages.create({
    model: CLAUDE_HAIKU_MODEL,
    max_tokens: params.maxTokens ?? 500,
    temperature: params.temperature ?? 0.7,
    system: params.systemPrompt,
    messages: [{ role: 'user', content: params.userMessage }],
  });

  const latencyMs = Date.now() - start;
  const textBlock = message.content.find((block) => block.type === 'text');
  const text = textBlock?.type === 'text' ? textBlock.text : '';
  const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

  return { text, tokensUsed, latencyMs };
}
