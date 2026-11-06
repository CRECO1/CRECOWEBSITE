import { publicListing, queryListings } from '@/lib/agent-api';
import type { Listing } from '@/lib/supabase';

/**
 * "Match my requirements": scores CRECO's currently available listings against a person's stated needs and says, for each,
 * what matched and what did not. Read-only; uses only published listing fields. Asking-rate and size are compared as published,
 * so an agent must still confirm availability and terms with CRECO.
 */
export type MatchInput = {
  property_types?: string[]; transaction?: 'lease' | 'sale'; min_sqft?: number; max_sqft?: number;
  max_lease_rate?: number; max_price?: number; areas?: string[]; features?: string[];
};

const norm = (s: unknown) => String(s ?? '').toLowerCase();
const typeMatches = (want: string, l: Listing) => {
  const w = norm(want), t = norm(l.property_type);
  if (['industrial', 'warehouse', 'flex'].includes(w)) return ['industrial', 'warehouse', 'flex'].includes(t);
  return t.includes(w) || w.includes(t);
};

export async function matchListings(input: MatchInput, max = 5) {
  const { rows } = await queryListings({ limit: 100, offset: 0 });
  const scored = rows.map(l => {
    const matched: string[] = [], missed: string[] = [];
    let score = 0, possible = 0;
    const size = l.available_sqft ?? l.sqft ?? null;
    if (input.transaction) { possible += 3; if (l.transaction_type === input.transaction) { score += 3; matched.push(`for ${input.transaction}`); } else missed.push(`this one is for ${l.transaction_type}`); }
    if (input.property_types?.length) { possible += 3; if (input.property_types.some(t => typeMatches(t, l))) { score += 3; matched.push(`${l.property_type}`); } else missed.push(`this is ${l.property_type}`); }
    if (input.min_sqft != null) { possible += 2; if (size != null && size >= input.min_sqft) { score += 2; matched.push(`at least ${input.min_sqft.toLocaleString('en-US')} SF`); } else missed.push(size ? `${size.toLocaleString('en-US')} SF is under the minimum` : 'size not published'); }
    if (input.max_sqft != null) { possible += 2; if (size != null && size <= input.max_sqft) { score += 2; matched.push(`at most ${input.max_sqft.toLocaleString('en-US')} SF`); } else missed.push(size ? `${size.toLocaleString('en-US')} SF is over the maximum` : 'size not published'); }
    if (input.max_lease_rate != null) { possible += 2; if (l.lease_rate != null && l.lease_rate <= input.max_lease_rate) { score += 2; matched.push(`rate within budget ($${l.lease_rate}/SF/yr)`); } else missed.push(l.lease_rate != null ? `rate $${l.lease_rate}/SF/yr is over budget` : 'rate not published; ask CRECO'); }
    if (input.max_price != null) { possible += 2; if (l.sale_price != null && l.sale_price <= input.max_price) { score += 2; matched.push('price within budget'); } else missed.push(l.sale_price != null ? 'price is over budget' : 'price not published; ask CRECO'); }
    if (input.areas?.length) { possible += 2; const hay = norm(`${l.city} ${l.submarket} ${l.address}`); if (input.areas.some(a => hay.includes(norm(a)))) { score += 2; matched.push(`in ${l.city}`); } else missed.push(`located in ${l.city}`); }
    if (input.features?.length) { const hay = norm(`${(l.features ?? []).join(' ')} ${l.description}`); for (const f of input.features) { possible += 1; if (hay.includes(norm(f))) { score += 1; matched.push(f); } else missed.push(`no mention of "${f}"`); } }
    return { l, score, possible, matched, missed };
  });
  const ranked = scored.filter(s => s.possible === 0 || s.score > 0).sort((a, b) => (b.possible ? b.score / b.possible : 0) - (a.possible ? a.score / a.possible : 0) || b.score - a.score).slice(0, max);
  return ranked.map(s => ({
    fit: s.possible ? `${s.score} of ${s.possible} points` : 'no criteria given',
    matched: s.matched, not_matched: s.missed,
    listing: publicListing(s.l),
  }));
}
