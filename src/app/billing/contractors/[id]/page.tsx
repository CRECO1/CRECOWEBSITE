'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ContractorForm } from '@/components/billing/ContractorForm';
import type { Contractor } from '@/lib/expenses';

export default function EditContractorPage() {
  const params = useParams();
  const id = (params?.id as string) ?? '';
  const [contractor, setContractor] = useState<Contractor | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', id)
        .single();
      if (cancelled) return;
      if (error) { setError(error.message); setContractor(null); return; }
      setContractor(data as Contractor);
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (contractor === undefined) {
    return (
      <main className="min-h-screen bg-background-cream flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </main>
    );
  }
  if (contractor === null) {
    return (
      <main className="min-h-screen bg-background-cream flex items-center justify-center p-6">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-body-sm text-amber-800 flex items-start gap-3 max-w-md">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>{error ?? 'Contractor not found'}</div>
        </div>
      </main>
    );
  }
  return <ContractorForm initial={contractor} mode="edit" />;
}
