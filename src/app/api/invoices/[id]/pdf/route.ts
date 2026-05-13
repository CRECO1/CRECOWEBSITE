import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { renderInvoicePdf } from '@/lib/invoice-pdf';
import type { Invoice } from '@/lib/invoices';

/**
 * GET /api/invoices/[id]/pdf
 *
 * Returns the invoice rendered as a PDF. Authenticated only — the response
 * contains client billing info, so we don't want a guessable-UUID
 * enumeration attack to leak invoices.
 *
 * The PDF is regenerated on every request rather than cached: invoices may
 * still be in draft and edits should reflect immediately. At our volume the
 * cost is negligible.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* read-only in API routes */ },
      },
    },
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await authSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const { data: line_items } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order', { ascending: true });

  const pdf = await renderInvoicePdf({ ...invoice, line_items: line_items ?? [] } as Invoice);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
