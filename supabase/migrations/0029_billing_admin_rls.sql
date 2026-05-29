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

-- ── admin_users bootstrap ───────────────────────────────────────────────────
-- The billing project doesn't have an admin_users table yet (it was only
-- in the website project where the original CRECO admin UI was built).
-- Create it with the same shape so the codebase's existing reads still
-- work, and backfill from auth.users so the broker isn't locked out the
-- moment the new policies activate.
--
-- Idempotent: `if not exists` + insert on conflict do nothing means
-- re-running this migration is safe and won't overwrite manual edits
-- to admin_users (e.g. name or role changes).

create table if not exists public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  name       text not null,
  role       text not null default 'admin',
  avatar_url text,
  created_at timestamptz default now()
);

-- Unique on lower(email) so the membership check in is_billing_admin()
-- is deterministic (no duplicate-with-different-case rows).
create unique index if not exists admin_users_email_unique_idx
  on public.admin_users (lower(email));

-- Backfill: every existing auth.users row that's NOT already in
-- admin_users becomes an admin. In a fresh billing project there's
-- exactly one auth.users row (the broker), so this seeds the broker
-- as admin. Use coalesce on raw_user_meta_data->>'name' / email as
-- the display name so the not-null column is satisfied.
insert into public.admin_users (email, name, role)
select
  au.email,
  coalesce(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  'admin'
from auth.users au
where au.email is not null
on conflict (lower((email))) do nothing;

-- RLS on admin_users itself. SELECT must be readable by any
-- authenticated user (otherwise the is_billing_admin() lookup can't
-- resolve, even via SECURITY DEFINER on most setups). INSERT/UPDATE/
-- DELETE are restricted to existing admins so a non-admin who somehow
-- authenticated can't add themselves.
alter table public.admin_users enable row level security;

drop policy if exists admin_users_select on public.admin_users;
create policy admin_users_select on public.admin_users
  for select to authenticated using (true);

drop policy if exists admin_users_self_admin_only on public.admin_users;
create policy admin_users_self_admin_only on public.admin_users
  for insert to authenticated
  with check (
    exists (
      select 1 from public.admin_users a
      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists admin_users_update_admin_only on public.admin_users;
create policy admin_users_update_admin_only on public.admin_users
  for update to authenticated
  using (
    exists (
      select 1 from public.admin_users a
      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  with check (
    exists (
      select 1 from public.admin_users a
      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

drop policy if exists admin_users_delete_admin_only on public.admin_users;
create policy admin_users_delete_admin_only on public.admin_users
  for delete to authenticated
  using (
    exists (
      select 1 from public.admin_users a
      where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

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
