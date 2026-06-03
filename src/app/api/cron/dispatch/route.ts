/**
 * GET /api/cron/dispatch
 *
 * Master cron dispatcher — fans out to every individual cron job in a
 * single Vercel cron entry. Reason: Vercel Hobby caps cron jobs at 2
 * per project. Without this consolidator, 5 of our 7 daily jobs would
 * silently never fire.
 *
 * The original 7 cron routes (invoice-reminders, recurring-invoices,
 * late-fees, plaid-sync, valuation-followup, tour-followup,
 * geocode-listings) all still exist and remain callable directly —
 * useful for debugging / manual re-run via curl. Vercel's cron schedule
 * (in vercel.json) now points only at this dispatcher.
 *
 * Execution model:
 *   - Sequential, not parallel. Some sub-crons depend on prior ones
 *     (e.g. plaid-sync must mark Plaid-paid invoices as paid BEFORE
 *     invoice-reminders decides who's overdue; late-fees must run
 *     AFTER reminders so we don't add a late-fee line item to an
 *     invoice that's about to be paid).
 *   - Fail-soft: each sub-cron runs inside try/catch. One throwing
 *     doesn't abort the others.
 *   - The req's Authorization header (containing the Vercel CRON_SECRET
 *     Bearer token) is passed through to each sub-handler so their own
 *     auth checks pass.
 *   - Total runtime budget: Vercel functions cap at ~5 min (Hobby) / 15
 *     min (Pro). Each sub-cron is bounded internally (batch sizes,
 *     idempotency, etc.) — but if we ever add a heavy sub-cron, may
 *     need to split or move to a queue.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET as runPlaidSync }          from '../plaid-sync/route';
import { GET as runInvoiceReminders }   from '../invoice-reminders/route';
import { GET as runRecurringInvoices }  from '../recurring-invoices/route';
import { GET as runLateFees }           from '../late-fees/route';
import { GET as runValuationFollowup }  from '../valuation-followup/route';
import { GET as runTourFollowup }       from '../tour-followup/route';
import { GET as runGeocodeListings }    from '../geocode-listings/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow up to ~5 min total — each sub-cron is internally bounded but the
// fan-out + small per-job overhead adds up. 300s aligns with the Vercel
// Hobby function max. Pro can extend to 800s if needed.
export const maxDuration = 300;

interface SubResult {
  name: string;
  /** Whether the sub-cron returned a 2xx and did not throw. */
  ok: boolean;
  /** HTTP status when the handler returned a response; undefined on throw. */
  status?: number;
  /** Parsed JSON body when available; undefined on throw or non-JSON. */
  body?: unknown;
  /** Error message when ok=false due to an exception. */
  error?: string;
  ms: number;
}

/**
 * Execution order matters for two pairs:
 *   plaid-sync → invoice-reminders: Plaid-detected payments mark
 *     invoices paid first, so reminders don't go to clients who just paid.
 *   invoice-reminders → late-fees: late fees add a line item; doing it
 *     before reminders means the reminder email shows a stale total.
 *
 * Everything else is independent and ordered for readability.
 */
const SUB_CRONS = [
  { name: 'plaid-sync',          handler: runPlaidSync },
  { name: 'invoice-reminders',   handler: runInvoiceReminders },
  { name: 'recurring-invoices',  handler: runRecurringInvoices },
  { name: 'late-fees',           handler: runLateFees },
  { name: 'valuation-followup',  handler: runValuationFollowup },
  { name: 'tour-followup',       handler: runTourFollowup },
  { name: 'geocode-listings',    handler: runGeocodeListings },
] as const;

export async function GET(req: NextRequest) {
  // Same Bearer-secret check the individual cron routes use. This is
  // strictly belt-and-suspenders since the sub-handlers also verify
  // the same header — but failing here gives a single 401 instead of
  // an 401-per-sub-cron noise burst in the logs.
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const overallStart = Date.now();
  const results: SubResult[] = [];

  for (const { name, handler } of SUB_CRONS) {
    const start = Date.now();
    try {
      // Pass the original req so the sub-handler sees the same auth
      // header and can perform its own check (defense in depth + makes
      // each route still individually callable for ad-hoc debugging).
      const res = await handler(req);
      const ms = Date.now() - start;
      // Best-effort body decode — every sub-cron returns JSON. If a
      // future one returns a stream, the catch will surface it.
      let body: unknown;
      try {
        body = await res.clone().json();
      } catch {
        body = { note: 'non-JSON response' };
      }
      results.push({ name, ok: res.status >= 200 && res.status < 300, status: res.status, body, ms });
    } catch (err) {
      const ms = Date.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[cron/dispatch] ${name} threw:`, message);
      results.push({ name, ok: false, error: message, ms });
    }
  }

  const totalMs = Date.now() - overallStart;
  const okCount   = results.filter(r => r.ok).length;
  const failCount = results.length - okCount;

  return NextResponse.json({
    ok: failCount === 0,
    total_ms: totalMs,
    ran: results.length,
    succeeded: okCount,
    failed: failCount,
    results,
  });
}

// POST is allowed too so the same endpoint works for manual triggers
// via tools that prefer POST (Postman, curl -X POST).
export async function POST(req: NextRequest) { return GET(req); }
