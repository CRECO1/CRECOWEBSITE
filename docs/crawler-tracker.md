# AI / search crawler tracker

Every request to crecotx.com whose user-agent matches a tracked bot writes one row
to `public.crawler_hits` in this site's own Supabase project (`lzynidkwnvwdpyluiqhg`,
not the CRM's). Human traffic is never logged.

- Detection + insert: `src/lib/crawler-hits.ts`, called from `src/middleware.ts`
  through `event.waitUntil()`, so the write happens after the response is sent and
  can never slow down or break a page. Same implementation as the Fair Oaks site.
- Schema + views: `supabase/migrations/0052_crawler_hits.sql`.
- Retention: **no prune job yet.** This site has no retention cron (the
  `/api/cron/dispatch` jobs are billing and follow-ups only). Volume is small — a few
  thousand rows a month — so it's fine for a long time. To keep a year, run this in
  the SQL Editor occasionally, or add it as a sub-cron in `/api/cron/dispatch`:

  ```sql
  delete from crawler_hits where created_at < now() - interval '365 days';
  ```

Tracked bots: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User,
PerplexityBot, Perplexity-User, Googlebot, Bingbot, Applebot, Amazonbot,
Meta-ExternalAgent, CCBot, Bytespider.

| column | meaning |
|---|---|
| `id` | identity primary key |
| `bot_name` | canonical bot name (`GPTBot`, `ClaudeBot`, …) |
| `path` | pathname only; the query string is dropped so tokens and emails are never stored |
| `status` | set when middleware answered the request itself (e.g. `307` login redirect on `/admin`). `null` = the page was rendered by the app, and middleware can't see that status. For full status codes use `vercel logs --status-code 404`. |
| `user_agent` | raw UA (first 512 chars) |
| `host` | request host |
| `created_at` | timestamp (UTC) |

User-agents can be spoofed. Googlebot in particular is often faked by scanners, so treat
the counts as a trend signal, not as verified crawler identity.

## Viewing it

Supabase dashboard → project **lzynidkwnvwdpyluiqhg** → **Table Editor**, and open
`crawler_hits` or one of these views (or `select * from <view>` in the **SQL Editor**):

| view | shows |
|---|---|
| `crawler_hits_by_day` | hits per bot per day (Central time) and distinct paths |
| `crawler_top_paths_30d` | most-crawled paths over the last 30 days and which bots hit them |
| `crawler_ai_files` | per bot: hits, first seen and last seen on `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt` |

The views and the table are not exposed to the public API (anon and authenticated have
no grants, RLS on with no policies). Only the dashboard and the service role can read them.

### Handy ad-hoc queries (SQL Editor)

```sql
-- AI bots only (no Google/Bing), last 14 days, by day
select (created_at at time zone 'America/Chicago')::date as day, bot_name, count(*)
  from crawler_hits
 where bot_name not in ('Googlebot', 'Bingbot')
   and created_at > now() - interval '14 days'
 group by 1, 2 order by 1 desc, 3 desc;

-- User-triggered AI fetches: someone asked ChatGPT / Claude / Perplexity
-- a question and the assistant opened our page live to answer it.
select created_at at time zone 'America/Chicago' as at_ct, bot_name, path
  from crawler_hits
 where bot_name in ('ChatGPT-User', 'Claude-User', 'Perplexity-User')
 order by created_at desc limit 100;

-- Which pages do assistants open most when people ask about us? (last 30 days)
select path, bot_name, count(*)
  from crawler_hits
 where bot_name in ('ChatGPT-User', 'Claude-User', 'Perplexity-User')
   and created_at > now() - interval '30 days'
 group by 1, 2 order by 3 desc limit 50;

-- AI training/index crawlers vs. user-triggered, per week
select date_trunc('week', created_at) as week,
       count(*) filter (where bot_name in ('ChatGPT-User', 'Claude-User', 'Perplexity-User')) as user_triggered,
       count(*) filter (where bot_name not in ('ChatGPT-User', 'Claude-User', 'Perplexity-User', 'Googlebot', 'Bingbot')) as ai_crawlers,
       count(*) filter (where bot_name in ('Googlebot', 'Bingbot')) as search
  from crawler_hits
 group by 1 order by 1 desc;

-- Did anyone fetch llms.txt / llms-full.txt yet?
select * from crawler_ai_files where path like '/llms%';
```
