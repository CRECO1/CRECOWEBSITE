import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { pushToCrm } from '@/lib/crm';
import { renderSubscriberNotification } from '@/lib/subscriber-notification-email';
import { labelForSource, type SignupContext } from '@/lib/signup-context';
import { enforceRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/subscribe/confirm?token=…
 *
 * The other half of double opt-in. A signup sits unconfirmed and inert until
 * this link is clicked; only then does the subscriber become real, the CRM
 * contact get created, and the team notification go out.
 *
 * That ordering is the whole point: a bot can POST a signup, but it will not
 * open a mailbox and click, so nothing it submits ever reaches the CRM or
 * Zack's inbox. It also guarantees every contact that does arrive has a
 * working address, because the click came out of it.
 *
 * Idempotent — a second click (forwarded mail, a prefetching client) lands on
 * the same friendly page rather than double-notifying.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com';

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

const origin = () =>
  process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '') || 'https://www.crecotx.com';

const landing = (status: 'confirmed' | 'already' | 'invalid') =>
  NextResponse.redirect(`${origin()}/subscribe/confirmed?status=${status}`, { status: 303 });

export async function GET(req: NextRequest) {
  // A token is a secret; guessing is the only attack and this makes it slow.
  const limited = enforceRateLimit(req, { namespace: 'subscribe-confirm', max: 20, windowMs: 60_000 });
  if (limited) return limited;

  const token = req.nextUrl.searchParams.get('token');
  if (!token || token.length < 32) return landing('invalid');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('[subscribe/confirm] Supabase env missing');
    return landing('invalid');
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: row, error } = await supabase
    .from('subscribers')
    .select('id, email, name, subscription_type, filters, source, asset_slug, context, confirmed_at')
    .eq('confirm_token', token)
    .maybeSingle();

  if (error) {
    console.error('[subscribe/confirm] lookup failed:', error.message);
    return landing('invalid');
  }
  if (!row) return landing('invalid');
  if (row.confirmed_at) return landing('already');

  // Claim the row. Matching on confirm_token again means two simultaneous
  // clicks cannot both win and send two notifications.
  const { data: claimed, error: claimError } = await supabase
    .from('subscribers')
    .update({ confirmed_at: new Date().toISOString(), confirm_token: null, updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('confirm_token', token)
    .select('id')
    .maybeSingle();

  if (claimError) {
    console.error('[subscribe/confirm] confirm failed:', claimError.message);
    return landing('invalid');
  }
  if (!claimed) return landing('already');

  const stored = (row.context ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);

  // Now — and only now — the signup becomes a contact.
  await pushToCrm({
    event: 'subscriber.created',
    source: row.source || row.subscription_type,
    name: row.name || null,
    email: row.email,
    subscription_type: row.subscription_type,
    asset_slug: row.asset_slug || null,
    filters: row.filters ?? null,
  }).catch(err => console.error('[subscribe/confirm] CRM push failed:', (err as Error).message));

  if (process.env.RESEND_API_KEY) {
    // Rebuild the context captured at signup so the notification reads exactly
    // as it would have, plus the fact that they confirmed.
    const ctx: SignupContext = {
      sourceLabel: labelForSource(row.source, str(stored.surface)),
      rawSource: row.source,
      pagePath: str(stored.page_path),
      pageUrl: str(stored.page_url),
      pageTitle: str(stored.page_title),
      referrer: str(stored.referrer),
      referrerLabel: str(stored.referrer),
      geo: str(stored.geo),
      device: str(stored.device),
      submittedAtLocal: new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short',
      }) + ' CT (confirmed)',
      utm: Object.fromEntries(
        Object.entries(stored)
          .filter(([k, v]) => k.startsWith('utm_') && typeof v === 'string')
          .map(([k, v]) => [k, v as string]),
      ),
    };

    const { subject, html } = renderSubscriberNotification({
      subscriptionType: row.subscription_type,
      email: row.email,
      name: row.name,
      assetSlug: row.asset_slug,
      filters: row.filters,
      ctx,
    });

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({ from: getFromEmail(), to: NOTIFICATION_EMAIL, subject, html });
    } catch (err) {
      console.error('[subscribe/confirm] notification failed:', (err as Error).message);
    }
  }

  return landing('confirmed');
}
