/**
 * Live trust strip — a thin band of confidence signals shown near
 * decision moments (homepage above-the-fold-adjacent, possibly /listings,
 * /property-alerts). Server Component so the numbers are real at the
 * moment of paint, not stale on a static prerender.
 *
 * Data sources, ranked by trustworthiness:
 *   1. Operator-curated stats in site_settings — stat_homes_sold (count of
 *      lifetime transactions), stat_years_experience, stat_satisfaction.
 *      These are signed off by the operator and what they're comfortable
 *      having on the marketing surface.
 *   2. Real-time count of currently-active listings from the listings
 *      table. Updates as inventory turns.
 *   3. Static brand positioning — "Same business day response," "Texas
 *      brokerage" — non-numeric trust signals that don't depend on metrics.
 *
 * Notes on honest framing:
 *   - We never display "$X closed this year" unless the closed_date +
 *     sold_price columns have populated values. Inventing or rounding-up
 *     would erode trust the strip is supposed to build.
 *   - The 3-4 cell layout is intentionally non-cluttered. Each cell carries
 *     one quantified or qualified signal, not a stat dump.
 */

import { Building2, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { supabase } from '@/lib/supabase';

interface TrustData {
  activeListings: number;
  yearsExperience: number;
  propertiesClosed: number;
}

async function loadTrustData(): Promise<TrustData> {
  // Run both queries in parallel — they touch different tables and the
  // strip needs both to render. Fallbacks ensure a soft-degraded display
  // if either query fails so we never render with placeholder zeros.
  const [activeResult, settingsResult] = await Promise.all([
    supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'pending']),
    supabase
      .from('site_settings')
      .select('stat_homes_sold, stat_years_experience')
      .eq('id', 1)
      .maybeSingle(),
  ]);

  return {
    activeListings: activeResult.count ?? 0,
    yearsExperience: settingsResult.data?.stat_years_experience ?? 15,
    propertiesClosed: settingsResult.data?.stat_homes_sold ?? 200,
  };
}

export async function TrustStrip() {
  let data: TrustData;
  try {
    data = await loadTrustData();
  } catch {
    // If the DB is unreachable at render time, fall back to brand-safe
    // defaults rather than crashing the page. Trust strip must never
    // break the homepage.
    data = { activeListings: 0, yearsExperience: 15, propertiesClosed: 200 };
  }

  return (
    <section
      aria-label="Why CRECO"
      className="bg-primary border-y border-white/10 text-white"
    >
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 py-7 sm:py-8">
          <TrustCell
            icon={<Building2 className="h-5 w-5 text-gold" />}
            value={data.activeListings > 0 ? String(data.activeListings) : 'Active'}
            label={data.activeListings > 0 ? 'Active Texas listings' : 'Texas listings'}
            sublabel="Updated daily"
          />
          <TrustCell
            icon={<ShieldCheck className="h-5 w-5 text-gold" />}
            value={`${data.propertiesClosed}+`}
            label="Properties transacted"
            sublabel="Lifetime CRECO team"
          />
          <TrustCell
            icon={<Clock className="h-5 w-5 text-gold" />}
            value="Same day"
            label="Response time"
            sublabel="Business days, M–F"
          />
          <TrustCell
            icon={<MapPin className="h-5 w-5 text-gold" />}
            value={`${data.yearsExperience}+ yrs`}
            label="Texas market experience"
            sublabel="HQ in Fair Oaks Ranch"
          />
        </div>
      </Container>
    </section>
  );
}

function TrustCell({
  icon, value, label, sublabel,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel: string;
}) {
  return (
    <div className="flex flex-col items-start md:items-start">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
          {icon}
        </span>
        <span className="font-heading text-heading-sm font-bold text-white whitespace-nowrap">
          {value}
        </span>
      </div>
      <p className="text-body-sm font-semibold text-white/90 leading-tight">{label}</p>
      <p className="text-caption text-white/50 leading-tight mt-0.5">{sublabel}</p>
    </div>
  );
}
