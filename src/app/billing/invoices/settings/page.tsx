'use client';

/**
 * /billing/invoices/settings — edit the default email template.
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
import { ArrowLeft, Save, RotateCw, Mail, AlertTriangle, CheckCircle, AlertOctagon, FileText, Upload, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FALLBACK_TEMPLATE, TEMPLATE_VARIABLES } from '@/lib/invoice-email';
import { REMINDER_STAGES } from '@/lib/invoice-reminders';
import type { LateFeeSettings } from '@/lib/invoices';
import { getW9DisplayUrl, removeW9File, uploadW9File } from '@/lib/w9';
import { useWorkspaceOrThrow } from '@/components/billing/WorkspaceProvider';

const DEFAULT_LATE_FEE: LateFeeSettings = {
  late_fee_enabled: false,
  late_fee_type: 'percent',
  late_fee_amount: 0.05,    // 5%
  late_fee_days: 30,
  late_fee_recurring: false,
};

export default function InvoiceSettingsPage() {
  // Multi-tenancy: invoice_settings is per-workspace. Today it's still
  // a singleton (id=1, CRECO's row); the schema gets refactored to one
  // row per workspace in a follow-up migration before customer #2
  // onboards. The upsert below already stamps workspace_id.
  const workspace = useWorkspaceOrThrow();
  const [subject, setSubject] = useState(FALLBACK_TEMPLATE.default_subject);
  const [message, setMessage] = useState(FALLBACK_TEMPLATE.default_message);
  const [lateFee, setLateFee] = useState<LateFeeSettings>(DEFAULT_LATE_FEE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // W-9 attachment state. Three values track the lifecycle:
  //   - w9Path / w9Filename / w9UploadedAt: what's currently saved
  //   - w9Uploading: spinner during the upload itself
  //   - w9Error: surfaces validation + upload failures (separate from
  //     the template-save error so it can be cleared independently)
  const [w9Path, setW9Path] = useState<string | null>(null);
  const [w9Filename, setW9Filename] = useState<string | null>(null);
  const [w9UploadedAt, setW9UploadedAt] = useState<string | null>(null);
  const [w9Uploading, setW9Uploading] = useState(false);
  const [w9Error, setW9Error] = useState<string | null>(null);
  const w9InputRef = useRef<HTMLInputElement | null>(null);

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
        .select('default_subject, default_message, late_fee_enabled, late_fee_type, late_fee_amount, late_fee_days, late_fee_recurring, w9_storage_path, w9_filename, w9_uploaded_at')
        .eq('workspace_id', workspace.id)
        .single();
      if (cancelled) return;
      if (!error && data) {
        setSubject(data.default_subject);
        setMessage(data.default_message);
        // Late fee fields are present only after migration 0018 has run.
        // If any are nullish, fall back to defaults.
        setLateFee({
          late_fee_enabled:   data.late_fee_enabled   ?? DEFAULT_LATE_FEE.late_fee_enabled,
          late_fee_type:      data.late_fee_type      ?? DEFAULT_LATE_FEE.late_fee_type,
          late_fee_amount:    data.late_fee_amount    != null ? Number(data.late_fee_amount) : DEFAULT_LATE_FEE.late_fee_amount,
          late_fee_days:      data.late_fee_days      ?? DEFAULT_LATE_FEE.late_fee_days,
          late_fee_recurring: data.late_fee_recurring ?? DEFAULT_LATE_FEE.late_fee_recurring,
        });
        // W-9 columns (migration 0030). Null when no W-9 uploaded yet.
        setW9Path(data.w9_storage_path ?? null);
        setW9Filename(data.w9_filename ?? null);
        setW9UploadedAt(data.w9_uploaded_at ?? null);
      } else if (error?.message?.includes('does not exist')) {
        setError('Run migration 0011_invoice_settings.sql in the Supabase SQL editor first. Until then, the hard-coded fallback template will be used when sending invoices.');
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [workspace.id]);

  // Pick a PDF, upload to storage, stamp the path on invoice_settings.
  // Replaces any previously-uploaded W-9 (deletes the old blob best-effort
  // so the bucket doesn't accumulate orphans across replacements).
  async function handleW9Upload(file: File) {
    setW9Error(null);
    setW9Uploading(true);
    try {
      const previousPath = w9Path;
      const result = await uploadW9File(file);
      if (!result.ok) {
        setW9Error(result.error);
        return;
      }
      const nowIso = new Date().toISOString();
      const { error: dbErr } = await supabase
        .from('invoice_settings')
        .update({
          w9_storage_path: result.path,
          w9_filename: result.filename,
          w9_uploaded_at: nowIso,
        })
        .eq('workspace_id', workspace.id);
      if (dbErr) {
        // DB write failed — try to remove the orphan blob so we don't
        // leak storage. State stays on the previous file.
        await removeW9File(result.path);
        setW9Error(`Could not save: ${dbErr.message}`);
        return;
      }
      setW9Path(result.path);
      setW9Filename(result.filename);
      setW9UploadedAt(nowIso);
      // Clean up the old file once the new one is the source of truth.
      if (previousPath) await removeW9File(previousPath);
    } finally {
      setW9Uploading(false);
      if (w9InputRef.current) w9InputRef.current.value = '';
    }
  }

  // Remove the W-9. Clears the DB row first (the user-visible state) and
  // then best-effort deletes the storage blob.
  async function handleW9Remove() {
    if (!w9Path) return;
    if (!confirm('Remove the W-9? Future invoice emails will go out without it.')) return;
    setW9Error(null);
    const pathToDelete = w9Path;
    const { error: dbErr } = await supabase
      .from('invoice_settings')
      .update({
        w9_storage_path: null,
        w9_filename: null,
        w9_uploaded_at: null,
      })
      .eq('workspace_id', workspace.id);
    if (dbErr) {
      setW9Error(`Could not remove: ${dbErr.message}`);
      return;
    }
    setW9Path(null);
    setW9Filename(null);
    setW9UploadedAt(null);
    await removeW9File(pathToDelete);
  }

  // Generate a fresh signed URL and open in a new tab. Don't store the
  // URL — signatures expire and stored links go stale.
  async function handleW9View() {
    if (!w9Path) return;
    const url = await getW9DisplayUrl(supabase, w9Path);
    if (!url) {
      setW9Error('Could not generate a download link. Try again in a moment.');
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

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
      .upsert({
        workspace_id: workspace.id,
        default_subject: subject,
        default_message: message,
        late_fee_enabled: lateFee.late_fee_enabled,
        late_fee_type: lateFee.late_fee_type,
        late_fee_amount: lateFee.late_fee_amount,
        late_fee_days: lateFee.late_fee_days,
        late_fee_recurring: lateFee.late_fee_recurring,
      }, { onConflict: 'workspace_id' });
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
        <div className="mx-auto max-w-6xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/billing/invoices" className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-primary">
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
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                  {w9Path
                    ? <>Your W-9 as a second PDF attachment ({w9Filename ?? 'W-9.pdf'})</>
                    : <>Your W-9 as a second PDF attachment <span className="italic text-foreground-subtle">— upload one below to enable</span></>}
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="font-heading text-body font-bold text-primary mb-1">Automated payment reminders</h2>
              <p className="text-caption text-foreground-muted mb-4">
                A daily cron job sends reminder emails on the schedule below. Each stage sends at most once per invoice. Per-invoice opt-out lives on the invoice detail page under "Payment reminders".
              </p>
              <div className="space-y-2">
                {REMINDER_STAGES.map(s => (
                  <div key={s.stage} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background-cream/40 px-3 py-2.5">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="font-mono text-caption text-gold-dark font-semibold shrink-0 mt-0.5">
                        {s.triggerDaysFromDue > 0 ? `T−${s.triggerDaysFromDue}` :
                         s.triggerDaysFromDue === 0 ? 'T+0' :
                         `T+${Math.abs(s.triggerDaysFromDue)}`}
                      </span>
                      <div className="min-w-0">
                        <div className="text-body-sm font-semibold text-primary">{s.label}</div>
                        <div className="text-caption text-foreground-muted font-mono truncate">{s.subject}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-caption text-foreground-muted">
                Reminder subjects + bodies are hard-coded today. Want to customize them? Tell me and we'll add per-stage template editing.
              </p>
            </div>

            {/* ── Email open tracking ─────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="font-heading text-body font-bold text-primary mb-1">Email open tracking</h2>
              <p className="text-caption text-foreground-muted mb-4">
                Each invoice's detail page can show when (and how many times) the client opened the email. We use Resend's built-in open tracking + a signed webhook, so events flow in automatically without per-send config.
              </p>
              <div className="space-y-3 text-body-sm">
                <p className="font-semibold text-primary">One-time setup on the Resend dashboard:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-foreground-muted leading-relaxed">
                  <li><strong className="text-primary">Domains</strong> → click <code className="bg-background-cream px-1.5 py-0.5 rounded text-caption">crecotx.com</code> → toggle <strong>Open tracking</strong> ON.</li>
                  <li><strong className="text-primary">Webhooks</strong> → <strong>Add endpoint</strong> → URL: <code className="bg-background-cream px-1.5 py-0.5 rounded text-caption break-all">https://www.crecotx.com/api/resend/webhook</code></li>
                  <li>Subscribe to: <code className="bg-background-cream px-1.5 py-0.5 rounded text-caption">email.delivered</code>, <code className="bg-background-cream px-1.5 py-0.5 rounded text-caption">email.opened</code>, <code className="bg-background-cream px-1.5 py-0.5 rounded text-caption">email.clicked</code>, <code className="bg-background-cream px-1.5 py-0.5 rounded text-caption">email.bounced</code>, <code className="bg-background-cream px-1.5 py-0.5 rounded text-caption">email.complained</code>.</li>
                  <li>Copy the <strong>signing secret</strong> (starts with <code className="bg-background-cream px-1.5 py-0.5 rounded text-caption">whsec_</code>).</li>
                  <li>In Vercel → <strong>Settings → Environment Variables</strong> → add <code className="bg-background-cream px-1.5 py-0.5 rounded text-caption">RESEND_WEBHOOK_SECRET</code> with that value → redeploy.</li>
                </ol>
                <p className="text-caption text-foreground-muted leading-relaxed">
                  <strong className="text-foreground">Privacy note:</strong> Some clients (Apple Mail with privacy protection, certain Gmail filters) block tracking images. If a client tells you they read the invoice but the dashboard says "Not opened," that's why — the data is approximate.
                </p>
              </div>
            </div>

            {/* ── W-9 attachment ─────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-white p-6">
              <div className="flex items-start gap-3 mb-4">
                <FileText className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-heading text-body font-bold text-primary">W-9 attachment</h2>
                  <p className="text-caption text-foreground-muted mt-1">
                    Upload your W-9 once and every outgoing invoice email + client portal page will include it.
                    Saves the back-and-forth with corporate AP departments that won&apos;t pay until they have one on file.
                  </p>
                </div>
              </div>

              {w9Error && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-body-sm text-amber-800 mb-4">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> <div>{w9Error}</div>
                </div>
              )}

              {w9Path ? (
                <div className="rounded-lg border border-border bg-background-cream/40 p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold-dark shrink-0">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-semibold text-primary truncate">
                        {w9Filename ?? 'W-9.pdf'}
                      </p>
                      <p className="text-caption text-foreground-muted">
                        On file
                        {w9UploadedAt
                          ? ` since ${new Date(w9UploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
                          : ''}
                        . Attached to every invoice email automatically.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleW9View}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-caption text-foreground-muted hover:text-primary hover:border-primary"
                        title="Open the current W-9 in a new tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => w9InputRef.current?.click()}
                        disabled={w9Uploading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-caption text-foreground-muted hover:text-primary hover:border-primary disabled:opacity-50"
                      >
                        <Upload className="h-3.5 w-3.5" /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleW9Remove}
                        disabled={w9Uploading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-caption text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => w9InputRef.current?.click()}
                  disabled={w9Uploading}
                  className="w-full rounded-lg border-2 border-dashed border-border bg-background-cream/40 hover:border-gold hover:bg-gold/5 p-8 text-center transition-colors disabled:opacity-50"
                >
                  <Upload className="mx-auto h-6 w-6 text-foreground-muted mb-2" />
                  <p className="text-body-sm font-semibold text-primary">
                    {w9Uploading ? 'Uploading…' : 'Upload your W-9 (PDF)'}
                  </p>
                  <p className="text-caption text-foreground-muted mt-1">
                    Drop a PDF here, or click to browse. Up to 5MB.
                  </p>
                </button>
              )}
              <input
                ref={w9InputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleW9Upload(f);
                }}
                className="hidden"
              />
            </div>

            {/* ── Auto late fees ─────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-white p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertOctagon className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-heading text-body font-bold text-primary">Automatic late fees</h2>
                  <p className="text-caption text-foreground-muted mt-1">
                    When enabled, the daily cron adds a late-fee line item to any invoice that's been past due for the specified number of days. Per-invoice opt-out lives on the invoice detail page (same "Payment reminders" toggle).
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-gold/50 mb-4">
                <input
                  type="checkbox"
                  checked={lateFee.late_fee_enabled}
                  onChange={e => setLateFee(s => ({ ...s, late_fee_enabled: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded text-gold focus:ring-gold"
                />
                <div>
                  <div className="text-body-sm font-semibold text-primary">Enable automatic late fees</div>
                  <div className="text-caption text-foreground-muted">
                    No fee is ever added if this is off, regardless of how overdue an invoice gets.
                  </div>
                </div>
              </label>

              <div className={`space-y-4 ${lateFee.late_fee_enabled ? '' : 'opacity-50 pointer-events-none'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">Fee type</span>
                    <select
                      value={lateFee.late_fee_type}
                      onChange={e => setLateFee(s => ({ ...s, late_fee_type: e.target.value as 'percent' | 'flat' }))}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
                    >
                      <option value="percent">Percent of invoice subtotal</option>
                      <option value="flat">Flat dollar amount</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">
                      {lateFee.late_fee_type === 'percent' ? 'Percentage (e.g. 0.05 = 5%)' : 'Amount (USD)'}
                    </span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                        {lateFee.late_fee_type === 'percent' ? '%' : '$'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step={lateFee.late_fee_type === 'percent' ? '0.005' : '1'}
                        max={lateFee.late_fee_type === 'percent' ? '1' : undefined}
                        value={lateFee.late_fee_amount}
                        onChange={e => setLateFee(s => ({ ...s, late_fee_amount: Number(e.target.value) }))}
                        className="w-full rounded-lg border border-border bg-white pl-7 pr-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
                      />
                    </div>
                    {lateFee.late_fee_type === 'percent' && (
                      <p className="text-caption text-foreground-muted mt-1">
                        That's {(lateFee.late_fee_amount * 100).toFixed(2)}% of the invoice subtotal each time.
                      </p>
                    )}
                  </label>
                  <label className="block">
                    <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">Days past due before first fee</span>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={lateFee.late_fee_days}
                      onChange={e => setLateFee(s => ({ ...s, late_fee_days: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
                    />
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-gold/50 self-end">
                    <input
                      type="checkbox"
                      checked={lateFee.late_fee_recurring}
                      onChange={e => setLateFee(s => ({ ...s, late_fee_recurring: e.target.checked }))}
                      className="h-4 w-4 rounded text-gold focus:ring-gold"
                    />
                    <div>
                      <div className="text-body-sm font-semibold text-primary">Recurring</div>
                      <div className="text-caption text-foreground-muted">
                        Repeat the fee every {lateFee.late_fee_days} days while still unpaid.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
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
