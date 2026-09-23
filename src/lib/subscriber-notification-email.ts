/**
 * The team's "new subscriber" notification — subject + HTML body.
 *
 * Extracted from the /api/subscribe route so the exact email that lands in the
 * inbox can be rendered offline (scripts/render-subscriber-notification.ts)
 * without sending anything. One builder, one output: a preview can never drift
 * from what production sends.
 */
import { escapeHtml } from './sanitize';
import type { SignupContext } from './signup-context';

export interface SubscriberNotificationInput {
  subscriptionType: string;
  email: string;
  name?: string | null;
  assetSlug?: string | null;
  filters?: unknown;
  ctx: SignupContext;
}

export function renderSubscriberNotification(
  { subscriptionType, email, name, assetSlug, filters, ctx }: SubscriberNotificationInput,
): { subject: string; html: string } {
  const row = (label: string, value: string | null) => value
    ? `<tr><td style="padding:6px 14px 6px 0;color:#6B6B6B;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;color:#1A1A1A">${value}</td></tr>`
    : '';
  const utmRows = Object.entries(ctx.utm)
    .map(([k, v]) => row(k.replace('utm_', 'Campaign ') + ':', escapeHtml(v)))
    .join('');

  return {
    // The page beats the form id in the subject line — it is the thing
    // Zack actually wants to know at a glance in the inbox list.
    subject: `New ${subscriptionType} subscriber: ${email}${ctx.pagePath ? ` (from ${ctx.pagePath})` : ''}`,
    html: `
            <div style="font-family:sans-serif;max-width:640px;color:#1A1A1A">
              <h2 style="margin:0 0 4px">New subscriber — ${escapeHtml(subscriptionType)}</h2>
              <p style="margin:0 0 18px;color:#6B6B6B">${escapeHtml(ctx.sourceLabel)} · ${escapeHtml(ctx.submittedAtLocal)}</p>

              <table style="border-collapse:collapse;font-size:14px;width:100%">
                ${row('Email:', `<a href="mailto:${escapeHtml(email)}" style="color:#C9A962">${escapeHtml(email)}</a>`)}
                ${row('Name:', name ? escapeHtml(name) : null)}
                ${row('Signed up on:', ctx.pageUrl ? `<a href="${escapeHtml(ctx.pageUrl)}" style="color:#C9A962">${escapeHtml(ctx.pageTitle || ctx.pagePath || ctx.pageUrl)}</a>` : null)}
                ${row('Page:', ctx.pagePath && ctx.pageTitle ? escapeHtml(ctx.pagePath) : null)}
                ${row('Came from:', ctx.referrerLabel ? escapeHtml(ctx.referrerLabel) : null)}
                ${row('Location:', ctx.geo ? escapeHtml(ctx.geo) : null)}
                ${row('Device:', ctx.device ? escapeHtml(ctx.device) : null)}
                ${row('Asset:', assetSlug ? escapeHtml(assetSlug) : null)}
                ${utmRows}
                ${row('Form id:', ctx.rawSource ? escapeHtml(ctx.rawSource) : null)}
              </table>

              ${filters
                ? `<p style="margin:18px 0 6px;font-weight:600">What they're looking for</p>
                   <pre style="background:#FAFAF8;padding:12px;border-radius:4px;font-size:13px;white-space:pre-wrap">${escapeHtml(JSON.stringify(filters, null, 2))}</pre>`
                : `<p style="margin:18px 0 0;color:#6B6B6B;font-size:13px">No search criteria — this card asks only for an email. Reply to ask what they're looking for.</p>`}
            </div>
          `,
  };
}
