-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════
-- HOW TO RUN (once, ~1 minute): Supabase dashboard → the CRM project (the one with the site_events and
-- site_pageviews tables) → SQL Editor → New query → paste this whole file → Run. "Success. No rows returned"
-- means it worked. Safe to re-run. Then read the results with:
--     select * from ai_funnel_30d;            -- AI visitors by assistant and landing page
--     select * from ai_vs_other_funnel_30d;   -- AI vs everyone else
--     select * from home_first_click_30d;     -- what people click first on the homepage
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════

-- AI-referral conversion funnel + homepage first-click views for crecotx.com.
--
-- RUN IN THE CRM SUPABASE PROJECT (the one that holds site_pageviews / site_events — the first-party tracker's
-- sink, written by the Fair Oaks ingest at /api/track). It is NOT this site's own project, so this file is not
-- in supabase/migrations/ and is not applied by anything automatically: paste it into the CRM project's SQL
-- Editor once. Re-running is safe (create or replace).
--
-- Reads (written by src/lib/tracker.ts + src/lib/conversion-signals.ts):
--   site_events.meta->>'ai_source'     AI assistant that sent the visit (chatgpt, perplexity, claude, gemini, copilot, grok …).
--                                      The ingest drops env.ai_source from pageview rows (verified live 2026-10-08), so the event meta is
--                                      the stored label; env and utm/referrer are kept as fallbacks.
--   site_events.type = 'home_click'    first three homepage clicks; label "<section>:<id>", value = seconds since load
--   site_events.type = 'intent_reached' arrival on get-started / valuation / contact / list / sell …
--   phone_tap / text_tap / phone_call / sms_click, lead_form_started, *_submitted / *_subscribed / *_requested
--
-- Sessions before the tracker shipped ai_source have no env label, so the label is also derived from utm_source /
-- referrer here (same list as classifyAiSource() in tracker.ts). Datacenter cities are excluded, matching the
-- site's analytics gate. No PII is read or produced — session ids, paths and fixed labels only.
--
-- Retention: 12 months, enforced by /api/cron/tracking-retention on the site (crecotx rows only).

create or replace view public.site_sessions_30d with (security_invoker = true) as
with landing as (
  select distinct on (session_id)
         session_id, path as landing_path, created_at, nullif(env->>'ai_source', '') as env_ai,
         lower(coalesce(utm_source, '') || ' ' || coalesce(referrer, '')) as src
    from public.site_pageviews
   where site in ('crecotx.com', 'www.crecotx.com')
     and created_at > now() - interval '30 days'
     and coalesce(city, '') not in ('Ashburn', 'Boardman', 'Council Bluffs', 'Des Moines', 'West Des Moines',
                                    'Moses Lake', 'Quincy', 'The Dalles', 'Prineville', 'Singapore', 'Glenview')
   order by session_id, created_at
), ev as (
  select session_id,
         bool_or(type = 'home_click')                                                        as any_home_click,
         bool_or(type in ('intent_reached', 'lead_form_started'))                            as intent,
         bool_or(type in ('phone_tap', 'text_tap', 'phone_call', 'sms_click'))               as call_text,
         bool_or(type ~ '_(submitted|subscribed|requested)$' or type = 'generate_lead')      as lead,
         (array_agg(label order by created_at) filter (where type = 'home_click'))[1]        as first_home_click,
         max(meta->>'ai_source')                                                              as ev_ai
    from public.site_events
   where site in ('crecotx.com', 'www.crecotx.com')
     and created_at > now() - interval '30 days'
   group by session_id
)
select l.session_id,
       l.landing_path,
       l.created_at,
       coalesce(l.env_ai, e.ev_ai, case
         when l.src ~ 'chatgpt|openai\.com'                       then 'chatgpt'
         when l.src ~ 'perplexity'                                then 'perplexity'
         when l.src ~ 'claude'                                    then 'claude'
         when l.src ~ 'gemini\.google|bard\.google|(^|\s)gemini'  then 'gemini'
         when l.src ~ 'copilot'                                   then 'copilot'
         when l.src ~ '(^|[^a-z])grok|(^|[^a-z])x\.ai'            then 'grok'
         when l.src ~ 'meta\.ai|meta_ai'                          then 'meta_ai'
         when l.src ~ 'deepseek'                                  then 'deepseek'
         when l.src ~ 'chat\.mistral|(^|\s)mistral'               then 'mistral'
         when l.src ~ '(^|[^a-z])you\.com'                        then 'you'
         when l.src ~ 'phind\.com'                                then 'phind'
         when l.src ~ '(^|[^a-z])poe\.com'                        then 'poe'
         when l.src ~ 'duck\.ai'                                  then 'duckai'
       end) as ai_source,
       coalesce(e.any_home_click, false) as any_home_click,
       coalesce(e.intent, false)         as intent,
       coalesce(e.call_text, false)      as call_text,
       coalesce(e.lead, false)           as lead,
       e.first_home_click
  from landing l
  left join ev e using (session_id);

-- AI-referred sessions, by assistant and landing page.
create or replace view public.ai_funnel_30d with (security_invoker = true) as
select ai_source,
       landing_path,
       count(*)                                                       as sessions,
       count(*) filter (where any_home_click)                         as home_clicked,
       count(*) filter (where intent)                                 as reached_intent,
       count(*) filter (where call_text)                              as tapped_call_or_text,
       count(*) filter (where lead)                                   as leads,
       round(100.0 * count(*) filter (where intent)    / count(*), 1) as pct_intent,
       round(100.0 * count(*) filter (where call_text) / count(*), 1) as pct_call_text,
       round(100.0 * count(*) filter (where lead)      / count(*), 1) as pct_lead
  from public.site_sessions_30d
 where ai_source is not null
 group by ai_source, landing_path
 order by sessions desc;

-- Same funnel, AI vs everything else, so the AI numbers have a baseline.
create or replace view public.ai_vs_other_funnel_30d with (security_invoker = true) as
select case when ai_source is null then 'not_ai' else 'ai' end        as channel,
       count(*)                                                       as sessions,
       count(*) filter (where intent)                                 as reached_intent,
       count(*) filter (where call_text)                              as tapped_call_or_text,
       count(*) filter (where lead)                                   as leads,
       round(100.0 * count(*) filter (where intent)    / count(*), 1) as pct_intent,
       round(100.0 * count(*) filter (where call_text) / count(*), 1) as pct_call_text,
       round(100.0 * count(*) filter (where lead)      / count(*), 1) as pct_lead
  from public.site_sessions_30d
 group by 1
 order by 1;

-- What homepage visitors click first (sessions that landed on / ), AI vs other. first_home_click = "<section>:<id>".
create or replace view public.home_first_click_30d with (security_invoker = true) as
select case when ai_source is null then 'not_ai' else 'ai' end        as channel,
       coalesce(first_home_click, '(no click)')                       as first_click,
       count(*)                                                       as sessions,
       round(100.0 * count(*) / sum(count(*)) over (partition by case when ai_source is null then 'not_ai' else 'ai' end), 1) as pct_of_channel,
       count(*) filter (where intent)                                 as reached_intent,
       count(*) filter (where lead)                                   as leads
  from public.site_sessions_30d
 where landing_path = '/'
 group by 1, 2
 order by 1, 3 desc;

revoke all on public.site_sessions_30d, public.ai_funnel_30d, public.ai_vs_other_funnel_30d, public.home_first_click_30d
  from anon, authenticated;

-- Quick check after running (expect rows only once real visits have been tracked):
-- select * from ai_vs_other_funnel_30d;
