/**
 * Render BOTH inquiry emails to static HTML files so they can be reviewed in
 * a browser (or screenshotted headlessly) without sending mail or running a
 * dev server:
 *
 *   - lead-email-preview.html    → internal notification CRECO receives
 *   - lead-email-autoreply.html  → auto-reply the prospect receives
 *
 *   npx tsx scripts/preview-lead-email.ts [outDir]
 *
 * Sample data mirrors a real submission (the "abby / awantrix llc" tenant
 * inquiry), including a multi-line answer, so the layout is exercised the way
 * an actual lead fills the form.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildLeadNotificationEmail, leadNotificationSubject } from '../src/lib/lead-notification-email';
import { buildInquiryAutoreplyEmail, INQUIRY_AUTOREPLY_SUBJECT } from '../src/lib/inquiry-autoreply-email';

const heading = 'New Tenant Inquiry';
const name = 'Abby Reyes';
const company = 'Awantrix LLC';

const html = buildLeadNotificationEmail({
  heading,
  pathLabel: 'Looking for space',
  name,
  company,
  email: 'abby@awantrix.com',
  phone: '(609) 727-1932',
  submittedAt: new Date('2026-09-17T12:59:00-05:00'),
  answers: [
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
  ],
});

const autoreplyHtml = buildInquiryAutoreplyEmail({ name, pathLabel: 'Looking for space' });

const outDir = process.argv[2] ?? '/Users/creco/Documents/CRECO/esign-review';

/**
 * The subject isn't part of the body, so show it as preview chrome above the
 * email the way an inbox would.
 */
function withChrome(title: string, subject: string, note: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;background:#F4F2EE;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:18px 12px 0;color:#525252;font-size:13px">
    <div style="background:#fff;border:1px dashed #C9A962;border-radius:8px;padding:12px 16px">
      <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#999">${title} — subject line</div>
      <div style="color:#1A1A1A;font-size:16px;font-weight:700;margin-top:4px">${subject}</div>
      <div style="margin-top:6px;font-size:12px">${note}</div>
    </div>
  </div>
  ${body}
</body></html>`;
}

const files: [string, string][] = [
  [
    join(outDir, 'lead-email-preview.html'),
    withChrome(
      'Internal notification (to CRECO)',
      leadNotificationSubject({ heading, name, company }),
      "Reply-to is set to the lead's address, so hitting Reply answers them directly.",
      html,
    ),
  ],
  [
    join(outDir, 'lead-email-autoreply.html'),
    withChrome(
      'Auto-reply (to the prospect)',
      INQUIRY_AUTOREPLY_SUBJECT,
      'Reply-to is info@crecotx.com, so a prospect replying reaches the team.',
      autoreplyHtml,
    ),
  ],
];

for (const [path, page] of files) {
  writeFileSync(path, page, 'utf8');
  console.log(`Wrote ${path} (${page.length} bytes)`);
}
