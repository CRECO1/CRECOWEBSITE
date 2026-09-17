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
 *
 * Every network call is bounded by REQUEST_TIMEOUT_MS; the script never hangs.
 */

const HOST = 'www.crecotx.com';
const SITE_URL = `https://${HOST}`;
const KEY = '9246f38b795b1b2989ff05deba06c6f6';
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const REQUEST_TIMEOUT_MS = 20_000;

/** City / market landing pages — the geo surface AI answers cite most. */
const CITY_PATHS = [
  '/san-antonio-commercial-real-estate',
  '/fair-oaks-ranch-commercial-real-estate',
  '/boerne-commercial-real-estate',
  '/austin-commercial-real-estate',
  '/houston-commercial-real-estate',
  '/dallas-commercial-real-estate',
  '/san-antonio-office-space',
  '/san-antonio-industrial-space',
  '/san-antonio-retail-space',
  '/austin-office-space',
  '/austin-industrial-space',
  '/houston-office-space',
  '/houston-industrial-space',
  '/dallas-office-space',
  '/dallas-industrial-space',
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
  ...CITY_PATHS,
  '/llms.txt',
  '/llms-full.txt',
];

const toUrl = (path: string) =>
  /^https?:\/\//i.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

async function main() {
  const paths = process.argv.slice(2).filter(a => !a.startsWith('-'));
  const urlList = (paths.length > 0 ? paths : KEY_PATHS).map(toUrl);

  const payload = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };

  console.log(`IndexNow → ${ENDPOINT}`);
  console.log(`  host:        ${HOST}`);
  console.log(`  keyLocation: ${KEY_LOCATION}`);
  console.log(`  urlList:     ${urlList.length} URLs`);
  for (const u of urlList) console.log(`    ${u}`);

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
