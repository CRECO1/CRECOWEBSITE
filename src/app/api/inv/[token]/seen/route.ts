import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyInvoiceView } from '@/lib/invoice-view-token';

/**
 * POST /api/inv/[token]/seen — records that a real browser rendered the invoice page (kind 'view') or clicked
 * "Download PDF" / "Pay online" (kinds 'pdf' / 'pay_click'). Called from the page's JS, so a mail scanner that
 * merely fetches the HTML never counts. Always 204; unsigned tokens and bots are ignored silently.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KINDS = new Set(['view', 'pdf', 'pay_click']);
const BOT = /bot|crawl|spider|slurp|preview|scanner|headless|lighthouse|curl|wget|python|axios|node-fetch|go-http|java\/|okhttp|barracuda|proofpoint|mimecast|symantec|messagelabs|safelinks/i;

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const claim = verifyInvoiceView(token);
  const ua = req.headers.get('user-agent') ?? '';
  if (!claim || !ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });

  let kind = 'view';
  try {
    const text = await req.text();
    const j = text ? JSON.parse(text) : {};
    if (typeof j.kind === 'string' && KINDS.has(j.kind)) kind = j.kind;
  } catch { /* default to view */ }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return new NextResponse(null, { status: 204 });
  const db = createClient(url, key, { auth: { persistSession: false } });

  try {
    const { data: inv } = await db.from('invoices').select('id, workspace_id').eq('id', claim.inv).maybeSingle();
    if (!inv) return new NextResponse(null, { status: 204 });
    // One 'view' per recipient per 30 minutes (a refresh or a returning tab isn't a new view).
    if (kind === 'view') {
      const since = new Date(Date.now() - 30 * 60_000).toISOString();
      const { data: recent } = await db.from('invoice_views').select('id').eq('invoice_id', claim.inv)
        .eq('recipient_email', claim.email).eq('kind', 'view').gte('created_at', since).limit(1);
      if (recent?.length) return new NextResponse(null, { status: 204 });
    }
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null;
    await db.from('invoice_views').insert({
      invoice_id: claim.inv, workspace_id: inv.workspace_id, recipient_email: claim.email, role: claim.role,
      kind, ip_address: ip, user_agent: ua.slice(0, 300),
    });
  } catch (e) { console.error('[inv/seen]', e); }
  return new NextResponse(null, { status: 204 });
}
