-- ============================================================================
-- Billing surface — tighten RLS to admin_users membership
-- ============================================================================
-- Until now every billing table accepted any authenticated user via
-- `USING (true)`. That was fine when the only path to authentication was
-- a broker manually creating accounts in Supabase Studio. But if the
-- project's Auth settings ever permit self-signups (the default in many
-- Supabase projects), any visitor could create an account and gain full
-- read/write to invoices, expenses, clients, contractors, properties,
-- recurring templates, bank accounts, and the activity log.
--
-- This migration changes the gate from "authenticated" to "authenticated
-- AND on the admin_users allowlist." Defense in depth: even if signups
-- become open in project config, the billing data stays sealed.
--
-- The helper function runs SECURITY DEFINER so it can read admin_users
-- regardless of the calling user's RLS posture. search_path is locked
-- to the public + pg_catalog schemas to neutralize search_path-injection
-- attacks against SECURITY DEFINER functions.
--
-- Match key is lower(auth.jwt() ->> 'email') against lower(admin_users.email)
-- to match the existing pattern in src/lib/auth.ts (getCurrentUser) and
-- avoid case-sensitivity bugs in mixed-case email addresses.
--
-- NOTE: activity_log's existing INSERT policy already enforces
-- `actor_id = auth.uid()` correctly, so we ALSO require admin membership
-- to read or insert there. UPDATE/DELETE remain absent (append-only).
-- ============================================================================

-- ── Helper function ─────────────────────────────────────────────────────────
create or replace function public.is_billing_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.admin_users a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Lock down execute — only authenticated callers need it. Revoke from
-- public so an anonymous JWT can't probe it.
revoke all on function public.is_billing_admin() from public;
grant execute on function public.is_billing_admin() to authenticated;

comment on function public.is_billing_admin() is
  'Returns true when the current JWT email matches an admin_users row. '
  'Used by RLS policies on every billing table for defense-in-depth '
  'against open project-level signups. SECURITY DEFINER so the lookup '
  'bypasses RLS on admin_users itself; search_path locked to neutralize '
  'injection.';

-- ── invoices ────────────────────────────────────────────────────────────────
drop policy if exists "authenticated read invoices"   on public.invoices;
drop policy if exists "authenticated insert invoices" on public.invoices;
drop policy if exists "authenticated update invoices" on public.invoices;
drop policy if exists "authenticated delete invoices" on public.invoices;
create policy "billing_admin_all_invoices" on public.invoices
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());

-- ── invoice_line_items ──────────────────────────────────────────────────────
drop policy if exists "authenticated read invoice_line_items"   on public.invoice_line_items;
drop policy if exists "authenticated insert invoice_line_items" on public.invoice_line_items;
drop policy if exists "authenticated update invoice_line_items" on public.invoice_line_items;
drop policy if exists "authenticated delete invoice_line_items" on public.invoice_line_items;
create policy "billing_admin_all_invoice_line_items" on public.invoice_line_items
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());

-- ── invoice_settings ────────────────────────────────────────────────────────
drop policy if exists "authenticated read invoice_settings"   on public.invoice_settings;
drop policy if exists "authenticated insert invoice_settings" on public.invoice_settings;
drop policy if exists "authenticated update invoice_settings" on public.invoice_settings;
drop policy if exists "authenticated delete invoice_settings" on public.invoice_settings;
create policy "billing_admin_all_invoice_settings" on public.invoice_settings
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());

-- ── invoice_reminders ───────────────────────────────────────────────────────
drop policy if exists "authenticated read invoice_reminders"   on public.invoice_reminders;
drop policy if exists "authenticated insert invoice_reminders" on public.invoice_reminders;
drop policy if exists "authenticated update invoice_reminders" on public.invoice_reminders;
drop policy if exists "authenticated delete invoice_reminders" on public.invoice_reminders;
create policy "billing_admin_all_invoice_reminders" on public.invoice_reminders
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());

-- ── invoice_email_events ────────────────────────────────────────────────────
drop policy if exists "admin_can_all_invoice_email_events" on public.invoice_email_events;
create policy "billing_admin_all_invoice_email_events" on public.invoice_email_events
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());

-- ── expenses ────────────────────────────────────────────────────────────────
drop policy if exists "authenticated read expenses"   on public.expenses;
drop policy if exists "authenticated insert expenses" on public.expenses;
drop policy if exists "authenticated update expenses" on public.expenses;
drop policy if exists "authenticated delete expenses" on public.expenses;
create policy "billing_admin_all_expenses" on public.expenses
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());

-- ── clients ─────────────────────────────────────────────────────────────────
drop policy if exists "admin_can_all_clients" on public.clients;
create policy "billing_admin_all_clients" on public.clients
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());

-- ── contractors ─────────────────────────────────────────────────────────────
drop policy if exists "admin_can_all_contractors" on public.contractors;
create policy "billing_admin_all_contractors" on public.contractors
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());

-- ── recurring_invoice_templates ─────────────────────────────────────────────
drop policy if exists "admin_can_all_recurring_templates" on public.recurring_invoice_templates;
create policy "billing_admin_all_recurring_templates" on public.recurring_invoice_templates
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());

-- ── recurring_invoice_line_items ────────────────────────────────────────────
drop policy if exists "admin_can_all_recurring_line_items" on public.recurring_invoice_line_items;
create policy "billing_admin_all_recurring_line_items" on public.recurring_invoice_line_items
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());

-- ── properties ──────────────────────────────────────────────────────────────
drop policy if exists "properties auth select" on public.properties;
drop policy if exists "properties auth insert" on public.properties;
drop policy if exists "properties auth update" on public.properties;
drop policy if exists "properties auth delete" on public.properties;
create policy "billing_admin_all_properties" on public.properties
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());

-- ── activity_log ────────────────────────────────────────────────────────────
-- Audit trail: SELECT now requires admin membership (was wide-open to any
-- authenticated user). INSERT keeps the actor_id = auth.uid() check AND
-- requires admin membership. Still no UPDATE/DELETE policies (append-only).
drop policy if exists "activity_log auth select" on public.activity_log;
drop policy if exists "activity_log auth insert" on public.activity_log;
create policy "billing_admin_select_activity_log" on public.activity_log
  for select to authenticated
  using (public.is_billing_admin());
create policy "billing_admin_insert_activity_log" on public.activity_log
  for insert to authenticated
  with check (
    public.is_billing_admin()
    and (actor_id is null or actor_id = auth.uid())
  );

-- ── bank_accounts ───────────────────────────────────────────────────────────
drop policy if exists "admin_can_all_bank_accounts" on public.bank_accounts;
create policy "billing_admin_all_bank_accounts" on public.bank_accounts
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());

-- ── bank_transactions ───────────────────────────────────────────────────────
drop policy if exists "admin_can_all_bank_transactions" on public.bank_transactions;
create policy "billing_admin_all_bank_transactions" on public.bank_transactions
  for all to authenticated
  using (public.is_billing_admin())
  with check (public.is_billing_admin());
