-- Double opt-in for newsletter and property-alert signups.
--
-- confirmed_at defaulted to now(), so every row was born confirmed and a bot
-- that could POST once became a "subscriber" and a CRM contact. Now a signup
-- lands unconfirmed with a token, and only becomes real when someone clicks
-- the link in their inbox — which a bot will not do, and which proves the
-- address is reachable.
--
-- Lead-magnet downloads keep the old behaviour: the guide itself is emailed to
-- that address, so delivery is already the proof, and making someone confirm
-- before handing over a PDF they asked for is friction with no gain.

alter table public.subscribers
  add column if not exists confirm_token text,
  add column if not exists confirm_sent_at timestamptz;

-- New signups are unconfirmed until they click. Existing rows keep their
-- confirmed_at — they are already opted in and must not be re-challenged.
alter table public.subscribers
  alter column confirmed_at drop default;

create unique index if not exists subscribers_confirm_token_key
  on public.subscribers (confirm_token)
  where confirm_token is not null;

create index if not exists subscribers_unconfirmed_idx
  on public.subscribers (created_at)
  where confirmed_at is null;

comment on column public.subscribers.confirm_token is
  'Single-use opt-in token. Cleared when confirmed_at is set.';
comment on column public.subscribers.confirmed_at is
  'Set when the subscriber clicks the confirmation link. NULL = pending, do not email or push to CRM.';
