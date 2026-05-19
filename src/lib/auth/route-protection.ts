import type { User } from '@supabase/supabase-js';

import { UserRole } from '@/types';

export type RouteAccess =
  | { type: 'public' }
  | { type: 'protected'; allowedRoles: UserRole[] };

const SISWA_PREFIXES = ['/dashboard', '/misi', '/leaderboard'] as const;
const GURU_PREFIX = '/guru';
const ADMIN_PREFIX = '/admin';

const PUBLIC_EXACT = new Set(['/', '/login', '/register']);

/** Tentukan kebutuhan auth/RBAC untuk pathname (tanpa query). */
export function getRouteAccess(pathname: string): RouteAccess {
  if (PUBLIC_EXACT.has(pathname)) {
    return { type: 'public' };
  }

  if (SISWA_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return { type: 'protected', allowedRoles: [UserRole.Siswa] };
  }

  if (matchesPrefix(pathname, GURU_PREFIX)) {
    return {
      type: 'protected',
      allowedRoles: [UserRole.Guru, UserRole.TutorSebaya],
    };
  }

  if (matchesPrefix(pathname, ADMIN_PREFIX)) {
    return { type: 'protected', allowedRoles: [UserRole.SuperAdmin] };
  }

  return { type: 'public' };
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Peran dari JWT session (user_metadata / app_metadata). */
export function getRoleFromSessionClaims(user: User): UserRole | null {
  const fromUserMeta = readRoleClaim(user.user_metadata);
  if (fromUserMeta) return fromUserMeta;

  const fromAppMeta = readRoleClaim(user.app_metadata);
  if (fromAppMeta) return fromAppMeta;

  return null;
}

function readRoleClaim(metadata: unknown): UserRole | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const role = (metadata as { role?: unknown }).role;
  if (typeof role !== 'string') return null;
  return isUserRole(role) ? role : null;
}

export function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}

export function isRoleAllowed(
  role: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(role);
}

export function buildLoginRedirectUrl(
  requestUrl: string,
  pathname: string,
  search: string
): URL {
  const loginUrl = new URL('/login', requestUrl);
  const redirectTarget = `${pathname}${search}`;
  loginUrl.searchParams.set('redirect', redirectTarget);
  return loginUrl;
}
