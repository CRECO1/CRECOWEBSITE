/**
 * Send one real sample of each inquiry-flow email to the site owner's own
 * inbox, rendered from the SAME template modules the API route uses — so what
 * lands in the inbox is byte-identical to what a real submission produces
 * (only the subject differs, by a "[SAMPLE] " prefix).
 *
 *   npx tsx scripts/send-sample-emails.ts
 *
 * SAFETY: the recipient is hardcoded below and is never taken from argv, env,
 * or the sample data. This script must never be pointed at a real lead.
 */

import { readFileSync } from 'node:fs';
import { Resend } from 'resend';
import { buildLeadNotificationEmail, leadNotificationSubject } from '../src/lib/lead-notification-email';
import { buildInquiryAutoreplyEmail, INQUIRY_AUTOREPLY_SUBJECT } from '../src/lib/inquiry-autoreply-email';

/** Hardcoded on purpose. Do not parameterize. */
const TO = 'zack@crecotx.com';

/** Matches getFromEmail() in src/app/api/inquiry/route.ts. */
const FROM = 'CRECO <noreply@crecotx.com>';

function loadEnv(): void {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}

// Same sample submission used by the PNG previews.
const heading = 'New Tenant Inquiry';
const pathLabel = 'Looking for space';
const name = 'Abby Reyes';
const company = 'Awantrix LLC';
const email = 'abby@awantrix.com';
const phone = '(609) 727-1932';

const answers = [
  { label: 'Space type(s)', value: 'office, retail, warehouse' },
  { label: 'Lease or buy', value: 'lease' },
  { label: 'Size needed', value: '5,000 - 15,000 SF' },
  { label: 'Monthly budget', value: '$2,500 - $5,000' },
  {
    label: 'Preferred area / zip codes',
    value: 'Frisco: 75034, 75035, 75036\nPlano: 75024 (Legacy/Legacy West), 75023, 75025, 75074, 75075, 75093\nAllen: 75002, 75013\nMcKinney: 75069, 75070, 75071, 75072',
  },
  { label: 'Must-have features', value: 'Drive-in door, 3-phase power, visible signage on a main road' },
  { label: 'Timeline', value: 'Within 60 days' },
  { label: 'Notes', value: 'We are consolidating two locations and need the warehouse bay attached to the office suite.' },
];

async function main(): Promise<void> {
  loadEnv();
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY missing from .env.local');
  const resend = new Resend(apiKey);

  const samples = [
    {
      key: 'internal',
      what: 'Internal lead notification (CRECO receives)',
      subject: `[SAMPLE] ${leadNotificationSubject({ heading, name, company })}`,
      html: buildLeadNotificationEmail({ heading, pathLabel, name, company, email, phone, answers }),
    },
    {
      key: 'autoreply',
      what: 'Prospect auto-reply (the lead receives)',
      subject: `[SAMPLE] ${INQUIRY_AUTOREPLY_SUBJECT}`,
      html: buildInquiryAutoreplyEmail({ name, pathLabel }),
    },
  ];

  // Optional filter: `... send-sample-emails.ts autoreply` sends just that one,
  // so an unchanged template isn't re-sent as inbox noise.
  const only = process.argv[2]?.toLowerCase();
  const selected = only
    ? samples.filter(s => s.key === only)
    : samples;
  if (only && selected.length === 0) {
    throw new Error(`Unknown sample "${only}". Valid: ${samples.map(s => s.key).join(', ')}`);
  }

  for (const s of selected) {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: TO,
      subject: s.subject,
      html: s.html,
    });
    if (error) {
      console.error(`FAILED  ${s.what}: ${JSON.stringify(error)}`);
      process.exitCode = 1;
    } else {
      console.log(`SENT    ${s.what}\n        to: ${TO}\n        subject: ${s.subject}\n        id: ${data?.id}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
