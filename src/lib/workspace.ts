/**
 * Workspace context — the multi-tenancy backbone of the billing surface.
 *
 * Today there's one workspace (CRECO). When VultStack starts onboarding
 * other brokerages, each becomes its own workspace and every billing
 * query / insert is scoped by workspace_id. This module is the single
 * source of truth for "which workspace is the current request operating
 * inside?"
 *
 * Three call sites, three shapes:
 *
 *   Browser (React):
 *     const { workspace } = useWorkspace();
 *     supabase.from('invoices').select('*').eq('workspace_id', workspace.id)…
 *
 *   API route (server):
 *     const auth = await requireWorkspaceAdmin();
 *     if (auth.error) return auth.error;
 *     const { supabase, user, workspace } = auth;
 *     supabase.from('invoices').insert({ ..., workspace_id: workspace.id });
 *
 *   Cron / service-role context:
 *     const workspaces = await listAllWorkspaces(serviceRoleClient);
 *     for (const ws of workspaces) { runJobForWorkspace(ws.id) }
 *
 * The workspace is resolved by joining auth.users.email → workspace_members
 * → workspaces, returning the user's first workspace by joined_at. When
 * users belong to multiple workspaces, a switcher UI sets a preference
 * (future work; not needed for VultStack v1 since most users have one).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface Workspace {
  /** UUID — used as the workspace_id foreign key on every billing row. */
  id: string;
  /** URL-safe identifier (e.g. "creco"). Used in paths + storage prefixes. */
  slug: string;
  /** Display name (e.g. "CRECO"). */
  name: string;
  /** The current user's role in this workspace. */
  role: 'admin' | 'agent' | 'viewer' | 'accountant';
}

/**
 * Resolve the calling user's primary workspace via the SECURITY DEFINER
 * RPC `current_user_workspace()`. Returns null if the user has no
 * workspace membership (typically means they shouldn't see /billing at
 * all — the layout / middleware should bounce them).
 *
 * Works from both client + server contexts as long as the Supabase
 * client has a valid auth session attached.
 */
export async function fetchCurrentWorkspace(
  client: SupabaseClient,
): Promise<Workspace | null> {
  const { data, error } = await client.rpc('current_user_workspace');
  if (error || !data || data.length === 0) {
    if (error && process.env.NODE_ENV !== 'production') {
      console.warn('[workspace] current_user_workspace failed:', error.message);
    }
    return null;
  }
  const row = data[0] as {
    workspace_id: string;
    workspace_slug: string;
    workspace_name: string;
    role: Workspace['role'];
  };
  return {
    id: row.workspace_id,
    slug: row.workspace_slug,
    name: row.workspace_name,
    role: row.role,
  };
}

/**
 * Build the storage path prefix for a workspace. All workspace-scoped
 * files (W-9s, receipts, future PDF templates, etc.) live under this
 * prefix so a single bucket can hold every tenant's files with RLS
 * gating on the path itself.
 *
 * Example: `creco/2026/06/abc123.pdf`
 *
 * Storage RLS policies parse the leading slug from the path and call
 * is_workspace_member() — same gating story as the table-level policies.
 */
export function workspacePathPrefix(workspace: Pick<Workspace, 'slug'>): string {
  return `${workspace.slug}/`;
}
