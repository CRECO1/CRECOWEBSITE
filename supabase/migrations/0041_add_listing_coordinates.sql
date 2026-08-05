-- 0041_add_listing_coordinates.sql
--
-- FIX: the listings map renders empty because the `listings` table is missing
-- the coordinate columns the map + geocoder depend on.
--
-- The app code all assumes these columns exist:
--   * src/lib/supabase.ts        (Listing type declares latitude/longitude/geocoded_at)
--   * src/components/listings/ListingsMap.tsx   (filters to rows WITH lat/lng)
--   * src/app/api/cron/geocode-listings/route.ts (queries `is latitude null`, writes lat/lng)
-- ...but no earlier migration ever added them (0001 defines listings without
-- them, and nothing after adds them). On any database built purely from these
-- migrations, every listing comes back from `select('*')` with no coordinates,
-- so the map filters them all out and shows "No mapped properties match," and
-- the geocode cron errors because the column it queries doesn't exist.
--
-- Idempotent — safe to run even if some columns already exist.

alter table public.listings
  add column if not exists latitude    double precision,
  add column if not exists longitude   double precision,
  add column if not exists geocoded_at timestamptz;

-- Makes the geocode cron's "ungeocoded active/pending" scan cheap.
create index if not exists listings_ungeocoded_idx
  on public.listings (status)
  where latitude is null;
