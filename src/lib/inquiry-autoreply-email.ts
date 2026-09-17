/**
 * Pure renderer — the auto-reply the PROSPECT receives after submitting an
 * inquiry on /get-started. Companion to `lead-notification-email.ts` (the
 * internal copy CRECO receives); both share the same brand chrome so a lead
 * who later gets a real email from a broker recognizes the sender.
 *
 * Used by:
 *   - src/app/api/inquiry/route.ts → the outbound send via Resend
 *   - scripts/preview-lead-email.ts → the static preview file
 *
 * Tone rules: warm, plain, and short. Promise only what the brokerage
 * actually commits to — one business day for a first response, and nothing
 * about pricing, availability, or deal outcomes. Say "team member", not
 * "broker": the first responder may be an agent or a coordinator, so the
 * prospect isn't promised a specific role.
 *
 * Deliberately minimal: header, thank-you, the one-business-day line, a
 * tap-to-dial call button, and the footer. An earlier "What happens next"
 * list was removed — it padded the email without telling the reader
 * anything the one-business-day line doesn't already say.
 *
 * Gmail/Outlook constraints: table-based layout, inline styles only, no
 * <style> block, no flex/grid.
 */

import { escapeHtml } from './sanitize';
import {
  BRAND_CITY_STATE_ZIP,
  BRAND_EMAIL,
  BRAND_NAME,
  BRAND_PHONE_DISPLAY,
  BRAND_PHONE_TEL,
  BRAND_SHORT_NAME,
  BRAND_SITE_URL,
  BRAND_STREET,
  BRAND_TREC_LICENSE,
} from './brand';

export interface InquiryAutoreplyEmailOptions {
  /** The lead's name, as submitted. */
  name: string;
  /** Which path they picked, e.g. "Looking for space" — shapes one line. */
  pathLabel: string;
}

const GOLD = '#C9A962';
const INK = '#1A1A1A';
const MUTED = '#525252';
const RULE = '#E8E5E0';

/**
 * Short name only: the full DBA made the subject long enough to truncate in
 * a phone inbox. The branded header and footer still carry the full name.
 */
export const INQUIRY_AUTOREPLY_SUBJECT = `We received your inquiry — ${BRAND_SHORT_NAME}`;

export function buildInquiryAutoreplyEmail({ name, pathLabel }: InquiryAutoreplyEmailOptions): string {
  const firstName = escapeHtml(name.split(' ')[0] || name);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${escapeHtml(INQUIRY_AUTOREPLY_SUBJECT)}</title></head>
<body style="margin:0;padding:0;background:#F4F2EE">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2EE;padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#FFFFFF;border:1px solid ${RULE};border-radius:10px;overflow:hidden;font-family:Helvetica,Arial,sans-serif">

          <!-- Brand header -->
          <tr>
            <td style="background:${INK};padding:22px 28px;border-bottom:3px solid ${GOLD}">
              <img src="${BRAND_SITE_URL}/images/creco-logo-email.png" alt="${escapeHtml(BRAND_NAME)}" width="170" style="display:block;width:170px;max-width:170px;height:auto;border:0" />
              <div style="color:${GOLD};font-size:11px;letter-spacing:1.4px;text-transform:uppercase;margin-top:10px">Commercial real estate · Texas</div>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding:30px 28px 0">
              <h1 style="margin:0;color:${INK};font-size:22px;line-height:1.3;font-weight:700">Thanks, ${firstName} — we got your inquiry.</h1>
              <p style="margin:14px 0 0;color:${MUTED};font-size:15px;line-height:1.65">
                Your request came through to our team${pathLabel ? ` (<strong style="color:${INK}">${escapeHtml(pathLabel)}</strong>)` : ''}, and <strong style="color:${INK}">a CRECO team member will reach out within one business day</strong>.
              </p>
              <p style="margin:12px 0 0;color:${MUTED};font-size:15px;line-height:1.65">
                We are a full-service brokerage, so the same team can help whether you are leasing, buying, selling, or weighing options — and there is no obligation in any of it.
              </p>
            </td>
          </tr>

          <!-- Call now — the one action we want available on tap, kept above
               the fold rather than buried under "what happens next". -->
          <tr>
            <td style="padding:24px 28px 0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};border-radius:10px">
                <tr>
                  <td style="padding:20px 22px" align="center">
                    <div style="color:#FFFFFF;font-size:16px;font-weight:700;line-height:1.4;margin-bottom:12px">Need help now?</div>
                    <a href="tel:${BRAND_PHONE_TEL}" style="display:inline-block;background:${GOLD};color:${INK};padding:14px 30px;border-radius:8px;font-weight:700;font-size:18px;text-decoration:none;white-space:nowrap">Call ${escapeHtml(BRAND_PHONE_DISPLAY)}</a>
                    <div style="color:#BFBFBF;font-size:12px;line-height:1.5;margin-top:10px">Tap to dial · Monday–Friday, 9 AM–6 PM Central</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Secondary contact — the call button above is the primary one,
               so this stays a plain line rather than a second button. -->
          <tr>
            <td style="padding:24px 28px 0">
              <p style="margin:0;color:${MUTED};font-size:15px;line-height:1.65">
                Prefer email? Reply to this message or write us at
                <a href="mailto:${BRAND_EMAIL}" style="color:${INK};font-weight:600;text-decoration:underline">${BRAND_EMAIL}</a>.
                You can also call or text <a href="tel:${BRAND_PHONE_TEL}" style="color:${INK};font-weight:600;text-decoration:underline">${escapeHtml(BRAND_PHONE_DISPLAY)}</a> anytime.
              </p>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:24px 28px 0">
              <p style="margin:0;color:${INK};font-size:15px;line-height:1.6">— The CRECO Team</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 28px 26px">
              <div style="border-top:1px solid ${RULE};padding-top:16px">
                <p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6">
                  ${escapeHtml(BRAND_NAME)}<br />
                  ${escapeHtml(BRAND_STREET)}, ${escapeHtml(BRAND_CITY_STATE_ZIP)}<br />
                  <a href="tel:${BRAND_PHONE_TEL}" style="color:${GOLD};text-decoration:none">${escapeHtml(BRAND_PHONE_DISPLAY)}</a> · <a href="${BRAND_SITE_URL}" style="color:${GOLD};text-decoration:none">crecotx.com</a>
                </p>
                <p style="margin:12px 0 0;color:#999999;font-size:11px;line-height:1.5">
                  Licensed Texas real estate brokerage · TREC #${escapeHtml(BRAND_TREC_LICENSE)}<br />
                  You are receiving this because you submitted an inquiry at crecotx.com.
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
