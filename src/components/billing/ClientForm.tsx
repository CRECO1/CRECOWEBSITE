'use client';

/**
 * Shared form component for creating + editing a saved client record.
 * Mode 'create' POSTs to /api/clients. Mode 'edit' PATCHes /api/clients/[id].
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertTriangle, Users, Trash } from 'lucide-react';
import type { Client } from '@/lib/clients';

export function ClientForm({
  initial, mode,
}: {
  initial: Client | null;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();

  const [name, setName]     = useState(initial?.name ?? '');
  const [email, setEmail]   = useState(initial?.email ?? '');
  const [company, setCompany] = useState(initial?.company ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [phone, setPhone]   = useState(initial?.phone ?? '');
  const [propertyReference, setPropertyReference] = useState(initial?.property_reference ?? '');
  const [notes, setNotes]   = useState(initial?.notes ?? '');
  const [active, setActive] = useState(initial?.active ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!name.trim())  return setError('Name is required');
    if (!email.trim()) return setError('Email is required');

    setSaving(true);
    try {
      const url = mode === 'edit' ? `/api/clients/${initial!.id}` : '/api/clients';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          company: company.trim() || null,
          address: address.trim() || null,
          phone: phone.trim() || null,
          property_reference: propertyReference.trim() || null,
          notes: notes.trim() || null,
          active,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      router.push('/billing/clients');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm('Delete this client? Historical invoices keep their snapshot info but lose the client link.')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${initial.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }
      router.push('/billing/clients');
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
            <Link href="/billing/clients" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to clients
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary flex items-center gap-2">
              <Users className="h-5 w-5 text-gold" />
              {mode === 'edit' ? 'Edit client' : 'New client'}
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
              <Save className="h-4 w-4" /> {mode === 'edit' ? 'Save changes' : 'Create client'}
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
            <Field label="Name *">
              <input type="text" className={inputCls} value={name} onChange={e => setName(e.target.value)} required />
            </Field>
            <Field label="Email *">
              <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} required />
            </Field>
            <Field label="Company">
              <input type="text" className={inputCls} value={company} onChange={e => setCompany(e.target.value)} />
            </Field>
            <Field label="Phone">
              <input type="tel" className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-6 space-y-5">
          <h2 className="font-heading text-body font-bold text-primary">Billing details</h2>
          <Field label="Billing address">
            <textarea
              className={inputCls}
              rows={3}
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Street, city, state, ZIP"
            />
          </Field>
          <Field label="Default property reference (optional)">
            <input
              type="text"
              className={inputCls}
              value={propertyReference}
              onChange={e => setPropertyReference(e.target.value)}
              placeholder='e.g. "8000 Fair Oaks Pkwy"'
            />
            <p className="mt-1.5 text-caption text-foreground-muted">
              Prefills the Property reference field on the invoice form when you pick this client.
            </p>
          </Field>
        </section>

        <section className="rounded-xl border border-border bg-white p-6 space-y-5">
          <Field label="Internal notes">
            <textarea
              className={inputCls}
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anything you want to remember about this client — preferred contact times, account quirks, etc."
            />
          </Field>
          <label className="flex items-center gap-2 text-body-sm text-primary">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="h-4 w-4 rounded border-border" />
            Active — show in the typeahead on the invoice form
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
