// Search-result lengths for <title> and <meta name="description">.
//
// Google shows about 60 characters of a title and about 155–160 of a
// description; anything longer is cut mid-phrase, which on this site used to hide
// the brand or the answer ("Does CRECO represent landlords? Yes"). Content files
// keep their full copy (it still feeds Open Graph and the page itself); these
// helpers fit it to what a results page actually shows, keeping the brand last.
// They only ever shorten — they never add wording.

const TITLE_MAX = 60;
const DESC_MAX = 158;

/** "Lead phrase | extra keywords | CRECO" → "Lead phrase | CRECO" when too long. */
export function metaTitle(title: string, brand = 'CRECO'): string {
  if (title.length <= TITLE_MAX) return title;
  const lead = title.split(' | ')[0].trim();
  const withBrand = `${lead} | ${brand}`;
  if (withBrand.length <= TITLE_MAX) return withBrand;
  // Still long: drop a trailing "— detail" or ": detail" from the lead phrase.
  const head = lead.split(/\s[—–]\s|:\s/)[0].trim();
  if (`${head} | ${brand}`.length <= TITLE_MAX) return `${head} | ${brand}`;
  return withBrand;
}

/** Whole sentences up to ~158 chars; otherwise cut at a clause or word boundary. */
export function metaDescription(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= 160) return t;
  let out = '';
  for (const s of t.split(/(?<=[.!?])\s+/)) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > DESC_MAX) break;
    out = next;
  }
  if (out.length >= 90) return out;
  const cut = t.slice(0, DESC_MAX - 1);
  const clause = Math.max(cut.lastIndexOf(', '), cut.lastIndexOf(' — '), cut.lastIndexOf('; '));
  const end = clause >= 90 ? clause : cut.lastIndexOf(' ');
  return `${cut.slice(0, end).replace(/[\s,;:—–-]+$/, '')}…`;
}
