-- 0026_receipts_bucket.sql
--
-- Private bucket for expense-receipt photos. Distinct from the public
-- `images` bucket (migration 0004) because receipts commonly show
-- vendor name, address, last-4 of card, and transaction amounts —
-- none of which should be enumerable via guessable URLs.
--
-- The bucket is private; the app generates short-lived signed URLs at
-- view time via supabase.storage.from('receipts').createSignedUrl().
-- Only authenticated operators can read or write. Anonymous visitors
-- get nothing.
--
-- File path layout inside the bucket: YYYY/MM/<uuid>.<ext> — year-month
-- foldering keeps the bucket browsable in the Supabase UI for tax-prep
-- and 1099 reviews. Random UUIDs per file prevent collisions on
-- rapid-fire captures (e.g., snapping 5 receipts in a row at lunch).
--
-- Applied to live DB via the Supabase MCP at commit time; file kept
-- here for the migration history.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "auth read receipts"   on storage.objects;
drop policy if exists "auth upload receipts" on storage.objects;
drop policy if exists "auth update receipts" on storage.objects;
drop policy if exists "auth delete receipts" on storage.objects;

create policy "auth read receipts"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'receipts');

create policy "auth upload receipts"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts');

create policy "auth update receipts"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'receipts')
  with check (bucket_id = 'receipts');

create policy "auth delete receipts"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'receipts');
