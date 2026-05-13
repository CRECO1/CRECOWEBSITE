'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  RecurringTemplateForm,
  type RecurringTemplateInitial,
} from '@/components/billing/RecurringTemplateForm';

export default function EditRecurringTemplatePage() {
  const params = useParams();
  const id = (params?.id as string) ?? '';
  const [tpl, setTpl] = useState<RecurringTemplateInitial | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: row, error: e1 }, { data: items }] = await Promise.all([
        supabase.from('recurring_invoice_templates').select('*').eq('id', id).single(),
        supabase.from('recurring_invoice_line_items').select('*').eq('template_id', id).order('sort_order'),
      ]);
      if (cancelled) return;
      if (e1) { setError(e1.message); setTpl(null); return; }
      setTpl({ ...row, line_items: items ?? [] });
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (tpl === undefined) {
    return (
      <main className="min-h-screen bg-background-cream flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </main>
    );
  }
  if (tpl === null) {
    return (
      <main className="min-h-screen bg-background-cream flex items-center justify-center p-6">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-body-sm text-amber-800 flex items-start gap-3 max-w-md">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>{error ?? 'Template not found'}</div>
        </div>
      </main>
    );
  }
  return <RecurringTemplateForm initial={tpl} mode="edit" />;
}
