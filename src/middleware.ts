import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { matchCrawler, logCrawlerHit } from '@/lib/crawler-hits';
import { DATACENTER_COOKIE } from '@/lib/analytics-gate';

// Protected routes that require authentication. /admin is content management;
// /billing is the financial surface (invoices, expenses, email template) —
// same auth gate today, but separated so we can layer role-based access
// later. /manage holds the auth-flow pages (login, forgot, reset).
const protectedRoutes = ['/admin', '/billing', '/manage'];
// Auth-flow pages within /manage that must be reachable without a session
// (login, forgot-password request form, and the reset-password page that
// Supabase's recovery email links to).
const publicRoutes = ['/manage/login', '/manage/forgot-password', '/manage/reset-password'];

// The matcher below covers every page (the crawler tracker needs to see them
// all), but the auth gate in handle() still applies only to protectedRoutes —
// everything else passes straight through.
// Datacenter towns whose "visitors" are email security scanners and cloud
// crawlers, not people (Oct-2026 GA review: ~0-20% engagement, spiking with
// every campaign send). Matched against Vercel's geo header and flagged with a
// cookie the analytics loaders read — see lib/analytics-gate.ts.
const DATACENTER_CITIES = new Set([
  'Ashburn', 'Boardman', 'Council Bluffs', 'Des Moines', 'West Des Moines',
  'Moses Lake', 'Quincy', 'The Dalles', 'Prineville', 'Singapore', 'Glenview',
]);

function flagDatacenterVisit(request: NextRequest, res: NextResponse) {
  if (request.headers.get('sec-fetch-dest') !== 'document') return;
  if (request.cookies.get(DATACENTER_COOKIE)?.value === '1') return;
  let city = request.headers.get('x-vercel-ip-city') ?? '';
  try { city = decodeURIComponent(city); } catch { /* keep raw */ }
  if (!DATACENTER_CITIES.has(city)) return;
  res.cookies.set(DATACENTER_COOKIE, '1', { path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' });
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const res = await handle(request);
  flagDatacenterVisit(request, res);

  const bot = matchCrawler(request.headers.get('user-agent'));
  if (bot) {
    // Pass-through responses are rendered by the app after middleware, so their
    // status isn't known here; record it only when middleware answered itself.
    const passedThrough = res.headers.has('x-middleware-next') || res.headers.has('x-middleware-rewrite');
    event.waitUntil(logCrawlerHit({
      bot_name: bot,
      path: request.nextUrl.pathname,            // no query string: keeps tokens/emails out
      status: passedThrough ? null : res.status,
      user_agent: request.headers.get('user-agent') ?? '',
      host: request.headers.get('host'),
    }));
  }
  return res;
}

async function handle(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Skip middleware for non-admin routes
  // Segment-exact, matching the old '/admin/:path*'-style matcher now that the
  // matcher covers every page.
  const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Allow public routes within /manage
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for Supabase env vars (this project uses the newer `_PUBLISHABLE_KEY`
  // naming, not the legacy `_ANON_KEY`). We only reach this point on a
  // protected, non-public route, so a missing config must FAIL CLOSED —
  // redirect to login rather than letting the request through. Previously
  // this returned NextResponse.next(), which left /admin, /billing and
  // /manage open at the edge whenever the env was absent.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const loginUrl = new URL('/manage/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
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
    // Everything except build assets and static media, so the crawler tracker
    // sees every page. Text/XML files stay in (robots.txt, sitemap.xml,
    // llms.txt) — those are what crawlers fetch. handle() decides which paths
    // are protected and which are public.
    '/((?!_next/static|_next/image|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|css|js|mjs|map|woff2?|ttf|otf|mp4|webm)$).*)',
  ],
};
