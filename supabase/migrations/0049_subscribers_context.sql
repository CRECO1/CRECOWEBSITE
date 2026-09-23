-- Signup context for subscribers.
--
-- The notification email could only say "property-alerts-inline" — the widget
-- id — because that plus email and name was all the row ever held. This adds
-- the page the visitor was on, how they reached the site, coarse geo and the
-- device, so "where did this come from?" is answerable from the row itself and
-- not only from a GA event.
--
-- Nullable and additive: every existing row keeps working, and a submission
-- that arrives without context (an older cached bundle, a direct API post)
-- simply writes NULL.
--
-- Deliberately NOT stored: the IP address. Vercel resolves it to city/region
-- at the edge and only those land here.
alter table public.subscribers
  add column if not exists context jsonb;

comment on column public.subscribers.context is
  'Signup context: page_path, page_url, page_title, referrer, geo, device, surface, utm_*. No IP.';

create index if not exists subscribers_context_page_path_idx
  on public.subscribers ((context ->> 'page_path'));
