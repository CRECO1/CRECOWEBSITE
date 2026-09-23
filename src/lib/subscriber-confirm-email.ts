/**
 * The opt-in confirmation email — the one a new subscriber must click.
 *
 * Deliberately plain and short. This is the only thing standing between a
 * signup and a real subscriber, so it has to read as obviously legitimate and
 * give one unmistakable action. No marketing, no second CTA competing with the
 * button, nothing that reads as a newsletter someone did not agree to yet.
 */
import { escapeHtml } from './sanitize';
import { BRAND_NAME, BRAND_FULL_ADDRESS, BRAND_PHONE_DISPLAY } from './brand';

const GOLD = '#C9A962', INK = '#1A1A1A', MUTED = '#6B6B6B', LINE = '#E5E5E0';

const COPY: Record<string, { subject: string; lead: string; button: string }> = {
  'property-alerts': {
    subject: 'Confirm your CRECO property alerts',
    lead: 'Confirm this address and we&rsquo;ll email you when a Texas commercial property matching your search hits the CRECO listings.',
    button: 'Confirm my property alerts',
  },
  'newsletter': {
    subject: 'Confirm your CRECO Insights subscription',
    lead: 'Confirm this address and we&rsquo;ll send CRECO Insights &mdash; Texas market analysis and deal commentary, roughly once a month.',
    button: 'Confirm my subscription',
  },
};

export function renderConfirmEmail(
  { subscriptionType, name, confirmUrl }: { subscriptionType: string; name?: string | null; confirmUrl: string },
): { subject: string; html: string } {
  const copy = COPY[subscriptionType] ?? COPY['newsletter'];
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi there,';
  const safeUrl = escapeHtml(confirmUrl);

  return {
    subject: copy.subject,
    html: `
<div style="margin:0;background:#F4F4F2;padding:28px 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid ${LINE};border-radius:10px;overflow:hidden">
    <div style="background:${INK};padding:20px 26px">
      <div style="color:#fff;font-size:16px;font-weight:700;letter-spacing:.02em">CRECO</div>
      <div style="color:${GOLD};font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-top:3px">Commercial Real Estate Company</div>
    </div>
    <div style="height:3px;background:${GOLD}"></div>

    <div style="padding:26px">
      <p style="margin:0 0 14px;font-size:15px;color:${INK}">${greeting}</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:23px;color:${INK}">${copy.lead}</p>

      <table style="border-collapse:collapse;margin:0 0 22px">
        <tr><td style="background:${GOLD};border-radius:6px">
          <a href="${safeUrl}" style="display:inline-block;padding:13px 26px;color:${INK};font-size:15px;font-weight:700;text-decoration:none">${copy.button}</a>
        </td></tr>
      </table>

      <p style="margin:0 0 6px;font-size:13px;color:${MUTED};line-height:20px">
        If the button doesn&rsquo;t work, paste this into your browser:<br>
        <a href="${safeUrl}" style="color:${GOLD};word-break:break-all">${safeUrl}</a>
      </p>
      <p style="margin:18px 0 0;font-size:13px;color:${MUTED};line-height:20px">
        Didn&rsquo;t sign up? Ignore this email &mdash; nothing happens until you click, and we won&rsquo;t email you again.
      </p>

      <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid ${LINE};font-size:12px;color:${MUTED};line-height:19px">
        ${escapeHtml(BRAND_NAME)}<br>
        ${escapeHtml(BRAND_FULL_ADDRESS)} &middot; ${escapeHtml(BRAND_PHONE_DISPLAY)}
      </p>
    </div>
  </div>
</div>`,
  };
}
