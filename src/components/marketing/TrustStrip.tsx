/**
 * Live trust strip — a thin band of confidence signals shown near
 * decision moments (homepage above-the-fold-adjacent, possibly /listings,
 * /property-alerts). Server Component so the numbers are real at the
 * moment of paint, not stale on a static prerender.
 *
 * Data sources, in order of how the cells are built:
 *   1. Real-time count of currently-active listings from the listings table.
 *      Updates as inventory turns. This is the only number in the strip.
 *   2. Checkable brand facts — the TREC licence number, the representation
 *      scope, the response commitment, the HQ. Nothing here needs a metric
 *      behind it, and all of it can be confirmed from outside the site.
 *
 * Notes on honest framing:
 *   - No track-record metrics. The operator-curated site_settings stats this
 *     used to read (2.4M SF transacted, 25 years' experience, 98% client
 *     satisfaction) could not be supported for a brokerage founded in 2024,
 *     and no aggregate closed-deal figure goes back in until real closed_date
 *     + sale_price rows exist to total.
 *   - The 4-cell layout is intentionally non-cluttered. Each cell carries one
 *     quantified or qualified signal, not a stat dump.
 */

import { Building2, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { supabase } from '@/lib/supabase';
import { BUSINESS } from '@/lib/schema';

interface TrustData {
  activeListings: number;
}

async function loadTrustData(): Promise<TrustData> {
  // Only one number is displayed now, and it is counted live rather than
  // curated: how many listings are actually on the market. The operator-set
  // stat_sf_transacted / stat_years_experience values this used to read were
  // unsupportable for a firm founded in 2024 and are no longer displayed.
  const { count } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .in('status', ['active', 'pending']);

  return { activeListings: count ?? 0 };
}

export async function TrustStrip() {
  let data: TrustData;
  try {
    data = await loadTrustData();
  } catch {
    // If the DB is unreachable at render time, fall back to brand-safe
    // defaults rather than crashing the page. Trust strip must never
    // break the homepage.
    data = { activeListings: 0 };
  }

  return (
    <section
      aria-label="Why CRECO"
      className="bg-primary border-y border-white/10 text-white"
    >
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 py-7 sm:py-8">
          {/* When the active count is 0 we swap to a non-numeric label
              ("Statewide") rather than displaying "0 active." Avoids the
              visual width drift caused by mixing a 1-char number with
              the other cells' wider values. Keeps the cell honest while
              the inventory ramps. */}
          <TrustCell
            icon={<Building2 className="h-5 w-5 text-gold" />}
            value={data.activeListings > 0 ? String(data.activeListings) : 'Statewide'}
            label={data.activeListings > 0 ? 'Active Texas listings' : 'Texas coverage'}
            sublabel={data.activeListings > 0 ? 'Updated daily' : 'San Antonio · Austin · Houston · DFW'}
          />
          {/* The licence number and the representation scope are both facts a
              visitor can verify — TREC's public lookup for the first, every
              other page on the site for the second. They replaced a "2.4M SF
              transacted / lifetime CRECO team" cell and a "25+ yrs Texas market
              experience" cell: CRECO was founded in 2024, and the agents table
              puts the founder at 9 years in the business, so neither figure
              could be supported. */}
          <TrustCell
            icon={<ShieldCheck className="h-5 w-5 text-gold" />}
            value={`TREC #${BUSINESS.trecLicense}`}
            label="Licensed Texas brokerage"
            sublabel="Texas Real Estate Commission"
          />
          <TrustCell
            icon={<Clock className="h-5 w-5 text-gold" />}
            value="Same day"
            label="Response time"
            sublabel="Business days, M–F"
          />
          <TrustCell
            icon={<MapPin className="h-5 w-5 text-gold" />}
            value="Full-service"
            label="Tenants, owners & investors"
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
