import { NextRequest } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// CRECO-branded unsubscribe, served on crecotx.com so commercial emails never point at
// the Fair Oaks domain. Writes to the shared CRM (FORG) Supabase — same connection the
// site already uses to push leads.
function crmClient(): SupabaseClient | null {
  const url = process.env.CRM_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.CRM_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function page(title: string, body: string, status = 200): Response {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — CRECO</title></head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#FAF8F5;color:#333">
  <div style="max-width:520px;margin:0 auto;padding:64px 24px;text-align:center">
    <div style="font-size:22px;font-weight:700;color:#C9922C;letter-spacing:3px">CRECO</div>
    <div style="font-size:11px;color:#999;letter-spacing:2px;margin-top:4px">COMMERCIAL REAL ESTATE COMPANY</div>
    <h2 style="color:#1A1A1A;margin:32px 0 10px">${title}</h2>
    <p style="line-height:1.6;font-size:15px">${body}</p>
  </div>
</body></html>`,
    { status, headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } },
  );
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return page('Invalid link', 'This unsubscribe link is missing its token.', 400);

  const supabase = crmClient();
  if (!supabase) return page('Temporarily unavailable', 'Please try again in a moment.', 503);

  const { data: client } = await supabase
    .from('crm_clients').select('id').eq('unsubscribe_token', token).single();
  if (!client) return page('Link not found', 'This unsubscribe link is invalid or has already been used.', 404);

  await supabase.from('crm_clients').update({ unsubscribed_at: new Date().toISOString() }).eq('id', client.id);
  await supabase.from('crm_campaign_enrollments').update({ active: false }).eq('client_id', client.id);
  await supabase.from('crm_action_plan_enrollments').update({ active: false }).eq('client_id', client.id);

  return page(
    "You've been unsubscribed",
    "You'll no longer receive marketing emails from <strong>CRECO</strong>. If this was a mistake, just reply to any of our emails and we'll add you back.",
  );
}
