import { BillingRail } from '@/components/admin/BillingRail';
import { CommandPalette } from '@/components/billing/CommandPalette';
import { KeyboardShortcuts } from '@/components/billing/KeyboardShortcuts';
import { ToastProvider } from '@/components/billing/Toast';
import { WorkspaceProvider } from '@/components/billing/WorkspaceProvider';

/**
 * Wraps every page under /billing/* with the persistent left-rail
 * navigation. Mirrors AdminLayout structurally (same w-56 desktop / mobile
 * hamburger pattern) so the two sections feel consistent without sharing
 * navigation state.
 *
 * Mounts the global Cmd+K palette + the Toast provider for undo notices
 * on destructive actions. Both are scoped to /billing/* so they don't
 * impose on the public site.
 *
 * WorkspaceProvider is the outermost wrapper because every billing page
 * + every nested component needs to scope its queries by workspace.id.
 * It loads the current user's workspace once on mount and provides it
 * via useWorkspace() — the multi-tenancy backbone for VultStack.
 */
export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
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
    </WorkspaceProvider>
  );
}
