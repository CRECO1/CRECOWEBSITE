'use client';

/**
 * Shared form component for creating + editing a saved client record.
 * Mode 'create' POSTs to /api/clients. Mode 'edit' PATCHes /api/clients/[id].
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertTriangle, Users, Trash, Settings, Link2, Copy, RefreshCw } from 'lucide-react';
import type { Client, ReminderCadence } from '@/lib/clients';
import { formInputCls as inputCls } from '@/lib/form-styles';

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

  // Defaults — empty string means "no override, fall back to global". Tax rate
  // stored as percent in the form for legibility (8.25), converted to decimal
  // on save (0.0825). Cadence is one of three preset variants.
  const [defaultTaxRatePct, setDefaultTaxRatePct] = useState(
    initial?.default_tax_rate != null ? String(initial.default_tax_rate * 100) : ''
  );
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(initial?.default_payment_terms ?? '');
  const [remindersEnabledDefault, setRemindersEnabledDefault] = useState(initial?.reminders_enabled_default ?? true);
  const [reminderCadence, setReminderCadence] = useState<ReminderCadence>(initial?.reminder_cadence ?? 'standard');

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
      // Convert percent string -> decimal. Empty string = null (no override).
      const taxRateDecimal = defaultTaxRatePct.trim() === ''
        ? null
        : Math.min(1, Math.max(0, Number(defaultTaxRatePct) / 100));
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
          default_tax_rate: Number.isFinite(taxRateDecimal as number) ? taxRateDecimal : null,
          default_payment_terms: defaultPaymentTerms.trim() || null,
          reminders_enabled_default: remindersEnabledDefault,
          reminder_cadence: reminderCadence,
        }),
      });
      // Parse body even on success so we can detect the "existed" case
      // (duplicate email — API returns 200 with the existing client's id).
      // Without this, the operator gets bounced to the list with no signal,
      // wondering why "their new client didn't save" — it didn't save
      // because it already existed under that email.
      const body = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        throw new Error((body as { error?: string }).error ?? `Failed (${res.status})`);
      }

      // Hand a marker to the list page so it can (a) show a confirmation
      // toast and (b) force-refresh past Next.js's router cache, which
      // otherwise serves the stale list and makes the new row look missing.
      try {
        sessionStorage.setItem('billing.pending_toast', JSON.stringify({
          kind: 'client_saved',
          mode,
          existed: (body as { existed?: boolean }).existed === true,
          name: name.trim(),
          id: (body as { id?: string }).id,
        }));
      } catch { /* private mode etc — skip */ }

      // The ?t= query string changes the URL identity so the list page's
      // useSearchParams reads a fresh value, which we use as a useEffect
      // dependency to re-fetch reliably even when the route segment is
      // cached. router.refresh() alone doesn't re-run client-side effects.
      router.push(`/billing/clients?t=${Date.now()}`);
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
          <h2 className="font-heading text-body font-bold text-primary flex items-center gap-2">
            <Settings className="h-4 w-4 text-gold" />
            Invoice defaults
          </h2>
          <p className="text-caption text-foreground-muted -mt-2">
            Prefills the invoice form when you pick this client. Leave blank to use the global defaults.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Default tax rate (%)">
              <input
                type="number"
                step="0.001"
                min="0"
                max="100"
                inputMode="decimal"
                className={inputCls}
                value={defaultTaxRatePct}
                onChange={e => {
                  const v = e.target.value;
                  // Soft-clamp to [0,100] on input. Number() of an empty string
                  // is 0; we let the empty case through so users can clear the
                  // field. Out-of-range values get blocked silently — the
                  // typed character just doesn't take.
                  if (v === '' || (Number(v) >= 0 && Number(v) <= 100)) {
                    setDefaultTaxRatePct(v);
                  }
                }}
                placeholder="e.g. 8.25"
              />
              <p className="mt-1 text-caption text-foreground-muted">
                Empty = use whatever global default is current. Use this for clients in different jurisdictions or tax-exempt entities (set 0).
              </p>
            </Field>
            <Field label="Default payment terms">
              <input
                type="text"
                className={inputCls}
                value={defaultPaymentTerms}
                onChange={e => setDefaultPaymentTerms(e.target.value)}
                placeholder='e.g. "Net 15", "Net 30", "Due on receipt"'
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Reminder cadence">
              <select
                value={reminderCadence}
                onChange={e => setReminderCadence(e.target.value as ReminderCadence)}
                className={inputCls}
              >
                <option value="standard">Standard — full 6-stage schedule</option>
                <option value="gentle">Gentle — skip early stages for trusted slow payers</option>
                <option value="firm">Firm — earlier + more frequent reminders</option>
              </select>
              <p className="mt-1 text-caption text-foreground-muted">
                Tune for client temperament. Gentle skips the T-7 / T+0 stages; firm fires them earlier.
              </p>
            </Field>
            <Field label="Reminders enabled by default">
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-gold/50 transition-colors">
                <input
                  type="checkbox"
                  checked={remindersEnabledDefault}
                  onChange={e => setRemindersEnabledDefault(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <div>
                  <div className="text-body-sm font-semibold text-primary">Auto-remind by default</div>
                  <div className="text-caption text-foreground-muted">
                    New invoices for this client start with reminders on. Individual invoices can still opt out.
                  </div>
                </div>
              </label>
            </Field>
          </div>
        </section>

        {mode === 'edit' && initial?.portal_token && (
          <section className="rounded-xl border border-border bg-white p-6 space-y-4">
            <h2 className="font-heading text-body font-bold text-primary flex items-center gap-2">
              <Link2 className="h-4 w-4 text-gold" />
              Client portal link
            </h2>
            <p className="text-caption text-foreground-muted -mt-2">
              Anyone with this URL can view this client&apos;s invoices and payment history at any time —
              no login required. Paste it into your emails, or share it on request.
            </p>
            <PortalLinkRow token={initial.portal_token} clientId={initial.id} />
          </section>
        )}

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


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

/**
 * Inline copy-link row + rotate action for the client portal URL. Rotate
 * generates a fresh token server-side, invalidating the old URL — used
 * when a client says "I think the link got forwarded somewhere it
 * shouldn't have."
 */
function PortalLinkRow({ token, clientId }: { token: string; clientId: string }) {
  const [currentToken, setCurrentToken] = useState(token);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build the URL — fall back to relative path during SSR
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/client/${currentToken}`
    : `/client/${currentToken}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copy failed — select the URL manually.');
    }
  }

  async function rotate() {
    if (!confirm('Generate a new portal link? The current link will stop working immediately.')) return;
    setRotating(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/rotate-portal-token`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Could not rotate token');
      setCurrentToken(body.portal_token);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRotating(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={url}
          readOnly
          onFocus={e => e.currentTarget.select()}
          className="flex-1 rounded-md border border-border bg-background-cream/40 px-3 py-2 text-caption font-mono text-primary focus:outline-none focus:border-gold"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-body-sm text-primary hover:border-primary whitespace-nowrap"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={rotate}
          disabled={rotating}
          title="Generate a new link — old link stops working"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-body-sm text-foreground-muted hover:text-primary disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${rotating ? 'animate-spin' : ''}`} />
          Rotate
        </button>
      </div>
      {error && <p className="text-caption text-destructive">{error}</p>}
    </div>
  );
}
