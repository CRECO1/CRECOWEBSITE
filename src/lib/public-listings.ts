import { getListings, type Listing } from './supabase';
import { withSyntheticListings } from './featured-properties';

/**
 * Currently-available inventory for structured data, FAQ answers and
 * llms-full.txt: DB listings that are active or pending plus the code-defined
 * CRECO properties. Leased/sold rows are excluded — an AI agent reading
 * "available" must never be handed a closed deal.
 */
export async function getAvailableListings(): Promise<Listing[]> {
  const db = await getListings('active').catch(() => [] as Listing[]);
  return withSyntheticListings(db).filter(l => l.status === 'active' || l.status === 'pending');
}

/** Cities CRECO treats as part of each metro when filtering market pages. */
const METRO_CITIES: Record<string, string[]> = {
  'san antonio': [
    'san antonio', 'fair oaks ranch', 'boerne', 'helotes', 'leon valley', 'live oak', 'converse', 'schertz',
    'cibolo', 'selma', 'universal city', 'new braunfels', 'bulverde', 'spring branch', 'lytle', 'comfort',
    'castroville', 'seguin', 'alamo heights', 'shavano park',
  ],
  austin: ['austin', 'round rock', 'cedar park', 'leander', 'pflugerville', 'georgetown', 'kyle', 'buda', 'san marcos'],
  houston: ['houston', 'sugar land', 'the woodlands', 'katy', 'spring', 'pearland', 'cypress', 'conroe', 'pasadena'],
  dallas: ['dallas', 'fort worth', 'plano', 'frisco', 'irving', 'arlington', 'mckinney', 'allen', 'richardson', 'garland', 'grand prairie', 'denton', 'carrollton', 'lewisville'],
};
METRO_CITIES['dallas–fort worth'] = METRO_CITIES.dallas;
METRO_CITIES['dallas-fort worth'] = METRO_CITIES.dallas;
METRO_CITIES['fort worth'] = METRO_CITIES.dallas;

const ASSET_TYPES: Record<string, string[]> = {
  industrial: ['industrial', 'warehouse', 'flex'],
  warehouse: ['industrial', 'warehouse', 'flex'],
  office: ['office'],
  'medical office': ['office'],
  retail: ['retail'],
  flex: ['flex', 'industrial', 'warehouse'],
  land: ['land'],
};

export function filterListings(
  listings: Listing[],
  f: { metro?: string; city?: string; asset?: string; transaction?: 'lease' | 'sale' },
): Listing[] {
  const metroCities = f.metro ? METRO_CITIES[f.metro.toLowerCase()] ?? [f.metro.toLowerCase()] : null;
  const types = f.asset ? ASSET_TYPES[f.asset.toLowerCase()] ?? [f.asset.toLowerCase()] : null;
  return listings.filter(l => {
    const city = (l.city ?? '').toLowerCase();
    if (metroCities && !metroCities.includes(city)) return false;
    if (f.city && city !== f.city.toLowerCase()) return false;
    if (types && !types.includes((l.property_type ?? '').toLowerCase())) return false;
    if (f.transaction && l.transaction_type !== f.transaction && l.transaction_type !== 'both') return false;
    return true;
  });
}
