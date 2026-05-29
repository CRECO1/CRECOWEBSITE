'use client';

/**
 * Shared create/edit form for property records. Mirrors the pattern
 * used by ClientForm + ContractorForm.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertTriangle, Building2, Trash } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formInputCls as inputCls } from '@/lib/form-styles';
import { logActivity } from '@/lib/activity-log';
import {
  PROPERTY_TYPES,
  type Property,
  type PropertyStatus,
  type PropertyType,
} from '@/lib/properties';

export function PropertyForm({
  initial, mode,
}: {
  initial: Property | null;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [state, setState] = useState(initial?.state ?? 'TX');
  const [zip, setZip] = useState(initial?.zip ?? '');
  const [propertyType, setPropertyType] = useState<PropertyType>((initial?.property_type as PropertyType) ?? 'office');
  const [status, setStatus] = useState<PropertyStatus>(initial?.status ?? 'active');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!name.trim()) return setError('Name is required');
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip: zip.trim() || null,
        property_type: propertyType,
        status,
        notes: notes.trim() || null,
      };
      if (mode === 'edit' && initial) {
        const { error: e } = await supabase.from('properties').update(payload).eq('id', initial.id);
        if (e) throw new Error(e.message);
        logActivity({ action: 'updated', entity_type: 'property', entity_id: initial.id, entity_label: name.trim() });
        router.push(`/billing/properties/${initial.id}`);
      } else {
        const { data, error: e } = await supabase.from('properties').insert([payload]).select('id').single();
        if (e || !data) throw new Error(e?.message ?? 'Could not create property');
        logActivity({ action: 'created', entity_type: 'property', entity_id: data.id, entity_label: name.trim() });
        router.push(`/billing/properties/${data.id}`);
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  async function handleSoftDelete() {
    if (!initial?.id) return;
    if (!confirm('Delete this property? Historical invoices + expenses keep their snapshot info — the property hides from new pickers but remains in P&L reports. You can restore later.')) return;
    setSaving(true);
    const { error: e } = await supabase
      .from('properties')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', initial.id);
    if (e) { setError(e.message); setSaving(false); return; }
    logActivity({ action: 'deleted', entity_type: 'property', entity_id: initial.id, entity_label: initial.name });
    router.push('/billing/properties');
    router.refresh();
  }

  async function handleRestore() {
    if (!initial?.id) return;
    setSaving(true);
    const { error: e } = await supabase
      .from('properties')
      .update({ deleted_at: null })
      .eq('id', initial.id);
    if (e) { setError(e.message); setSaving(false); return; }
    logActivity({ action: 'restored', entity_type: 'property', entity_id: initial.id, entity_label: initial.name });
    router.refresh();
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link href="/billing/properties" className="inline-flex items-center gap-1.5 text-caption text-foreground-muted hover:text-primary mb-1">
              <ArrowLeft className="h-3 w-3" /> Back to properties
            </Link>
            <h1 className="font-heading text-heading-md font-bold text-primary flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gold" />
              {mode === 'edit' ? 'Edit property' : 'New property'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'edit' && initial?.deleted_at && (
              <button
                type="button"
                onClick={handleRestore}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-4 py-2 text-body-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
              >
                Restore
              </button>
            )}
            {mode === 'edit' && !initial?.deleted_at && (
              <button
                type="button"
                onClick={handleSoftDelete}
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
              <Save className="h-4 w-4" /> {mode === 'edit' ? 'Save changes' : 'Create property'}
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
          <Field label="Name *">
            <input type="text" className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder='e.g. "8000 Fair Oaks Pkwy" or "Lakewood Plaza Refi"' required />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Type">
              <select value={propertyType} onChange={e => setPropertyType(e.target.value as PropertyType)} className={inputCls}>
                {PROPERTY_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={e => setStatus(e.target.value as PropertyStatus)} className={inputCls}>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-6 space-y-5">
          <h2 className="font-heading text-body font-bold text-primary">Location</h2>
          <Field label="Address">
            <input type="text" className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="Street" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="City">
              <input type="text" className={inputCls} value={city} onChange={e => setCity(e.target.value)} />
            </Field>
            <Field label="State">
              <input type="text" className={inputCls} value={state} onChange={e => setState(e.target.value)} maxLength={2} />
            </Field>
            <Field label="ZIP">
              <input type="text" className={inputCls} value={zip} onChange={e => setZip(e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-6 space-y-5">
          <Field label="Internal notes">
            <textarea className={inputCls} rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything operators should remember about this property — lender, partner shares, important dates" />
          </Field>
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
