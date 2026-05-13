'use client';

/**
 * Shared form component for creating + editing a contractor record.
 *
 * Mode 'create' POSTs to /api/contractors. Mode 'edit' PATCHes
 * /api/contractors/[id]. Direct Supabase writes work too, but the API route
 * gives us a single place to add validation later (TIN format, duplicate
 * detection, etc.) without touching the UI.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertTriangle, FileBadge, Trash } from 'lucide-react';
import type { Contractor } from '@/lib/expenses';

export function ContractorForm({
  initial, mode,
}: {
  initial: Contractor | null;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();

  const [legalName, setLegalName]   = useState(initial?.legal_name ?? '');
  const [displayName, setDisplayName] = useState(initial?.display_name ?? '');
  const [email, setEmail]           = useState(initial?.email ?? '');
  const [phone, setPhone]           = useState(initial?.phone ?? '');
  const [taxId, setTaxId]           = useState(initial?.tax_id ?? '');
  const [taxIdType, setTaxIdType]   = useState<'SSN' | 'EIN' | ''>(initial?.tax_id_type ?? '');
  const [addr1, setAddr1]           = useState(initial?.address_line1 ?? '');
  const [addr2, setAddr2]           = useState(initial?.address_line2 ?? '');
  const [city, setCity]             = useState(initial?.city ?? '');
  const [state, setState]           = useState(initial?.state ?? 'TX');
  const [zip, setZip]               = useState(initial?.zip ?? '');
  const [notes, setNotes]           = useState(initial?.notes ?? '');
  const [active, setActive]         = useState(initial?.active ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!legalName.trim()) return setError('Legal name is required');

    setSaving(true);
    try {
      const url = mode === 'edit' ? `/api/contractors/${initial!.id}` : '/api/contractors';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_name: legalName.trim(),
          display_name: displayName.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          tax_id: taxId.trim() || null,
          tax_id_type: taxIdType || null,
          address_line1: addr1.trim() || null,
          address_line2: addr2.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zip: zip.trim() || null,
          notes: notes.trim() || null,
          active,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      router.push('/billing/contractors');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm('Delete this contractor? Linked expenses will keep their 1099-eligible flag but lose the contractor reference.')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contractors/${initial.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      router.push('/billing/contractors');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/billing/contractors" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to contractors
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary flex items-center gap-2">
              <FileBadge className="h-5 w-5 text-gold" />
              {mode === 'edit' ? 'Edit contractor' : 'New contractor'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-body-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash className="h-4 w-4" /> Delete
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {mode === 'edit' ? 'Save changes' : 'Create contractor'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-body-sm text-red-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{error}</div>
          </div>
        )}

        <section className="rounded-xl border border-border bg-white p-6 space-y-5">
          <h2 className="font-heading text-body font-bold text-primary">Identity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Legal name * (on W-9)">
              <input type="text" className={inputCls} value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="e.g. David Lopez" required />
            </Field>
            <Field label="Display name (DBA)">
              <input type="text" className={inputCls} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder='e.g. "DSL Photography"' />
            </Field>
            <Field label="Email">
              <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone">
              <input type="tel" className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-6 space-y-5">
          <h2 className="font-heading text-body font-bold text-primary">Tax info</h2>
          <p className="text-caption text-foreground-muted -mt-3">
            Get a signed W-9 before they hit $600. Once they do, you'll need this to issue a 1099-NEC by January 31.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tax ID type">
              <select className={inputCls} value={taxIdType} onChange={e => setTaxIdType(e.target.value as 'SSN' | 'EIN' | '')}>
                <option value="">— not specified —</option>
                <option value="SSN">SSN (sole proprietor / individual)</option>
                <option value="EIN">EIN (LLC / corporation)</option>
              </select>
            </Field>
            <Field label="Tax ID (SSN or EIN)">
              <input
                type="text"
                className={inputCls + ' font-mono'}
                value={taxId}
                onChange={e => setTaxId(e.target.value)}
                placeholder={taxIdType === 'EIN' ? '12-3456789' : taxIdType === 'SSN' ? '123-45-6789' : ''}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-6 space-y-5">
          <h2 className="font-heading text-body font-bold text-primary">Billing address (for 1099)</h2>
          <Field label="Street address">
            <input type="text" className={inputCls} value={addr1} onChange={e => setAddr1(e.target.value)} />
          </Field>
          <Field label="Apt / suite (optional)">
            <input type="text" className={inputCls} value={addr2} onChange={e => setAddr2(e.target.value)} />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field label="City">
              <input type="text" className={inputCls} value={city} onChange={e => setCity(e.target.value)} />
            </Field>
            <Field label="State">
              <input type="text" maxLength={2} className={inputCls + ' uppercase'} value={state} onChange={e => setState(e.target.value.toUpperCase())} />
            </Field>
            <Field label="ZIP">
              <input type="text" className={inputCls} value={zip} onChange={e => setZip(e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-6 space-y-5">
          <Field label="Internal notes">
            <textarea className={inputCls} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder='e.g. "1099 sent 1/28/2026"' />
          </Field>
          <label className="flex items-center gap-2 text-body-sm text-primary">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="h-4 w-4 rounded border-border" />
            Active — show in expense form dropdown
          </label>
        </section>
      </div>
    </main>
  );
}

const inputCls = 'w-full rounded-md border border-border bg-white px-3 py-2 text-body-sm text-primary focus:outline-none focus:border-primary';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
