import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import {
  buildLoginRedirectUrl,
  getRoleFromSessionClaims,
  getRouteAccess,
  isRoleAllowed,
  isUserRole,
} from '@/lib/auth/route-protection';

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const access = getRouteAccess(pathname);

  if (access.type === 'public') {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = buildLoginRedirectUrl(request.url, pathname, search);
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  let role = getRoleFromSessionClaims(user);

  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role && isUserRole(profile.role)) {
      role = profile.role;
    }
  }

  if (!role || !isRoleAllowed(role, access.allowedRoles)) {
    const loginUrl = buildLoginRedirectUrl(request.url, pathname, search);
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}
