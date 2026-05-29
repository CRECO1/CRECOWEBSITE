import { BillingRail } from '@/components/admin/BillingRail';
import { CommandPalette } from '@/components/billing/CommandPalette';
import { KeyboardShortcuts } from '@/components/billing/KeyboardShortcuts';
import { ToastProvider } from '@/components/billing/Toast';

/**
 * Wraps every page under /billing/* with the persistent left-rail
 * navigation. Mirrors AdminLayout structurally (same w-56 desktop / mobile
 * hamburger pattern) so the two sections feel consistent without sharing
 * navigation state.
 *
 * Mounts the global Cmd+K palette + the Toast provider for undo notices
 * on destructive actions. Both are scoped to /billing/* so they don't
 * impose on the public site.
 */
export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background-cream">
        <BillingRail />
        <div className="lg:pl-56 min-h-screen">
          {children}
        </div>
        <CommandPalette />
        <KeyboardShortcuts />
      </div>
    </ToastProvider>
  );
}
