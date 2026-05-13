'use client';

/**
 * /admin/invoices/settings — edit the default email template.
 *
 * One row in `invoice_settings` (id=1) holds the global defaults. The
 * Compose modal on each invoice loads these defaults, substitutes
 * {{variables}} against the specific invoice, and lets the admin tweak
 * before sending. Editing the defaults here changes the starting point
 * for every future send.
 *
 * Variable chips at the right insert tokens at the active cursor position
 * so admins don't have to remember the exact `{{...}}` syntax.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, RotateCw, Mail, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FALLBACK_TEMPLATE, TEMPLATE_VARIABLES } from '@/lib/invoice-email';

export default function InvoiceSettingsPage() {
  const [subject, setSubject] = useState(FALLBACK_TEMPLATE.default_subject);
  const [message, setMessage] = useState(FALLBACK_TEMPLATE.default_message);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const subjectRef = useRef<HTMLInputElement | null>(null);
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  // Track which field was last focused so the chip buttons know where to
  // insert — last-focus wins, defaults to message.
  const [activeField, setActiveField] = useState<'subject' | 'message'>('message');

  // Load the row on mount. If the table doesn't exist or has no row yet,
  // we just stay on FALLBACK_TEMPLATE and surface a hint to run the migration.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('default_subject, default_message')
        .eq('id', 1)
        .single();
      if (cancelled) return;
      if (!error && data) {
        setSubject(data.default_subject);
        setMessage(data.default_message);
      } else if (error?.message?.includes('does not exist')) {
        setError('Run migration 0011_invoice_settings.sql in the Supabase SQL editor first. Until then, the hard-coded fallback template will be used when sending invoices.');
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  function insertToken(token: string) {
    if (activeField === 'subject') {
      const el = subjectRef.current;
      if (!el) return;
      const start = el.selectionStart ?? subject.length;
      const end = el.selectionEnd ?? subject.length;
      const next = subject.slice(0, start) + token + subject.slice(end);
      setSubject(next);
      // Restore caret after the inserted token
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
    } else {
      const el = messageRef.current;
      if (!el) return;
      const start = el.selectionStart ?? message.length;
      const end = el.selectionEnd ?? message.length;
      const next = message.slice(0, start) + token + message.slice(end);
      setMessage(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
    }
  }

  function resetToDefaults() {
    setSubject(FALLBACK_TEMPLATE.default_subject);
    setMessage(FALLBACK_TEMPLATE.default_message);
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error } = await supabase
      .from('invoice_settings')
      .upsert({ id: 1, default_subject: subject, default_message: message });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin/invoices" className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Invoices
            </Link>
            <span className="text-foreground-muted">/</span>
            <h1 className="font-heading text-heading-md font-bold text-primary flex items-center gap-2">
              <Mail className="h-5 w-5 text-gold" /> Email template
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetToDefaults}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-primary"
            >
              <RotateCw className="h-4 w-4" /> Reset to default
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save template'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-body-sm text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /> <div>{error}</div>
          </div>
        )}
        {saved && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-body-sm text-green-800">
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" /> <div>Template saved. Future invoice sends will use this.</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <section className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-white p-6 space-y-5">
              <div>
                <h2 className="font-heading text-body font-bold text-primary mb-1">Default subject line</h2>
                <p className="text-caption text-foreground-muted mb-3">Appears in the recipient's inbox preview.</p>
                <input
                  ref={subjectRef}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold font-mono"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  onFocus={() => setActiveField('subject')}
                  placeholder="Invoice {{invoice_number}} from CRECO — {{total}}"
                />
              </div>

              <div>
                <h2 className="font-heading text-body font-bold text-primary mb-1">Default message</h2>
                <p className="text-caption text-foreground-muted mb-3">
                  The personal-message body at the top of every invoice email. Auto-formatted with line breaks preserved.
                </p>
                <textarea
                  ref={messageRef}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold font-mono"
                  rows={10}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onFocus={() => setActiveField('message')}
                  placeholder="Hi {{first_name}},..."
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="font-heading text-body font-bold text-primary mb-1">What still gets added automatically</h2>
              <p className="text-caption text-foreground-muted mb-3">
                After your message, every invoice email includes:
              </p>
              <ul className="space-y-2 text-body-sm text-foreground-muted">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" /> A summary table (Invoice #, Amount, Due date)</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" /> A gold "Pay online →" button when the invoice has a Stripe payment link</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" /> Mailing address for paper-check payments</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" /> Sign-off, phone, and TREC #</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" /> The invoice itself as a branded PDF attachment</li>
              </ul>
            </div>
          </section>

          {/* Variables sidebar */}
          <aside className="space-y-6">
            <div className="rounded-xl border border-border bg-white p-5 sticky top-6">
              <h3 className="font-heading text-body font-bold text-primary mb-1">Variables</h3>
              <p className="text-caption text-foreground-muted mb-4">
                Click to insert at the cursor. Each token gets replaced with the matching invoice data when an email is sent.
              </p>
              <div className="space-y-2">
                {TEMPLATE_VARIABLES.map(v => (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => insertToken(v.token)}
                    className="w-full text-left rounded-lg border border-border bg-white hover:border-gold hover:bg-gold/5 p-2.5 transition-colors"
                  >
                    <div className="font-mono text-caption text-gold-dark font-semibold">{v.token}</div>
                    <div className="text-caption text-foreground-muted mt-0.5">{v.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
