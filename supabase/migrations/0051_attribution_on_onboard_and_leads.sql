-- Lead attribution parity.
--
-- A CRM audit found 0 of the site's leads carried a source: two submit paths
-- never captured attribution at all.
--
--   /api/inquiry  (get-started, career applications) writes to `leads`, which
--                 already has all seven columns — the route simply never read
--                 or persisted them. Fixed in the route; no schema change.
--   /api/onboard  (workspace signup) writes to `workspaces`, which had no
--                 attribution columns at all. Added here.
--
-- Also adds `leads.context`, mirroring subscribers.context, so a lead can
-- carry the same page/referrer/geo/device capture a subscriber does rather
-- than attribution being strictly poorer on the higher-intent path.
--
-- All nullable and additive: existing rows keep working and a submission that
-- arrives without attribution writes NULL.

alter table public.workspaces
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term     text,
  add column if not exists utm_content  text,
  add column if not exists referrer     text,
  add column if not exists landing_page text;

alter table public.leads
  add column if not exists context jsonb;

create index if not exists workspaces_utm_source_idx on public.workspaces (utm_source);
create index if not exists leads_utm_source_idx      on public.leads (utm_source);

comment on column public.workspaces.utm_source is
  'First-touch attribution captured at signup from the creco_attr cookie.';
comment on column public.leads.context is
  'Signup context: page_path, page_url, page_title, referrer, geo, device, surface. No IP.';
