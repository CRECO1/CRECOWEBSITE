/**
 * Renders the team's "new subscriber" notification to HTML files so it can be
 * reviewed without sending mail.
 *
 * It calls the same buildSignupContext() and renderSubscriberNotification()
 * the /api/subscribe route calls, with a stubbed request carrying the headers
 * Vercel would supply in production. Nothing is sent and nothing is written to
 * the database.
 *
 * Usage: npm run render:subscriber-email -- [out-dir]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildSignupContext } from '../src/lib/signup-context';
import { renderSubscriberNotification } from '../src/lib/subscriber-notification-email';

const DEFAULT_OUT_DIR = path.join(os.homedir(), 'Documents', 'CRECO', 'Marketing');

const MOBILE_IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const DESKTOP_MAC_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

/** Stand-in for the NextRequest — only its headers are read. */
const reqWith = (headers: Record<string, string>) => ({ headers: new Headers(headers) }) as never;

/** Wraps the email body so it opens standalone in a browser. */
const page = (title: string, subject: string, body: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;background:#F4F4F2;padding:28px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:680px;margin:0 auto">
    <div style="background:#fff;border:1px solid #E5E5E0;border-radius:8px 8px 0 0;padding:14px 20px">
      <div style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#9A9A92;margin-bottom:6px">Subject</div>
      <div style="font-size:14px;color:#1A1A1A;font-weight:600">${subject.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>
      <div style="margin-top:10px;font-size:12px;color:#6B6B6B">To: info@crecotx.com &nbsp;·&nbsp; From: CRECO &lt;noreply@crecotx.com&gt;</div>
    </div>
    <div style="background:#fff;border:1px solid #E5E5E0;border-top:0;border-radius:0 0 8px 8px;padding:22px 20px">
${body}
    </div>
  </div>
</body>
</html>
`;

// ── 1. Inline card: email only, no criteria ──────────────────────────────────
const inlineCtx = buildSignupContext(
  reqWith({
    'x-vercel-ip-city': 'San%20Antonio',
    'x-vercel-ip-country-region': 'TX',
    'x-vercel-ip-country': 'US',
    'user-agent': MOBILE_IOS_UA,
  }),
  {
    source: 'property-alerts-inline',
    surface: 'listings-bottom',
    page_path: '/listings?type=warehouse&city=San+Antonio',
    page_url: 'https://www.crecotx.com/listings?type=warehouse&city=San+Antonio',
    page_title: 'Texas Commercial Properties for Lease & Sale | CRECO',
    referrer: 'https://www.google.com/search',
    viewport_width: 390,
  },
);
const inline = renderSubscriberNotification({
  subscriptionType: 'property-alerts',
  email: 'swagner@wickerproperties.com',
  name: 'swagner',
  // The inline card now asks one question — which asset types — so even the
  // email-only surface carries an interest. Empty would read "All types".
  filters: { property_types: ['warehouse', 'land'] },
  ctx: inlineCtx,
});

// ── 2. Full form: real search criteria ───────────────────────────────────────
const filteredCtx = buildSignupContext(
  reqWith({
    'x-vercel-ip-city': 'Boerne',
    'x-vercel-ip-country-region': 'TX',
    'x-vercel-ip-country': 'US',
    'user-agent': DESKTOP_MAC_UA,
  }),
  {
    source: 'property-alerts-page',
    page_path: '/property-alerts',
    page_url: 'https://www.crecotx.com/property-alerts',
    page_title: 'Texas Commercial Property Alerts | CRECO',
    referrer: 'https://www.loopnet.com/',
    viewport_width: 1680,
    utm_source: 'loopnet',
    utm_medium: 'referral',
  },
);
const filtered = renderSubscriberNotification({
  subscriptionType: 'property-alerts',
  email: 'dcastillo@riverbendcapital.com',
  name: 'Daniel Castillo',
  filters: {
    property_types: ['Retail', 'Flex'],
    transaction_type: 'sale',
    submarkets: ['Fair Oaks Ranch', 'Boerne', 'Stone Oak'],
    size_min: 5000,
    size_max: 20000,
    price_max: 4500000,
    notes: 'Looking for a stabilized multi-tenant retail strip for a 1031 exchange. Identification period closes mid-November — need to move quickly on anything that fits.',
  },
  ctx: filteredCtx,
});

const outDir = process.argv[2] || DEFAULT_OUT_DIR;
fs.mkdirSync(outDir, { recursive: true });

const files: [string, { subject: string; html: string }, string][] = [
  ['sample-property-alert-notification_inline.html', inline, 'CRECO — new subscriber (inline card)'],
  ['sample-property-alert-notification_filtered.html', filtered, 'CRECO — new subscriber (with criteria)'],
];

for (const [name, mail, title] of files) {
  const dest = path.join(outDir, name);
  fs.writeFileSync(dest, page(title, mail.subject, mail.html));
  console.log(`${dest}\n   subject: ${mail.subject}\n`);
}
