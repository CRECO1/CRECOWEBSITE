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
import { assetTypesSummary } from './asset-types';

export interface SubscriberNotificationInput {
  subscriptionType: string;
  email: string;
  name?: string | null;
  assetSlug?: string | null;
  filters?: unknown;
  ctx: SignupContext;
}

/** "5,000" — plain thousands separators, no currency. */
const num = (n: number) => n.toLocaleString('en-US');

/** 4500000 -> "$4.5M", 750000 -> "$750K", 900 -> "$900". */
function money(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return `$${k % 1 === 0 ? k : k.toFixed(1)}K`;
  }
  return `$${num(n)}`;
}

const asNumber = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

/** "5,000 – 20,000 SF", "Up to 20,000 SF", "100,000+ SF", or null. */
function rangeText(minRaw: unknown, maxRaw: unknown, unit: string, fmt: (n: number) => string): string | null {
  const min = asNumber(minRaw);
  const max = asNumber(maxRaw);
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}${unit}`;
  if (max != null) return `Up to ${fmt(max)}${unit}`;
  if (min != null) return `${fmt(min)}${unit}+`;
  return null;
}

const TRANSACTION_TEXT: Record<string, string> = {
  lease: 'For lease',
  sale: 'For sale',
  both: 'Lease or sale',
  any: 'Lease or sale',
};

/** Title-cases an unrecognised filter key: "loading_dock" -> "Loading dock". */
const humanizeKey = (k: string) => {
  const words = k.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Renders any leftover value as prose — never JSON. */
function plainValue(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (Array.isArray(v)) {
    const parts = v.map(x => (typeof x === 'object' ? null : String(x))).filter(Boolean) as string[];
    return parts.length ? parts.join(', ') : null;
  }
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return null; // nothing structured reaches the inbox
  return String(v);
}

/**
 * Turns the alerts filter payload into a brief a broker can read at a glance.
 *
 * This block used to be JSON.stringify in a <pre>, which put a debug payload in
 * front of the one thing that actually says what the prospect wants. Known keys
 * become labelled rows in the same style as the table above; anything
 * unrecognised is humanised rather than dumped, so a new filter field degrades
 * into a readable row instead of reintroducing raw JSON.
 *
 * `notes` is pulled out and rendered as a quotation — it is the prospect's own
 * words and reads better set apart from the specs.
 */
function renderFilters(
  filters: unknown,
  row: (label: string, value: string | null) => string,
): string {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) return '';
  const f = filters as Record<string, unknown>;

  const handled = new Set([
    'property_types', 'property_type', 'transaction_type', 'submarkets', 'submarket',
    'size_min', 'size_max', 'price_min', 'price_max', 'notes', 'note',
  ]);

  // Labels, not stored values — the brief should say "Industrial", not the
  // 'warehouse' the listings table happens to key on.
  const types = assetTypesSummary(f.property_types ?? f.property_type) ?? plainValue(f.property_types ?? f.property_type);
  const transaction = typeof f.transaction_type === 'string'
    ? (TRANSACTION_TEXT[f.transaction_type.toLowerCase()] ?? humanizeKey(f.transaction_type))
    : null;
  const submarkets = plainValue(f.submarkets ?? f.submarket);
  const size = rangeText(f.size_min, f.size_max, ' SF', num);
  const price = rangeText(f.price_min, f.price_max, '', money);

  const extras = Object.entries(f)
    .filter(([k, v]) => !handled.has(k) && plainValue(v) !== null)
    .map(([k, v]) => row(`${humanizeKey(k)}:`, escapeHtml(plainValue(v) as string)))
    .join('');

  const rows = [
    row('Type:', types ? escapeHtml(types) : null),
    row('Looking to:', transaction ? escapeHtml(transaction) : null),
    row('Submarkets:', submarkets ? escapeHtml(submarkets) : null),
    row('Size:', size ? escapeHtml(size) : null),
    row('Budget:', price ? escapeHtml(price) : null),
    extras,
  ].join('');

  const note = plainValue(f.notes ?? f.note);

  if (!rows.trim() && !note) return '';

  return `<p style="margin:22px 0 6px;font-weight:600">What they&rsquo;re looking for</p>
              ${rows.trim() ? `<table style="border-collapse:collapse;font-size:14px;width:100%">${rows}</table>` : ''}
              ${note ? `<blockquote style="margin:14px 0 0;padding:10px 14px;border-left:3px solid #C9A962;background:#FAFAF8;color:#3A3A3A;font-size:14px;font-style:italic">${escapeHtml(note)}</blockquote>` : ''}`;
}

export function renderSubscriberNotification(
  { subscriptionType, email, name, assetSlug, filters, ctx }: SubscriberNotificationInput,
): { subject: string; html: string } {
  const row = (label: string, value: string | null) => value
    ? `<tr><td style="padding:6px 14px 6px 0;color:#6B6B6B;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;color:#1A1A1A">${value}</td></tr>`
    : '';
  const filterRecord = (filters && typeof filters === 'object' && !Array.isArray(filters))
    ? (filters as Record<string, unknown>)
    : null;
  const interestedIn = filterRecord
    ? (assetTypesSummary(filterRecord.property_types ?? filterRecord.property_type) ?? 'All types')
    : null;

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
                ${/* The asset type belongs at the top, not buried in the brief
                      below — it is the first thing worth knowing about an
                      alert signup. 'All types' is shown explicitly so a broad
                      subscriber reads as an answer, not a missing field. */ ''}
                ${row('Interested in:', interestedIn ? `<strong>${escapeHtml(interestedIn)}</strong>` : null)}
                ${row('Signed up on:', ctx.pageUrl ? `<a href="${escapeHtml(ctx.pageUrl)}" style="color:#C9A962">${escapeHtml(ctx.pageTitle || ctx.pagePath || ctx.pageUrl)}</a>` : null)}
                ${row('Page:', ctx.pagePath && ctx.pageTitle ? escapeHtml(ctx.pagePath) : null)}
                ${row('Came from:', ctx.referrerLabel ? escapeHtml(ctx.referrerLabel) : null)}
                ${row('Location:', ctx.geo ? escapeHtml(ctx.geo) : null)}
                ${row('Device:', ctx.device ? escapeHtml(ctx.device) : null)}
                ${row('Asset:', assetSlug ? escapeHtml(assetSlug) : null)}
                ${utmRows}
                ${row('Form id:', ctx.rawSource ? escapeHtml(ctx.rawSource) : null)}
              </table>

              ${renderFilters(filters, row)
                || `<p style="margin:18px 0 0;color:#6B6B6B;font-size:13px">No size, budget or submarket set — the inline card asks for asset type and nothing else. Reply to ask what else they need.</p>`}
            </div>
          `,
  };
}
