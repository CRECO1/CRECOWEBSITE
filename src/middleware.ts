import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Protected routes that require authentication. /admin is content management;
// /billing is the financial surface (invoices, expenses, email template) —
// same auth gate today, but separated so we can layer role-based access
// later. /manage holds the auth-flow pages (login, forgot, reset).
const protectedRoutes = ['/admin', '/billing', '/manage'];
// Auth-flow pages within /manage that must be reachable without a session
// (login, forgot-password request form, and the reset-password page that
// Supabase's recovery email links to).
const publicRoutes = ['/manage/login', '/manage/forgot-password', '/manage/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for non-admin routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Allow public routes within /manage
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for Supabase env vars (this project uses the newer `_PUBLISHABLE_KEY`
  // naming, not the legacy `_ANON_KEY`). Without this fix the middleware
  // bails out and /manage is effectively unprotected at the edge.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }

  try {
    // Update session and get user
    const { supabaseResponse, user, supabase } = await updateSession(request);

    // If no user, redirect to login
    if (!user) {
      const loginUrl = new URL('/manage/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Defense in depth: for /admin and /billing surfaces, also verify
    // the user is on the admin_users allowlist. A bare valid Supabase
    // JWT isn't enough — if the project's Auth settings ever permit
    // self-signups, this stops a stranger from reaching the admin UI.
    // RLS on the underlying tables enforces the same gate at the DB
    // (migration 0029) so the two layers are independent.
    //
    // /manage/* paths skip this check by design — login + password reset
    // need to be reachable BY admins who don't yet have a session.
    const needsAdminCheck = pathname.startsWith('/admin') || pathname.startsWith('/billing');
    if (needsAdminCheck) {
      if (!user.email) {
        // Anonymous JWT or magic-link without an email — definitely
        // not an admin. Bounce to login.
        const loginUrl = new URL('/manage/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      const { data: adminRow } = await supabase
        .from('admin_users')
        .select('email')
        .ilike('email', user.email)
        .maybeSingle();
      if (!adminRow) {
        // Authenticated but not authorized. 404 the surface so we don't
        // confirm the URL exists to a casual prober.
        return new NextResponse('Not found', { status: 404 });
      }
    }

    return supabaseResponse;
  } catch (error) {
    console.error('Middleware auth error:', error);
    // On error, redirect to login
    const loginUrl = new URL('/manage/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    // Run the middleware on every protected surface. The handler itself
    // decides which paths are protected and which are public.
    '/admin/:path*',
    '/billing/:path*',
    '/manage/:path*',
  ],
};
