import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Workspaces allowed to send invoice email automatically (reminders, recurring invoices): those with at least one member whose login is on the
 * admin_users allowlist. A workspace that only a stranger belongs to never mails anyone from our domain, even if its rows say "send".
 */
export async function approvedWorkspaceIds(sb: SupabaseClient): Promise<Set<string>> {
  const { data: admins } = await sb.from('admin_users').select('email');
  const emails = new Set((admins ?? []).map(a => String(a.email ?? '').toLowerCase()).filter(Boolean));
  if (!emails.size) return new Set();
  const ids: string[] = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users) if (u.email && emails.has(u.email.toLowerCase())) ids.push(u.id);
    if (data.users.length < 200) break;
  }
  if (!ids.length) return new Set();
  const { data: wm } = await sb.from('workspace_members').select('workspace_id').in('user_id', ids);
  return new Set((wm ?? []).map(w => String(w.workspace_id)));
}
