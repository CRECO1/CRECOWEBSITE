import { BillingRail } from '@/components/admin/BillingRail';

/**
 * Wraps every page under /billing/* with the persistent left-rail
 * navigation. Mirrors AdminLayout structurally (same w-56 desktop / mobile
 * hamburger pattern) so the two sections feel consistent without sharing
 * navigation state.
 */
export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background-cream">
      <BillingRail />
      <div className="lg:pl-56 min-h-screen">
        {children}
      </div>
    </div>
  );
}
