import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyInvoiceView } from '@/lib/invoice-view-token';
import { renderInvoicePdf } from '@/lib/invoice-pdf';
import type { Invoice } from '@/lib/invoices';

/** GET /api/inv/[token]/pdf — the invoice PDF for the holder of a valid signed link. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const claim = verifyInvoiceView(token);
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: invoice } = await db.from('invoices').select('*').eq('id', claim.inv).is('deleted_at', null).maybeSingle();
  if (!invoice || invoice.status === 'draft') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { data: line_items } = await db.from('invoice_line_items').select('*').eq('invoice_id', claim.inv).order('sort_order', { ascending: true });
  const pdf = await renderInvoicePdf({ ...invoice, line_items: line_items ?? [] } as Invoice);
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`, 'Cache-Control': 'no-store' },
  });
}
