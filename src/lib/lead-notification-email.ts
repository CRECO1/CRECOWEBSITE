/**
 * Pure renderer — builds the internal lead-notification email CRECO receives
 * when someone submits an inquiry from /get-started.
 *
 * Used by:
 *   - src/app/api/inquiry/route.ts → the outbound send via Resend
 *   - scripts/preview-lead-email.ts → the static preview file
 *
 * The previous version dumped every form answer into a <pre> monospace block,
 * which read like a bot log. Answers now render as labeled table rows, so a
 * broker can scan an inquiry on a phone without decoding a wall of text.
 *
 * Gmail/Outlook constraints: table-based layout, inline styles only, no
 * <style> block, no flex/grid. Every interpolated value is escaped by the
 * caller-facing helpers here — never pass raw user input into the returned
 * HTML string.
 */

import { escapeHtml } from './sanitize';
import {
  BRAND_CITY_STATE_ZIP,
  BRAND_NAME,
  BRAND_PHONE_DISPLAY,
  BRAND_PHONE_TEL,
  BRAND_STREET,
  BRAND_TREC_LICENSE,
} from './brand';

/** One answered form question. `value` may contain newlines. */
export interface LeadAnswer {
  label: string;
  value: string;
}

export interface LeadNotificationEmailOptions {
  /** Inquiry kind, already human-phrased, e.g. "New Tenant Inquiry". */
  heading: string;
  /** Which path the submitter picked, e.g. "Looking for space". */
  pathLabel: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  answers: LeadAnswer[];
  /** Rendered as the "received" timestamp. Defaults to now. */
  submittedAt?: Date;
}

const GOLD = '#C9A962';
const INK = '#1A1A1A';
const MUTED = '#525252';
const RULE = '#E8E5E0';
const CREAM = '#FAFAF8';

/** Digits only — "(210) 817-3443" is not a valid tel: target. */
function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.startsWith('+') ? digits : `+1${digits}`;
}

/** Subject line: informative, no "bot log" punctuation. */
export function leadNotificationSubject({ heading, name, company }: { heading: string; name: string; company: string }): string {
  return company ? `${heading} — ${name}, ${company}` : `${heading} — ${name}`;
}

/** A label/value row in the contact block. `valueHtml` is pre-escaped HTML. */
function contactRow(label: string, valueHtml: string): string {
  return `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid ${RULE};color:${MUTED};font-size:13px;width:120px;vertical-align:top">${escapeHtml(label)}</td>
                <td style="padding:10px 0;border-bottom:1px solid ${RULE};color:${INK};font-size:15px;font-weight:600;vertical-align:top">${valueHtml}</td>
              </tr>`;
}

export function buildLeadNotificationEmail(options: LeadNotificationEmailOptions): string {
  const { heading, pathLabel, name, company, email, phone, answers } = options;
  const submittedAt = options.submittedAt ?? new Date();

  const received = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Chicago',
  }).format(submittedAt);

  // white-space:pre-line keeps multi-line answers (e.g. a pasted list of zip
  // codes) readable without a monospace block.
  const answerRows = answers.length
    ? answers
        .map(
          ({ label, value }, i) => `
              <tr>
                <td style="padding:12px 16px;background:${i % 2 === 0 ? CREAM : '#FFFFFF'};border-bottom:1px solid ${RULE};color:${MUTED};font-size:13px;width:42%;vertical-align:top">${escapeHtml(label)}</td>
                <td style="padding:12px 16px;background:${i % 2 === 0 ? CREAM : '#FFFFFF'};border-bottom:1px solid ${RULE};color:${INK};font-size:15px;line-height:1.5;white-space:pre-line;vertical-align:top">${escapeHtml(value) || '—'}</td>
              </tr>`,
        )
        .join('')
    : `
              <tr>
                <td colspan="2" style="padding:12px 16px;color:${MUTED};font-size:14px;font-style:italic">No additional answers submitted.</td>
              </tr>`;

  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#F4F2EE">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2EE;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#FFFFFF;border:1px solid ${RULE};border-radius:10px;overflow:hidden;font-family:Helvetica,Arial,sans-serif">

          <!-- Brand header -->
          <tr>
            <td style="background:${INK};padding:22px 28px;border-bottom:3px solid ${GOLD}">
              <img src="https://www.crecotx.com/images/creco-logo-email.png" alt="${escapeHtml(BRAND_NAME)}" width="170" style="display:block;width:170px;max-width:170px;height:auto;border:0" />
              <div style="color:${GOLD};font-size:11px;letter-spacing:1.4px;text-transform:uppercase;margin-top:10px">Website inquiry</div>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding:28px 28px 8px">
              <h1 style="margin:0;color:${INK};font-size:22px;line-height:1.3;font-weight:700">${escapeHtml(heading)}</h1>
              <p style="margin:8px 0 0;color:${MUTED};font-size:14px">${escapeHtml(pathLabel)} · Received ${escapeHtml(received)} CT</p>
            </td>
          </tr>

          <!-- Contact block -->
          <tr>
            <td style="padding:20px 28px 4px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                ${contactRow('Name', escapeHtml(name))}
                ${contactRow('Company', escapeHtml(company) || '—')}
                ${contactRow('Email', `<a href="mailto:${safeEmail}" style="color:${INK};text-decoration:underline">${safeEmail}</a>`)}
                ${contactRow('Phone', `<a href="tel:${escapeHtml(telHref(phone))}" style="color:${INK};text-decoration:underline">${safePhone}</a>`)}
              </table>
            </td>
          </tr>

          <!-- Primary action -->
          <tr>
            <td style="padding:22px 28px 6px">
              <a href="mailto:${safeEmail}" style="display:inline-block;background:${INK};color:${GOLD};padding:12px 24px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none">Reply to ${escapeHtml(name.split(' ')[0] || name)} →</a>
              <a href="tel:${escapeHtml(telHref(phone))}" style="display:inline-block;margin-left:10px;color:${INK};padding:12px 4px;font-weight:600;font-size:15px;text-decoration:underline">Call ${safePhone}</a>
            </td>
          </tr>

          <!-- Answers -->
          <tr>
            <td style="padding:24px 28px 8px">
              <div style="color:${MUTED};font-size:11px;letter-spacing:1.2px;text-transform:uppercase;margin:0 0 10px">What they told us</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${RULE};border-radius:8px">
                ${answerRows}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 28px 26px">
              <p style="margin:0 0 4px;color:${MUTED};font-size:13px;line-height:1.6">
                ${escapeHtml(BRAND_NAME)}<br />
                ${escapeHtml(BRAND_STREET)}, ${escapeHtml(BRAND_CITY_STATE_ZIP)}<br />
                <a href="tel:${BRAND_PHONE_TEL}" style="color:${GOLD};text-decoration:none">${escapeHtml(BRAND_PHONE_DISPLAY)}</a> · <a href="https://www.crecotx.com" style="color:${GOLD};text-decoration:none">crecotx.com</a>
              </p>
              <p style="margin:12px 0 0;color:#999999;font-size:11px">TREC #${escapeHtml(BRAND_TREC_LICENSE)} · Sent automatically from the crecotx.com inquiry form.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
