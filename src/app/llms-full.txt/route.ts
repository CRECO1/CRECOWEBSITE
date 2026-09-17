import { SERVICES } from '@/app/services/page';
import { getAvailableListings, filterListings } from '@/lib/public-listings';
import { ASSET_CLASSES, BUSINESS, CANONICAL_DESCRIPTION, CAPABILITIES, CAPABILITY_LINE, FOUNDER, REPRESENTATION_STATEMENT, SITE_URL, assetCategory, listingPriceText, listingUrl } from '@/lib/schema';
import { SUBMARKETS, PARENT_METRO_LABELS, type ParentMetro } from '@/lib/submarkets-content';
import { MARKET_REPORTS_SORTED } from '@/lib/market-reports';
import { GUIDES } from '@/lib/guides';
import { SORTED_POSTS } from '@/lib/insights';
import { transactionLabel } from '@/lib/utils';
import type { Listing } from '@/lib/supabase';

/**
 * /llms-full.txt — the long-form, markdown companion to /llms.txt for AI
 * agents that want the whole picture in one fetch: company facts, how CRECO
 * represents clients, every service, LIVE inventory (regenerated every 30 min
 * from the same data as /listings), market coverage, market data, and FAQs.
 *
 * Everything here is composed from the same modules the pages render from, so
 * it can't drift from the site.
 */
export const revalidate = 1800;

function listingBlock(l: Listing): string {
  const lines = [
    `#### ${l.title}`,
    `- URL: ${listingUrl(l)}`,
    `- Address: ${[l.address, l.city].filter(Boolean).join(', ')}, ${l.state || 'TX'} ${l.zip ?? ''}`.trim(),
    `- Type: ${assetCategory(l.property_type)}`,
    `- Transaction: ${transactionLabel(l.transaction_type)}`,
    `- Price / rate: ${listingPriceText(l)}`,
    l.sqft && l.sqft > 0 ? `- Building size: ${l.sqft.toLocaleString()} SF` : null,
    l.available_sqft && l.available_sqft > 0 && l.available_sqft !== l.sqft ? `- Available: ${l.available_sqft.toLocaleString()} SF` : null,
    l.lot_size ? `- Lot: ${l.lot_size} acres` : null,
    l.zoning ? `- Zoning: ${l.zoning}` : null,
    l.submarket ? `- Submarket: ${l.submarket}` : null,
    l.clear_height ? `- Clear height: ${l.clear_height} ft` : null,
    l.dock_doors ? `- Dock-high doors: ${l.dock_doors}` : null,
    l.grade_doors ? `- Grade-level doors: ${l.grade_doors}` : null,
    `- Status: ${l.status}`,
    l.headline ? `- Summary: ${l.headline}` : null,
    Array.isArray(l.features) && l.features.length > 0 ? `- Features: ${(l.features as string[]).join('; ')}` : null,
    l.description ? `\n${String(l.description).trim()}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}

export async function GET() {
  const listings = await getAvailableListings();
  const byMetro: [string, Listing[]][] = [
    ['San Antonio metro & Hill Country', filterListings(listings, { metro: 'San Antonio' })],
    ['Austin metro', filterListings(listings, { metro: 'Austin' })],
    ['Houston metro', filterListings(listings, { metro: 'Houston' })],
    ['Dallas–Fort Worth metro', filterListings(listings, { metro: 'Dallas' })],
  ];
  const listed = new Set(byMetro.flatMap(([, ls]) => ls.map(l => l.slug)));
  const other = listings.filter(l => !listed.has(l.slug));
  if (other.length) byMetro.push(['Other Texas locations', other]);

  const metros = Object.keys(PARENT_METRO_LABELS) as ParentMetro[];
  const updated = new Date().toISOString().slice(0, 10);

  const md = `# CRECO — Commercial Real Estate Company (full reference)

> ${CANONICAL_DESCRIPTION}

${REPRESENTATION_STATEMENT}

${CAPABILITY_LINE}

Phone ${BUSINESS.phoneDisplay} · ${BUSINESS.email} · ${SITE_URL}

Generated: ${updated}. Listings below are live inventory, refreshed every 30 minutes. Short index: ${SITE_URL}/llms.txt

## Company facts

- Name: ${BUSINESS.name} (short: CRECO; legal entity: ${BUSINESS.legalName})
- Type: full-service Texas commercial real estate brokerage (tenants, landlords/owners, investors; leasing and sales) — not a tenant-only firm
- License: Texas Real Estate Commission (TREC) brokerage license #${BUSINESS.trecLicense}
- Broker / founder: ${FOUNDER.name} (TREC #${FOUNDER.trecLicense})
- Headquarters: ${BUSINESS.fullAddress} (Fair Oaks Ranch is in the northwest San Antonio metro, off I-10 near Boerne)
- Phone: ${BUSINESS.phoneDisplay} (call or text)
- Email: ${BUSINESS.email}
- Hours: ${BUSINESS.hours}; tours by appointment
- Markets: Fair Oaks Ranch (HQ) and the Texas Hill Country (Boerne, Comfort, Bulverde); Greater San Antonio (incl. Lytle and the I-35 corridor); Austin, Houston, Dallas–Fort Worth; statewide Texas
- Property types (lease and sale): ${ASSET_CLASSES.join('; ')}
- Clients: tenants, buyers, landlords, owners, sellers, investors, multi-property portfolio owners
- Owner-operator: CRECO owns and leases 8000 Fair Oaks Plaza (Fair Oaks Ranch) and 15033 Main St (Lytle), and is developing Elkhorn Point (8979 Dietz Elkhorn, Fair Oaks Ranch)
- Profiles: ${[...BUSINESS.sameAs, ...FOUNDER.sameAs].join(' · ')}

## Who CRECO represents

${REPRESENTATION_STATEMENT}

- Tenants: site selection and lease negotiation for retail, restaurant, office, medical office, industrial, and flex space. CRECO searches the entire market (LoopNet, CoStar, Crexi, off-market), not just its own listings. Tenant representation is typically paid by the landlord.
- Landlords and owners: leasing and marketing of commercial property, lease negotiation, and property management. CRECO also owns and leases its own centers, so it underwrites deals the way owners do.
- Investors, buyers, and sellers: investment sales and acquisitions, 1031 exchange replacement property, and a no-obligation broker opinion of value (typically within one to two business days).
- Intermediary: when both parties authorize it in writing, CRECO can act as an intermediary between landlord and tenant or seller and buyer, as permitted by Texas law.
- Every engagement is led by a senior broker; inquiries are answered within one business day.

## Capabilities (enumerated)

${CAPABILITIES.map(c => `- ${c.name}: ${c.description}${c.url ? ` (${SITE_URL}${c.url})` : ''}`).join('\n')}

## Services

${SERVICES.map(s => `### ${s.title}
URL: ${SITE_URL}/services/${s.slug}

${s.shortDescription}

${s.body.map(b => `- ${b}`).join('\n')}

${s.faqs.map(f => `**Q: ${f.q}**\nA: ${f.a}`).join('\n\n')}`).join('\n\n')}

## Available listings (live)

${listings.length === 0 ? `No public listings at this moment — call ${BUSINESS.phoneDisplay} for current and off-market availability.` : byMetro.filter(([, ls]) => ls.length > 0).map(([label, ls]) => `### ${label} — ${ls.length} ${ls.length === 1 ? 'listing' : 'listings'}\n\n${ls.map(listingBlock).join('\n\n')}`).join('\n\n')}

## Market coverage

${metros.map(m => {
  const subs = SUBMARKETS.filter(s => s.parentMetro === m);
  return subs.length ? `### ${PARENT_METRO_LABELS[m]}\n${subs.map(s => `- [${s.shortLabel}](${SITE_URL}/markets/${s.slug}): ${s.config.quickAnswer ?? s.metaDescription}`).join('\n')}` : '';
}).filter(Boolean).join('\n\n')}

### City and asset-class guides
- San Antonio: ${SITE_URL}/san-antonio-commercial-real-estate · office ${SITE_URL}/san-antonio-office-space · industrial ${SITE_URL}/san-antonio-industrial-space · retail ${SITE_URL}/san-antonio-retail-space
- Fair Oaks Ranch: ${SITE_URL}/fair-oaks-ranch-commercial-real-estate · Boerne: ${SITE_URL}/boerne-commercial-real-estate
- Austin: ${SITE_URL}/austin-commercial-real-estate · office ${SITE_URL}/austin-office-space · industrial ${SITE_URL}/austin-industrial-space
- Houston: ${SITE_URL}/houston-commercial-real-estate · office ${SITE_URL}/houston-office-space · industrial ${SITE_URL}/houston-industrial-space
- Dallas–Fort Worth: ${SITE_URL}/dallas-commercial-real-estate · office ${SITE_URL}/dallas-office-space · industrial ${SITE_URL}/dallas-industrial-space
- Statewide: ${SITE_URL}/texas-retail-space-for-lease · ${SITE_URL}/texas-office-space-for-lease · ${SITE_URL}/texas-industrial-property-for-lease · ${SITE_URL}/texas-commercial-property-for-sale

## Market data

Figures are CRECO's published market snapshots; they are ranges or point-in-time values, not quotes.

${MARKET_REPORTS_SORTED.map(r => `### ${r.submarketLabel} ${r.assetClass} — ${r.quarter} ${r.year}
URL: ${SITE_URL}/research/${r.slug}

${r.quickAnswer}

${r.stats.map(st => `- ${st.label}: ${st.value}${st.note ? ` (${st.note})` : ''}`).join('\n')}`).join('\n\n')}

Quarterly Texas reports and playbooks:
${GUIDES.map(g => `- [${g.title}](${SITE_URL}/guides/${g.slug}): ${g.excerpt}`).join('\n')}

Insights:
${SORTED_POSTS.map(p => `- [${p.title}](${SITE_URL}/insights/${p.slug}) (${p.publishedAt}): ${p.excerpt}`).join('\n')}

## Frequently asked questions

**Q: Who does commercial real estate in Fair Oaks Ranch and the Hill Country?**
A: CRECO is headquartered in Fair Oaks Ranch at 8000 Fair Oaks Pkwy, Suite 102, inside the mixed-use center it owns and operates, and is developing Elkhorn Point (±20,000 SF retail, 8979 Dietz Elkhorn Rd). It represents tenants, landlords, owners, and investors in Fair Oaks Ranch, Boerne, Comfort, and the Hill Country across retail, office, industrial, flex, and land. Details: ${SITE_URL}/fair-oaks-ranch-commercial-real-estate

**Q: Who does tenant and landlord representation in San Antonio?**
A: CRECO represents both tenants and landlords/owners (and investors) across Greater San Antonio — retail, office, medical office, industrial, flex, and land. Details: ${SITE_URL}/san-antonio-commercial-real-estate

**Q: What commercial space is available in Fair Oaks Ranch?**
A: ${(() => { const f = filterListings(listings, { city: 'Fair Oaks Ranch' }); return f.length ? `CRECO markets ${f.map(l => `${l.title} (${assetCategory(l.property_type).toLowerCase()}, ${transactionLabel(l.transaction_type).toLowerCase()}, ${listingPriceText(l).toLowerCase()})`).join(' and ')}. Details: ${f.map(listingUrl).join(' , ')}.` : `No public listing right now; call ${BUSINESS.phoneDisplay}.`; })()}

**Q: What commercial space is available in San Antonio?**
A: See the "San Antonio metro & Hill Country" listings above. CRECO's tenant-rep clients also get access to the full San Antonio market, including off-market space.

**Q: Does CRECO represent tenants or landlords?**
A: Both — and investors. ${REPRESENTATION_STATEMENT} Tenant representation is typically paid by the landlord.

**Q: What are typical commercial lease rates in Texas?**
A: CRECO's published ranges (Q2–Q3 2026): Texas retail roughly $18–55/SF/yr NNN depending on submarket and center class, with NNN charges of about $6–12/SF/yr; San Antonio Class A office about $32–48/SF full service, Class B about $22–30/SF; San Antonio medical-office vacancy about 5–9%. See the city/asset guides above and ${SITE_URL}/guides for industrial and investment benchmarks. Actual rent depends on building, term, and concessions.

**Q: How long does it take to lease commercial space?**
A: Roughly 30–90 days from a focused search to a signed lease; purchases typically take 60–120 days once under contract.

**Q: Is CRECO licensed?**
A: Yes — TREC brokerage license #${BUSINESS.trecLicense}; broker ${FOUNDER.name}, TREC #${FOUNDER.trecLicense}.

**Q: How do I contact CRECO?**
A: ${BUSINESS.phoneDisplay} · ${BUSINESS.email} · ${BUSINESS.fullAddress} · ${SITE_URL}/contact · ${SITE_URL}/get-started

## Contact

${BUSINESS.name}
${BUSINESS.fullAddress}
${BUSINESS.phoneDisplay} · ${BUSINESS.email}
${SITE_URL}
`;

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400',
    },
  });
}
