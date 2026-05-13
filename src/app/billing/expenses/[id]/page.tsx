'use client';

/**
 * /billing/expenses/[id] — view + edit + delete one expense.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowDownCircle, Pencil, Save, X, Trash2,
  AlertTriangle, ExternalLink, FileBadge,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  EXPENSE_CATEGORIES, PAYMENT_METHODS, categoryStyle,
  formatMoney, formatDate, type Expense, type Contractor,
} from '@/lib/expenses';

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Expense | null>(null);
  const [busy, setBusy] = useState<null | string>(null);
  const [error, setError] = useState<string | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('contractors')
        .select('id, legal_name, display_name, active')
        .eq('active', true)
        .order('legal_name');
      setContractors((data ?? []) as Contractor[]);
    })();
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single();
    if (error || !data) {
      setError(error?.message ?? 'Expense not found');
      return;
    }
    setExpense(data as Expense);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function startEdit() {
    if (!expense) return;
    setDraft({ ...expense });
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(null);
    setEditing(false);
  }

  async function saveEdit() {
    if (!draft) return;
    if (!draft.vendor.trim()) {
      setError('Vendor is required.');
      return;
    }
    const amt = Number(draft.amount);
    if (!amt || amt <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    setBusy('save');
    const { error: e1 } = await supabase
      .from('expenses')
      .update({
        expense_date: draft.expense_date,
        vendor: draft.vendor.trim(),
        category: draft.category.trim() || 'Other',
        amount: amt,
        payment_method: draft.payment_method?.trim() || null,
        description: draft.description?.trim() || null,
        receipt_url: draft.receipt_url?.trim() || null,
        property_reference: draft.property_reference?.trim() || null,
        reimbursable: !!draft.reimbursable,
        internal_notes: draft.internal_notes?.trim() || null,
        is_1099_eligible: !!draft.is_1099_eligible,
        contractor_id: draft.contractor_id || null,
      })
      .eq('id', draft.id);
    setBusy(null);
    if (e1) { setError(e1.message); return; }
    setEditing(false);
    setDraft(null);
    await load();
  }

  async function destroy() {
    if (!expense) return;
    if (!window.confirm(`Permanently delete this expense (${expense.vendor} — ${formatMoney(expense.amount)})?`)) return;
    setBusy('delete');
    const { error } = await supabase.from('expenses').delete().eq('id', expense.id);
    setBusy(null);
    if (error) { setError(error.message); return; }
    router.push('/billing/expenses');
  }

  const view = editing && draft ? draft : expense;

  if (!expense && !error) {
    return <div className="min-h-screen bg-background-cream flex items-center justify-center text-foreground-muted">Loading…</div>;
  }
  if (!expense) {
    return (
      <div className="min-h-screen bg-background-cream flex items-center justify-center">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">{error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/billing/expenses" className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Expenses
            </Link>
            <span className="text-foreground-muted">/</span>
            <h1 className="font-heading text-heading-md font-bold text-primary truncate flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-gold shrink-0" />
              <span className="truncate">{expense.vendor}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button type="button" onClick={cancelEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-primary">
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button type="button" onClick={saveEdit} disabled={busy === 'save'} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
                  <Save className="h-4 w-4" /> {busy === 'save' ? 'Saving…' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={startEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-primary hover:border-primary">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button type="button" onClick={destroy} disabled={busy === 'delete'} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-white text-foreground-muted hover:text-destructive hover:border-destructive disabled:opacity-60" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-body-sm text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{error}</div>
          </div>
        )}

        {view && (
          <div className="rounded-xl border border-border bg-white p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date">
                {editing ? (
                  <input type="date" className={inputCls} value={view.expense_date} onChange={e => setDraft(d => d && ({ ...d, expense_date: e.target.value }))} />
                ) : <p className="text-body text-primary">{formatDate(view.expense_date)}</p>}
              </Field>
              <Field label="Amount">
                {editing ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">$</span>
                    <input type="number" min="0" step="0.01" className={`${inputCls} pl-7`} value={view.amount} onChange={e => setDraft(d => d && ({ ...d, amount: Number(e.target.value) || 0 }))} />
                  </div>
                ) : <p className="font-heading text-heading-md font-bold text-primary">{formatMoney(view.amount)}</p>}
              </Field>
              <Field label="Vendor">
                {editing ? (
                  <input type="text" className={inputCls} value={view.vendor} onChange={e => setDraft(d => d && ({ ...d, vendor: e.target.value }))} />
                ) : <p className="text-body text-primary font-semibold">{view.vendor}</p>}
              </Field>
              <Field label="Category">
                {editing ? (
                  <select className={inputCls} value={view.category} onChange={e => setDraft(d => d && ({ ...d, category: e.target.value }))}>
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold border ${categoryStyle(view.category)}`}>
                    {view.category}
                  </span>
                )}
              </Field>
              <Field label="Payment method">
                {editing ? (
                  <select className={inputCls} value={view.payment_method ?? ''} onChange={e => setDraft(d => d && ({ ...d, payment_method: e.target.value }))}>
                    <option value="">—</option>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : <p className="text-body text-foreground-muted">{view.payment_method ?? '—'}</p>}
              </Field>
              <Field label="Property reference">
                {editing ? (
                  <input type="text" className={inputCls} value={view.property_reference ?? ''} onChange={e => setDraft(d => d && ({ ...d, property_reference: e.target.value }))} />
                ) : <p className="text-body text-foreground-muted">{view.property_reference || '—'}</p>}
              </Field>
            </div>

            <Field label="Description">
              {editing ? (
                <input type="text" className={inputCls} value={view.description ?? ''} onChange={e => setDraft(d => d && ({ ...d, description: e.target.value }))} />
              ) : <p className="text-body text-foreground-muted">{view.description || '—'}</p>}
            </Field>

            <Field label="Receipt">
              {editing ? (
                <input type="url" className={inputCls} value={view.receipt_url ?? ''} onChange={e => setDraft(d => d && ({ ...d, receipt_url: e.target.value }))} placeholder="https://..." />
              ) : view.receipt_url ? (
                <a href={view.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-body-sm text-gold-dark hover:text-gold break-all">
                  {view.receipt_url} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : <p className="text-body text-foreground-muted">No receipt attached.</p>}
            </Field>

            <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-gold/50">
              <input
                type="checkbox"
                disabled={!editing}
                checked={view.reimbursable}
                onChange={e => setDraft(d => d && ({ ...d, reimbursable: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded text-gold focus:ring-gold"
              />
              <div>
                <div className="text-body-sm font-semibold text-primary">Reimbursable</div>
                <div className="text-caption text-foreground-muted">Marked when this expense should be reimbursed.</div>
              </div>
            </label>

            {/* 1099 eligibility */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!editing}
                  checked={!!view.is_1099_eligible}
                  onChange={e => setDraft(d => d && ({ ...d, is_1099_eligible: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded text-gold focus:ring-gold"
                />
                <div className="flex-1">
                  <div className="text-body-sm font-semibold text-primary flex items-center gap-1.5">
                    <FileBadge className="h-3.5 w-3.5" /> Counts toward a contractor's 1099-NEC
                  </div>
                  <div className="text-caption text-foreground-muted">
                    Used at year-end to total what each contractor was paid.
                  </div>
                </div>
              </label>
              {view.is_1099_eligible && (
                <Field label="Contractor (1099 payee)">
                  {editing ? (
                    <select
                      className={inputCls}
                      value={view.contractor_id ?? ''}
                      onChange={e => setDraft(d => d && ({ ...d, contractor_id: e.target.value || null }))}
                    >
                      <option value="">— Select contractor —</option>
                      {contractors.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.display_name ?? c.legal_name}
                        </option>
                      ))}
                    </select>
                  ) : view.contractor_id ? (
                    <Link
                      href={`/billing/contractors/${view.contractor_id}`}
                      className="text-body-sm text-gold-dark hover:text-gold"
                    >
                      {contractors.find(c => c.id === view.contractor_id)?.display_name ??
                       contractors.find(c => c.id === view.contractor_id)?.legal_name ??
                       'View contractor'}
                    </Link>
                  ) : (
                    <p className="text-caption text-amber-700 italic">
                      Flagged 1099 but no contractor linked. Edit to assign.
                    </p>
                  )}
                </Field>
              )}
            </div>

            <Field label="Internal notes">
              {editing ? (
                <textarea className={inputCls} rows={3} value={view.internal_notes ?? ''} onChange={e => setDraft(d => d && ({ ...d, internal_notes: e.target.value }))} />
              ) : <p className="text-body text-foreground-muted whitespace-pre-line">{view.internal_notes || '—'}</p>}
            </Field>
          </div>
        )}
      </div>
    </main>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">{label}</span>
      {children}
    </div>
  );
}
