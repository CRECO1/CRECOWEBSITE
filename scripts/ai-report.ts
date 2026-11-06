/**
 * Monthly AI-crawler report for crecotx.com, from public.crawler_hits.
 *
 * Usage (needs the prod service-role key; `vercel env pull` it, never commit it):
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run ai-report -- [days=30]
 *
 * "Real" hits exclude scanner probes (.env, wp-admin, userfiles, ...) that spoof bot user-agents,
 * and robots/sitemap/llms fetches (reported separately). "User-triggered" bots (ChatGPT-User,
 * Claude-User, Perplexity-User) fetch a page because a person asked an assistant about it, so
 * they are the closest thing to AI demand we can measure here.
 */
const days = Number(process.argv[2]) || 30;
const URL_ = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
if (!URL_ || !KEY) { console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const SCANNER = /\.env|environ|\.git|wp-|phpmyadmin|userfiles|@fs|\.php|\.aws|\/admin|\/manage|\/api\/|xmlrpc|cgi-bin/i;
const FILES = /^\/(robots\.txt|sitemap[^/]*\.xml|llms(-full)?\.txt)$/;
const USER_BOTS = /^(ChatGPT-User|Claude-User|Perplexity-User|MistralAI-User|Meta-ExternalFetcher)$/;
const SEARCH = /^(Googlebot|Bingbot)$/;

type Hit = { bot_name: string; path: string; created_at: string };
async function load(sinceIso: string, untilIso?: string): Promise<Hit[]> {
  const out: Hit[] = [];
  for (let o = 0; ; o += 1000) {
    const q = `select=bot_name,path,created_at&host=in.(www.crecotx.com,crecotx.com)&created_at=gte.${sinceIso}${untilIso ? `&created_at=lt.${untilIso}` : ''}&order=created_at.asc`;
    const r = await fetch(`${URL_}/rest/v1/crawler_hits?${q}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${o}-${o + 999}`, 'Range-Unit': 'items' } });
    const rows = await r.json();
    if (!Array.isArray(rows)) throw new Error(JSON.stringify(rows));
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}
const count = <T,>(xs: T[], f: (x: T) => string) => { const m = new Map<string, number>(); xs.forEach(x => m.set(f(x), (m.get(f(x)) ?? 0) + 1)); return [...m.entries()].sort((a, b) => b[1] - a[1]); };

(async () => {
  const now = Date.now(), d = (n: number) => new Date(now - n * 864e5).toISOString();
  const cur = await load(d(days)), prev = await load(d(days * 2), d(days));
  const real = (h: Hit[]) => h.filter(x => !SCANNER.test(x.path) && !FILES.test(x.path));
  const ai = (h: Hit[]) => real(h).filter(x => !SEARCH.test(x.bot_name));
  console.log(`\nCRECO AI-crawler report, last ${days} days vs the ${days} before\n`);
  console.log(`All tracked hits:     ${cur.length}  (prev ${prev.length})`);
  console.log(`Scanner probes cut:   ${cur.filter(x => SCANNER.test(x.path)).length}`);
  console.log(`AI content hits:      ${ai(cur).length}  (prev ${ai(prev).length})`);
  console.log(`Distinct pages read:  ${new Set(ai(cur).map(x => x.path)).size}  (prev ${new Set(ai(prev).map(x => x.path)).size})`);
  const uc = ai(cur).filter(x => USER_BOTS.test(x.bot_name)), up = ai(prev).filter(x => USER_BOTS.test(x.bot_name));
  console.log(`User-triggered fetches (a person asked an AI): ${uc.length}  (prev ${up.length})`);
  console.log('\nBy bot (content hits, prev):');
  const pm = new Map(count(ai(prev), x => x.bot_name));
  for (const [b, n] of count(ai(cur), x => x.bot_name)) console.log(`  ${b.padEnd(22)} ${String(n).padStart(6)}  (${pm.get(b) ?? 0})`);
  console.log('\nTop pages AI read:'); count(ai(cur), x => x.path).slice(0, 12).forEach(([p, n]) => console.log(`  ${String(n).padStart(5)}  ${p}`));
  console.log('\nTop pages people asked AI about:'); count(uc, x => x.path).slice(0, 10).forEach(([p, n]) => console.log(`  ${String(n).padStart(5)}  ${p}`));
  const f = cur.filter(x => FILES.test(x.path) && !SEARCH.test(x.bot_name));
  console.log('\nRules/maps fetched by AI bots:'); count(f, x => x.path).forEach(([p, n]) => console.log(`  ${String(n).padStart(5)}  ${p}`));
  console.log('\nNot measured here: AI referral clicks (GA4 > Acquisition > chatgpt.com / claude.ai / perplexity.ai) and leads tagged "AI Agent Inquiry" in the CRM.\n');
})().catch(e => { console.error(e); process.exit(1); });
