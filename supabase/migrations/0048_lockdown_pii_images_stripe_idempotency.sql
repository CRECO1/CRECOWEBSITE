-- 0048 — Security remediation: lock down PII reads, gate image writes, harden Stripe idempotency
-- ============================================================================================
-- APPLY THIS MANUALLY in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
-- The whole script is one transaction and SELF-VERIFIES: the DO block at the end simulates a
-- billing admin and an anonymous "attacker" JWT and RAISEs (rolling everything back) if the admin
-- would lose access or a non-admin could still read. If it prints "VERIFIED ✓", it committed.
--
-- Findings addressed:
--   HIGH   leads / subscribers / admin_users had SELECT+UPDATE+DELETE granted to *any* authenticated
--          user (USING true). Because /api/onboard lets anyone self-provision an authenticated
--          account, that made every captured lead + newsletter subscriber (name, email, phone,
--          message) world-readable and deletable. Scope reads/writes to billing admins; KEEP the
--          public INSERT policies so the marketing forms still work.
--   MEDIUM the public `images` storage bucket allowed INSERT/UPDATE/DELETE by any authenticated user
--          (only bucket_id was checked). Gate writes on is_billing_admin(), matching how the
--          `receipts` and `tax-documents` buckets are already locked down. Public SELECT is kept.
--   MEDIUM Stripe payment idempotency was a read-then-insert with no DB uniqueness, so two concurrent
--          webhook deliveries could double-record a payment (paid_amount = 2×total). Add a partial
--          unique index; the webhook code now treats the resulting 23505 as an idempotent no-op.

begin;

-- ── HIGH: leads ─────────────────────────────────────────────────────────────
drop policy if exists "authenticated read leads"   on public.leads;
drop policy if exists "authenticated update leads" on public.leads;
drop policy if exists "authenticated delete leads" on public.leads;
create policy "admin read leads"   on public.leads for select to authenticated using (public.is_billing_admin());
create policy "admin update leads" on public.leads for update to authenticated using (public.is_billing_admin()) with check (public.is_billing_admin());
create policy "admin delete leads" on public.leads for delete to authenticated using (public.is_billing_admin());
-- ("public insert leads" is intentionally left in place so the site's forms keep working)

-- ── HIGH: subscribers ───────────────────────────────────────────────────────
drop policy if exists "authenticated read subscribers"   on public.subscribers;
drop policy if exists "authenticated update subscribers" on public.subscribers;
drop policy if exists "authenticated delete subscribers" on public.subscribers;
create policy "admin read subscribers"   on public.subscribers for select to authenticated using (public.is_billing_admin());
create policy "admin update subscribers" on public.subscribers for update to authenticated using (public.is_billing_admin()) with check (public.is_billing_admin());
create policy "admin delete subscribers" on public.subscribers for delete to authenticated using (public.is_billing_admin());
-- ("public insert subscribers" left in place)

-- ── HIGH: admin_users (scope the SELECT; the write policies are already admin-only) ──
drop policy if exists "admin_users_select" on public.admin_users;
create policy "admin_users_select" on public.admin_users for select to authenticated using (public.is_billing_admin());

-- ── MEDIUM: images storage bucket — gate writes on is_billing_admin() ────────
drop policy if exists "authenticated upload images" on storage.objects;
drop policy if exists "authenticated update images" on storage.objects;
drop policy if exists "authenticated delete images" on storage.objects;
create policy "admin upload images" on storage.objects for insert to authenticated
  with check (bucket_id = 'images' and public.is_billing_admin());
create policy "admin update images" on storage.objects for update to authenticated
  using (bucket_id = 'images' and public.is_billing_admin())
  with check (bucket_id = 'images' and public.is_billing_admin());
create policy "admin delete images" on storage.objects for delete to authenticated
  using (bucket_id = 'images' and public.is_billing_admin());
-- ("public read images" left in place so listing photos keep loading)

-- ── MEDIUM: Stripe idempotency — back it with a real unique constraint ───────
create unique index if not exists invoice_payments_stripe_session_uidx
  on public.invoice_payments (invoice_id, notes) where source = 'stripe';

-- ── SELF-VERIFY (aborts + rolls back the whole transaction on any failure) ───
do $$
declare
  total_leads int; admin_leads int;
  att_leads int; att_subs int; att_admins int; leftover int;
begin
  select count(*) into total_leads from public.leads;   -- ground truth (postgres bypasses RLS)

  -- (a) a billing admin keeps FULL read access
  perform set_config('request.jwt.claims', '{"email":"zack@crecotx.com","role":"authenticated"}', true);
  set local role authenticated;
  if not public.is_billing_admin() then reset role; raise exception 'ABORT: admin no longer resolves as billing admin'; end if;
  select count(*) into admin_leads from public.leads;
  reset role;
  if admin_leads <> total_leads then raise exception 'ABORT: admin lost rows (sees %/%)', admin_leads, total_leads; end if;

  -- (b) a non-admin authenticated user (the attacker) sees NOTHING
  perform set_config('request.jwt.claims', '{"email":"attacker@evil.example","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into att_leads  from public.leads;
  select count(*) into att_subs   from public.subscribers;
  select count(*) into att_admins from public.admin_users;
  reset role;
  if att_leads <> 0 or att_subs <> 0 or att_admins <> 0 then
    raise exception 'ABORT: attacker still reads (leads=%, subs=%, admins=%)', att_leads, att_subs, att_admins;
  end if;

  -- (c) no permissive images-write policy slipped through the rename
  select count(*) into leftover from pg_policies
    where schemaname='storage' and tablename='objects' and cmd in ('INSERT','UPDATE','DELETE')
      and (coalesce(qual,'')||coalesce(with_check,'')) like '%images%'
      and (coalesce(qual,'')||coalesce(with_check,'')) not like '%is_billing_admin%';
  if leftover <> 0 then raise exception 'ABORT: % permissive images-write policy(ies) remain', leftover; end if;

  raise notice 'VERIFIED ✓  admin reads %/% leads; attacker sees 0/0/0; image writes admin-gated.', admin_leads, total_leads;
end $$;

commit;
