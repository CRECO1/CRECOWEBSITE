'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

type Tab = 'listings' | 'sold' | 'agents' | 'submarkets' | 'testimonials' | 'leads' | 'settings' | 'landing_pages';

// Predefined property type options. Custom types can be added via the
// "+ Add custom type…" item in the dropdown — they're saved as plain strings.
const PROPERTY_TYPE_OPTIONS = [
  { value: 'office',       label: 'Office' },
  { value: 'warehouse',    label: 'Warehouse / Industrial' },
  { value: 'flex',         label: 'Flex' },
  { value: 'retail',       label: 'Retail' },
  { value: 'land',         label: 'Land' },
  { value: 'multifamily',  label: 'Multifamily' },
  { value: 'mixed-use',    label: 'Mixed-Use' },
  { value: 'industrial',   label: 'Industrial' },
];

const TRANSACTION_TYPE_OPTIONS = [
  { value: 'lease', label: 'For Lease' },
  { value: 'sale',  label: 'For Sale' },
  { value: 'both',  label: 'Lease or Sale' },
];

// ─── Image Upload Button ──────────────────────────────────────────────────────
function ImageUpload({
  value,
  onChange,
  label = 'Image',
}: {
  value: string | null;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="preview" className="h-16 w-16 rounded-lg object-cover border border-gray-200" />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed border-gray-300 text-xs">
            No img
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : value ? 'Change Photo' : 'Upload Photo'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')}
              className="text-xs text-red-500 hover:underline text-left">
              Remove
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
    </div>
  );
}

// ─── Type Select (with custom-add) ────────────────────────────────────────────
// Used for property_type and transaction_type fields on listings. Renders a
// <select> with predefined options merged with any unique values already in
// the data (so once you save a custom type, it's reusable for the next
// listing). Choosing "+ Add custom type…" swaps in a text input.
function TypeSelect({
  label,
  value,
  options,
  knownValues = [],
  onChange,
  placeholder = 'Choose…',
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  knownValues?: string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  // Merge predefined + already-saved values, dedupe, preserve predefined order
  const knownExtras = knownValues
    .filter(v => v && !options.some(o => o.value === v))
    .map(v => ({ value: v, label: v.replace(/^\w/, c => c.toUpperCase()) }));
  const allOptions = [...options, ...knownExtras];

  const isCustom = !!value && !allOptions.some(o => o.value === value);
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState('');

  // Custom mode UI (text input + cancel)
  if (adding || isCustom) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 capitalize">{label}</label>
        <div className="flex gap-2">
          <input
            type="text"
            autoFocus={adding}
            value={adding ? custom : value}
            onChange={e => {
              if (adding) setCustom(e.target.value);
              else onChange(e.target.value);
            }}
            onBlur={() => {
              if (adding) {
                const v = custom.trim().toLowerCase().replace(/\s+/g, '-');
                if (v) onChange(v);
                setAdding(false);
                setCustom('');
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
              } else if (e.key === 'Escape') {
                setAdding(false);
                setCustom('');
              }
            }}
            placeholder="e.g. self-storage, data-center"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            type="button"
            onClick={() => { setAdding(false); setCustom(''); onChange(''); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"
          >
            Use list
          </button>
        </div>
        {isCustom && !adding && (
          <p className="mt-1 text-xs text-gray-400">Custom value — saved as <code className="bg-gray-100 px-1 py-0.5 rounded">{value}</code></p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600 capitalize">{label}</label>
      <select
        value={value ?? ''}
        onChange={e => {
          if (e.target.value === '__custom__') {
            setAdding(true);
          } else {
            onChange(e.target.value);
          }
        }}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
      >
        <option value="">{placeholder}</option>
        {allOptions.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
        <option value="__custom__">+ Add custom type…</option>
      </select>
    </div>
  );
}

// ─── Multi-Image Upload ───────────────────────────────────────────────────────
// For listings (and sold) which have an `images` text[] column. Lets the user
// add multiple photos, remove individual ones, and reorder by drag.
function MultiImageUpload({
  value,
  onChange,
  label = 'Property Photos',
}: {
  value: string[] | null | undefined;
  onChange: (urls: string[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const items = Array.isArray(value) ? value : [];

  async function handleFiles(files: FileList) {
    const arr = Array.from(files);
    setUploading(true);
    setProgress({ done: 0, total: arr.length });

    const newUrls: string[] = [];
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
      if (error) {
        alert(`Upload failed for ${file.name}: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from('images').getPublicUrl(path);
      newUrls.push(data.publicUrl);
      setProgress({ done: i + 1, total: arr.length });
    }
    setUploading(false);
    onChange([...items, ...newUrls]);
  }

  function removeAt(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  return (
    <div className="sm:col-span-2">
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <p className="mb-3 text-xs text-gray-400">
        First photo becomes the cover image on listing cards. Hover or tap a photo to reorder or remove.
      </p>

      {items.length > 0 && (
        <div className="mb-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {items.map((url, i) => (
            <div key={url + i} className="relative group rounded-lg border border-gray-200 overflow-hidden aspect-square bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${i + 1}`} className="absolute inset-0 h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 rounded bg-yellow-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">COVER</span>
              )}
              <div className="absolute inset-0 flex items-end justify-between bg-black/0 group-hover:bg-black/40 transition-colors p-1">
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => moveItem(i, i - 1)} disabled={i === 0}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-xs hover:bg-white disabled:opacity-40" aria-label="Move left">←</button>
                  <button type="button" onClick={() => moveItem(i, i + 1)} disabled={i === items.length - 1}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-xs hover:bg-white disabled:opacity-40" aria-label="Move right">→</button>
                </div>
                <button type="button" onClick={() => removeAt(i)}
                  className="rounded bg-red-600/90 px-1.5 py-0.5 text-xs font-medium text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-yellow-500 hover:text-yellow-700 disabled:opacity-60"
        >
          {uploading
            ? `Uploading… ${progress.done} / ${progress.total}`
            : items.length === 0 ? '+ Add Photos' : '+ Add More Photos'}
        </button>
        {items.length > 0 && (
          <span className="text-xs text-gray-500">{items.length} photo{items.length === 1 ? '' : 's'}</span>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files); }} />
    </div>
  );
}

// ─── Tag Editor ───────────────────────────────────────────────────────────────
function TagEditor({ label = 'Specialties', value, onChange }: { label?: string; value: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  function addTag() {
    const tag = input.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput('');
  }

  return (
    <div className="sm:col-span-2">
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-yellow-100 border border-yellow-300 px-3 py-1 text-xs font-medium text-yellow-800">
            {tag}
            <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} className="ml-1 text-yellow-600 hover:text-red-500 font-bold leading-none">×</button>
          </span>
        ))}
        {value.length === 0 && <span className="text-xs text-gray-400 italic">No tags yet</span>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="Type a specialty and press Enter or Add"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <button type="button" onClick={addTag} className="rounded-lg bg-yellow-600 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-700">Add</button>
      </div>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: (s: Session) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.session) onLogin(data.session);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <p className="text-2xl font-bold text-gray-900">CRE<span className="text-yellow-600">CO</span></p>
          <p className="mt-1 text-sm text-gray-500">Admin Portal</p>
        </div>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-yellow-600 py-2 text-sm font-semibold text-white hover:bg-yellow-700 disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Site Settings Tab ────────────────────────────────────────────────────────
function SettingsTab() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('*').eq('id', 1).single()
      .then(({ data }) => { if (data) setSettings(data); });
  }, []);

  async function handleSave() {
    setSaving(true);
    const { updated_at, ...fields } = settings;
    await supabase.from('site_settings').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', 1);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!settings) return <div className="py-20 text-center text-gray-400">Loading…</div>;

  const sections = [
    {
      title: '🖼️ Hero Section',
      fields: [
        { key: 'hero_headline', label: 'Main Headline', type: 'text' },
        { key: 'hero_subheadline', label: 'Sub-headline', type: 'textarea' },
        { key: 'hero_image_url', label: 'Hero Background Photo', type: 'image' },
      ],
    },
    {
      title: '📊 Stats Bar',
      fields: [
        { key: 'stat_homes_sold', label: 'Homes Sold', type: 'number' },
        { key: 'stat_years_experience', label: 'Years Experience', type: 'number' },
        { key: 'stat_satisfaction', label: 'Client Satisfaction (e.g. 98%)', type: 'text' },
        { key: 'stat_avg_days', label: 'Avg Days on Market', type: 'number' },
      ],
    },
    {
      title: '💬 About / Why Us Section',
      fields: [
        { key: 'about_headline', label: 'Section Headline', type: 'text' },
        { key: 'about_text', label: 'Section Text', type: 'textarea' },
      ],
    },
    {
      title: '📣 Quiz CTA Banner',
      fields: [
        { key: 'cta_headline', label: 'CTA Headline', type: 'text' },
        { key: 'cta_subheadline', label: 'CTA Sub-headline', type: 'text' },
      ],
    },
    {
      title: '📞 Contact Info',
      fields: [
        { key: 'phone', label: 'Phone Number', type: 'text' },
        { key: 'email', label: 'Email Address', type: 'text' },
        { key: 'address', label: 'Office Address', type: 'text' },
        { key: 'office_hours', label: 'Office Hours', type: 'text' },
      ],
    },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      {sections.map(section => (
        <div key={section.title} className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-5 text-base font-semibold text-gray-800">{section.title}</h2>
          <div className="space-y-5">
            {section.fields.map(field => (
              <div key={field.key}>
                {field.type === 'image' ? (
                  <ImageUpload
                    label={field.label}
                    value={settings[field.key] ?? ''}
                    onChange={url => setSettings({ ...settings, [field.key]: url })}
                  />
                ) : field.type === 'textarea' ? (
                  <>
                    <label className="mb-1 block text-xs font-medium text-gray-600">{field.label}</label>
                    <textarea rows={3} value={settings[field.key] ?? ''}
                      onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                  </>
                ) : (
                  <>
                    <label className="mb-1 block text-xs font-medium text-gray-600">{field.label}</label>
                    <input type={field.type} value={settings[field.key] ?? ''}
                      onChange={e => setSettings({ ...settings, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 pb-8">
        <button onClick={handleSave} disabled={saving}
          className="rounded-lg bg-yellow-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-yellow-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
        {saved && <span className="text-sm font-medium text-green-600">✓ Saved! Changes live on the website.</span>}
      </div>
    </div>
  );
}

// ─── Landing Pages Tab ────────────────────────────────────────────────────────
// Edits the `landing_pages` table — admin-controlled SEO copy for the
// 4 Texas keyword landing pages and /owner-services. Changes hit production
// immediately on next request (pages are force-dynamic).

interface LandingPageRow {
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  eyebrow: string | null;
  h1: string | null;
  subhead: string | null;
  intro_paragraphs: string[];
  market_bullets: { title: string; body: string }[];
  why_bullets: string[];
  faqs: { q: string; a: string }[];
  updated_at: string;
}

function StringListEditor({ label, helper, value, onChange }: { label: string; helper?: string; value: string[]; onChange: (v: string[]) => void }) {
  const [items, setItems] = useState<string[]>(value ?? []);
  useEffect(() => { setItems(value ?? []); }, [value]);
  function commit(next: string[]) { setItems(next); onChange(next); }
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      {helper && <p className="mb-2 text-xs text-gray-400">{helper}</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <textarea rows={2} value={item}
              onChange={e => { const next = [...items]; next[i] = e.target.value; commit(next); }}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            <button type="button" onClick={() => commit(items.filter((_, j) => j !== i))}
              className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => commit([...items, ''])}
          className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:border-yellow-500 hover:text-yellow-700">+ Add item</button>
      </div>
    </div>
  );
}

function MarketBulletsEditor({ value, onChange }: { value: { title: string; body: string }[]; onChange: (v: { title: string; body: string }[]) => void }) {
  const [items, setItems] = useState(value ?? []);
  useEffect(() => { setItems(value ?? []); }, [value]);
  function commit(next: { title: string; body: string }[]) { setItems(next); onChange(next); }
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">Market Context Cards</label>
      <p className="mb-2 text-xs text-gray-400">3 cards explaining why this Texas market matters. Each has a short title and a longer body paragraph.</p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Card {i + 1}</span>
              <button type="button" onClick={() => commit(items.filter((_, j) => j !== i))}
                className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs text-red-700 hover:bg-red-50">Remove</button>
            </div>
            <input type="text" placeholder="Card title…" value={item.title}
              onChange={e => { const next = [...items]; next[i] = { ...item, title: e.target.value }; commit(next); }}
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            <textarea rows={3} placeholder="Card body…" value={item.body}
              onChange={e => { const next = [...items]; next[i] = { ...item, body: e.target.value }; commit(next); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
        ))}
        <button type="button" onClick={() => commit([...items, { title: '', body: '' }])}
          className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:border-yellow-500 hover:text-yellow-700">+ Add card</button>
      </div>
    </div>
  );
}

function FAQEditor({ value, onChange }: { value: { q: string; a: string }[]; onChange: (v: { q: string; a: string }[]) => void }) {
  const [items, setItems] = useState(value ?? []);
  useEffect(() => { setItems(value ?? []); }, [value]);
  function commit(next: { q: string; a: string }[]) { setItems(next); onChange(next); }
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">FAQs</label>
      <p className="mb-2 text-xs text-gray-400">Each FAQ becomes part of the page&apos;s FAQ schema (Google &quot;People Also Ask&quot; rich result eligibility).</p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">FAQ {i + 1}</span>
              <button type="button" onClick={() => commit(items.filter((_, j) => j !== i))}
                className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs text-red-700 hover:bg-red-50">Remove</button>
            </div>
            <input type="text" placeholder="Question…" value={item.q}
              onChange={e => { const next = [...items]; next[i] = { ...item, q: e.target.value }; commit(next); }}
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            <textarea rows={4} placeholder="Answer…" value={item.a}
              onChange={e => { const next = [...items]; next[i] = { ...item, a: e.target.value }; commit(next); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
        ))}
        <button type="button" onClick={() => commit([...items, { q: '', a: '' }])}
          className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:border-yellow-500 hover:text-yellow-700">+ Add FAQ</button>
      </div>
    </div>
  );
}

function LandingPagesTab() {
  const [pages, setPages] = useState<LandingPageRow[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<LandingPageRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('landing_pages').select('*').order('slug')
      .then(({ data }) => {
        if (data) {
          setPages(data as LandingPageRow[]);
          if (!activeSlug && data.length > 0) {
            setActiveSlug(data[0].slug);
            setDraft(data[0] as LandingPageRow);
          }
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectPage(slug: string) {
    setActiveSlug(slug);
    const p = pages.find(x => x.slug === slug);
    if (p) setDraft({ ...p });
    setSaved(false);
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    const { updated_at, ...fields } = draft;
    await supabase.from('landing_pages').update({ ...fields, updated_at: new Date().toISOString() }).eq('slug', draft.slug);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    // Refresh local list cache
    setPages(prev => prev.map(p => p.slug === draft.slug ? { ...draft } : p));
  }

  if (!draft || pages.length === 0) {
    return <div className="py-20 text-center text-gray-400">Loading landing pages…</div>;
  }

  const livePath = '/' + draft.slug;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      {/* Sidebar — page picker */}
      <aside className="space-y-1">
        <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Landing Pages</h2>
        {pages.map(p => (
          <button key={p.slug} onClick={() => selectPage(p.slug)}
            className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
              activeSlug === p.slug ? 'bg-yellow-100 text-yellow-900 font-semibold' : 'text-gray-700 hover:bg-gray-100'
            }`}>
            <div>{p.title}</div>
            <div className="text-xs text-gray-400 truncate">/{p.slug}</div>
          </button>
        ))}
      </aside>

      {/* Editor */}
      <div className="max-w-3xl space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{draft.title}</h2>
              <a href={livePath} target="_blank" rel="noopener noreferrer" className="text-xs text-yellow-700 hover:underline">View live page → {livePath}</a>
            </div>
          </div>

          <div className="space-y-5">
            {/* SEO meta */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">SEO Title (browser tab + Google result)</label>
              <input type="text" value={draft.meta_title ?? ''}
                onChange={e => setDraft({ ...draft, meta_title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">SEO Meta Description (Google search result snippet — keep under 160 chars)</label>
              <textarea rows={3} value={draft.meta_description ?? ''}
                onChange={e => setDraft({ ...draft, meta_description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>

            {/* Hero */}
            <div className="border-t border-gray-100 pt-5">
              <label className="mb-1 block text-xs font-medium text-gray-600">Hero Eyebrow (small text above headline)</label>
              <input type="text" value={draft.eyebrow ?? ''}
                onChange={e => setDraft({ ...draft, eyebrow: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Hero Headline (H1)</label>
              <input type="text" value={draft.h1 ?? ''}
                onChange={e => setDraft({ ...draft, h1: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Hero Subheadline</label>
              <textarea rows={4} value={draft.subhead ?? ''}
                onChange={e => setDraft({ ...draft, subhead: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>

            {/* Owner-services-style intro paragraphs */}
            {(draft.slug === 'owner-services' || (draft.intro_paragraphs && draft.intro_paragraphs.length > 0)) && (
              <div className="border-t border-gray-100 pt-5">
                <StringListEditor
                  label="Intro Paragraphs"
                  helper="Multi-paragraph intro section (used on /owner-services). Each entry renders as one paragraph."
                  value={draft.intro_paragraphs ?? []}
                  onChange={v => setDraft({ ...draft, intro_paragraphs: v })}
                />
              </div>
            )}

            {/* Property-landing-style market bullets */}
            {draft.slug !== 'owner-services' && (
              <div className="border-t border-gray-100 pt-5">
                <MarketBulletsEditor
                  value={draft.market_bullets ?? []}
                  onChange={v => setDraft({ ...draft, market_bullets: v })}
                />
              </div>
            )}

            {/* Why bullets */}
            <div className="border-t border-gray-100 pt-5">
              <StringListEditor
                label="Why CRECO bullets"
                helper="Bullet list shown in the 'Why CRECO' / 'What you get with CRECO' section."
                value={draft.why_bullets ?? []}
                onChange={v => setDraft({ ...draft, why_bullets: v })}
              />
            </div>

            {/* FAQs */}
            <div className="border-t border-gray-100 pt-5">
              <FAQEditor
                value={draft.faqs ?? []}
                onChange={v => setDraft({ ...draft, faqs: v })}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pb-8">
          <button onClick={handleSave} disabled={saving}
            className="rounded-lg bg-yellow-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-yellow-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm font-medium text-green-600">✓ Saved! Changes live at {livePath}.</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────
function DataTable({ tab }: { tab: Exclude<Tab, 'settings' | 'landing_pages'> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const tableMap: Record<string, string> = {
    listings: 'listings', sold: 'listings', agents: 'agents', submarkets: 'submarkets',
    testimonials: 'testimonials', leads: 'leads',
  };
  const table = tableMap[tab];

  // Blank templates so "Add" forms always show the right fields
  const blankTemplates: Record<string, object> = {
    agents: { name: '', title: '', email: '', phone: '', bio: '', image_url: '', license_number: '', years_experience: 0, featured: false, order: 0, specialties: [] },
    // Commercial listing schema (matches public.listings columns)
    listings: {
      title: '', slug: '', address: '', city: 'San Antonio', state: 'TX', zip: '', submarket: '',
      property_type: 'office', transaction_type: 'lease',
      sale_price: null, lease_rate: null, lease_rate_basis: 'NNN',
      sqft: 0, available_sqft: 0, lot_size: 0, zoning: '', year_built: new Date().getFullYear(),
      clear_height: null, dock_doors: null, grade_doors: null,
      headline: '', description: '', features: [],
      images: [], brochure_url: '', virtual_tour_url: '',
      status: 'active', listing_date: new Date().toISOString().slice(0, 10),
    },
    sold: {
      title: '', slug: '', address: '', city: 'San Antonio', state: 'TX', zip: '', submarket: '',
      property_type: 'office', transaction_type: 'sale',
      sale_price: null, lease_rate: null, lease_rate_basis: null,
      sqft: 0, lot_size: 0, zoning: '', year_built: new Date().getFullYear(),
      headline: '', description: '', features: [],
      images: [],
      status: 'sold', closed_date: new Date().toISOString().slice(0, 10),
    },
    submarkets: {
      name: '', slug: '', description: '', image_url: '',
      highlights: [], zip_codes: [], featured: false, order: 99,
    },
    testimonials: { client_name: '', client_location: '', quote: '', rating: 5, image_url: '', featured: false },
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    let query = supabase.from(table).select('*').order('created_at', { ascending: false });
    // Sold tab only shows sold listings; listings tab excludes sold
    if (tab === 'sold') query = query.eq('status', 'sold');
    if (tab === 'listings') query = query.in('status', ['active', 'pending', 'withdrawn']);
    const { data, error } = await query;
    if (error) setError(error.message);
    else setRows(data ?? []);
    setLoading(false);
  }, [table, tab]);

  useEffect(() => { load(); }, [load]);

  // Image field configuration per table:
  //  - listings/sold use the `images` text[] column (multi-photo)
  //  - everything else uses a single `image_url` column
  const imageFields: Record<string, { field: string; multi: boolean }> = {
    agents:        { field: 'image_url', multi: false },
    submarkets:    { field: 'image_url', multi: false },
    testimonials:  { field: 'image_url', multi: false },
    listings:      { field: 'images',    multi: true  },
    sold:          { field: 'images',    multi: true  },
  };
  const imageConfig = imageFields[tab];
  const imageField = imageConfig?.field;

  async function handleSave() {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, search_vector, ...fields } = editing;

    // Defensive: strip legacy field names that may linger in component state
    // from a stale tab. Listings/sold use the `images` text[] column — older
    // code wrote `image_url`, which Postgres rejects with a schema-cache error.
    if (table === 'listings') {
      delete (fields as { image_url?: string }).image_url;
      // Also strip residential-only fields that may exist on rows imported from
      // the original Fair Oaks codebase
      const stale = ['bedrooms', 'bathrooms', 'mls_number', 'sold_price', 'days_on_market'];
      for (const k of stale) delete (fields as Record<string, unknown>)[k];
    }

    if (id && rows.find(r => r.id === id)) {
      const { error } = await supabase.from(table).update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from(table).insert([fields]);
      if (error) alert(error.message);
    }
    setSaving(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this record?')) return;
    setDeleting(id);
    await supabase.from(table).delete().eq('id', id);
    setDeleting(null);
    load();
  }

  const columnOrder: Record<string, string[]> = {
    listings: ['title', 'property_type', 'transaction_type', 'city', 'submarket', 'sqft', 'status'],
    sold: ['title', 'property_type', 'sale_price', 'closed_date', 'address', 'city', 'sqft'],
    agents: ['name', 'title', 'email', 'phone', 'featured'],
    submarkets: ['name', 'featured', 'order'],
    testimonials: ['client_name', 'rating', 'quote', 'featured'],
    leads: ['name', 'email', 'phone', 'source', 'created_at'],
  };
  const cols = columnOrder[tab] ?? [];

  // Fields to hide from the edit modal
  const hiddenFields = new Set(['id', 'created_at', 'updated_at', 'search_vector']);
  const textareaFields = new Set(['description', 'bio', 'quote', 'message']);
  const booleanFields = new Set(['featured']);
  const statusField = 'status';

  if (loading) return <div className="py-20 text-center text-gray-400">Loading…</div>;
  if (error) return <div className="py-20 text-center text-red-500">{error}</div>;

  return (
    <div>
      {tab !== 'leads' && (
        <div className="mb-4 flex justify-end">
          <button onClick={() => setEditing(blankTemplates[tab] ?? {})}
            className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700">
            + Add {tab.slice(0, -1)}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {cols.map(c => (
                <th key={c} className="px-4 py-3 text-left font-semibold text-gray-600 capitalize">
                  {c.replace(/_/g, ' ')}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.length === 0 && (
              <tr><td colSpan={cols.length + 1} className="py-12 text-center text-gray-400">No records yet</td></tr>
            )}
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {cols.map(c => (
                  <td key={c} className="max-w-[200px] truncate px-4 py-3 text-gray-700">
                    {c === 'featured' ? (row[c] ? '✅' : '—') :
                      c === 'rating' ? '⭐'.repeat(row[c] ?? 0) :
                      c === 'sale_price' || c === 'price' || c === 'avg_price' ? (row[c] ? `$${Number(row[c]).toLocaleString()}` : '—') :
                      c === 'lease_rate' ? (row[c] ? `$${Number(row[c]).toFixed(2)}/SF` : '—') :
                      c === 'sqft' ? (row[c] ? `${Number(row[c]).toLocaleString()} SF` : '—') :
                      String(row[c] ?? '—')}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {tab !== 'leads' && (
                      <button onClick={() => setEditing({ ...row })}
                        className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium hover:bg-gray-200">
                        Edit
                      </button>
                    )}
                    <button onClick={() => handleDelete(row.id)} disabled={deleting === row.id}
                      className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
                      {deleting === row.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-gray-900 capitalize">
              {editing.id ? `Edit ${tab.slice(0, -1)}` : `New ${tab.slice(0, -1)}`}
            </h2>

            <div className="space-y-4">
              {/* Image upload — multi for listings/sold, single for the rest */}
              {imageField && (
                imageConfig.multi ? (
                  <MultiImageUpload
                    label="Property Photos"
                    value={Array.isArray(editing[imageField]) ? editing[imageField] : []}
                    onChange={urls => setEditing({ ...editing, [imageField]: urls })}
                  />
                ) : (
                  <ImageUpload
                    label="Profile / Cover Photo"
                    value={editing[imageField] ?? ''}
                    onChange={url => setEditing({ ...editing, [imageField]: url })}
                  />
                )
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Tag editors for array fields */}
                {tab === 'agents' && (
                  <TagEditor
                    label="Specialties"
                    value={Array.isArray(editing.specialties) ? editing.specialties : []}
                    onChange={tags => setEditing({ ...editing, specialties: tags })}
                  />
                )}
                {(tab === 'listings' || tab === 'sold') && (
                  <TagEditor
                    label="Features"
                    value={Array.isArray(editing.features) ? editing.features : []}
                    onChange={tags => setEditing({ ...editing, features: tags })}
                  />
                )}
                {tab === 'submarkets' && (
                  <TagEditor
                    label="Highlights"
                    value={Array.isArray(editing.highlights) ? editing.highlights : []}
                    onChange={tags => setEditing({ ...editing, highlights: tags })}
                  />
                )}

                {Object.keys(editing)
                  .filter(k => !hiddenFields.has(k) && k !== imageField && k !== 'images' && k !== 'features' && k !== 'highlights' && k !== 'specialties')
                  .map(field => (
                    <div key={field} className={textareaFields.has(field) || field === 'property_type' || field === 'transaction_type' ? 'sm:col-span-2' : ''}>
                      {field !== 'property_type' && field !== 'transaction_type' && (
                        <label className="mb-1 block text-xs font-medium text-gray-600 capitalize">
                          {field.replace(/_/g, ' ')}
                        </label>
                      )}
                      {field === 'property_type' ? (
                        <TypeSelect
                          label="Property Type"
                          value={editing[field] ?? ''}
                          options={PROPERTY_TYPE_OPTIONS}
                          knownValues={Array.from(new Set(rows.map(r => r.property_type).filter(Boolean)))}
                          onChange={v => setEditing({ ...editing, [field]: v })}
                          placeholder="Choose a property type…"
                        />
                      ) : field === 'transaction_type' ? (
                        <TypeSelect
                          label="Transaction Type"
                          value={editing[field] ?? ''}
                          options={TRANSACTION_TYPE_OPTIONS}
                          knownValues={Array.from(new Set(rows.map(r => r.transaction_type).filter(Boolean)))}
                          onChange={v => setEditing({ ...editing, [field]: v })}
                          placeholder="Choose a transaction type…"
                        />
                      ) : textareaFields.has(field) ? (
                        <textarea rows={4} value={editing[field] ?? ''}
                          onChange={e => setEditing({ ...editing, [field]: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                      ) : booleanFields.has(field) ? (
                        <select value={editing[field] ? 'true' : 'false'}
                          onChange={e => setEditing({ ...editing, [field]: e.target.value === 'true' })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500">
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      ) : field === statusField ? (
                        <select value={editing[field] ?? 'active'}
                          onChange={e => setEditing({ ...editing, [field]: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500">
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="sold">Sold</option>
                          <option value="leased">Leased</option>
                          <option value="off-market">Off Market</option>
                        </select>
                      ) : (
                        <input
                          type={typeof editing[field] === 'number' ? 'number' : 'text'}
                          value={editing[field] ?? ''}
                          onChange={e => {
                            const val = typeof editing[field] === 'number' ? Number(e.target.value) : e.target.value;
                            const updates: Record<string, unknown> = { [field]: val };
                            // Auto-generate slug from title or name
                            if ((field === 'title' || field === 'name') && !editing.id) {
                              updates.slug = String(val).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                            }
                            setEditing({ ...editing, ...updates });
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('settings');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent" />
    </div>
  );

  if (!session) return <LoginForm onLogin={setSession} />;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'settings', label: '⚙️ Homepage' },
    { key: 'landing_pages', label: '📄 Landing Pages' },
    { key: 'listings', label: '🏠 Listings' },
    { key: 'sold', label: '✅ Sold' },
    { key: 'agents', label: '👥 Agents' },
    { key: 'submarkets', label: '🏙️ Submarkets' },
    { key: 'testimonials', label: '⭐ Testimonials' },
    { key: 'leads', label: '📬 Leads' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <span className="text-xl font-bold text-gray-900">CRE<span className="text-yellow-600">CO</span></span>
            <span className="ml-2 text-sm text-gray-400">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" target="_blank" className="text-sm text-gray-500 hover:text-gray-700">← View Site</a>
            <button onClick={handleSignOut}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">Sign Out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Tab bar */}
        <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-sm border border-gray-200 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-yellow-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'settings' ? (
          <SettingsTab />
        ) : tab === 'landing_pages' ? (
          <LandingPagesTab />
        ) : (
          <DataTable key={tab} tab={tab as Exclude<Tab, 'settings' | 'landing_pages'>} />
        )}
      </div>
    </div>
  );
}
