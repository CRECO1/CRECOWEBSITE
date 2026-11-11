/**
 * IndexNow submission — pushes CRECO's key URLs to the IndexNow network so a
 * corrected page gets recrawled in hours instead of waiting on a natural crawl.
 *
 * One POST to api.indexnow.org fans out to every participating engine: Bing
 * (and therefore ChatGPT Search + Copilot, which read Bing's index), Yandex,
 * Seznam, Naver. Google does NOT consume IndexNow — for Google, the owner still
 * has to request indexing in Search Console (see docs/ or the README note).
 *
 * The key is a public shared secret: it proves we control the host, because
 * IndexNow fetches `keyLocation` and checks the file contains the same string.
 * That's why the key file lives in /public and is committed — it is meant to be
 * served, not hidden.
 *
 * Usage:
 *   npm run indexnow                    # submit the standard key-page list
 *   npm run indexnow -- /some/new-page  # submit only the paths given
 *   npm run indexnow -- --sitemap       # submit every URL in the live sitemap.xml
 *   npm run indexnow -- --from-diff A B # submit only pages affected by files changed A..B (add --dry to preview)
 *
 * Run it AFTER a deploy is live (IndexNow makes the engines fetch the URL now).
 *
 * Every network call is bounded by REQUEST_TIMEOUT_MS; the script never hangs.
 */

const HOST = 'www.crecotx.com';
const SITE_URL = `https://${HOST}`;
const KEY = '9246f38b795b1b2989ff05deba06c6f6';
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const REQUEST_TIMEOUT_MS = 20_000;

/** City / market landing pages — the geo surface AI answers cite most.
 *  Austin / Houston / Dallas hubs are noindex (outside the San Antonio & Hill Country focus),
 *  so they are deliberately NOT submitted here. */
const CITY_PATHS = [
  '/san-antonio-commercial-real-estate',
  '/fair-oaks-ranch-commercial-real-estate',
  '/boerne-commercial-real-estate',
  '/san-antonio-office-space',
  '/san-antonio-industrial-space',
  '/san-antonio-retail-space',
];

/**
 * The pages whose CONTENT changed in the identity/positioning corrections —
 * name, NAP, "not tenant-only" representation copy, and the org JSON-LD that
 * every page embeds. llms.txt / llms-full.txt are included because they are the
 * files AI crawlers read first.
 */
export const KEY_PATHS = [
  '/',
  '/about',
  '/services',
  '/landlord-representation',
  '/owner-services',
  '/seller-investor-representation',
  '/listings',
  '/market-brief',
  '/markets',
  ...CITY_PATHS,
  '/llms.txt',
  '/llms-full.txt',
];

const toUrl = (path: string) =>
  /^https?:\/\//i.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** Every <loc> in the live sitemap that belongs to this host (IndexNow rejects others). */
async function sitemapUrls(): Promise<string[]> {
  const res = await fetch(`${SITE_URL}/sitemap.xml`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`sitemap.xml returned HTTP ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]);
  return urls.filter(u => new URL(u).host === HOST);
}


/**
 * Repo files changed in a deploy -> site paths worth re-pinging.
 *
 * The sitemap's lastmod for static pages is one hand-set date (CONTENT_REVISED),
 * so the daily /api/cron/indexnow job can't see an edit to /listings or
 * /get-started. `--from-diff <base> <head>` closes that gap: it maps the files a
 * deploy changed to the routes they render, so a deploy pings exactly those.
 *   - src/app/<route>/**           -> that route (dynamic segments collapse to the
 *                                     parent: listings/[slug]/x -> /listings)
 *   - shared components, schema, copy modules, root layout -> KEY_PATHS
 *   - public/llms.txt              -> the llms files
 * Anything else (api, scripts, docs, billing/admin/CRM code) pings nothing.
 */
const PRIVATE_ROUTE = /^(api|admin|manage|billing|client|r|inv|_|sign|unsubscribe|thank)/;
const SHARED_FILE = /^(src\/components\/(?!billing|admin|crm)|src\/app\/layout\.tsx$|src\/lib\/(schema|brand|answers|submarkets-content|featured-properties|public-listings|utils)\.ts$)/;

export function pathsForChangedFiles(files: string[]): string[] {
  const out = new Set<string>();
  let shared = false;
  for (const f of files) {
    if (f === 'public/llms.txt') { out.add('/llms.txt'); out.add('/llms-full.txt'); continue; }
    if (SHARED_FILE.test(f)) { shared = true; continue; }
    const m = f.match(/^src\/app\/(.+)$/);
    if (!m) continue;
    const segs = m[1].split('/').slice(0, -1).filter(s => !/^\(.*\)$/.test(s)); // drop the filename + route groups
    const stat: string[] = [];
    for (const s of segs) { if (s.startsWith('[')) break; stat.push(s); }
    if (segs.length === 0) { if (/^page\.tsx?$/.test(m[1])) out.add('/'); continue; }
    if (stat.length === 0 || PRIVATE_ROUTE.test(stat[0])) continue;
    out.add(`/${stat.join('/')}`);
  }
  if (shared) KEY_PATHS.forEach(p => out.add(p));
  return [...out];
}

async function changedPaths(base: string, head: string): Promise<string[]> {
  const { execFileSync } = await import('node:child_process');
  const names = execFileSync('git', ['diff', '--name-only', base, head], { encoding: 'utf8' })
    .split('\n').map(s => s.trim()).filter(Boolean);
  const wanted = pathsForChangedFiles(names);
  // Only submit what the live sitemap actually lists — never a noindex or private route.
  const inMap = new Set((await sitemapUrls()).map(u => new URL(u).pathname.replace(/\/$/, '') || '/'));
  return wanted.filter(p => inMap.has(p.replace(/\/$/, '') || '/') || /^\/llms(-full)?\.txt$/.test(p));
}

async function main() {
  const args = process.argv.slice(2);
  const diffAt = args.indexOf('--from-diff');
  const dry = args.includes('--dry');
  const paths = args.filter((a, i) => !a.startsWith('-') && !(diffAt >= 0 && (i === diffAt + 1 || i === diffAt + 2)));
  const useSitemap = args.includes('--sitemap');
  let urlList: string[];
  if (diffAt >= 0) {
    const [base, head] = [args[diffAt + 1], args[diffAt + 2]];
    if (!base || !head) { console.error('Usage: --from-diff <base> <head>'); process.exit(1); }
    urlList = (await changedPaths(base, head)).map(toUrl).slice(0, 500);
    if (urlList.length === 0) { console.log(`No page-affecting changes in ${base.slice(0, 7)}..${head.slice(0, 7)} — nothing to submit.`); return; }
  } else {
    // A single IndexNow POST carries at most 10,000 URLs; the sitemap is far smaller.
    urlList = (useSitemap ? await sitemapUrls() : (paths.length > 0 ? paths : KEY_PATHS).map(toUrl)).slice(0, 10_000);
  }

  const payload = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };

  console.log(`IndexNow → ${ENDPOINT}`);
  console.log(`  host:        ${HOST}`);
  console.log(`  keyLocation: ${KEY_LOCATION}`);
  console.log(`  urlList:     ${urlList.length} URLs`);
  for (const u of urlList) console.log(`    ${u}`);

  if (dry) { console.log('\n--dry: not sent.'); return; }

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    console.error(`\nRequest failed (or timed out after ${REQUEST_TIMEOUT_MS}ms):`, err);
    process.exit(1);
  }

  const body = await res.text().catch(() => '');
  console.log(`\nHTTP ${res.status} ${res.statusText}`);
  if (body.trim()) console.log(body.trim());

  // 200 = accepted, 202 = accepted but key validation still pending. Anything
  // else (403 = key file not reachable, 422 = URLs don't match the host) is a
  // real failure worth a non-zero exit so CI / a wrapper notices.
  if (res.status === 200 || res.status === 202) {
    console.log('\nSubmitted. Bing/Copilot/ChatGPT Search and Yandex consume this feed.');
    console.log('Google does not — request indexing in Search Console separately.');
  } else {
    process.exit(1);
  }
}

main();
