/**
 * Personalized owner property reports — crecotx.com/r/<token>.
 *
 * Each report is a snapshot of one owner's parcels from the county appraisal
 * roll plus county-wide benchmarks, built offline
 * (Marketing/Kendall-Landlords/build_owner_reports.mjs) into the CRM table
 * crm_owner_reports. The page reads it server-side with the CRM service role;
 * the token in the URL is the only key, so it is long, random, and never
 * logged to analytics (/r/ is excluded in lib/analytics-gate.ts).
 *
 * Everything shown is public record or derived from it — no CRECO-estimated
 * price. The ask is a Broker Opinion of Value, which Zack prepares.
 */
import { crmAdminClient } from './crm';

export interface ReportProperty {
  address: string;
  parcel: string;
  cad_url: string;
  acres: number;
  building_sf: number;
  appraised: number;
  land: number;
  improvements: number;
  psf: number | null;
  psf_pct: number | null;
  land_share: number | null;
  land_per_acre: number | null;
  land_per_acre_pct: number | null;
}

export interface ReportBenchmark {
  county: string;
  roll_year: number;
  n_psf: number;
  med_psf: number;
  p25_psf: number;
  p75_psf: number;
  n_lpa: number;
  med_lpa: number;
}

export interface OwnerReport {
  id: string;
  token: string;
  client_id: string | null;
  owner_entity: string;
  contact_name: string | null;
  county: string;
  roll_year: number;
  properties: ReportProperty[];
  benchmark: ReportBenchmark;
  bov_requested_at: string | null;
}

export const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

export async function getOwnerReport(token: string): Promise<OwnerReport | null> {
  if (!TOKEN_RE.test(token)) return null;
  const db = crmAdminClient();
  if (!db) return null;
  const { data, error } = await db
    .from('crm_owner_reports')
    .select('id, token, client_id, owner_entity, contact_name, county, roll_year, properties, benchmark, bov_requested_at')
    .eq('token', token)
    .maybeSingle();
  if (error) {
    console.error('[owner-report] fetch failed:', error.message);
    return null;
  }
  return (data as OwnerReport | null) ?? null;
}

const KEEP_UPPER = new Set(['LLC', 'LP', 'LTD', 'LLP', 'INC', 'II', 'III', 'IV', 'VI', 'USA', 'HC', 'TR', 'HEB', 'BKCK', 'KSKM', 'JRH', 'VBM', 'NSA', 'TGA', 'MOB', 'SCF', 'RC', 'MSC', 'TBS', 'AGAP', 'D&L', 'G', 'D']);

/** "GUYCHIC LLC" → "Guychic LLC", keeping entity suffixes and initialisms. */
export function displayEntity(raw: string): string {
  return raw.trim().split(/\s+/).map(w => {
    const bare = w.replace(/[^A-Z0-9&]/gi, '').toUpperCase();
    if (KEEP_UPPER.has(bare) || /\d/.test(w)) return w.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

const short = (p: ReportProperty) => p.address;

/**
 * One plain-English takeaway, built only from the numbers on the page. It is
 * framed as an observation and a reason to talk, never as a price.
 */
export function reportInsight(r: OwnerReport): string {
  const props = r.properties;
  const ranked = props.filter(p => p.psf_pct != null).sort((a, b) => b.psf_pct! - a.psf_pct!);

  if (props.length === 1) {
    const p = props[0];
    if (p.land_share != null && p.land_share >= 60) {
      return `Land is **${p.land_share}% of your appraised value**. When the dirt is worth more than the building${/I-10/.test(p.address) ? ' — common on I-10 frontage' : ''}, a sale, ground lease, or redevelopment is often worth a conversation.`;
    }
    if (p.psf_pct != null && p.psf_pct >= 75) {
      return `Your building appraises **higher per square foot than ${p.psf_pct}%** of ${r.county} County commercial property. Owners in that position usually have more options than they realize — a sale, a refinance, or a 1031 into something larger.`;
    }
    if (p.psf_pct != null && p.psf_pct < 50) {
      return `Your building appraises **below the county median per square foot**. That can mean room to run — in rent, use, or value — and it's exactly what a Broker Opinion of Value sorts out against real sales and leases.`;
    }
    return `Your property sits in the middle of the ${r.county} County pack per square foot. A Broker Opinion of Value shows where it lands against actual recent sales and leases, not just the tax roll.`;
  }

  const top = ranked.filter(p => p.psf_pct! >= 75);
  const low = ranked.filter(p => p.psf_pct! < 50);
  const list = (xs: ReportProperty[]) => xs.length > 1 ? `${xs.slice(0, -1).map(short).join(', ')} and ${short(xs[xs.length - 1])}` : short(xs[0]);
  if (top.length && low.length) {
    const floor = Math.min(...top.map(p => p.psf_pct!));
    return `${list(top)} ${top.length > 1 ? 'rank' : 'ranks'} in the **top ${100 - floor}%** of the county by appraised value per square foot, while ${list(low)} ${low.length > 1 ? 'sit' : 'sits'} below the median. A spread like that usually means the lower-ranked ${low.length > 1 ? 'buildings have' : 'building has'} room to run — in rent, use, or price.`;
  }
  if (ranked.length && !low.length) {
    return `All ${ranked.length} of your buildings appraise **above the county median** per square foot. A portfolio in that position has real options — selling one to fund another, a portfolio refinance, or a 1031.`;
  }
  return `Your ${props.length} properties span a wide range of the ${r.county} County market. A Broker Opinion of Value puts each one against actual recent sales and leases, so you can see which to hold, improve, or sell.`;
}

export const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
export const intl = (n: number) => Math.round(n).toLocaleString('en-US');
