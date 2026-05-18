'use client';

/**
 * /billing/bank — Plaid bank feed control center.
 *
 * Two sections:
 *   1. Connected accounts — list of linked Items + accounts, with
 *      "Sync now", "Pause", and "Disconnect" controls.
 *   2. Transactions inbox — unreviewed bank transactions, with quick
 *      actions to turn each into an expense, ignore, or reconcile to
 *      an existing expense.
 *
 * Plaid Link is loaded dynamically (react-plaid-link) so the bundle
 * stays small when the page isn't used.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, RefreshCw, Pause, Play, Trash, Loader2,
  AlertTriangle, ExternalLink, CheckCircle2, ArrowDownCircle, X, ArrowUpCircle,
} from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate } from '@/lib/invoices';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/expenses';

interface BankAccount {
  id: string;
  institution_name: string | null;
  account_name: string | null;
  account_mask: string | null;
  account_type: string | null;
  account_subtype: string | null;
  active: boolean;
  last_synced_at: string | null;
  last_sync_error: string | null;
  created_at: string;
}

interface BankTransaction {
  id: string;
  bank_account_id: string;
  posted_date: string;
  amount: number;
  merchant_name: string | null;
  description: string;
  plaid_category: string | null;
  pending: boolean;
  status: 'unreviewed' | 'expensed' | 'ignored' | 'reconciled';
  expense_id: string | null;
  reconciled_invoice_id: string | null;
  internal_notes: string | null;
}

interface OpenInvoice {
  id: string;
  invoice_number: string;
  client_name: string;
  total: number;
  due_date: string;
  status: string;
}

export default function BankPage() {
  const [accounts, setAccounts] = useState<BankAccount[] | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[] | null>(null);
  // Outstanding invoices — populated alongside accounts/transactions so the
  // review modal can suggest matches for inflows. Refetched after a bulk
  // change too (an applied invoice drops off this list).
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [reviewingTxnId, setReviewingTxnId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'unreviewed' | 'expensed' | 'ignored' | 'all'>('unreviewed');

  const reloadAll = useCallback(async () => {
    const [accR, txnR, invR] = await Promise.all([
      supabase.from('bank_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('bank_transactions').select('*').order('posted_date', { ascending: false }).limit(200),
      // Open invoices = sent or overdue. Used for invoice-match suggestions
      // on inflows. Limit 100 keeps the response small — should cover any
      // realistic A/R window.
      supabase
        .from('invoices')
        .select('id, invoice_number, client_name, total, due_date, status')
        .in('status', ['sent', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(100),
    ]);
    setAccounts((accR.data ?? []) as BankAccount[]);
    setTransactions((txnR.data ?? []) as BankTransaction[]);
    setOpenInvoices((invR.data ?? []) as OpenInvoice[]);
  }, []);

  useEffect(() => { reloadAll(); }, [reloadAll]);

  // Fetch a link token from our backend; required for the Plaid Link UI
  async function startLinkFlow() {
    setLinkError(null);
    setBusy('link');
    try {
      const res = await fetch('/api/plaid/link-token', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not get link token');
      setLinkToken(json.link_token);
    } catch (err) {
      setLinkError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const { open: openPlaidLink, ready: linkReady } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      setBusy('exchange');
      try {
        const res = await fetch('/api/plaid/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token: publicToken }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Exchange failed');
        setLinkToken(null);
        await reloadAll();
      } catch (err) {
        setLinkError((err as Error).message);
      } finally {
        setBusy(null);
      }
    },
    onExit: (err) => {
      if (err) setLinkError(err.error_message ?? err.error_code ?? 'Link cancelled');
      setLinkToken(null);
    },
  });

  // Open the Plaid Link modal once we have a token + the SDK is ready
  useEffect(() => {
    if (linkToken && linkReady) openPlaidLink();
  }, [linkToken, linkReady, openPlaidLink]);

  async function syncNow() {
    setBusy('sync');
    setSyncMessage(null);
    try {
      const res = await fetch('/api/plaid/sync', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Sync failed');
      const totalAdded = (json.results ?? []).reduce((s: number, r: { added: number }) => s + r.added, 0);
      setSyncMessage(totalAdded === 0 ? 'No new transactions.' : `${totalAdded} new transaction${totalAdded !== 1 ? 's' : ''} pulled.`);
      setTimeout(() => setSyncMessage(null), 4000);
      await reloadAll();
    } catch (err) {
      setLinkError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function togglePauseAccount(acct: BankAccount) {
    setBusy(acct.id);
    await fetch(`/api/plaid/accounts/${acct.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !acct.active }),
    });
    await reloadAll();
    setBusy(null);
  }

  async function disconnectAccount(acct: BankAccount) {
    if (!confirm(`Disconnect ${acct.institution_name ?? 'this account'}? Plaid will be told to revoke the access token. Transaction history is deleted.`)) return;
    setBusy(acct.id);
    await fetch(`/api/plaid/accounts/${acct.id}`, { method: 'DELETE' });
    await reloadAll();
    setBusy(null);
  }

  const filteredTxns = (transactions ?? []).filter(t => statusFilter === 'all' || t.status === statusFilter);
  const unreviewedCount = (transactions ?? []).filter(t => t.status === 'unreviewed' && !t.pending).length;
  const reviewingTxn = transactions?.find(t => t.id === reviewingTxnId) ?? null;

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/billing" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to dashboard
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary">Bank feed</h1>
            <p className="text-caption text-foreground-muted">
              Connect your business bank + cards. Daily sync pulls new transactions for review.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={syncNow}
              disabled={busy === 'sync' || (accounts?.length ?? 0) === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-primary hover:border-primary disabled:opacity-50"
            >
              {busy === 'sync' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync now
            </button>
            <button
              type="button"
              onClick={startLinkFlow}
              disabled={busy === 'link' || busy === 'exchange'}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {busy === 'link' || busy === 'exchange' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Link a bank
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {linkError && (
          <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-body-sm text-red-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              {linkError}
              {linkError.includes('not configured') && (
                <div className="mt-2 text-caption">
                  Set PLAID_CLIENT_ID and PLAID_SECRET in Vercel → Settings → Environment Variables, then redeploy. Use sandbox creds (free at plaid.com) to test.
                </div>
              )}
            </div>
            <button onClick={() => setLinkError(null)} className="ml-auto text-red-800 hover:text-red-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {syncMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-body-sm text-green-800 inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {syncMessage}
          </div>
        )}

        {/* ── Accounts ───────────────────────────────────────────── */}
        <section>
          <h2 className="font-heading text-body font-bold text-primary mb-3">Connected accounts</h2>
          {accounts === null ? (
            <div className="py-8 text-center text-foreground-muted">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-gold" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
              <p className="text-body-sm text-foreground-muted mb-3">No bank accounts linked yet.</p>
              <button
                type="button"
                onClick={startLinkFlow}
                disabled={busy === 'link' || busy === 'exchange'}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" /> Link your first bank
              </button>
              <p className="mt-3 text-caption text-foreground-muted">
                Requires PLAID_CLIENT_ID + PLAID_SECRET on Vercel. Use Plaid Sandbox creds (free) to test before applying for production.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {accounts.map(a => (
                <div key={a.id} className="rounded-xl border border-border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-body-sm font-semibold text-primary truncate">
                        {a.institution_name ?? 'Bank'}
                      </p>
                      <p className="text-caption text-foreground-muted truncate">
                        {a.account_name ?? '—'}
                        {a.account_mask ? <span className="font-mono"> ••{a.account_mask}</span> : null}
                      </p>
                      {a.account_subtype && (
                        <p className="text-caption text-foreground-muted capitalize">{a.account_subtype}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {a.active ? (
                        <span className="inline-flex items-center gap-1 text-caption text-green-700">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-caption text-foreground-muted">
                          <Pause className="h-3 w-3" /> Paused
                        </span>
                      )}
                      <p className="text-caption text-foreground-muted mt-1">
                        Last sync: {a.last_synced_at ? formatDate(a.last_synced_at.slice(0, 10)) : 'never'}
                      </p>
                    </div>
                  </div>
                  {a.last_sync_error && (
                    <p className="mt-2 text-caption text-red-700 bg-red-50 rounded p-2 truncate" title={a.last_sync_error}>
                      Last error: {a.last_sync_error}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePauseAccount(a)}
                      disabled={busy === a.id}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-1.5 text-caption text-primary hover:border-primary disabled:opacity-50"
                    >
                      {a.active ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Resume</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => disconnectAccount(a)}
                      disabled={busy === a.id}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-3 py-1.5 text-caption text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash className="h-3 w-3" /> Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Transactions inbox ─────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-heading text-body font-bold text-primary">
              Transactions {unreviewedCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center bg-gold text-primary text-caption font-bold rounded-full px-2 py-0.5">
                  {unreviewedCount}
                </span>
              )}
            </h2>
            <div className="inline-flex rounded-md border border-border overflow-hidden text-body-sm">
              {(['unreviewed','expensed','ignored','all'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 capitalize ${statusFilter === s ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-background-cream/60'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {transactions === null ? (
            <div className="py-8 text-center text-foreground-muted">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-gold" />
            </div>
          ) : filteredTxns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center text-body-sm text-foreground-muted">
              {statusFilter === 'unreviewed' ? 'Inbox zero. Sync to pull more.' : 'Nothing in this view.'}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-body-sm min-w-[720px]">
                  <thead className="bg-background-cream/50 text-caption uppercase tracking-widest text-foreground-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Merchant / Description</th>
                      <th className="px-4 py-3 text-left font-medium">Category</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTxns.map(t => (
                      <tr key={t.id} className="hover:bg-background-cream/40">
                        <td className="px-4 py-3 align-top whitespace-nowrap">
                          {formatDate(t.posted_date)}
                          {t.pending && <div className="text-caption text-amber-700">pending</div>}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="text-primary font-medium truncate max-w-xs">{t.merchant_name ?? t.description}</div>
                          {t.merchant_name && t.description !== t.merchant_name && (
                            <div className="text-caption text-foreground-muted truncate max-w-xs">{t.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-foreground-muted text-caption">
                          {t.plaid_category ?? '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                          {Number(t.amount) >= 0 ? (
                            <span className="font-mono font-semibold text-primary">{formatMoney(Number(t.amount))}</span>
                          ) : (
                            <span className="font-mono font-semibold text-green-700 inline-flex items-center gap-1">
                              <ArrowUpCircle className="h-3 w-3" /> {formatMoney(Math.abs(Number(t.amount)))}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <StatusPill status={t.status} />
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          {t.status === 'unreviewed' && !t.pending ? (
                            <button
                              type="button"
                              onClick={() => setReviewingTxnId(t.id)}
                              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-caption font-semibold text-white hover:bg-primary/90"
                            >
                              Review
                            </button>
                          ) : t.expense_id ? (
                            <Link
                              href={`/billing/expenses/${t.expense_id}`}
                              className="inline-flex items-center gap-1 text-caption text-gold-dark hover:text-gold"
                            >
                              View expense <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => unreview(t.id)}
                              className="text-caption text-foreground-muted hover:text-primary"
                            >
                              Undo
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Review modal */}
      {reviewingTxn && (
        <ReviewModal
          txn={reviewingTxn}
          openInvoices={openInvoices}
          onClose={() => setReviewingTxnId(null)}
          onComplete={async () => {
            setReviewingTxnId(null);
            await reloadAll();
          }}
        />
      )}
    </main>
  );

  async function unreview(id: string) {
    setBusy(id);
    await fetch(`/api/plaid/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unreview' }),
    });
    await reloadAll();
    setBusy(null);
  }
}

function StatusPill({ status }: { status: BankTransaction['status'] }) {
  const styles: Record<BankTransaction['status'], string> = {
    unreviewed: 'bg-amber-50 text-amber-900 border-amber-200',
    expensed:   'bg-green-50 text-green-800 border-green-200',
    ignored:    'bg-gray-50 text-gray-600 border-gray-200',
    reconciled: 'bg-blue-50 text-blue-800 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold border ${styles[status]}`}>
      {status}
    </span>
  );
}

function ReviewModal({
  txn, openInvoices, onClose, onComplete,
}: {
  txn: BankTransaction;
  openInvoices: OpenInvoice[];
  onClose: () => void;
  onComplete: () => void;
}) {
  const isOutflow = Number(txn.amount) > 0;
  const txnAbsAmount = Math.abs(Number(txn.amount));
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState(txn.description);
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [propertyReference, setPropertyReference] = useState('');
  const [reimbursable, setReimbursable] = useState(false);
  const [is1099, setIs1099] = useState(false);
  const [busy, setBusy] = useState<'expense' | 'ignore' | 'apply' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Rank invoice matches by amount-similarity (exact match first, then
  // small absolute delta) then by client_name fuzzy-match against the
  // bank txn description. The first match is auto-selected so a single
  // click on "Apply" lands the most-likely reconciliation.
  const matchedInvoices = useMemo(() => {
    if (isOutflow) return [];
    const desc = `${txn.merchant_name ?? ''} ${txn.description ?? ''}`.toLowerCase();
    return openInvoices
      .map(inv => {
        const totalDelta = Math.abs(Number(inv.total) - txnAbsAmount);
        const exact = totalDelta < 0.01;
        const close = totalDelta < 10;          // within $10 — fee tolerance
        const nameMatch = inv.client_name
          ? desc.includes(inv.client_name.toLowerCase().split(/\s+/)[0] ?? '')
          : false;
        return { inv, totalDelta, exact, close, nameMatch };
      })
      .sort((a, b) => {
        // Exact-amount match wins outright
        if (a.exact !== b.exact) return a.exact ? -1 : 1;
        // Then close-amount + name match
        const aScore = (a.close ? 2 : 0) + (a.nameMatch ? 1 : 0);
        const bScore = (b.close ? 2 : 0) + (b.nameMatch ? 1 : 0);
        if (aScore !== bScore) return bScore - aScore;
        // Tiebreak: smaller amount delta first
        return a.totalDelta - b.totalDelta;
      });
  }, [openInvoices, txnAbsAmount, txn.merchant_name, txn.description, isOutflow]);

  const [pickedInvoiceId, setPickedInvoiceId] = useState<string | null>(
    matchedInvoices[0]?.inv.id ?? null,
  );
  const [applyMethod, setApplyMethod] = useState<string>('ACH');

  async function submitExpense() {
    if (!isOutflow) { setError('This is a credit. Use Ignore.'); return; }
    setBusy('expense'); setError(null);
    try {
      const res = await fetch(`/api/plaid/transactions/${txn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'expense',
          category,
          description,
          payment_method: paymentMethod,
          property_reference: propertyReference || null,
          reimbursable,
          is_1099_eligible: is1099,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      onComplete();
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(null); }
  }

  async function submitApplyToInvoice() {
    if (!pickedInvoiceId) { setError('Pick an invoice first.'); return; }
    setBusy('apply'); setError(null);
    try {
      const res = await fetch(`/api/plaid/transactions/${txn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_to_invoice',
          invoice_id: pickedInvoiceId,
          method: applyMethod,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Apply failed');
      onComplete();
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(null); }
  }

  async function submitIgnore() {
    setBusy('ignore'); setError(null);
    try {
      const res = await fetch(`/api/plaid/transactions/${txn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ignore' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      onComplete();
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(null); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <div className="text-caption uppercase tracking-widest text-foreground-muted">{formatDate(txn.posted_date)}</div>
            <h3 className="font-heading text-heading-sm font-bold text-primary mt-0.5">{txn.merchant_name ?? txn.description}</h3>
            {txn.plaid_category && <p className="text-caption text-foreground-muted">Plaid: {txn.plaid_category}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-body-sm font-mono font-bold ${isOutflow ? 'text-primary bg-background-cream' : 'text-green-700 bg-green-50'}`}>
              {isOutflow ? <ArrowDownCircle className="h-3.5 w-3.5" /> : <ArrowUpCircle className="h-3.5 w-3.5" />}
              {formatMoney(Math.abs(Number(txn.amount)))}
            </span>
            <button onClick={onClose} className="text-foreground-muted hover:text-primary">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-body-sm text-red-800">{error}</div>
          )}

          {!isOutflow && (
            <div className="space-y-3">
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-body-sm text-blue-900">
                This is an inflow ({formatMoney(txnAbsAmount)}). Apply it to an open invoice below, or use Ignore for non-invoice deposits (refunds, transfers, etc.).
              </div>

              <div>
                <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-2">Apply to invoice</span>
                {matchedInvoices.length === 0 ? (
                  <p className="text-body-sm text-foreground-muted italic">No open invoices to match. Mark them sent first, or use Ignore.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-white divide-y divide-border">
                    {matchedInvoices.slice(0, 12).map(({ inv, exact, close, nameMatch }) => {
                      const picked = pickedInvoiceId === inv.id;
                      return (
                        <label
                          key={inv.id}
                          className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                            picked ? 'bg-gold/10' : 'hover:bg-background-cream/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name="invoice-match"
                            checked={picked}
                            onChange={() => setPickedInvoiceId(inv.id)}
                            className="mt-1 h-4 w-4 accent-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-body-sm font-semibold text-primary">{inv.invoice_number}</span>
                              <span className="text-body-sm text-foreground truncate">{inv.client_name}</span>
                              {exact && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-caption font-semibold">
                                  <CheckCircle2 className="h-3 w-3" /> exact match
                                </span>
                              )}
                              {!exact && close && (
                                <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-caption font-semibold">close match</span>
                              )}
                              {nameMatch && !exact && (
                                <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-caption font-semibold">name match</span>
                              )}
                            </div>
                            <div className="text-caption text-foreground-muted">
                              {formatMoney(Number(inv.total))} · due {formatDate(inv.due_date)} · {inv.status}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {pickedInvoiceId && (
                <div>
                  <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-2">Payment method</span>
                  <div className="grid grid-cols-5 gap-1.5" role="radiogroup">
                    {['ACH', 'Wire', 'Check', 'Stripe', 'Other'].map(m => {
                      const selected = applyMethod === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setApplyMethod(m)}
                          className={`rounded-lg border-2 px-2 py-1.5 text-caption font-semibold transition-colors ${
                            selected ? 'border-gold bg-gold/5 text-primary' : 'border-border bg-white text-foreground-muted hover:border-gold/50'
                          }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                disabled={!isOutflow}
                className="w-full rounded-lg border border-border px-3 py-2 text-body-sm"
              >
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Payment method">
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                disabled={!isOutflow}
                className="w-full rounded-lg border border-border px-3 py-2 text-body-sm"
              >
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!isOutflow}
              className="w-full rounded-lg border border-border px-3 py-2 text-body-sm"
            />
          </Field>
          <Field label="Property reference (optional)">
            <input
              type="text"
              value={propertyReference}
              onChange={e => setPropertyReference(e.target.value)}
              disabled={!isOutflow}
              className="w-full rounded-lg border border-border px-3 py-2 text-body-sm"
              placeholder="e.g. 8000 Fair Oaks Pkwy"
            />
          </Field>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 text-body-sm text-primary">
              <input
                type="checkbox"
                checked={reimbursable}
                onChange={e => setReimbursable(e.target.checked)}
                disabled={!isOutflow}
                className="h-4 w-4 rounded border-border"
              />
              Reimbursable
            </label>
            <label className="inline-flex items-center gap-2 text-body-sm text-primary">
              <input
                type="checkbox"
                checked={is1099}
                onChange={e => setIs1099(e.target.checked)}
                disabled={!isOutflow}
                className="h-4 w-4 rounded border-border"
              />
              1099-eligible
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-background-cream/40 px-5 py-3">
          <button
            type="button"
            onClick={submitIgnore}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-primary disabled:opacity-50"
          >
            {busy === 'ignore' ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Ignore
          </button>
          {isOutflow ? (
            <button
              type="button"
              onClick={submitExpense}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {busy === 'expense' ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save as expense
            </button>
          ) : (
            <button
              type="button"
              onClick={submitApplyToInvoice}
              disabled={!pickedInvoiceId || busy !== null}
              className="inline-flex items-center gap-1.5 rounded-md bg-green-700 px-4 py-2 text-body-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {busy === 'apply' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Apply to invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
