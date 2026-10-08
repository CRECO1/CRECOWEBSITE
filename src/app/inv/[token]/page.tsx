import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { formatMoney, formatDate, type Invoice, type InvoiceLineItem } from '@/lib/invoices';
import { verifyInvoiceView } from '@/lib/invoice-view-token';
import InvoiceActions from './InvoiceActions';

/**
 * /inv/[token] — the invoice a recipient opens from "View invoice online" in the email.
 *
 * The signed token is the credential and also names the recipient (see lib/invoice-view-token.ts). Rendering the
 * page records nothing by itself; the client component logs the view once a real browser runs it.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const metadata = { title: 'Your invoice | CRECO', robots: 'noindex,nofollow' };

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const claim = verifyInvoiceView(token);
  if (!claim) notFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) notFound();
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: invoice } = await db.from('invoices')
    .select('id, invoice_number, client_name, client_company, issue_date, due_date, status, subtotal, tax_rate, tax_amount, total, paid_amount, credited_amount, stripe_payment_link_url, payment_terms, notes')
    .eq('id', claim.inv).is('deleted_at', null).maybeSingle();
  if (!invoice || invoice.status === 'draft') notFound();
  const { data: items } = await db.from('invoice_line_items').select('description, quantity, rate, amount, sort_order')
    .eq('invoice_id', claim.inv).order('sort_order', { ascending: true });

  const inv = invoice as unknown as Invoice;
  const paid = inv.status === 'paid';
  const due = Math.max(0, Number(inv.total) - Number(inv.paid_amount ?? 0) - Number(inv.credited_amount ?? 0));
  const cell: React.CSSProperties = { padding: '8px 12px', border: '1px solid #E8E5E0' };

  return (
    <main style={{ background: '#f5f5f0', minHeight: '100vh', padding: '24px 12px', fontFamily: 'Helvetica,Arial,sans-serif', color: '#1A1A1A' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', background: '#fff', border: '1px solid #E8E5E0', borderRadius: 10, padding: '24px 26px' }}>
        <div style={{ paddingBottom: 16, borderBottom: '2px solid #C9A962', marginBottom: 20 }}>
          <a href="https://www.crecotx.com"><img src="https://www.crecotx.com/images/creco-logo-light.png" alt="CRECO" width={170} style={{ display: 'block', width: 170, height: 'auto', border: 0 }} /></a>
        </div>
        <h1 style={{ fontSize: 22, margin: '0 0 4px' }}>Invoice {inv.invoice_number}</h1>
        <p style={{ margin: '0 0 18px', color: '#525252' }}>
          {inv.client_company || inv.client_name} · Issued {formatDate(inv.issue_date)}
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
          <tbody>
            <tr><td style={{ ...cell, background: '#FAFAF8' }}><strong>Status</strong></td><td style={cell}>{paid ? 'Paid — thank you!' : inv.status === 'overdue' ? 'Overdue' : 'Awaiting payment'}</td></tr>
            <tr><td style={{ ...cell, background: '#FAFAF8' }}><strong>{paid ? 'Total' : 'Amount due'}</strong></td><td style={{ ...cell, fontSize: 18, color: '#9A7B2F', fontWeight: 700 }}>{formatMoney(paid ? Number(inv.total) : due)}</td></tr>
            <tr><td style={{ ...cell, background: '#FAFAF8' }}><strong>Due date</strong></td><td style={cell}>{formatDate(inv.due_date)}</td></tr>
          </tbody>
        </table>

        {(items?.length ?? 0) > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr>{['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => <th key={h} style={{ ...cell, background: '#FAFAF8', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>)}</tr></thead>
            <tbody>
              {(items as InvoiceLineItem[]).map((li, i) => (
                <tr key={i}>
                  <td style={cell}>{li.description}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>{li.quantity}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>{formatMoney(Number(li.rate))}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>{formatMoney(Number(li.amount))}</td>
                </tr>
              ))}
              {Number(inv.tax_amount) > 0 && <tr><td style={cell} colSpan={3}>Tax ({(Number(inv.tax_rate) * 100).toFixed(2)}%)</td><td style={{ ...cell, textAlign: 'right' }}>{formatMoney(Number(inv.tax_amount))}</td></tr>}
              <tr><td style={{ ...cell, fontWeight: 700 }} colSpan={3}>Total</td><td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>{formatMoney(Number(inv.total))}</td></tr>
            </tbody>
          </table>
        )}

        <InvoiceActions token={token} payUrl={inv.stripe_payment_link_url} showPay={!paid && due > 0} />

        {inv.payment_terms && <p style={{ color: '#525252', fontSize: 14 }}>{inv.payment_terms}</p>}
        <p style={{ margin: '20px 0 0', color: '#525252', fontSize: 14 }}>
          Mail a check to: CRECO — Commercial Real Estate Company, 8000 Fair Oaks Pkwy, Suite 100, Fair Oaks Ranch, TX 78015.<br />
          Questions? Reply to the email or call <a href="tel:+12108173443" style={{ color: '#9A7B2F' }}>(210) 817-3443</a>.
        </p>
        <p style={{ color: '#999', fontSize: 11, margin: '22px 0 0' }}>TREC #9014367 · crecotx.com</p>
      </div>
    </main>
  );
}
