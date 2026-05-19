import { type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

/**
 * Middleware: refresh sesi Supabase + RBAC per rute.
 *
 * Publik: /, /login, /register
 * Siswa: /dashboard/**, /misi/**, /leaderboard/**
 * Guru: /guru/** (guru | tutor_sebaya)
 * Admin: /admin/** (super_admin)
 *
 * Akses tidak sah → /login?redirect=<url_asal>
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Semua rute kecuali static assets dan gambar.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
