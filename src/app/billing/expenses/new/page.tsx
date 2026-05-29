'use client';

/**
 * /billing/expenses/new — record a new expense. Single-screen form.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertTriangle, ArrowDownCircle, FileBadge } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, type Contractor } from '@/lib/expenses';
import { formInputCls as inputCls } from '@/lib/form-styles';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewExpensePage() {
  const router = useRouter();
  const [date, setDate] = useState(todayIso());
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [propertyReference, setPropertyReference] = useState('');
  const [reimbursable, setReimbursable] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [is1099Eligible, setIs1099Eligible] = useState(false);
  const [contractorId, setContractorId] = useState<string>('');
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function save() {
    setError(null);
    if (!vendor.trim()) {
      setError('Vendor is required.');
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    setSaving(true);
    const { data, error: insertErr } = await supabase
      .from('expenses')
      .insert([{
        expense_date: date,
        vendor: vendor.trim(),
        category: category.trim() || 'Other',
        amount: amt,
        payment_method: paymentMethod.trim() || null,
        description: description.trim() || null,
        receipt_url: receiptUrl.trim() || null,
        property_reference: propertyReference.trim() || null,
        reimbursable,
        internal_notes: internalNotes.trim() || null,
        is_1099_eligible: is1099Eligible,
        contractor_id: contractorId || null,
      }])
      .select()
      .single();

    setSaving(false);
    if (insertErr || !data) {
      setError(insertErr?.message ?? 'Could not save expense.');
      return;
    }
    router.push(`/billing/expenses/${data.id}`);
  }

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/billing/expenses" className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Expenses
            </Link>
            <span className="text-foreground-muted">/</span>
            <h1 className="font-heading text-heading-md font-bold text-primary flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-gold" /> New expense
            </h1>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save expense'}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-body-sm text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{error}</div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-white p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date *">
              <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} required />
            </Field>
            <Field label="Amount *">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">$</span>
                <input type="number" min="0" step="0.01" className={`${inputCls} pl-7`} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
              </div>
            </Field>
            <Field label="Vendor / Payee *">
              <input type="text" className={inputCls} value={vendor} onChange={e => setVendor(e.target.value)} placeholder='e.g. "Verizon", "Office Depot"' required />
            </Field>
            <Field label="Category">
              <select className={inputCls} value={category} onChange={e => setCategory(e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Payment method">
              <select className={inputCls} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Property reference">
              <input type="text" className={inputCls} value={propertyReference} onChange={e => setPropertyReference(e.target.value)} placeholder='Optional — e.g. "8000 Fair Oaks Pkwy"' />
            </Field>
          </div>

          <Field label="Description">
            <input type="text" className={inputCls} value={description} onChange={e => setDescription(e.target.value)} placeholder="Short note about the purchase" />
          </Field>

          <Field label="Receipt URL">
            <input type="url" className={inputCls} value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} placeholder="https://drive.google.com/... — paste a link to the receipt" />
            <p className="mt-1.5 text-caption text-foreground-muted">
              Direct file uploads land in v2 — for now paste a Google Drive, Dropbox, or direct file URL.
            </p>
          </Field>

          <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-gold/50 transition-colors">
            <input
              type="checkbox"
              checked={reimbursable}
              onChange={e => setReimbursable(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-gold focus:ring-gold"
            />
            <div>
              <div className="text-body-sm font-semibold text-primary">Reimbursable</div>
              <div className="text-caption text-foreground-muted">Paid personally and should be reimbursed by the firm (or vice versa).</div>
            </div>
          </label>

          {/* 1099 contractor tracking */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={is1099Eligible}
                onChange={e => setIs1099Eligible(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-gold focus:ring-gold"
              />
              <div className="flex-1">
                <div className="text-body-sm font-semibold text-primary flex items-center gap-1.5">
                  <FileBadge className="h-3.5 w-3.5" /> Counts toward a contractor's 1099-NEC
                </div>
                <div className="text-caption text-foreground-muted">
                  Check this for contractor labour, professional services, or rents over $600/year. Goods, software, and meals are <em>not</em> 1099-eligible.
                </div>
              </div>
            </label>
            {is1099Eligible && (
              <div>
                <Field label="Contractor (1099 payee)">
                  <div className="flex gap-2 items-start">
                    <select
                      className={inputCls + ' flex-1'}
                      value={contractorId}
                      onChange={e => setContractorId(e.target.value)}
                    >
                      <option value="">— Select contractor —</option>
                      {contractors.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.display_name ?? c.legal_name}
                          {c.display_name && c.display_name !== c.legal_name ? ` (${c.legal_name})` : ''}
                        </option>
                      ))}
                    </select>
                    <Link
                      href="/billing/contractors/new"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-2.5 text-caption text-primary hover:border-primary whitespace-nowrap"
                      title="Add a new contractor"
                    >
                      + new
                    </Link>
                  </div>
                </Field>
                {!contractorId && contractors.length === 0 && (
                  <p className="mt-2 text-caption text-amber-700">
                    No contractors yet. Add one first so this expense can roll up to a 1099 at year-end.
                  </p>
                )}
              </div>
            )}
          </div>

          <Field label="Internal notes">
            <textarea className={inputCls} rows={3} value={internalNotes} onChange={e => setInternalNotes(e.target.value)} placeholder="Optional context — only visible to CRECO admins" />
          </Field>
        </div>
      </div>
    </main>
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
