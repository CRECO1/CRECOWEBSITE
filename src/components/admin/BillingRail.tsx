'use client';

/**
 * Left-rail navigation for the /billing section.
 *
 * Visually mirrors AdminRail (black bg, gold active state) so the admin
 * feels like a single product, but the content is purpose-built for
 * financial workflows: dashboard, invoices, expenses, email template.
 *
 * Lives in `app/billing/layout.tsx` so it persists across navigation between
 * billing pages without re-mounting. Active state derived from pathname
 * prefix.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Receipt, ArrowDownCircle, Mail,
  ArrowLeft, ExternalLink, LogOut, Menu, X,
  Clock, BarChart3, FileBadge, Repeat, FileText, Landmark,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BillingSearch } from '@/components/billing/BillingSearch';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPrefix: string;
  matchExact?: boolean;
}

const NAV: NavItem[] = [
  { href: '/billing',                       label: 'Dashboard',      icon: LayoutDashboard, matchPrefix: '/billing',                       matchExact: true },
  { href: '/billing/invoices',              label: 'Invoices',       icon: Receipt,         matchPrefix: '/billing/invoices' },
  { href: '/billing/recurring',             label: 'Recurring',      icon: Repeat,          matchPrefix: '/billing/recurring' },
  { href: '/billing/expenses',              label: 'Expenses',       icon: ArrowDownCircle, matchPrefix: '/billing/expenses' },
  { href: '/billing/bank',                  label: 'Bank feed',      icon: Landmark,        matchPrefix: '/billing/bank' },
  { href: '/billing/contractors',           label: 'Contractors',    icon: FileBadge,       matchPrefix: '/billing/contractors' },
  { href: '/billing/statements',            label: 'Statements',     icon: FileText,        matchPrefix: '/billing/statements' },
  { href: '/billing/reports/ar-aging',      label: 'A/R Aging',      icon: Clock,           matchPrefix: '/billing/reports/ar-aging' },
  { href: '/billing/reports/profit-loss',   label: 'Profit & Loss',  icon: BarChart3,       matchPrefix: '/billing/reports/profit-loss' },
  { href: '/billing/reports/schedule-c',    label: 'Schedule C',     icon: FileBadge,       matchPrefix: '/billing/reports/schedule-c' },
  { href: '/billing/reports/1099',          label: '1099 Export',    icon: FileBadge,       matchPrefix: '/billing/reports/1099' },
  { href: '/billing/invoices/settings',     label: 'Email Template', icon: Mail,            matchPrefix: '/billing/invoices/settings' },
];

export function BillingRail() {
  const pathname = usePathname() ?? '/billing';
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(item: NavItem): boolean {
    if (item.matchExact) return pathname === item.matchPrefix;
    if (!pathname.startsWith(item.matchPrefix)) return false;
    // Walk the list for a more-specific match (Email Template beats Invoices
    // when on /billing/invoices/settings)
    const moreSpecific = NAV.some(other => {
      if (other === item) return false;
      const op = other.matchPrefix;
      return op.startsWith(item.matchPrefix) && op.length > item.matchPrefix.length && pathname.startsWith(op);
    });
    return !moreSpecific;
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/manage/login';
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-white shadow-lg"
        aria-label="Open billing menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* The rail */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-56 bg-primary text-white flex flex-col
          transition-transform duration-200 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
        aria-label="Billing navigation"
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <Link
            href="/billing"
            className="font-heading text-xl font-bold tracking-tight"
            onClick={() => setMobileOpen(false)}
          >
            CRE<span className="text-gold">CO</span>
            <span className="ml-2 text-caption text-gold/70 font-normal tracking-wider">BILLING</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden inline-flex items-center justify-center h-8 w-8 rounded-md text-white/60 hover:text-white hover:bg-white/10"
            aria-label="Close billing menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Confidential strip — visual reminder this section holds money data */}
        <div className="px-5 py-2 bg-gold/10 border-b border-white/5">
          <p className="text-caption uppercase tracking-widest text-gold/80">Restricted · Financial</p>
        </div>

        {/* Global search */}
        <div className="px-3 py-3 border-b border-white/5">
          <BillingSearch />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          <div className="space-y-0.5">
            {NAV.map(item => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-5 py-2 text-body-sm transition-colors
                    ${active
                      ? 'bg-gold/15 text-gold border-l-2 border-gold -ml-0.5 pl-[18px] font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}
                  `}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom utility */}
        <div className="border-t border-white/10 py-2">
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-5 py-2.5 text-body-sm text-white/60 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to admin</span>
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-2.5 text-body-sm text-white/60 hover:text-white hover:bg-white/5"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View site</span>
          </a>
          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-body-sm text-white/60 hover:text-white hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
