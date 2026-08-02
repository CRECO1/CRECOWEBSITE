import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Admin-only: match the sibling invoice routes. requireAdmin() returns a
  // session-scoped, RLS-honoring client plus the admin_users allowlist check.
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

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
