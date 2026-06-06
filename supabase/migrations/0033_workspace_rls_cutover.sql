-- ============================================================================
-- RLS cutover — swap every billing-table policy to is_workspace_member()
-- ============================================================================
-- This is THE breaking moment in the multi-tenancy migration. Up through
-- 0032, every billing-table policy gated access on is_billing_admin()
-- (membership in admin_users). After this migration, every policy gates
-- on is_workspace_member(workspace_id) — meaning a user can only see /
-- write rows in workspaces they're a member of.
--
-- Pre-requisites (verified by the apply script):
--   - 0031 applied: workspaces + workspace_members exist; CRECO seeded.
--   - 0032 applied: every billing table has workspace_id NOT NULL.
--   - App code updated: every INSERT/UPSERT includes workspace_id.
--   - is_workspace_member() returns true for the broker against CRECO.
--
-- After this:
--   - is_billing_admin() still exists. We don't drop it because some
--     non-billing tables (e.g. activity_log inserts gated on admin_users
--     membership directly via a check) may still reference it, and it's
--     useful as a "is this user any kind of admin" predicate during
--     migration cleanup. It's just no longer the primary gate for
--     billing data.
--   - Unscoped SELECT queries still work — RLS evaluates per-row, and
--     since each row has a workspace_id, the user gets exactly the rows
--     in workspaces they belong to. No SELECT code changes needed for
--     correctness on single-workspace users. (Performance is better when
--     the query filters by workspace_id explicitly; that's a later pass.)
--   - INSERT queries MUST include workspace_id. The NOT NULL constraint
--     would have caught missing-id inserts already, but RLS adds a second
--     gate via WITH CHECK — preventing inserts into workspaces the user
--     isn't a member of.
-- ============================================================================

-- ── invoices ────────────────────────────────────────────────────────────────
drop policy if exists "billing_admin_all_invoices" on public.invoices;
create policy "workspace_member_all_invoices" on public.invoices
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ── invoice_line_items ──────────────────────────────────────────────────────
drop policy if exists "billing_admin_all_invoice_line_items" on public.invoice_line_items;
create policy "workspace_member_all_invoice_line_items" on public.invoice_line_items
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ── invoice_settings ────────────────────────────────────────────────────────
-- Note: today the table still has the id=1 singleton constraint from
-- migration 0011. CRECO's row has id=1 + workspace_id=<creco>. A follow-
-- up migration will drop the id constraint and use workspace_id as the
-- unique key so multiple workspaces can each have their own settings row.
-- The RLS swap below is correct either way.
drop policy if exists "billing_admin_all_invoice_settings" on public.invoice_settings;
create policy "workspace_member_all_invoice_settings" on public.invoice_settings
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ── invoice_reminders ───────────────────────────────────────────────────────
drop policy if exists "billing_admin_all_invoice_reminders" on public.invoice_reminders;
create policy "workspace_member_all_invoice_reminders" on public.invoice_reminders
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ── invoice_email_events ────────────────────────────────────────────────────
drop policy if exists "billing_admin_all_invoice_email_events" on public.invoice_email_events;
create policy "workspace_member_all_invoice_email_events" on public.invoice_email_events
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ── expenses ────────────────────────────────────────────────────────────────
drop policy if exists "billing_admin_all_expenses" on public.expenses;
create policy "workspace_member_all_expenses" on public.expenses
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ── clients ─────────────────────────────────────────────────────────────────
drop policy if exists "billing_admin_all_clients" on public.clients;
create policy "workspace_member_all_clients" on public.clients
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ── contractors ─────────────────────────────────────────────────────────────
drop policy if exists "billing_admin_all_contractors" on public.contractors;
create policy "workspace_member_all_contractors" on public.contractors
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ── recurring_invoice_templates ─────────────────────────────────────────────
drop policy if exists "billing_admin_all_recurring_templates" on public.recurring_invoice_templates;
create policy "workspace_member_all_recurring_templates" on public.recurring_invoice_templates
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ── recurring_invoice_line_items ────────────────────────────────────────────
drop policy if exists "billing_admin_all_recurring_line_items" on public.recurring_invoice_line_items;
create policy "workspace_member_all_recurring_line_items" on public.recurring_invoice_line_items
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ── properties ──────────────────────────────────────────────────────────────
drop policy if exists "billing_admin_all_properties" on public.properties;
create policy "workspace_member_all_properties" on public.properties
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ── activity_log ────────────────────────────────────────────────────────────
-- Audit log keeps its existing actor_id = auth.uid() check on INSERT,
-- gated additionally by workspace membership. SELECT requires workspace
-- membership. Still no UPDATE/DELETE policies (append-only).
drop policy if exists "billing_admin_select_activity_log" on public.activity_log;
drop policy if exists "billing_admin_insert_activity_log" on public.activity_log;
create policy "workspace_member_select_activity_log" on public.activity_log
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy "workspace_member_insert_activity_log" on public.activity_log
  for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and (actor_id is null or actor_id = auth.uid())
  );

-- ── bank_accounts ───────────────────────────────────────────────────────────
drop policy if exists "billing_admin_all_bank_accounts" on public.bank_accounts;
create policy "workspace_member_all_bank_accounts" on public.bank_accounts
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ── bank_transactions ───────────────────────────────────────────────────────
drop policy if exists "billing_admin_all_bank_transactions" on public.bank_transactions;
create policy "workspace_member_all_bank_transactions" on public.bank_transactions
  for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
