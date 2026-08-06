-- 0043_receipts_admin_stopgap.sql
--
-- SECURITY stopgap. The receipts bucket (migration 0026) gated its four
-- policies only on `bucket_id = 'receipts'` + `to authenticated` — no
-- workspace or path check. So ANY authenticated user (including a
-- self-onboarded stranger who is NOT in admin_users) could list /
-- download / createSignedUrl / remove EVERY workspace's expense receipts,
-- which show vendor, address, card last-4, and amounts.
--
-- Until receipts are re-pathed under a `${workspace.slug}/` prefix with an
-- is_workspace_member()-based storage policy (tracked separately), gate the
-- bucket on public.is_billing_admin() — exactly mirroring the tax-documents
-- (W-9) bucket in migration 0030. Only allowlisted admins (currently just
-- CRECO) can touch receipts, which closes the outsider-reachable
-- read/delete today. Note: this intentionally means non-admin workspace
-- members can't use receipts yet — acceptable while the app is single-tenant.

drop policy if exists "auth read receipts"   on storage.objects;
drop policy if exists "auth upload receipts" on storage.objects;
drop policy if exists "auth update receipts" on storage.objects;
drop policy if exists "auth delete receipts" on storage.objects;

create policy "auth read receipts"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'receipts' and public.is_billing_admin());

create policy "auth upload receipts"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts' and public.is_billing_admin());

create policy "auth update receipts"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'receipts' and public.is_billing_admin())
  with check (bucket_id = 'receipts' and public.is_billing_admin());

create policy "auth delete receipts"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'receipts' and public.is_billing_admin());
