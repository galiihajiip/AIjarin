import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
});

function formatZodError(error: z.ZodError): string {
  return Object.entries(error.flatten().fieldErrors)
    .map(([key, messages]) => {
      const list = Array.isArray(messages) ? messages : [];
      return `${key}: ${list.join(', ')}`;
    })
    .join('\n');
}

function parseEnv() {
  const publicInput = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  };

  if (typeof window !== 'undefined') {
    const result = publicEnvSchema.safeParse(publicInput);
    if (!result.success) {
      throw new Error(
        `Variabel lingkungan publik tidak valid:\n${formatZodError(result.error)}`
      );
    }
    return { ...result.data, isServer: false as const };
  }

  const result = serverEnvSchema.safeParse({
    ...publicInput,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  });

  if (!result.success) {
    throw new Error(
      `Variabel lingkungan tidak valid:\n${formatZodError(result.error)}`
    );
  }

  return { ...result.data, isServer: true as const };
}

/** Validated environment variables — throws at module load if invalid. */
export const env = parseEnv();

export type Env = typeof env;
