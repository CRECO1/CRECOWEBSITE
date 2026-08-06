import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { renderStatementPdf } from '@/lib/statement-pdf';
import { Resend } from 'resend';
import type { Invoice } from '@/lib/invoices';
import { formatDate } from '@/lib/invoices';
import { escapeHtml } from '@/lib/sanitize';

/**
 * Client statement endpoint.
 *
 *   POST /api/statements?action=download   → returns the statement PDF binary
 *   POST /api/statements?action=email      → emails the PDF to the client
 *
 * Body:
 *   {
 *     client_email: string,
 *     period_start: 'YYYY-MM-DD',
 *     period_end:   'YYYY-MM-DD',
 *   }
 *
 * Why the email is a separate action: most statements are downloaded and
 * forwarded manually (PM-client cycle, owner forwards to their CPA).
 * Sending direct from CRECO is a button-press away when the relationship
 * is warm enough.
 *
 * Admin-only — uses the session-scoped Supabase client so RLS protects
 * the invoices read. The email path also uses Resend (so RESEND_API_KEY
 * must be set when action=email).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const action = req.nextUrl.searchParams.get('action');
  if (action !== 'download' && action !== 'email') {
    return NextResponse.json({ error: 'action must be "download" or "email"' }, { status: 400 });
  }

  let body: { client_email?: string; period_start?: string; period_end?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const email = (body.client_email ?? '').trim().toLowerCase();
  const periodStart = body.period_start;
  const periodEnd = body.period_end;
  if (!email) return NextResponse.json({ error: 'client_email required' }, { status: 400 });
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: 'period_start and period_end required' }, { status: 400 });
  }
  // Sanity-check the date shape — fields are coming from a date input so
  // this should be defensive, not the main barrier.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart) || !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)) {
    return NextResponse.json({ error: 'Dates must be YYYY-MM-DD' }, { status: 400 });
  }
  if (periodStart > periodEnd) {
    return NextResponse.json({ error: 'period_start must precede period_end' }, { status: 400 });
  }

  // Pull every invoice this client has — we need history before periodStart
  // to compute the opening balance, plus everything in-period to populate
  // the ledger.
  const { data: rows, error: dbErr } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_email', email)
    .order('issue_date', { ascending: true });

  if (dbErr) {
    console.error('[statements] db error:', dbErr.message);
    return NextResponse.json({ error: 'Could not load invoices' }, { status: 500 });
  }
  const invoices = (rows ?? []) as Invoice[];
  if (invoices.length === 0) {
    return NextResponse.json({ error: 'No invoices found for that email' }, { status: 404 });
  }

  // Take the most recent invoice's client info as the canonical "bill to"
  // — newer rows reflect the latest known address/company for the client.
  const latest = invoices[invoices.length - 1];

  // Pull the payment + credit ledgers for these invoices so the statement
  // reflects every real payment (multiple per invoice) and credit note,
  // not just a single derived paid_at.
  const invIds = invoices.map(i => i.id);
  const byId = new Map(invoices.map(i => [i.id, i]));
  const [{ data: pmtRows }, { data: crRows }] = await Promise.all([
    supabase.from('invoice_payments').select('invoice_id, amount, method, paid_at').in('invoice_id', invIds),
    supabase.from('invoice_credits').select('invoice_id, amount, reason, issued_at').in('invoice_id', invIds),
  ]);
  const payments = (pmtRows ?? []).map(p => ({
    date: p.paid_at as string,
    amount: Number(p.amount),
    invoice_number: byId.get(p.invoice_id as string)?.invoice_number ?? '—',
    method: (p.method as string | null) ?? null,
  }));
  const credits = (crRows ?? []).map(cr => ({
    date: cr.issued_at as string,
    amount: Number(cr.amount),
    invoice_number: byId.get(cr.invoice_id as string)?.invoice_number ?? '—',
    reason: (cr.reason as string | null) ?? null,
  }));

  // Opening balance = charges before the period − payments − credits before it.
  let openingBalance = 0;
  for (const inv of invoices) {
    if (inv.issue_date < periodStart) openingBalance += Number(inv.total);
  }
  for (const p of payments) { if (p.date < periodStart) openingBalance -= p.amount; }
  for (const cr of credits) { if (cr.date < periodStart) openingBalance -= cr.amount; }
  openingBalance = Math.round((openingBalance + Number.EPSILON) * 100) / 100;

  const pdfBytes = await renderStatementPdf({
    client: {
      name: latest.client_name,
      email: latest.client_email,
      company: latest.client_company,
      address: latest.client_address,
    },
    periodStart,
    periodEnd,
    invoices,
    payments,
    credits,
    openingBalance,
  });
  const pdfBuffer = Buffer.from(pdfBytes);

  // ── Download path ─────────────────────────────────────────────────
  if (action === 'download') {
    return new NextResponse(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="statement-${email}-${periodStart}-to-${periodEnd}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // ── Email path ────────────────────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const safeName = escapeHtml(latest.client_name);
  await resend.emails.send({
    from: getFromEmail(),
    to: email,
    replyTo: process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com',
    subject: `Account statement — ${formatDate(periodStart)} to ${formatDate(periodEnd)}`,
    html: `
      <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;color:#1A1A1A">
        <div style="margin:0 0 20px;padding:0 0 18px;border-bottom:2px solid #C9A962">
          <a href="https://www.crecotx.com" style="text-decoration:none;display:inline-block">
            <img src="https://www.crecotx.com/images/creco-logo-light.png" alt="CRECO" width="180" style="display:block;width:180px;max-width:180px;height:auto;border:0" />
          </a>
        </div>
        <h2 style="margin:0 0 16px;font-size:20px">Hi ${safeName},</h2>
        <p style="line-height:1.6">Attached is your account statement covering <strong>${escapeHtml(formatDate(periodStart))} to ${escapeHtml(formatDate(periodEnd))}</strong>.</p>
        <p style="line-height:1.6">If anything looks off — or if you'd like a different cut of the period — just reply to this email and we'll resend.</p>
        <p style="color:#525252;margin:24px 0 0">— The CRECO Team</p>
        <p style="color:#999;font-size:11px;margin:24px 0 0">TREC #9014367-BB · 8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015</p>
      </div>
    `,
    attachments: [
      {
        filename: `statement-${periodStart}-to-${periodEnd}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  return NextResponse.json({ ok: true });
}
