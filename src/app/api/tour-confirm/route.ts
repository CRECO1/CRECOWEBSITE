import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/sanitize';

/**
 * GET /api/tour-confirm?token=<hex>
 *
 * One-click endpoint the broker hits from the tour-request notification
 * email. Looks up the lead by the single-use token, confirms it
 * (status='tour-scheduled', tour_confirmed_at=now, clears the token),
 * fires a confirmation email to the prospect, and returns a small HTML
 * page confirming the action.
 *
 * Why use the service role key: this runs server-side from a broker's
 * email-link click — there's no Supabase session. Service role bypasses
 * RLS so we can read + update the lead row regardless of who the request
 * is (notionally) from. The token itself is the auth — 256 bits of
 * random hex stored only in our DB and in the broker's inbox.
 *
 * Token is consumed on success — re-clicking the same link shows a
 * friendly "already confirmed" page rather than re-firing the email.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

/** Render a small HTML response page. Used for both success and error states. */
function htmlPage(title: string, body: string, status = 200): NextResponse {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} · CRECO</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #FAFAF8;
      margin: 0;
      padding: 40px 20px;
      color: #1A1A1A;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: #FFFFFF;
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      text-align: center;
    }
    .check { display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: #C9A962; color: #1A1A1A; line-height: 56px; font-size: 28px; font-weight: 700; margin-bottom: 16px; }
    .warn { display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: #F4DCA4; color: #1A1A1A; line-height: 56px; font-size: 28px; font-weight: 700; margin-bottom: 16px; }
    h1 { font-size: 22px; margin: 0 0 12px; }
    p { color: #525252; line-height: 1.6; margin: 0 0 12px; }
    a { color: #C9A962; text-decoration: none; font-weight: 600; }
    .meta { color: #999; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    ${body}
    <p class="meta">CRECO · TREC #9014367-BB</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token || typeof token !== 'string' || token.length < 32 || !/^[a-f0-9]+$/i.test(token)) {
    return htmlPage(
      'Invalid confirmation link',
      `<div class="warn">!</div>
       <h1>That link doesn't look right.</h1>
       <p>If you got here by accident, no action was taken. If you meant to confirm a tour, head back to the notification email and click the button there.</p>`,
      400,
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return htmlPage(
      'Service unavailable',
      `<div class="warn">!</div>
       <h1>Tour confirmation isn't configured.</h1>
       <p>The site admin needs to set SUPABASE_SERVICE_ROLE_KEY. Please contact CRECO directly to confirm this tour.</p>`,
      503,
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  // Look up the lead by token. Single-use, so we filter on
  // tour_confirmed_at IS NULL too — re-clicks land in the "already
  // confirmed" path rather than re-firing the prospect email.
  const { data: lead, error: fetchErr } = await supabase
    .from('leads')
    .select('id, name, email, phone, property_interest, message, tour_confirmed_at, status')
    .eq('tour_confirmation_token', token)
    .single();

  if (fetchErr || !lead) {
    return htmlPage(
      'Confirmation link expired',
      `<div class="warn">!</div>
       <h1>That link's no good anymore.</h1>
       <p>Either the tour was already confirmed (and the link consumed) or the link has expired. Open the original tour-request email to see the latest state, or call the prospect directly.</p>`,
      404,
    );
  }

  // Already confirmed — idempotent re-click
  if (lead.tour_confirmed_at) {
    return htmlPage(
      'Already confirmed',
      `<div class="check">✓</div>
       <h1>Tour already confirmed.</h1>
       <p>This tour was confirmed at ${escapeHtml(new Date(lead.tour_confirmed_at).toLocaleString('en-US', { timeZone: 'America/Chicago' }))} Central.</p>
       <p>The prospect (${escapeHtml(lead.email)}) was emailed at that time.</p>`,
    );
  }

  // Flip the lead — service-role context bypasses RLS so this works without
  // any user session. Clear the token so the link can't be reused.
  const now = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from('leads')
    .update({
      tour_confirmed_at: now,
      status: 'tour-scheduled',
      tour_confirmation_token: null,
    })
    .eq('id', lead.id);

  if (updateErr) {
    console.error('[tour-confirm] update failed:', updateErr.message);
    return htmlPage(
      'Something went wrong',
      `<div class="warn">!</div>
       <h1>We couldn't save the confirmation.</h1>
       <p>The lead is still in the system — please confirm with the prospect directly. If this keeps happening, contact the site admin.</p>`,
      500,
    );
  }

  // Fire the confirmation email to the prospect
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      await resend.emails.send({
        from: getFromEmail(),
        to: lead.email,
        replyTo: process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com',
        subject: `Tour confirmed — ${lead.property_interest || 'your CRECO tour'}`,
        html: `
          <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;color:#1A1A1A">
            <div style="margin:0 0 20px;padding:0 0 18px;border-bottom:2px solid #C9A962">
              <a href="https://www.crecotx.com" style="text-decoration:none;display:inline-block">
                <img src="https://www.crecotx.com/images/creco-logo-light.png" alt="CRECO" width="180" style="display:block;width:180px;max-width:180px;height:auto;border:0" />
              </a>
            </div>
            <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:20px">You're confirmed, ${escapeHtml(lead.name)}.</h2>
            <p style="line-height:1.6">A CRECO broker just confirmed your tour request${lead.property_interest ? ` for <strong>${escapeHtml(lead.property_interest)}</strong>` : ''}. The calendar invite from our earlier email is on your calendar — we'll see you then.</p>
            <p style="line-height:1.6;margin-top:16px"><strong>Before the tour:</strong> if anything changes on your end, reply to this email or call <a href="tel:+12108173443" style="color:#C9A962">(210) 817-3443</a> and we'll reschedule.</p>
            <p style="line-height:1.6;margin-top:16px">If you'd like to share what you're hoping to learn during the walkthrough — use case, headcount, layout preferences, timeline — feel free to reply ahead of time. The more context, the better the conversation.</p>
            <p style="color:#525252;margin:24px 0 0">— The CRECO Team</p>
            <p style="color:#999;font-size:11px;margin:24px 0 0">TREC #9014367-BB · 8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[tour-confirm] confirmation email failed:', err);
      // Don't fail the whole flow — the DB is updated and the broker
      // can follow up directly with the prospect.
    }
  }

  return htmlPage(
    'Tour confirmed',
    `<div class="check">✓</div>
     <h1>Confirmed.</h1>
     <p>${escapeHtml(lead.name)} was emailed a confirmation and the lead is now <code style="background:#F4DCA4;padding:2px 6px;border-radius:3px">tour-scheduled</code>.</p>
     <p><a href="https://www.crecotx.com">Back to CRECO</a></p>`,
  );
}
