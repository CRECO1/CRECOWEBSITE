-- 0055 — Security audit 2026-10 remediation (H2, M10, M11)
-- ============================================================================================
-- APPLY MANUALLY in the Supabase SQL editor after review (same flow as 0048). One transaction,
-- idempotent, and it self-verifies: a non-admin "attacker" JWT must see/modify nothing in the
-- tables below, and a billing admin must keep access, or the whole thing rolls back.
--
-- H2   invoice_email_messages / invoice_views (0054) were FOR ALL TO authenticated USING (true), and
--      landing_pages (0003) allowed insert/update/delete for ANY authenticated user. Because
--      /api/onboard lets a visitor self-provision an authenticated account, that exposed every
--      tenant's recipient emails/IPs and let a stranger rewrite public landing pages.
--      → scoped to billing admins / workspace members; landing_pages writes are admin-only
--        (public SELECT is kept — the marketing site reads it with the anon key).
-- M10  leads / subscribers: remove EVERY direct-insert path for anon and authenticated. The four
--      public form routes write with the service-role key (behind reCAPTCHA, honeypot, rate limit
--      and validation); a direct PostgREST insert with the public publishable key bypassed all of
--      that. Folds in supabase/rls-anon-write-lockdown.sql (which left "authenticated insert").
-- M11  Server-side limits on the storage buckets: the browser-side type/size checks are bypassable.
--
-- NOT touched: invoice_counters (RLS state should be confirmed live; see REMEDIATION.md).
-- ============================================================================================

begin;

-- ── H2: invoice_email_messages ───────────────────────────────────────────────
drop policy if exists "admin_can_all_invoice_email_messages" on public.invoice_email_messages;
drop policy if exists "billing_admin_invoice_email_messages" on public.invoice_email_messages;
create policy "billing_admin_invoice_email_messages" on public.invoice_email_messages
  for all to authenticated
  using (public.is_billing_admin() or public.is_workspace_member(workspace_id))
  with check (public.is_billing_admin() or public.is_workspace_member(workspace_id));

-- ── H2: invoice_views ────────────────────────────────────────────────────────
drop policy if exists "admin_can_all_invoice_views" on public.invoice_views;
drop policy if exists "billing_admin_invoice_views" on public.invoice_views;
create policy "billing_admin_invoice_views" on public.invoice_views
  for all to authenticated
  using (public.is_billing_admin() or public.is_workspace_member(workspace_id))
  with check (public.is_billing_admin() or public.is_workspace_member(workspace_id));

-- ── H2: landing_pages (public read stays; writes admin-only) ────────────────
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'landing_pages'
             and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy %I on public.landing_pages', p.policyname);
  end loop;
end $$;
create policy "admin insert landing_pages" on public.landing_pages
  for insert to authenticated with check (public.is_billing_admin());
create policy "admin update landing_pages" on public.landing_pages
  for update to authenticated using (public.is_billing_admin()) with check (public.is_billing_admin());
create policy "admin delete landing_pages" on public.landing_pages
  for delete to authenticated using (public.is_billing_admin());

-- ── M10: leads / subscribers — no direct inserts from the API roles ─────────
drop policy if exists "public insert leads"              on public.leads;
drop policy if exists "authenticated insert leads"       on public.leads;
drop policy if exists "public insert subscribers"        on public.subscribers;
drop policy if exists "authenticated insert subscribers" on public.subscribers;
revoke insert on public.leads, public.subscribers from anon;
revoke insert, update, delete, truncate on all tables in schema public from anon;
alter default privileges in schema public revoke insert, update, delete, truncate on tables from anon;
-- service_role bypasses RLS and is what /api/leads, /api/inquiry, /api/tour-request,
-- /api/subscribe and the chat capture_lead tool use.

-- ── M11: bucket-level type + size limits ────────────────────────────────────
update storage.buckets set
  file_size_limit    = 10 * 1024 * 1024,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
where id = 'images';

update storage.buckets set
  file_size_limit    = 30 * 1024 * 1024,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
where id = 'receipts';

update storage.buckets set
  file_size_limit    = 5 * 1024 * 1024,
  allowed_mime_types = array['application/pdf']
where id = 'tax-documents';

-- ── Self-verify (rolls the transaction back on failure) ─────────────────────
do $$
declare n int;
begin
  perform set_config('request.jwt.claims', '{"email":"attacker@evil.example","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.invoice_views;           if n <> 0 then reset role; raise exception 'ABORT: attacker reads invoice_views'; end if;
  select count(*) into n from public.invoice_email_messages;  if n <> 0 then reset role; raise exception 'ABORT: attacker reads invoice_email_messages'; end if;
  reset role;

  select count(*) into n from pg_policies
   where schemaname = 'public' and tablename in ('leads', 'subscribers') and cmd in ('INSERT', 'ALL');
  if n <> 0 then raise exception 'ABORT: % insert policy(ies) remain on leads/subscribers', n; end if;

  select count(*) into n from pg_policies
   where schemaname = 'public' and tablename = 'landing_pages' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
     and (coalesce(qual, '') || coalesce(with_check, '')) not like '%is_billing_admin%';
  if n <> 0 then raise exception 'ABORT: % non-admin write policy(ies) remain on landing_pages', n; end if;

  raise notice 'VERIFIED ✓ 0055: invoice_* scoped, landing_pages admin-write, no direct lead/subscriber inserts, bucket limits set.';
end $$;

commit;
