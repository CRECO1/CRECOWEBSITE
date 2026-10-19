import type { ReactNode } from 'react';

/**
 * Issue 1 of the San Antonio & Hill Country Market Brief (Q2 2026 data).
 *
 * Every figure links to the report it came from. Where the big brokerages disagree
 * (they measure different building sets), all of them are shown. Anything that could not
 * be confirmed from a primary source was left out rather than hedged — add it back only
 * with a source. Section 4 is CRECO's opinion and is labelled as such.
 */

function A({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-gold-dark underline underline-offset-2 hover:text-gold">{children}</a>;
}

function Table({ head, rows, note }: { head: string[]; rows: ReactNode[][]; note?: ReactNode }) {
  return (
    <div className="my-5">
      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[560px] text-left text-body-sm">
          <thead className="bg-background-cream text-caption uppercase tracking-wide text-foreground-muted">
            <tr>{head.map((h, i) => <th key={i} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border/70">
                {r.map((c, j) => <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-semibold text-primary' : 'text-foreground-muted'}`}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-2 text-caption text-foreground-muted">{note}</p>}
    </div>
  );
}

const H2 = ({ id, children }: { id: string; children: ReactNode }) => (
  <h2 id={id} className="mt-12 scroll-mt-28 font-heading text-display-sm font-bold text-primary">{children}</h2>
);
const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="mt-8 font-heading text-heading-lg font-semibold text-primary">{children}</h3>
);
const UL = ({ children }: { children: ReactNode }) => (
  <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-foreground-muted leading-relaxed marker:text-gold">{children}</ul>
);

const CBRE_IND = 'https://www.cbre.com/insights/figures/san-antonio-industrial-figures-q2-2026';
const CBRE_OFF = 'https://www.cbre.com/insights/figures/san-antonio-office-figures-q2-2026';
const CW_IND = 'https://assets.cushmanwakefield.com/-/media/cw/marketbeat-pdfs/2026/q2/us-reports/industrial/sanantonio_americas_marketbeat_industrial_q22026.pdf';
const CW_OFF = 'https://assets.cushmanwakefield.com/-/media/cw/marketbeat-pdfs/2026/q2/us-reports/office/san-antonio_americas_marketbeat_office_q22026.pdf';
const P_IND = 'https://partnersrealestate.com/research/san-antonio-industrial-q2-2026-quarterly-market-report/';
const P_OFF = 'https://partnersrealestate.com/research/san-antonio-office-q2-2026-quarterly-market-report/';
const P_RET = 'https://partnersrealestate.com/research/san-antonio-retail-q2-2026-quarterly-market-report/';
const MATTHEWS = 'https://www.matthews.com/insights/san-antonio-medical-office-q2-2026';

export const BRIEF_SECTIONS = [
  { id: 'summary', label: 'The short version' },
  { id: 'by-type', label: 'San Antonio by property type' },
  { id: 'hill-country', label: 'Hill Country focus' },
  { id: 'what-it-means', label: 'What it means' },
  { id: 'sources', label: 'Sources' },
];

export function BriefContent() {
  return (
    <article className="max-w-3xl">
      <H2 id="summary">Retail stays tight, office is improving and the Hill Country keeps growing</H2>
      <UL>
        <li><strong className="text-primary">Retail space is scarcest in the Hill Country.</strong> Metro retail vacancy was 4.1%. In Kendall County it was <strong>2.4%</strong> and in Comal County <strong>2.6%</strong> (<A href={P_RET}>Partners Retail Q2 2026</A>).</li>
        <li><strong className="text-primary">Office vacancy depends on who is counting, but the I-10/1604 gateway beats the metro.</strong> Metro office vacancy was 15.2% (<A href={CW_OFF}>Cushman &amp; Wakefield</A>), 16.9% (<A href={P_OFF}>Partners</A>) or 17.6% (<A href={CBRE_OFF}>CBRE</A>). Cushman&apos;s Far Northwest submarket was <strong>9.2%</strong>.</li>
        <li><strong className="text-primary">Small-bay flex is steady.</strong> Flex vacancy was 8.0% to 8.7%, with asking rents of about <strong>$12.49 to $12.85/SF NNN</strong> across all three brokers.</li>
        <li><strong className="text-primary">People keep moving north and northeast.</strong> From 2020 to 2025, Comal County&apos;s population grew <strong>27.8%</strong> (<A href="https://communityimpact.com/san-antonio/northeast-san-antonio-metrocom/government/2026/04/07/comal-county-sees-278-population-increase-from-2020-25/">Community Impact, Apr 2026</A>) and Kendall County&apos;s grew <strong>20.3%</strong> (<A href="https://newsletter.communityimpact.com/p/new-post-a034">Community Impact, Apr 2026</A>).</li>
      </UL>
      <p className="mt-4 rounded-xl border border-border bg-background-cream p-4 text-body-sm text-foreground-muted leading-relaxed">
        <strong className="text-primary">How to read the numbers.</strong> The big brokerages measure different building sets: office inventory is 34.3M SF at CBRE, 43.7M SF at Partners and 50.3M SF at Cushman &amp; Wakefield, so their vacancy rates differ. Where they disagree, all of them are shown.
      </p>

      <H2 id="by-type">San Antonio by property type (Q2 2026)</H2>

      <H3>Industrial</H3>
      <Table
        head={['Q2 2026', 'CBRE', 'Cushman & Wakefield', 'Partners']}
        rows={[
          ['Vacancy', '10.3%', '11.1%', '11.3%'],
          ['Net absorption (quarter)', '252,059 SF', '357,376 SF', '873,488 SF'],
          ['Avg. asking rent', '$8.52 NNN', '$8.83 overall net', '$9.22'],
          ['Under construction', '2.9M SF', '2.70M SF', '4.0M SF'],
        ]}
        note={<>Sources: <A href={CBRE_IND}>CBRE (Jul 9 2026)</A>, <A href={CW_IND}>Cushman &amp; Wakefield</A>, <A href={P_IND}>Partners (Aug 1 2026)</A>.</>}
      />
      <UL>
        <li><strong className="text-primary">The sources disagree on absorption.</strong> Partners&apos; figure is more than three times CBRE&apos;s.</li>
        <li><strong className="text-primary">They disagree on the Northwest submarket too.</strong> CBRE shows −145,000 SF there, Cushman +131,075 SF and Partners +443,658 SF. All three put Northwest vacancy at 7.1% to 7.6%.</li>
        <li><strong className="text-primary">Notable Q2 deals:</strong> JCB signed a 198,000 SF lease at 10120 Fischer Rd (South). Amazon bought the vacant 560,500 SF Rosillo Creek Industrial Park Bldg 1.</li>
        <li><strong className="text-primary">Construction is concentrated in manufacturing,</strong> including JCB&apos;s 1.0M SF plant and Toyota&apos;s 500,000 SF Rear Axle facility (CBRE).</li>
      </UL>

      <H3>Flex (small-bay / office-service)</H3>
      <Table
        head={['Q2 2026', 'CBRE "R&D/Flex"', 'Cushman "Office Service/Flex"', 'Partners "Flex"']}
        rows={[
          ['Vacancy', '8.6%', '8.0%', '8.7%'],
          ['Asking rent (NNN)', '$12.59', '$12.49', '$12.85'],
          ['Net absorption', '−25,000 SF', '−45,103 SF', '+238,700 SF'],
        ]}
        note="Sources: the same three industrial reports."
      />

      <H3>Office</H3>
      <Table
        head={['Q2 2026', 'CBRE', 'Cushman & Wakefield', 'Partners']}
        rows={[
          ['Vacancy', '17.6%', '15.2%', '16.9%'],
          ['Net absorption', '−43,950 SF', '+283,787 SF', '−85,357 SF'],
          ['Avg. asking rent (full service)', '$29.76', '$27.97', '$29.54'],
          ['Under construction', '30,400 SF', '0 SF', '60,000 SF'],
        ]}
        note={<>Sources: <A href={CBRE_OFF}>CBRE (Jul 9 2026)</A>, <A href={CW_OFF}>Cushman &amp; Wakefield</A>, <A href={P_OFF}>Partners (Aug 11 2026)</A>.</>}
      />
      <UL>
        <li><strong className="text-primary">The sources disagree on the direction of absorption.</strong> Cushman says positive; CBRE and Partners say negative.</li>
        <li><strong className="text-primary">Northwest submarket vacancy:</strong> 16.8% (CBRE), 16.7% (Cushman), 15.1% (Partners).</li>
        <li><strong className="text-primary">Far Northwest (Cushman only):</strong> 9.2% vacancy, +306,704 SF absorbed in Q2, $40.41/SF asking.</li>
        <li><strong className="text-primary">The only project underway (Partners):</strong> The Rock Medical and Research Pavilion, 60,000 SF in Northwest, 58% pre-leased.</li>
        <li><strong className="text-primary">Medical office (<A href={MATTHEWS}>Matthews, Jul 2026</A>):</strong> 12.27% metro vacancy, $29.99/SF asking and 80,128 SF under construction. Matthews names Far West/Westover Hills and Far Northwest as demand hotspots, with leasing concentrating along Loop 1604 and I-10.</li>
      </UL>

      <H3>Retail</H3>
      <p className="mt-3 text-body text-foreground-muted leading-relaxed">Partners is the only free Q2 2026 retail source we found (<A href={P_RET}>Partners Retail Q2 2026, Aug 17 2026</A>), so these figures have no second source to cross-check.</p>
      <UL>
        <li><strong className="text-primary">Metro:</strong> vacancy 4.1%; net absorption 94,972 SF, down from 405,772 SF in Q1; asking rent $19.27/SF NNN, down 2.5% YoY; 833,294 SF under construction, about 59% pre-leased; 162,514 SF delivered.</li>
        <li><strong className="text-primary">Notable leases:</strong> Crunch Fitness, 42,763 SF at New Braunfels Marketplace; Marshalls, 24,000 SF at Windsor Park Center. <strong className="text-primary">Notable sale:</strong> DRA Advisors bought La Plaza Del Norte (222,076 SF).</li>
      </UL>

      <H2 id="hill-country">Hill Country focus</H2>
      <Table
        head={['Submarket (Q2 2026)', 'Vacancy', 'Net absorption', 'Under construction', 'Asking rent NNN']}
        rows={[
          ['Kendall Co. retail', '2.4%', '+15,068 SF', '70,271 SF', '$22.85'],
          ['Comal Co. retail', '2.6%', '+13,396 SF', '62,700 SF', '$28.16'],
          ['Northwest SA retail', '4.6%', '+3,639 SF', '270,034 SF', '$15.74'],
          ['Comal Co. industrial (Partners)', '11.3%', '+239,313 SF', '311,343 SF', '$12.14'],
          ['Comal Co. industrial (Cushman)', '10.0%', '+82,543 SF', '51,000 SF', 'not split out'],
        ]}
        note={<>Sources: <A href={P_RET}>Partners Retail</A>, <A href={P_IND}>Partners Industrial</A>, <A href={CW_IND}>Cushman Industrial</A>. Cushman&apos;s largest Comal deal was a new 173,447 SF lease at 2633 Goodwin Ln, Bldg A.</>}
      />

      <H3>Boerne / Kendall County</H3>
      <UL>
        <li><strong className="text-primary">Population:</strong> Kendall County grew from 44,568 (2020) to 53,289 (2025), per Census data reported by <A href="https://newsletter.communityimpact.com/p/new-post-a034">Community Impact</A> and confirmed on <A href="https://fred.stlouisfed.org/series/TXKEND9POP">FRED</A>.</li>
        <li><strong className="text-primary">Medical:</strong> Baptist Health System&apos;s first Boerne acute-care hospital plus a medical office building, on 23 acres at I-10 and SH-46, was scheduled to begin construction in 2026; no completion date had been announced (<A href="https://communityimpact.com/san-antonio/healthcare/building-boerne-baptist-site-work-begins-on-acute-care-hospital-and-medical-office/">Community Impact, Dec 2025</A>). Wellness Plaza at Boerne, 37,000 SF off Herff Rd with ground-floor retail and two floors of medical office, targeted a spring 2026 groundbreaking and a 2027 opening (<A href="https://communityimpact.com/san-antonio/development/wellness-plaza-at-boerne-aims-to-bring-health-care-retail-to-herff-road/">Community Impact, Sep 2025</A>).</li>
        <li><strong className="text-primary">Retail:</strong> Scenic Loop Retail, three shell buildings totaling 30,572 SF at 31905 I-10, is scheduled Oct 2026 to Sep 2027 (<A href="https://www.tdlr.texas.gov/TABS/Search/Print/TABS2026014737">TDLR filing TABS2026014737</A>). Buc-ee&apos;s is capped at a 54,000 SF store and 100 fueling stations under the October 2025 revised agreement (<A href="https://communityimpact.com/san-antonio/development/buc-ees-baptist-health-system-and-more-coming-to-boerne-fair-oaks-ranch/">Community Impact, Dec 2025</A>).</li>
      </UL>

      <H3>Fair Oaks Ranch / Leon Springs / I-10 corridor</H3>
      <UL>
        <li><strong className="text-primary">Lemon Creek Ranch (118 acres, Bexar County side):</strong> H-E-B Fair Oaks is adding a $2M, 4,465 SF True Texas BBQ, scheduled for construction June to September 2026 (<A href="https://www.yahoo.com/news/articles/h-e-b-plans-texas-220300537.html">MySA, Feb 2026</A>). The plan includes a hotel, apartments and retail (<A href="https://www.yahoo.com/news/articles/details-sprawling-development-only-minutes-123510550.html">MySA, Oct 2025</A>).</li>
        <li><strong className="text-primary">Gateway office:</strong> the Far Northwest office figures and the WestRidge at La Cantera sale (258,031 SF, Perform Properties to SageView Partners; Cushman) are the nearest institutional data points.</li>
      </UL>

      <H3>New Braunfels / Comal County</H3>
      <UL>
        <li><strong className="text-primary">Population:</strong> 163,608 (2020) to 209,166 (2025), +27.8% (<A href="https://communityimpact.com/san-antonio/northeast-san-antonio-metrocom/government/2026/04/07/comal-county-sees-278-population-increase-from-2020-25/">Community Impact</A>).</li>
        <li><strong className="text-primary">The Neue:</strong> $27M, 72,000 SF of condos with ground-floor commercial downtown; broke ground Sep 29 2026, completion expected Nov 2027 (<A href="https://communityimpact.com/new-braunfels/development/developers-break-ground-on-the-neue-in-downtown-new-braunfels/">Community Impact</A>).</li>
        <li><strong className="text-primary">Latitude:</strong> 65,000 SF of for-sale office/warehouse bays (45 units) at 710 N. Walnut Ave; groundbreaking expected Q2 2027 (<A href="https://communityimpact.com/new-braunfels/development/gbmc-communities-to-develop-6-5-acre-office-warehouse-space-in-new-braunfels/">Community Impact</A>).</li>
        <li><strong className="text-primary">Corridor Commercial Center Phase 2:</strong> 35,000 SF of flex/retail, spaces from 1,800 to 11,900 SF (<A href="https://communityimpact.com/new-braunfels/development/corridor-commercial-centers-phase-2-underway-in-new-braunfels/">Community Impact</A>).</li>
      </UL>

      <H3>Appraisals</H3>
      <UL>
        <li>Bexar County 2026 commercial values rose <strong>5.99%</strong> while single-family values fell 0.11% (<A href="https://sanantonioreport.org/average-bexar-county-home-property-values-2026/">San Antonio Report, Apr 2026</A>).</li>
      </UL>

      <H2 id="what-it-means">What it means: CRECO&apos;s view</H2>
      <p className="mt-3 text-caption font-semibold uppercase tracking-wide text-gold-dark">Opinion, not data</p>
      <H3>For owners</H3>
      <UL>
        <li><strong className="text-primary">Hill Country retail and medical owners have pricing power.</strong> With Kendall and Comal retail under 3% vacant, renewals are a time to hold firm on rent. Price against local comps rather than metro averages, because metro asking rent slipped 2.5% YoY.</li>
        <li><strong className="text-primary">Small-bay flex is the most balanced product.</strong> Well-located flex is a reasonable hold for buyers who value stable occupancy.</li>
        <li><strong className="text-primary">Office owners face a split market.</strong> Owners in the Far Northwest gateway compete in a much tighter market than the metro headline suggests. Owners of older Class B space elsewhere should budget for concessions.</li>
        <li><strong className="text-primary">Check your appraisal.</strong> Bexar commercial values rose about 6% while homes were flat. Review your 2027 notice carefully and consider protesting.</li>
      </UL>
      <H3>For tenants</H3>
      <UL>
        <li><strong className="text-primary">Hill Country retail and medical tenants should start early.</strong> Begin searches 9 to 12 months ahead: little space is vacant, and new medical space is not expected before 2027.</li>
        <li><strong className="text-primary">Office tenants have leverage almost everywhere except the gateway submarkets.</strong> Ask for TI, free rent and flexible terms.</li>
        <li><strong className="text-primary">Industrial users above 100,000 SF have the most choice.</strong> CBRE shows 15.9% vacancy in the 100K to 250K SF size range versus 6.1% below 50K SF.</li>
      </UL>

      <H2 id="sources">Sources</H2>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-body-sm text-foreground-muted break-words">
        <li>CBRE Research, <A href={CBRE_IND}>San Antonio Industrial Figures Q2 2026</A>, Jul 9 2026.</li>
        <li>CBRE Research, <A href={CBRE_OFF}>San Antonio Office Figures Q2 2026</A>, Jul 9 2026.</li>
        <li>Cushman &amp; Wakefield, <A href={CW_OFF}>MarketBeat San Antonio Office Q2 2026</A>.</li>
        <li>Cushman &amp; Wakefield, <A href={CW_IND}>MarketBeat San Antonio Industrial Q2 2026</A>.</li>
        <li>Partners Real Estate, <A href={P_IND}>San Antonio Industrial Q2 2026</A>, Aug 1 2026.</li>
        <li>Partners Real Estate, <A href={P_OFF}>San Antonio Office Q2 2026</A>, Aug 11 2026.</li>
        <li>Partners Real Estate, <A href={P_RET}>San Antonio Retail Q2 2026</A>, Aug 17 2026.</li>
        <li>Matthews, <A href={MATTHEWS}>San Antonio Medical Office Q2 2026</A>, Jul 21 2026.</li>
        <li>Community Impact, <A href="https://communityimpact.com/san-antonio/northeast-san-antonio-metrocom/government/2026/04/07/comal-county-sees-278-population-increase-from-2020-25/">Comal County sees 27.8% population increase from 2020–25</A>, Apr 8 2026.</li>
        <li>Community Impact SATX-BNE newsletter, <A href="https://newsletter.communityimpact.com/p/new-post-a034">Apr 1 2026</A> (Kendall County population).</li>
        <li>FRED / U.S. Census Bureau, <A href="https://fred.stlouisfed.org/series/TXKEND9POP">Resident Population in Kendall County, TX</A>, updated Mar 27 2026.</li>
        <li>Community Impact, <A href="https://communityimpact.com/san-antonio/healthcare/building-boerne-baptist-site-work-begins-on-acute-care-hospital-and-medical-office/">Building Boerne: Baptist site work begins</A>, Dec 19 2025.</li>
        <li>Community Impact, <A href="https://communityimpact.com/san-antonio/development/buc-ees-baptist-health-system-and-more-coming-to-boerne-fair-oaks-ranch/">Buc-ee&apos;s, Baptist Health System and more coming to Boerne, Fair Oaks Ranch</A>, Dec 31 2025.</li>
        <li>Community Impact, <A href="https://communityimpact.com/san-antonio/development/wellness-plaza-at-boerne-aims-to-bring-health-care-retail-to-herff-road/">Wellness Plaza at Boerne</A>, Sep 4 2025.</li>
        <li>Texas Dept. of Licensing &amp; Regulation, <A href="https://www.tdlr.texas.gov/TABS/Search/Print/TABS2026014737">TABS2026014737 &ldquo;Scenic Loop Retail&rdquo;</A>, registered Mar 11 2026.</li>
        <li>MySA via Yahoo News, <A href="https://www.yahoo.com/news/articles/h-e-b-plans-texas-220300537.html">H-E-B Fair Oaks True Texas BBQ expansion</A>, Feb 2 2026.</li>
        <li>MySA via Yahoo News, <A href="https://www.yahoo.com/news/articles/details-sprawling-development-only-minutes-123510550.html">Lemon Creek Ranch</A>, Oct 29 2025.</li>
        <li>Community Impact, <A href="https://communityimpact.com/new-braunfels/development/developers-break-ground-on-the-neue-in-downtown-new-braunfels/">Developers break ground on The Neue</A>, Sep 30 2026.</li>
        <li>Community Impact, <A href="https://communityimpact.com/new-braunfels/development/gbmc-communities-to-develop-6-5-acre-office-warehouse-space-in-new-braunfels/">GBMC Communities to develop 6.5-acre office, warehouse space</A>, Sep 15 2026.</li>
        <li>Community Impact, <A href="https://communityimpact.com/new-braunfels/development/corridor-commercial-centers-phase-2-underway-in-new-braunfels/">Corridor Commercial Center&apos;s Phase 2 underway</A>, Jul 29 2026.</li>
        <li>San Antonio Report, <A href="https://sanantonioreport.org/average-bexar-county-home-property-values-2026/">2026 Bexar County property values</A>, Apr 10 2026.</li>
      </ol>
    </article>
  );
}
