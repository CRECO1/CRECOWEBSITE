'use client';

/**
 * WorkspaceProvider — the React context wrapper that loads the current
 * user's workspace once on mount and provides it to every billing
 * surface below it.
 *
 * Mounted from /billing/layout.tsx so it covers every billing page +
 * detail route. Components consume it via `useWorkspace()`.
 *
 * Loading semantics:
 *   - On first render, workspace is null + loading=true.
 *   - useEffect fires fetchCurrentWorkspace() against the browser
 *     Supabase client. Resolves the user's primary workspace via the
 *     current_user_workspace() RPC we added in migration 0031.
 *   - Once resolved, every child can read `workspace` synchronously.
 *
 * Failure mode: when the RPC returns null (user has no workspace
 * membership), we render a clear "not provisioned" UI rather than
 * silently rendering broken billing pages. In practice this only fires
 * for users who authenticated but haven't been added to a workspace
 * yet — middleware should bounce them earlier, but the second-line
 * defense is here.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchCurrentWorkspace, type Workspace } from '@/lib/workspace';

interface WorkspaceContextValue {
  workspace: Workspace | null;
  loading: boolean;
  /** Force a refetch — useful after creating a new workspace via onboarding. */
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/**
 * Hook used by every billing component to read the current workspace.
 * Throws if used outside a WorkspaceProvider — fail loudly during
 * development rather than render with workspace=undefined and silently
 * leak cross-workspace data.
 */
export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace() called outside of <WorkspaceProvider>. Wrap your component in the billing layout.');
  }
  return ctx;
}

/**
 * Same as useWorkspace() but asserts that the workspace is loaded.
 * Pages that need workspace.id should call this — saves the
 * `if (!workspace) return null` boilerplate at every call site.
 *
 * Pages that legitimately need to handle the loading state inline
 * (e.g. dashboard widgets that should render skeletons) should use
 * useWorkspace() directly.
 */
export function useWorkspaceOrThrow(): Workspace {
  const { workspace } = useWorkspace();
  if (!workspace) {
    throw new Error('useWorkspaceOrThrow() called before workspace was loaded. Use useWorkspace() for the loading-aware variant.');
  }
  return workspace;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const ws = await fetchCurrentWorkspace(supabase);
    setWorkspace(ws);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ws = await fetchCurrentWorkspace(supabase);
      if (!cancelled) {
        setWorkspace(ws);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Loading state — minimal centered spinner. Matches the
  // BillingFallback aesthetic so the transition into a loaded page
  // doesn't flash.
  if (loading) {
    return (
      <main className="min-h-screen bg-background-cream flex items-center justify-center text-foreground-muted">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </main>
    );
  }

  // Authenticated but not a member of any workspace — typically means
  // the operator was added to admin_users but never to workspace_members.
  // Surface a clear path forward instead of rendering empty data.
  if (!workspace) {
    return (
      <main className="min-h-screen bg-background-cream flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-heading-md font-bold text-primary mb-2">
            No workspace assigned
          </h1>
          <p className="text-body-sm text-foreground-muted mb-6 leading-relaxed">
            Your account is authenticated but not yet a member of any billing workspace.
            Ask the workspace owner to invite you, or sign out and start fresh.
          </p>
          <Link
            href="/manage/login"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90"
          >
            Sign in again
          </Link>
        </div>
      </main>
    );
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, loading, refresh: load }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
