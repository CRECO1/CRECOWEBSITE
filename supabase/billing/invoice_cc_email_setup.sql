-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════
-- HOW TO RUN (once, ~1 minute): Supabase dashboard → the BILLING project (the crecotx.com website's own
-- project, the one with the invoices and invoice_settings tables) → SQL Editor → New query → paste this whole
-- file → Run. "Success" with one result row (INV-2026-1015 / brian@crecotx.com / draft) means it worked.
-- Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════
--
-- 1. Adds the per-invoice CC column (same as supabase/migrations/0053_invoice_cc_email.sql). Nullable and
--    additive; every existing invoice is unchanged. There is NO global / default CC anywhere — a CC exists only
--    on an invoice where one is set.
-- 2. Sets brian@crecotx.com as the CC on INV-2026-1015 only, and only while it is still an unsent draft.

alter table public.invoices
  add column if not exists cc_email text;

comment on column public.invoices.cc_email is
  'Optional CC address copied when the invoice is emailed. Per-invoice only; pre-fills the Compose modal. After a send it records who was CC''d.';

update public.invoices
   set cc_email = 'brian@crecotx.com'
 where invoice_number = 'INV-2026-1015'
   and status = 'draft'
   and sent_at is null;

-- Result: should show one row — INV-2026-1015, brian@crecotx.com, draft.
select invoice_number, status, sent_at, cc_email
  from public.invoices
 where invoice_number = 'INV-2026-1015';
