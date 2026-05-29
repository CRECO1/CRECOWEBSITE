/**
 * Server-side authentication helper for admin-only API routes.
 *
 * The Next.js middleware (src/middleware.ts) protects every UI route under
 * /admin, /billing, and /manage by redirecting to the login page when the
 * user has no session. But `/api/*` routes are explicitly NOT in the
 * middleware matcher — those need their own auth check, otherwise a curl
 * call with no cookie hits the handler unauthenticated.
 *
 * Two gates, both required:
 *   1. A valid Supabase session (signed cookie → JWT → auth.users row).
 *   2. The session user's email is on the admin_users allowlist.
 *
 * The second gate is the defense-in-depth piece: if the Supabase project's
 * Auth settings ever permit self-signups, a visitor could mint a JWT but
 * still wouldn't pass the admin-membership check. RLS on every billing
 * table layers the same check (see migration 0029) so even a route that
 * forgot to call this helper would still get RLS-denied at the DB.
 *
 * Usage:
 *
 *   import { requireAdmin } from '@/lib/api-auth';
 *
 *   export async function POST(req: NextRequest) {
 *     const auth = await requireAdmin();
 *     if (auth.error) return auth.error;
 *     const { supabase, user } = auth;
 *     // ... rest of the handler — supabase is a session-scoped client
 *     // that honors RLS as that user.
 *   }
 *
 * Returns the session-scoped Supabase client + the authenticated user, OR
 * a NextResponse(401/403) the caller can return directly.
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export type RequireAdminResult =
  | { error: NextResponse; supabase?: never; user?: never }
  | { error?: never; supabase: SupabaseClient; user: User };

export async function requireAdmin(): Promise<RequireAdminResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return {
      error: NextResponse.json(
        { error: 'Auth not configured' },
        { status: 503 },
      ),
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() { /* read-only in API routes */ },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Not authorized' },
        { status: 401 },
      ),
    };
  }

  // Defense in depth: a valid Supabase JWT is necessary but not
  // sufficient. The user must also be on the admin_users allowlist.
  // This prevents a visitor who slipped through self-signup (if project
  // Auth settings ever permit it) from hitting admin endpoints. The
  // billing-table RLS in migration 0029 layers the same gate at the DB.
  if (!user.email) {
    return {
      error: NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 },
      ),
    };
  }
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('email')
    .ilike('email', user.email)
    .maybeSingle();
  if (!adminRow) {
    return {
      error: NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 },
      ),
    };
  }

  return { supabase, user };
}
