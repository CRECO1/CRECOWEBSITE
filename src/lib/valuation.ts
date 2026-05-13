/**
 * Quick-look commercial property valuation engine.
 *
 * Two paths:
 *   1. Income approach (preferred when the owner knows their numbers):
 *        value = NOI / cap rate
 *      We use a cap rate range per (property_type, submarket tier), so the
 *      output is a low/high band, not a point estimate.
 *
 *   2. Rent-extrapolation fallback (when only SF + asking-rent style inputs
 *      are available):
 *        gross_income = SF × rate × occupancy × 12
 *        NOI ≈ gross_income × operating_margin  (default 0.65 for CRE)
 *        value = NOI / cap rate
 *
 * The cap rate ranges below are sourced from CRECO's published Q2 2026
 * insights post + on-the-ground broker conversations. They're directionally
 * accurate, not point estimates — that's why we always return a range and
 * label it "preliminary". For an actual valuation the owner needs a full
 * broker review with comps, condition, lease analysis, etc.
 */

export type PropertyType = 'industrial' | 'retail' | 'office' | 'flex' | 'mixed-use' | 'land' | 'multifamily';
export type SubmarketTier = 'primary' | 'secondary' | 'tertiary';

/**
 * Cap rate ranges for stabilized assets, mid-2026. low = aggressive
 * (Class A, premium submarket); high = conservative (Class C, secondary
 * submarket). Stored as decimals (0.07 = 7%).
 */
export const CAP_RATE_BANDS: Record<PropertyType, { low: number; high: number }> = {
  industrial:  { low: 0.065, high: 0.085 },
  retail:      { low: 0.065, high: 0.085 },
  office:      { low: 0.080, high: 0.105 },
  flex:        { low: 0.070, high: 0.090 },
  'mixed-use': { low: 0.065, high: 0.085 },
  land:        { low: 0.060, high: 0.090 },     // less reliable — land trades on comps not cap rate
  multifamily: { low: 0.055, high: 0.075 },
};

/**
 * Submarket-tier nudge — primary submarkets (Austin Domain, Houston Galleria,
 * Dallas Uptown, Frisco) compress cap rates by ~50 bps below the band; tertiary
 * (out-of-metro Texas) expand by ~50 bps above. Secondary stays in the band.
 */
const TIER_ADJUST: Record<SubmarketTier, number> = {
  primary:   -0.005,
  secondary:  0,
  tertiary:   0.005,
};

/**
 * Default operating margin (NOI / gross income) when the owner provides
 * gross income but not NOI. 65% is a reasonable mid-band for stabilized
 * Texas CRE — varies widely (warehouse can be 80%+, multifamily can be 55%).
 */
const DEFAULT_OPERATING_MARGIN = 0.65;

export interface ValuationInput {
  propertyType: PropertyType;
  submarketTier: SubmarketTier;
  /** Annual net operating income, if the owner knows it. Preferred input. */
  noi?: number;
  /** Annual gross income (rent roll × 12), if NOI is unknown. */
  grossIncome?: number;
  /** Square footage. Used only when neither NOI nor gross income is given. */
  totalSf?: number;
  /** Asking rent in $/SF/year, fallback when noi/grossIncome unknown. */
  rentPerSfYear?: number;
  /** Occupancy as decimal (0.85 = 85%). Defaults to 0.95 if unknown. */
  occupancy?: number;
}

export interface ValuationResult {
  /** Low end of the cap-rate-derived range. */
  low: number;
  /** High end of the range. */
  high: number;
  /** Midpoint — useful for "rough estimate" framing. */
  midpoint: number;
  /** Computed (or input) NOI used to derive the range. */
  noiUsed: number;
  /** Cap rate range applied (after tier adjustment). */
  capRateRange: { low: number; high: number };
  /** Plain-language note on how we arrived at the number. */
  methodology: string;
}

/**
 * Compute a preliminary valuation range. Returns null if there's not enough
 * input to make any reasonable estimate.
 */
export function valueProperty(input: ValuationInput): ValuationResult | null {
  const band = CAP_RATE_BANDS[input.propertyType];
  if (!band) return null;

  const tierAdjust = TIER_ADJUST[input.submarketTier];
  const capLow = Math.max(0.03, band.low + tierAdjust);    // floor at 3% to avoid wild outputs
  const capHigh = Math.max(0.04, band.high + tierAdjust);

  let noi: number;
  let methodology: string;

  if (input.noi && input.noi > 0) {
    noi = input.noi;
    methodology = `Income approach — value = NOI / cap rate, with cap rates of ${(capLow * 100).toFixed(2)}% (low) to ${(capHigh * 100).toFixed(2)}% (high) for ${propertyTypeLabel(input.propertyType)} in this submarket tier.`;
  } else if (input.grossIncome && input.grossIncome > 0) {
    noi = input.grossIncome * DEFAULT_OPERATING_MARGIN;
    methodology = `Income approach — gross income × ${(DEFAULT_OPERATING_MARGIN * 100).toFixed(0)}% operating margin (typical for ${propertyTypeLabel(input.propertyType)}) = estimated NOI, then NOI / cap rate.`;
  } else if (input.totalSf && input.totalSf > 0 && input.rentPerSfYear && input.rentPerSfYear > 0) {
    const occupancy = input.occupancy ?? 0.95;
    const grossIncome = input.totalSf * input.rentPerSfYear * occupancy;
    noi = grossIncome * DEFAULT_OPERATING_MARGIN;
    methodology = `Estimated from SF × rent × ${(occupancy * 100).toFixed(0)}% occupancy × ${(DEFAULT_OPERATING_MARGIN * 100).toFixed(0)}% operating margin → NOI / cap rate.`;
  } else {
    return null;
  }

  // value = NOI / cap rate. Lower cap rate → higher value. Inverted bounds.
  const high = noi / capLow;
  const low = noi / capHigh;
  const midpoint = (low + high) / 2;

  return {
    low: Math.round(low),
    high: Math.round(high),
    midpoint: Math.round(midpoint),
    noiUsed: Math.round(noi),
    capRateRange: { low: capLow, high: capHigh },
    methodology,
  };
}

export function propertyTypeLabel(t: PropertyType): string {
  const map: Record<PropertyType, string> = {
    industrial: 'Industrial / Warehouse',
    retail: 'Retail',
    office: 'Office',
    flex: 'Flex',
    'mixed-use': 'Mixed-Use',
    land: 'Land',
    multifamily: 'Multifamily',
  };
  return map[t] ?? t;
}

/**
 * Submarket tier hint based on the user's selected market. Hard-coded
 * mapping — not perfect, but good enough for a rough estimate. Primary
 * = trophy/Class A core, secondary = standard urban/suburban, tertiary
 * = outlying / smaller-market.
 */
export const SUBMARKETS_BY_TIER: { tier: SubmarketTier; label: string; markets: string[] }[] = [
  {
    tier: 'primary',
    label: 'Class A core',
    markets: ['Austin Domain', 'Austin Downtown', 'Houston Galleria', 'Houston Energy Corridor', 'Dallas Uptown', 'Frisco', 'Plano', 'The Woodlands', 'Sugar Land'],
  },
  {
    tier: 'secondary',
    label: 'Standard urban / suburban',
    markets: ['San Antonio NW / NC / NE', 'San Antonio Downtown', 'San Antonio South Side', 'Fair Oaks Ranch', 'Boerne', 'East Austin', 'South Congress', 'Round Rock', 'Pflugerville', 'Cedar Park', 'DFW Airport corridor', 'Alliance', 'Mesquite / Lancaster', 'Houston Northwest / Southwest / Ship Channel', 'Downtown Fort Worth'],
  },
  {
    tier: 'tertiary',
    label: 'Outlying / smaller market',
    markets: ['New Braunfels', 'Seguin', 'Schertz', 'Helotes', 'Bulverde', 'Other Texas'],
  },
];
