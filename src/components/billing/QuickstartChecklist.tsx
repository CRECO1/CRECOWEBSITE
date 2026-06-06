'use client';

/**
 * QuickstartChecklist — auto-detecting onboarding nudges for new
 * workspaces. Renders on /billing only when there's something the new
 * operator hasn't done yet that they reasonably should:
 *
 *   1. Upload your W-9
 *   2. Add your first client (or skip — auto-saves from invoice form)
 *   3. Send your first invoice
 *
 * Self-resolving — each step is "completed" the moment the underlying
 * data exists. No "mark as done" buttons; we just look at the DB.
 * Dismissable per-workspace via localStorage so an operator who
 * finished and came back doesn't see it again. The dismiss is
 * permanent for that workspace (we don't time-bomb it).
 *
 * Renders nothing when:
 *   - All steps are complete (W-9 uploaded + ≥1 client + ≥1 invoice)
 *   - Operator dismissed it
 *   - Provider isn't loaded yet
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Upload, Users, FileText, X, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/billing/WorkspaceProvider';

interface ChecklistState {
  has_w9: boolean;
  has_client: boolean;
  has_invoice: boolean;
}

function dismissKey(workspaceId: string): string {
  return `vultstack.quickstart.dismissed.${workspaceId}`;
}

export function QuickstartChecklist() {
  const { workspace } = useWorkspace();
  const [state, setState] = useState<ChecklistState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Read the workspace-scoped dismiss state once on mount.
  useEffect(() => {
    if (!workspace) return;
    try {
      const v = localStorage.getItem(dismissKey(workspace.id));
      if (v === '1') setDismissed(true);
    } catch { /* private mode — leave defaults */ }
  }, [workspace]);

  // Load the checklist state. Cheap: three count queries that RLS scopes
  // to this workspace automatically (workspace_member_* policies from
  // migration 0033).
  useEffect(() => {
    if (!workspace || dismissed) return;
    let cancelled = false;
    (async () => {
      const [w9, c, i] = await Promise.all([
        supabase
          .from('invoice_settings')
          .select('w9_storage_path')
          .eq('workspace_id', workspace.id)
          .maybeSingle(),
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .limit(1),
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .limit(1),
      ]);
      if (cancelled) return;
      setState({
        has_w9:      Boolean(w9.data?.w9_storage_path),
        has_client:  (c.count ?? 0) > 0,
        has_invoice: (i.count ?? 0) > 0,
      });
    })();
    return () => { cancelled = true; };
  }, [workspace, dismissed]);

  if (!workspace || dismissed || !state) return null;
  // All done → nothing to nudge about. Auto-resolves without a dismiss
  // click (better UX than a "complete" UI that the operator has to
  // close manually).
  if (state.has_w9 && state.has_client && state.has_invoice) return null;

  const done = [state.has_w9, state.has_client, state.has_invoice].filter(Boolean).length;
  const total = 3;

  function handleDismiss() {
    try {
      if (workspace) localStorage.setItem(dismissKey(workspace.id), '1');
    } catch { /* private mode — best-effort */ }
    setDismissed(true);
  }

  return (
    <section
      className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-gold/5 to-transparent p-5 sm:p-6"
      aria-labelledby="quickstart-title"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="overline mb-1 text-gold-dark">Quickstart</p>
          <h2 id="quickstart-title" className="font-heading text-heading-sm font-bold text-primary">
            {done === 0
              ? `Welcome to ${workspace.name}.`
              : done === total
                ? "You're all set."
                : `${done} of ${total} done — almost there.`}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss quickstart"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:text-primary hover:bg-white/40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="space-y-2">
        <ChecklistItem
          done={state.has_w9}
          title="Upload your W-9"
          body="Auto-attached to every invoice email."
          href="/billing/invoices/settings"
          icon={<Upload className="h-4 w-4" />}
        />
        <ChecklistItem
          done={state.has_client}
          title="Add your first client"
          body="Or skip — clients save themselves when you invoice them."
          href="/billing/clients/new"
          icon={<Users className="h-4 w-4" />}
        />
        <ChecklistItem
          done={state.has_invoice}
          title="Send your first invoice"
          body="Five fields. The PDF + your W-9 go out together."
          href="/billing/invoices/new"
          icon={<FileText className="h-4 w-4" />}
        />
      </ul>
    </section>
  );
}

function ChecklistItem({
  done, title, body, href, icon,
}: {
  done: boolean;
  title: string;
  body: string;
  href: string;
  icon: React.ReactNode;
}) {
  const content = (
    <div
      className={`flex items-start gap-3 rounded-xl p-3 transition-colors ${
        done
          ? 'bg-green-50 border border-green-200'
          : 'bg-white border border-border hover:border-gold hover:bg-gold/5'
      }`}
    >
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
          done ? 'bg-green-100 text-green-700' : 'bg-gold/15 text-gold-dark'
        }`}
      >
        {done ? <CheckCircle2 className="h-5 w-5" /> : icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`text-body-sm font-semibold ${done ? 'text-green-900 line-through' : 'text-primary'}`}>
            {title}
          </h3>
          {!done && <ArrowRight className="h-3.5 w-3.5 text-gold-dark" aria-hidden="true" />}
        </div>
        <p className={`text-caption mt-0.5 ${done ? 'text-green-800' : 'text-foreground-muted'}`}>
          {body}
        </p>
      </div>
    </div>
  );
  if (done) return <li>{content}</li>;
  return <li><Link href={href} className="block">{content}</Link></li>;
}
