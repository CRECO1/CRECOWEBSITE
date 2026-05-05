'use client';

/**
 * Floating bar that appears at the bottom-right whenever the compare
 * shortlist has 1+ listings. Tapping it goes to /compare. Shows the count.
 *
 * Hidden if count is 0 or if the user is already on /compare.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scale, X } from 'lucide-react';
import { useCompareList } from '@/hooks/useCompareList';

export function CompareBar() {
  const { count, clear } = useCompareList();
  const pathname = usePathname();

  if (count === 0) return null;
  if (pathname === '/compare') return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 rounded-full bg-primary text-white shadow-2xl border border-gold/40 pl-2 pr-1.5 py-1.5">
      <Link
        href="/compare"
        className="flex items-center gap-2 px-4 py-2 rounded-full text-body-sm font-semibold hover:text-gold transition-colors"
      >
        <Scale className="h-4 w-4 text-gold" />
        Compare ({count})
      </Link>
      <button
        type="button"
        onClick={clear}
        title="Clear compare list"
        aria-label="Clear compare list"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
