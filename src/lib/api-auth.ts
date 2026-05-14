/**
 * Server-side authentication helper for admin-only API routes.
 *
 * The Next.js middleware (src/middleware.ts) protects every UI route under
 * /admin, /billing, and /manage by redirecting to the login page when the
 * user has no session. But `/api/*` routes are explicitly NOT in the
 * middleware matcher — those need their own auth check, otherwise a curl
 * call with no cookie hits the handler unauthenticated.
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
 * a NextResponse(401) the caller can return directly.
 *
 * Note: this protects against *unauthenticated* access. If you ever need
 * role-based access (e.g. some routes only for super-admins), layer a
 * roles check on top by looking up `admin_users.role` for `user.id`.
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

  return { supabase, user };
}
