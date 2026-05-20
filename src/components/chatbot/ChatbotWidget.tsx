'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, X } from 'lucide-react';

import { SigmaLogo } from '@/components/auth/SigmaLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  content: string;
};

type ChatbotWidgetProps = {
  misiId: string;
  missionName: string;
  context: string;
  className?: string;
};

type SsePayload =
  | { text?: string }
  | { message?: string; tokensUsed?: number }
  | { error?: string };

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseSseEvents(buffer: string): {
  events: Array<{ event: string; data: SsePayload }>;
  rest: string;
} {
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';

  const events = parts
    .map((part) => {
      const event =
        part
          .split('\n')
          .find((line) => line.startsWith('event: '))
          ?.slice(7)
          .trim() ?? 'message';
      const dataLine = part
        .split('\n')
        .find((line) => line.startsWith('data: '));

      if (!dataLine) return null;

      try {
        return {
          event,
          data: JSON.parse(dataLine.slice(6)) as SsePayload,
        };
      } catch {
        return null;
      }
    })
    .filter(
      (event): event is { event: string; data: SsePayload } => event !== null
    );

  return { events, rest };
}

export function ChatbotWidget({
  misiId,
  missionName,
  context,
  className,
}: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitWarning, setRateLimitWarning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'sigma-greeting',
      role: 'bot',
      content: `Hai! Kamu sedang mengerjakan ${missionName}. Ada yang membingungkan?`,
    },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  const appendToBotMessage = useCallback((messageId: string, chunk: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, content: `${message.content}${chunk}` }
          : message
      )
    );
  }, []);

  const sendMessage = useCallback(
    async (rawMessage: string) => {
      const trimmed = rawMessage.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = {
        id: createId('user'),
        role: 'user',
        content: trimmed,
      };
      const botMessageId = createId('bot');

      setMessages((current) => [
        ...current,
        userMessage,
        { id: botMessageId, role: 'bot', content: '' },
      ]);
      setInput('');
      setIsLoading(true);
      setRateLimitWarning(false);

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            misiId,
            context,
          }),
        });

        if (response.status === 429) {
          setRateLimitWarning(true);
          setMessages((current) =>
            current.filter((message) => message.id !== botMessageId)
          );
          return;
        }

        if (!response.ok || !response.body) {
          throw new Error('SIGMA-Bot belum bisa dihubungi.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parsed = parseSseEvents(buffer);
          buffer = parsed.rest;

          for (const item of parsed.events) {
            if (item.event === 'chunk' && 'text' in item.data) {
              appendToBotMessage(botMessageId, item.data.text ?? '');
            }

            if (item.event === 'done' && 'message' in item.data) {
              const finalMessage = item.data.message ?? '';
              setMessages((current) =>
                current.map((message) =>
                  message.id === botMessageId
                    ? {
                        ...message,
                        content: message.content || finalMessage,
                      }
                    : message
                )
              );
            }

            if (item.event === 'error' && 'error' in item.data) {
              throw new Error(item.data.error ?? 'SIGMA-Bot gagal menjawab.');
            }
          }
        }
      } catch (error) {
        const fallback =
          error instanceof Error
            ? error.message
            : 'SIGMA-Bot belum bisa menjawab sekarang.';
        setMessages((current) =>
          current.map((message) =>
            message.id === botMessageId
              ? { ...message, content: fallback }
              : message
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [appendToBotMessage, context, isLoading, misiId]
  );

  const handleSubmit = useCallback(() => {
    void sendMessage(input);
  }, [input, sendMessage]);

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6',
        className
      )}
    >
      <section
        className={cn(
          'fixed bottom-20 left-3 right-3 origin-bottom rounded-3xl border border-slate-700 bg-slate-950/95 shadow-2xl shadow-slate-950/70 backdrop-blur transition-all duration-200 sm:left-auto sm:right-6 sm:w-[350px]',
          isOpen
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-8 scale-95 opacity-0'
        )}
        aria-label="Chat SIGMA-Bot"
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-sigma-cyan/15">
              <SigmaLogo size={28} />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">SIGMA-Bot</p>
              <p className="text-xs text-slate-400">Tutor misi kamu</p>
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup chat"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>

        <div className="max-h-[55dvh] min-h-[18rem] space-y-3 overflow-y-auto px-4 py-4 sm:max-h-[27rem]">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                {!isUser ? (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sigma-cyan/15">
                    <Bot className="h-4 w-4 text-sigma-cyan" aria-hidden />
                  </div>
                ) : null}
                <div
                  className={cn(
                    'max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    isUser
                      ? 'rounded-br-md bg-sigma-cyan text-sigma-navy'
                      : 'rounded-bl-md border border-slate-700 bg-slate-900 text-slate-100'
                  )}
                >
                  {message.content || (
                    <span className="text-slate-500">
                      Bot sedang mengetik...
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Bot sedang mengetik...
            </div>
          ) : null}
          <div ref={scrollRef} />
        </div>

        {rateLimitWarning ? (
          <p className="mx-4 mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Kamu sudah banyak bertanya hari ini. Coba dulu sendiri ya!
          </p>
        ) : null}

        <div className="border-t border-slate-800 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              rows={2}
              className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sigma-cyan"
              placeholder="Tanya SIGMA-Bot..."
              disabled={isLoading}
            />
            <Button
              type="button"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-2xl bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90"
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              aria-label="Kirim pesan"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>
      </section>

      <button
        type="button"
        className="group relative flex h-16 w-16 items-center justify-center rounded-full border border-sigma-cyan/50 bg-slate-950 text-white shadow-2xl shadow-sigma-cyan/20 transition hover:scale-105"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Tutup SIGMA-Bot' : 'Buka SIGMA-Bot'}
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-sigma-cyan/20" />
        <span className="absolute inset-1 rounded-full bg-sigma-cyan/10 opacity-0 transition group-hover:opacity-100" />
        <SigmaLogo size={42} className="relative" />
      </button>
    </div>
  );
}
