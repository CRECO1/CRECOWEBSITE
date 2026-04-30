-- ============================================================================
-- CRECO – Supabase Storage setup
--
-- Creates the public `images` bucket the admin uses for property photos,
-- agent headshots, submarket photos, hero images, etc. Adds RLS policies on
-- storage.objects so:
--   - anyone can read (public bucket → images load on the public site)
--   - signed-in admin users can insert / update / delete
-- ============================================================================

-- Public bucket
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = excluded.public;

-- Drop existing policies (idempotent)
drop policy if exists "public read images"            on storage.objects;
drop policy if exists "authenticated upload images"   on storage.objects;
drop policy if exists "authenticated update images"   on storage.objects;
drop policy if exists "authenticated delete images"   on storage.objects;

create policy "public read images"
  on storage.objects for select
  using (bucket_id = 'images');

create policy "authenticated upload images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images');

create policy "authenticated update images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images')
  with check (bucket_id = 'images');

create policy "authenticated delete images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images');
