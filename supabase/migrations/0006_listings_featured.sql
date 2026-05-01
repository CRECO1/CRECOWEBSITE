-- ============================================================================
-- CRECO – Add `featured` flag to listings
--
-- Lets admins pin specific properties to the top of the homepage's "Featured
-- Properties" section regardless of listing date. Default false so existing
-- listings keep their date-ordered position.
-- ============================================================================

alter table public.listings
  add column if not exists featured boolean not null default false;

create index if not exists listings_featured_idx
  on public.listings (featured)
  where featured = true;
