-- ============================================================================
-- W-9 attachment — auto-attach the broker's W-9 to outgoing invoice emails
-- ============================================================================
-- Pain point: corporate AP departments routinely refuse to cut a check until
-- a W-9 is on file. The current flow forces the operator to remember to
-- attach it manually (or to wait for the request and respond with an email
-- thread). This migration adds the persistence layer for a one-time-upload,
-- always-attach experience.
--
-- Storage: dedicated private bucket. Distinct from `receipts/` because the
-- W-9 has different access semantics — it's the broker's own document,
-- expected to be shared with clients, lives forever, single canonical copy.
-- Receipts are inbound, transient, and tied to individual expense rows.
--
-- Schema: `invoice_settings.w9_storage_path` holds the bucket path
-- (e.g. "2026/06/abc123.pdf") when a W-9 is uploaded; null when not.
-- `w9_filename` holds the original filename for display + the attachment
-- name in outgoing emails ("W-9 — CRECO LLC.pdf" reads better than the
-- random UUID we use as the storage key).
-- ============================================================================

-- ── Storage bucket ──────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('tax-documents', 'tax-documents', false)
on conflict (id) do nothing;

-- Storage policies. Operators (billing admins) can upload + read + replace.
-- Service-role contexts (cron, manual send route) bypass RLS via the
-- service-role key and read directly. No public/anon access — signed URLs
-- only, generated at view time.
drop policy if exists "tax_documents_admin_select" on storage.objects;
create policy "tax_documents_admin_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'tax-documents'
    and public.is_billing_admin()
  );

drop policy if exists "tax_documents_admin_insert" on storage.objects;
create policy "tax_documents_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tax-documents'
    and public.is_billing_admin()
  );

drop policy if exists "tax_documents_admin_update" on storage.objects;
create policy "tax_documents_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'tax-documents'
    and public.is_billing_admin()
  )
  with check (
    bucket_id = 'tax-documents'
    and public.is_billing_admin()
  );

drop policy if exists "tax_documents_admin_delete" on storage.objects;
create policy "tax_documents_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tax-documents'
    and public.is_billing_admin()
  );

-- ── invoice_settings columns ────────────────────────────────────────────────
alter table public.invoice_settings
  add column if not exists w9_storage_path text,
  add column if not exists w9_filename     text,
  add column if not exists w9_uploaded_at  timestamptz;

comment on column public.invoice_settings.w9_storage_path is
  'Storage path inside the tax-documents bucket. NULL when no W-9 has '
  'been uploaded. Format: "YYYY/MM/<uuid>.pdf". Server-side send code '
  'fetches this binary and attaches it to every outgoing invoice email.';

comment on column public.invoice_settings.w9_filename is
  'Original filename at upload time. Used as the attachment name in '
  'outgoing emails — "W-9 — CRECO LLC.pdf" reads better than the random '
  'storage key. Also displayed on the settings UI to confirm the right '
  'file is on file.';
