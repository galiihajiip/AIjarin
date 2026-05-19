import { createClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';

/**
 * Service-role client for trusted server operations (e.g. badge awards).
 * Bypasses RLS — use only from server-side gamification logic.
 */
export function createAdminClient() {
  if (!env.isServer) {
    throw new Error('createAdminClient hanya boleh dipanggil di server.');
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
