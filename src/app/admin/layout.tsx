import { Suspense } from 'react';
import { AdminRail } from '@/components/admin/AdminRail';

/**
 * Wraps every page under /admin/* with the persistent left-rail navigation.
 * The rail is fixed-position; the main content area is padded by w-56 on
 * desktop (rail width), full width on mobile (rail collapses behind a
 * hamburger).
 *
 * AdminRail reads from useSearchParams, which Next.js requires to be inside
 * a <Suspense> boundary in app router.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background-cream">
      <Suspense fallback={null}>
        <AdminRail />
      </Suspense>
      <div className="lg:pl-56 min-h-screen">
        {children}
      </div>
    </div>
  );
}
