import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2, CheckCircle, Clock, AlertCircle, ExternalLink, Phone, Mail,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { formatMoney, formatDate, effectiveStatus, STATUS_STYLES, type Invoice } from '@/lib/invoices';

/**
 * /client/[token] — the public-facing client portal.
 *
 * No auth: the token in the URL is the credential. Anyone with the link
 * sees that client's invoices, payments, and outstanding balance. The
 * operator emails the link as part of the invoice send flow and the
 * client can come back to it without re-asking us for status.
 *
 * Tokens are UUIDs (gen_random_uuid). Rotation = UPDATE clients SET
 * portal_token = gen_random_uuid(). No expiry — kept simple because
 * operator can rotate anytime.
 *
 * Read-only in the MVP. Stripe payment links open in a new tab; we don't
 * accept payment confirmations or statement requests inline yet. Each
 * invoice gets a PDF download button that hits /api/invoices/[id]/pdf.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  // Validate the token shape so a 404 page doesn't burn a DB lookup
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return { title: 'Client portal | CRECO', robots: 'noindex,nofollow' };
  }
  return {
    title: 'Your account | CRECO',
    description: 'View your invoices, payments, and account balance with CRECO.',
    robots: 'noindex,nofollow', // tokens shouldn't be indexed by Google
  };
}

export default async function ClientPortalPage({ params }: PageProps) {
  const { token } = await params;

  // Basic shape validation before hitting the DB
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    notFound();
  }

  // Service-role client for the read — RLS would otherwise hide everything
  // because the visitor isn't authed. The token IS the credential.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    notFound();
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, email, company, address')
    .eq('portal_token', token)
    .maybeSingle();
  if (!client) notFound();

  // Pull every invoice for this client (by id link OR by email — covers the
  // window between when a client row was upserted and old invoices were
  // back-linked). De-duplicate by id.
  const [byId, byEmail] = await Promise.all([
    supabase.from('invoices').select('*').eq('client_id', client.id),
    supabase.from('invoices').select('*').eq('client_email', client.email),
  ]);
  const seen = new Set<string>();
  const invoices: Invoice[] = [];
  for (const row of [...(byId.data ?? []), ...(byEmail.data ?? [])]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    invoices.push(row as Invoice);
  }
  invoices.sort((a, b) => a.issue_date < b.issue_date ? 1 : -1);

  // Surface metrics
  let outstanding = 0;
  let paidYtd = 0;
  const yearStart = `${new Date().getUTCFullYear()}-01-01`;
  for (const inv of invoices) {
    const eff = effectiveStatus(inv);
    if (eff === 'sent' || eff === 'overdue') outstanding += Number(inv.total);
    if (eff === 'paid' && inv.paid_at && inv.paid_at >= yearStart) {
      paidYtd += Number(inv.paid_amount ?? inv.total);
    }
  }
  const openInvoices = invoices.filter(i => {
    const e = effectiveStatus(i);
    return e === 'sent' || e === 'overdue';
  });
  const closedInvoices = invoices.filter(i => {
    const e = effectiveStatus(i);
    return e === 'paid' || e === 'void';
  });

  return (
    <main className="min-h-screen bg-background-cream">
      {/* Header — branded but trimmed; no nav, no marketing. The portal is
          a focused tool, not a sales surface. */}
      <header className="bg-white border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/creco-logo-light.png"
              alt="CRECO"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Link>
          <div className="text-right">
            <p className="text-caption uppercase tracking-widest text-foreground-muted">Account portal</p>
            <p className="text-body-sm font-semibold text-primary">{client.name}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* Welcome + balance card */}
        <section className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-gold/5 to-transparent p-6 sm:p-8">
          <p className="text-caption uppercase tracking-widest text-gold-dark mb-1">Welcome back</p>
          <h1 className="font-heading text-display-sm font-bold text-primary mb-1">
            {client.name}
          </h1>
          {client.company && (
            <p className="text-body text-foreground-muted mb-4">{client.company}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <div className="rounded-xl bg-white border border-border p-5">
              <p className="text-caption uppercase tracking-widest text-foreground-muted">Outstanding</p>
              <p className={`mt-1 font-heading text-display-sm font-bold ${outstanding > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {formatMoney(outstanding)}
              </p>
              <p className="text-caption text-foreground-muted mt-1">
                {openInvoices.length} open invoice{openInvoices.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="rounded-xl bg-white border border-border p-5">
              <p className="text-caption uppercase tracking-widest text-foreground-muted">Paid year-to-date</p>
              <p className="mt-1 font-heading text-display-sm font-bold text-primary">
                {formatMoney(paidYtd)}
              </p>
              <p className="text-caption text-foreground-muted mt-1">
                {invoices.filter(i => effectiveStatus(i) === 'paid' && i.paid_at && i.paid_at >= yearStart).length} settled
              </p>
            </div>
          </div>
        </section>

        {/* Open invoices */}
        {openInvoices.length > 0 && (
          <section className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-amber-50/50">
              <h2 className="font-heading text-heading-sm font-bold text-primary inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" /> Open invoices
              </h2>
              <p className="text-caption text-foreground-muted">
                {openInvoices.length} invoice{openInvoices.length !== 1 ? 's' : ''} awaiting payment
              </p>
            </div>
            <div className="divide-y divide-border">
              {openInvoices.map(inv => {
                const eff = effectiveStatus(inv);
                const style = STATUS_STYLES[eff];
                return (
                  <div key={inv.id} className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-body-sm font-semibold text-primary">{inv.invoice_number}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold border ${style.className}`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-caption text-foreground-muted mt-0.5">
                        Issued {formatDate(inv.issue_date)} · Due {formatDate(inv.due_date)}
                      </p>
                      {inv.property_reference && (
                        <p className="text-caption text-foreground-muted">
                          <Building2 className="inline h-3 w-3 mr-1" />
                          {inv.property_reference}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-heading-sm font-bold text-primary">{formatMoney(inv.total)}</p>
                      <div className="mt-1 flex items-center gap-2 justify-end flex-wrap">
                        {inv.stripe_payment_link_url && (
                          <a
                            href={inv.stripe_payment_link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-gold px-3 py-1.5 text-caption font-semibold text-primary hover:bg-gold-light"
                          >
                            Pay online <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-1.5 text-caption text-primary hover:border-primary"
                        >
                          PDF
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Closed history */}
        {closedInvoices.length > 0 && (
          <section className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-heading text-heading-sm font-bold text-primary inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-700" /> History
              </h2>
              <p className="text-caption text-foreground-muted">
                {closedInvoices.length} paid / void invoice{closedInvoices.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead className="bg-background-cream/50 text-caption uppercase tracking-widest text-foreground-muted">
                  <tr>
                    <th className="px-5 py-2.5 text-left">Invoice</th>
                    <th className="px-5 py-2.5 text-left">Issued</th>
                    <th className="px-5 py-2.5 text-left">Paid</th>
                    <th className="px-5 py-2.5 text-right">Amount</th>
                    <th className="px-5 py-2.5 text-left">Status</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {closedInvoices.slice(0, 50).map(inv => {
                    const eff = effectiveStatus(inv);
                    const style = STATUS_STYLES[eff];
                    return (
                      <tr key={inv.id} className="hover:bg-background-cream/30">
                        <td className="px-5 py-3 font-mono text-primary">{inv.invoice_number}</td>
                        <td className="px-5 py-3 text-foreground-muted">{formatDate(inv.issue_date)}</td>
                        <td className="px-5 py-3 text-foreground-muted">
                          {inv.paid_at ? formatDate(inv.paid_at.slice(0, 10)) : '—'}
                        </td>
                        <td className="px-5 py-3 font-mono text-right text-primary">{formatMoney(inv.total)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold border ${style.className}`}>
                            {style.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <a
                            href={`/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-caption text-gold-dark hover:text-gold"
                          >
                            PDF
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {closedInvoices.length > 50 && (
                <p className="px-5 py-3 text-caption text-foreground-muted text-center bg-background-cream/30">
                  Showing 50 most recent. Reply to any CRECO email for the full history.
                </p>
              )}
            </div>
          </section>
        )}

        {invoices.length === 0 && (
          <section className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-foreground-subtle mb-3" />
            <h3 className="font-heading text-body font-bold text-primary mb-1">No invoices yet</h3>
            <p className="text-body-sm text-foreground-muted">
              When CRECO issues you an invoice, it&apos;ll appear here.
            </p>
          </section>
        )}

        {/* Footer / contact */}
        <section className="rounded-xl bg-primary text-white p-6">
          <h3 className="font-heading text-heading-sm font-bold mb-2">Questions about your account?</h3>
          <p className="text-body-sm text-white/70 mb-4">
            Reach out and we&apos;ll get back same business day.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="tel:+12108173443"
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-body-sm font-semibold text-primary hover:bg-gold-light"
            >
              <Phone className="h-4 w-4" /> (210) 817-3443
            </a>
            <a
              href="mailto:info@crecotx.com"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-transparent px-4 py-2 text-body-sm font-semibold text-white hover:bg-white/10"
            >
              <Mail className="h-4 w-4" /> info@crecotx.com
            </a>
          </div>
        </section>

        <p className="text-caption text-foreground-muted text-center pt-2">
          This page is private to you. Don&apos;t share the URL.
        </p>
      </div>
    </main>
  );
}
