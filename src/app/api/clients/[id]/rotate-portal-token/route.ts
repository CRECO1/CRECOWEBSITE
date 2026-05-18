import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { randomUUID } from 'crypto';

/**
 * POST /api/clients/[id]/rotate-portal-token
 *
 * Generates a fresh portal_token for a client, invalidating any previously
 * shared URLs. Used when:
 *   - The operator suspects the link was forwarded outside the client org
 *   - A client says "I no longer trust this URL"
 *   - Periodic rotation as a hygiene practice
 *
 * Returns the new token so the UI can update the displayed URL inline
 * without a page refresh.
 *
 * Admin-only — gated through requireAdmin().
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  // Generate a fresh UUID. Postgres can do this server-side via
  // gen_random_uuid() but generating client-side gives us a return value
  // without a second query.
  const next = randomUUID();

  const { error } = await supabase
    .from('clients')
    .update({ portal_token: next })
    .eq('id', id);
  if (error) {
    console.error('[clients/rotate-portal-token]', error.message);
    return NextResponse.json({ error: 'Could not rotate token' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, portal_token: next });
}
