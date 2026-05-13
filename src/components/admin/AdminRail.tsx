'use client';

/**
 * Left-rail navigation for the /admin section (content management only).
 *
 * Billing — invoices, expenses, email template — lives in its own /billing
 * section behind BillingRail so financial data is mentally and visually
 * separated from website content. The two sections cross-link at the rail
 * bottom.
 *
 * Lives in `app/admin/layout.tsx`, so it persists across navigation between
 * admin pages without re-mounting. Active state is derived from the current
 * pathname + the `?tab=` search param.
 *
 * On desktop the rail is fixed-position on the left at w-56. On mobile it
 * collapses behind a hamburger button that slides it in as an overlay.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home, Building2, CheckCircle2, Users, MapPin, MessageSquare,
  FileText, Inbox, DollarSign, ExternalLink, LogOut, Menu, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Used to determine active state. For /admin?tab=X items, this is the tab key. */
  matchTab?: string;
  /** If true, treat a pathname prefix match as active. */
  matchPrefix?: string;
}

const PRIMARY_NAV: NavItem[] = [
  { href: '/admin?tab=settings',      label: 'Homepage',      icon: Home,           matchTab: 'settings' },
  { href: '/admin?tab=listings',      label: 'Listings',      icon: Building2,      matchTab: 'listings' },
  { href: '/admin?tab=sold',          label: 'Sold',          icon: CheckCircle2,   matchTab: 'sold' },
  { href: '/admin?tab=agents',        label: 'Agents',        icon: Users,          matchTab: 'agents' },
  { href: '/admin?tab=submarkets',    label: 'Submarkets',    icon: MapPin,         matchTab: 'submarkets' },
  { href: '/admin?tab=testimonials',  label: 'Testimonials',  icon: MessageSquare,  matchTab: 'testimonials' },
  { href: '/admin?tab=landing_pages', label: 'Landing Pages', icon: FileText,       matchTab: 'landing_pages' },
  { href: '/admin?tab=leads',         label: 'Leads',         icon: Inbox,          matchTab: 'leads' },
];

// Billing has moved to its own /billing section with its own rail. Keep
// a single cross-link in the bottom utility area instead of mixing the
// two surfaces in one rail.
const BUSINESS_NAV: NavItem[] = [];

export function AdminRail() {
  const pathname = usePathname() ?? '/admin';
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(item: NavItem): boolean {
    if (item.matchPrefix) {
      // More specific prefixes win — Email Template ("/admin/invoices/settings")
      // beats Invoices ("/admin/invoices") on the settings page. Walk the
      // rest of BUSINESS_NAV for a strictly-deeper match.
      const prefix = item.matchPrefix;
      if (!pathname.startsWith(prefix)) return false;
      const moreSpecific = BUSINESS_NAV.some(other => {
        const op = other.matchPrefix;
        if (!op || other === item) return false;
        return op.startsWith(prefix) && op.length > prefix.length && pathname.startsWith(op);
      });
      return !moreSpecific;
    }
    if (item.matchTab) {
      // Only highlight tab items when we're actually on /admin (root) — not on
      // any nested admin route (where the tab query param would be stale).
      if (pathname !== '/admin') return false;
      // Default tab when no ?tab= param is "settings" (matches /admin/page.tsx
      // initial state).
      const current = activeTab ?? 'settings';
      return current === item.matchTab;
    }
    return false;
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/manage/login';
  }

  return (
    <>
      {/* Mobile toggle — sits on top of content, only visible below lg */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-white shadow-lg"
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop (mobile only) */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* The rail itself */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-56 bg-primary text-white flex flex-col
          transition-transform duration-200 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <Link
            href="/admin"
            className="font-heading text-xl font-bold tracking-tight"
            onClick={() => setMobileOpen(false)}
          >
            CRE<span className="text-gold">CO</span>
            <span className="ml-2 text-caption text-white/40 font-normal tracking-wider">ADMIN</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden inline-flex items-center justify-center h-8 w-8 rounded-md text-white/60 hover:text-white hover:bg-white/10"
            aria-label="Close admin menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          <NavSection label="Content">
            {PRIMARY_NAV.map(item => (
              <NavLink key={item.href} item={item} active={isActive(item)} onNavigate={() => setMobileOpen(false)} />
            ))}
          </NavSection>
        </nav>

        {/* Bottom utility */}
        <div className="border-t border-white/10 py-2">
          <Link
            href="/billing"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-5 py-2.5 text-body-sm text-gold hover:text-gold-light hover:bg-white/5 font-semibold"
          >
            <DollarSign className="h-4 w-4" />
            <span>Billing →</span>
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

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="px-5 mb-1 text-caption uppercase tracking-widest text-white/30">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
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
}
