import Link from 'next/link';
import { A, Table, H2, H3, UL } from './briefKit';

/**
 * Issue 2 of the San Antonio & Hill Country Market Brief (Q3 2026 data).
 *
 * Every Q3 figure below was read on the publisher's own page or PDF and is the same figure published on the
 * /answers pages (src/lib/answer-pages.ts); keep the two in step. Where the big brokerages disagree (they measure
 * different building sets) all of them are shown, and a dash means the report does not publish that figure.
 * Medical office, population and development items are carried from Issue 1 and keep their original dates.
 * Section 5 is CRECO's opinion and is labelled as such. Issue 1 lives on at /market-brief/q2-2026.
 */

const CBRE_OFF = 'https://www.cbre.com/insights/figures/san-antonio-office-figures-q3-2026';
const CW_OFF = 'https://www.cushmanwakefield.com/en/united-states/insights/us-marketbeats/san-antonio-marketbeats/office';
const P_OFF = 'https://partnersrealestate.com/research/san-antonio-office-q3-2026-quarterly-market-report/';
const CBRE_IND = 'https://www.cbre.com/insights/figures/san-antonio-industrial-figures-q3-2026';
const CW_IND = 'https://www.cushmanwakefield.com/en/united-states/insights/us-marketbeats/san-antonio-marketbeats/industrial';
const P_IND = 'https://partnersrealestate.com/research/san-antonio-industrial-q3-2026-quarterly-market-report/';
const P_RET = 'https://partnersrealestate.com/research/san-antonio-retail-q3-2026-quarterly-market-report/';
const MATTHEWS_RET = 'https://www.matthews.com/insights/san-antonio-retail-q3-2026';
const MATTHEWS_MED = 'https://www.matthews.com/insights/san-antonio-medical-office-q2-2026';
const CI_COMAL = 'https://communityimpact.com/san-antonio/northeast-san-antonio-metrocom/government/2026/04/07/comal-county-sees-278-population-increase-from-2020-25/';
const CI_KENDALL = 'https://newsletter.communityimpact.com/p/new-post-a034';

export const BRIEF_SECTIONS = [
  { id: 'summary', label: 'The short version' },
  { id: 'by-type', label: 'San Antonio by property type' },
  { id: 'hill-country', label: 'Hill Country focus' },
  { id: 'revisions', label: 'What changed since Issue 1' },
  { id: 'what-it-means', label: 'What it means' },
  { id: 'sources', label: 'Sources' },
];

export function BriefContent() {
  return (
    <article className="max-w-3xl">
      <H2 id="summary">Retail is still tight, office vacancy is easing and no new office is being built</H2>
      <UL>
        <li><strong className="text-primary">Retail is scarcest in the Hill Country.</strong> Metro retail vacancy was 4.3% (<A href={P_RET}>Partners</A>) or 4.0% (<A href={MATTHEWS_RET}>Matthews</A>). Comal County (New Braunfels) was <strong>2.7%</strong> and Kendall County (Boerne) <strong>3.2%</strong>.</li>
        <li><strong className="text-primary">Office vacancy was 15.2% to 17.8%, and nothing is under construction.</strong> <A href={CW_OFF}>Cushman &amp; Wakefield</A> had 15.2%, <A href={P_OFF}>Partners</A> 16.6% and <A href={CBRE_OFF}>CBRE</A> 17.8%. None of the three reports an office project under way, and none delivered in Q3. Class A asked $32.02 to $36.56/SF full service.</li>
        <li><strong className="text-primary">Industrial vacancy was 10.3% to 11.5%, with more than 2M SF still being built.</strong> Net absorption was positive in all three reports. Most construction is in the South submarket (<A href={CBRE_IND}>CBRE</A>, <A href={P_IND}>Partners</A>).</li>
        <li><strong className="text-primary">Small-bay flex stayed steady.</strong> Vacancy was 7.9% to 8.1% with asking rents of about <strong>$12.61 to $13.79/SF NNN</strong>, and absorption was positive in all three reports.</li>
        <li><strong className="text-primary">Retail cap rates are still drifting up.</strong> Matthews put the San Antonio average at <strong>6.66%</strong> in Q3, up for 13 straight quarters.</li>
      </UL>
      <p className="mt-4 rounded-xl border border-border bg-background-cream p-4 text-body-sm text-foreground-muted leading-relaxed">
        <strong className="text-primary">How to read the numbers.</strong> The big brokerages measure different building sets: office inventory is 34.3M SF at CBRE, 43.5M SF at Partners (Class A and B only) and 49.9M SF at Cushman &amp; Wakefield, so their vacancy rates differ. Where they disagree, all of them are shown; use the spread as the range. Issue 1 (Q2 2026) is archived at <Link href="/market-brief/q2-2026" className="text-gold-dark underline underline-offset-2 hover:text-gold">/market-brief/q2-2026</Link>.
      </p>

      <H2 id="by-type">San Antonio by property type (Q3 2026)</H2>

      <H3>Office</H3>
      <Table
        head={['Q3 2026', 'CBRE', 'Cushman & Wakefield', 'Partners']}
        rows={[
          ['Vacancy', '17.8%', '15.2%', '16.6%'],
          ['Net absorption (quarter)', '+28,000 SF', 'about −65,000 SF', '+13,816 SF'],
          ['Avg. asking rent (full service)', '$29.33', '$28.67', '$29.86'],
          ['Class A asking rent', '$36.56', '$32.02', '$33.02'],
          ['Class A vacancy', '18.4%', '—', '18.5%'],
          ['Downtown (CBD) vacancy', '25.0%', '18.8%', '23.4%'],
          ['Under construction', 'none', 'none', 'none'],
        ]}
        note={<>Sources: <A href={CBRE_OFF}>CBRE (Oct 9 2026)</A>, <A href={CW_OFF}>Cushman &amp; Wakefield MarketBeat</A>, <A href={P_OFF}>Partners (Nov 2 2026)</A>.</>}
      />
      <UL>
        <li><strong className="text-primary">The sources disagree on the direction of absorption.</strong> CBRE and Partners show a small gain; Cushman &amp; Wakefield shows a loss of about 65,000 SF.</li>
        <li><strong className="text-primary">Rents are rising modestly.</strong> Cushman &amp; Wakefield has overall asking rent up 4.1% and Class A up 8.0% year over year. Partners has overall rent up 1.5% for the quarter.</li>
        <li><strong className="text-primary">The far-west and far-northwest corridors are far tighter than the metro.</strong> Cushman &amp; Wakefield has Far West at 8.1% and Far Northwest at 8.3% vacant, and CBRE has Far West at 8.7%. Downtown is the loosest submarket in all three reports.</li>
        <li><strong className="text-primary">Northwest submarket vacancy:</strong> 15.4% (CBRE), 16.0% (Cushman &amp; Wakefield), 15.3% (Partners).</li>
        <li><strong className="text-primary">Medical office</strong> was last reported by <A href={MATTHEWS_MED}>Matthews in July 2026</A> (Q2 data): 12.27% metro vacancy, $29.99/SF asking and 80,128 SF under construction. Matthews had not published a Q3 report when this issue was prepared.</li>
      </UL>
      <p className="mt-3 text-body-sm"><Link href="/answers/san-antonio-class-a-office-rent" className="font-semibold text-gold-dark hover:text-gold">Class A rent by submarket, Q3 2026 →</Link></p>

      <H3>Industrial</H3>
      <Table
        head={['Q3 2026', 'CBRE', 'Cushman & Wakefield', 'Partners']}
        rows={[
          ['Vacancy', '10.3%', '10.6%', '11.5%'],
          ['Net absorption (quarter)', '796,000 SF', 'about 310,000 SF', '391,242 SF'],
          ['Avg. asking rent', '$8.81 NNN', '$8.85 net', '$9.26 NNN'],
          ['Leasing activity', '2.91M SF', '2.3M SF', '2.35M SF'],
          ['Under construction', '2.44M SF', 'about 2.33M SF', '3.79M SF'],
        ]}
        note={<>Sources: <A href={CBRE_IND}>CBRE (Oct 9 2026)</A>, <A href={CW_IND}>Cushman &amp; Wakefield MarketBeat</A>, <A href={P_IND}>Partners (Nov 8 2026)</A>.</>}
      />
      <UL>
        <li><strong className="text-primary">Rents are up.</strong> CBRE has asking rent up 5.0% and Cushman &amp; Wakefield up 3.1% year over year; Partners has it up 0.4% for the quarter.</li>
        <li><strong className="text-primary">The sources disagree on the size of absorption.</strong> CBRE&apos;s figure is more than 2.5 times Cushman &amp; Wakefield&apos;s.</li>
        <li><strong className="text-primary">Size matters.</strong> CBRE shows 14.8% vacancy at 100K to 249,999 SF and 15.4% at 250K to 499,999 SF, versus 6.6% below 50K SF.</li>
        <li><strong className="text-primary">Northwest is tight, Northeast is loose.</strong> Northwest vacancy was 7.9% (Partners), 8.7% (CBRE) and 8.9% (Cushman &amp; Wakefield); the Northeast was 12.6% (CBRE), 17.7% (Cushman &amp; Wakefield) and 18.2% (Partners).</li>
        <li><strong className="text-primary">Notable activity:</strong> Cushman &amp; Wakefield lists PepsiCo&apos;s 708,000 SF lease at Foster Commerce Center 6 in the South submarket among the quarter&apos;s key leases. Construction is concentrated in the South submarket (about 1.5M SF at CBRE and Partners), where CBRE lists JCB&apos;s 1.0M SF plant and Toyota&apos;s 500,000 SF Rear Axle facility.</li>
      </UL>

      <H3>Flex (small-bay / office-service)</H3>
      <Table
        head={['Q3 2026', 'CBRE "R&D/Flex"', 'Cushman "Office Service/Flex"', 'Partners "Flex"']}
        rows={[
          ['Vacancy', '8.0%', '7.9%', '8.1%'],
          ['Asking rent (net)', '$13.79 NNN', '$12.61', '$12.76 NNN'],
          ['Net absorption', '+96,000 SF', '+57,041 SF', '+61,350 SF'],
        ]}
        note="Sources: the same three industrial reports. Partners splits its flex rent further: R&D $14.75 and Service $9.32/SF NNN."
      />

      <H3>Retail</H3>
      <p className="mt-3 text-body text-foreground-muted leading-relaxed">Partners (<A href={P_RET}>Q3 2026, Oct 19 2026</A>) and Matthews (<A href={MATTHEWS_RET}>Q3 2026, Nov 4 2026</A>) are the retail sources we read.</p>
      <UL>
        <li><strong className="text-primary">Metro (Partners):</strong> vacancy 4.3%, up 10 bps from Q2; net absorption 32,095 SF; asking rent $19.58/SF NNN, up 0.7% for the quarter and 2.4% year over year.</li>
        <li><strong className="text-primary">Metro (Matthews):</strong> vacancy 4.0%, asking rent $24.12/SF (a record; Matthews does not state its rent basis, so the two rents are not directly comparable), average cap rate 6.66%, pricing $271/SF.</li>
        <li><strong className="text-primary">Pipeline:</strong> about 1.0M SF under construction metro-wide, roughly 65% pre-leased, and 114,306 SF delivered. The largest projects were a 163,745 SF Home Depot in Schertz, a 125,000 SF H-E-B at 10137 I-10 E in Converse and the 58,250 SF Stone Oak Mercantile.</li>
      </UL>
      <p className="mt-3 text-body-sm"><Link href="/answers/texas-retail-cap-rates" className="font-semibold text-gold-dark hover:text-gold">Texas retail cap rates by metro, Q3 2026 →</Link></p>

      <H2 id="hill-country">Hill Country focus</H2>
      <Table
        head={['Submarket (Q3 2026)', 'Vacancy', 'Net absorption', 'Under construction', 'Asking rent NNN']}
        rows={[
          ['Kendall Co. retail', '3.2%', '−16,769 SF', '80,366 SF', '$22.65'],
          ['Comal Co. retail', '2.7%', '+8,487 SF', '59,200 SF', '$27.85'],
          ['Northwest SA retail', '4.3%', '+148,835 SF', '313,969 SF', '$16.48'],
          ['Comal Co. industrial (Partners)', '11.8%', '−100,495 SF', '636,617 SF', '$10.23'],
          ['Comal Co. industrial (Cushman)', '11.3%', '−105,495 SF', '311,343 SF', 'not split out'],
        ]}
        note={<>Sources: <A href={P_RET}>Partners Retail</A>, <A href={P_IND}>Partners Industrial</A>, <A href={CW_IND}>Cushman &amp; Wakefield Industrial</A>. Cushman &amp; Wakefield&apos;s Q3 key leases include Hollingsworth Logistics Group&apos;s new 340,090 SF lease at Park 35 in Comal County.</>}
      />

      <H3>Boerne / Kendall County</H3>
      <UL>
        <li><strong className="text-primary">Retail:</strong> 3.2% vacancy and 6.2% availability at $22.65/SF NNN, below the metro&apos;s 4.3% (<A href={P_RET}>Partners</A>).</li>
        <li><strong className="text-primary">Population:</strong> Kendall County grew from 44,568 (2020) to 53,289 (2025), +20.3%, per Census data reported by <A href={CI_KENDALL}>Community Impact</A> and confirmed on <A href="https://fred.stlouisfed.org/series/TXKEND9POP">FRED</A>.</li>
        <li><strong className="text-primary">Medical:</strong> Baptist Health System&apos;s first Boerne acute-care hospital plus a medical office building, on 23 acres at I-10 and SH-46, was scheduled to begin construction in 2026; no completion date had been announced (<A href="https://communityimpact.com/san-antonio/healthcare/building-boerne-baptist-site-work-begins-on-acute-care-hospital-and-medical-office/">Community Impact, Dec 2025</A>). Wellness Plaza at Boerne, 37,000 SF off Herff Rd, targeted a spring 2026 groundbreaking and a 2027 opening (<A href="https://communityimpact.com/san-antonio/development/wellness-plaza-at-boerne-aims-to-bring-health-care-retail-to-herff-road/">Community Impact, Sep 2025</A>).</li>
        <li><strong className="text-primary">Retail pipeline:</strong> Scenic Loop Retail, three shell buildings totaling 30,572 SF at 31905 I-10, is scheduled Oct 2026 to Sep 2027 (<A href="https://www.tdlr.texas.gov/TABS/Search/Print/TABS2026014737">TDLR filing TABS2026014737</A>). Buc-ee&apos;s is capped at a 54,000 SF store under the October 2025 revised agreement (<A href="https://communityimpact.com/san-antonio/development/buc-ees-baptist-health-system-and-more-coming-to-boerne-fair-oaks-ranch/">Community Impact, Dec 2025</A>).</li>
      </UL>

      <H3>Fair Oaks Ranch / Leon Springs / I-10 corridor</H3>
      <UL>
        <li><strong className="text-primary">Lemon Creek Ranch (118 acres, Bexar County side):</strong> H-E-B Fair Oaks is adding a $2M, 4,465 SF True Texas BBQ, scheduled for construction June to September 2026 (<A href="https://www.yahoo.com/news/articles/h-e-b-plans-texas-220300537.html">MySA, Feb 2026</A>). The plan includes a hotel, apartments and retail (<A href="https://www.yahoo.com/news/articles/details-sprawling-development-only-minutes-123510550.html">MySA, Oct 2025</A>).</li>
        <li><strong className="text-primary">Gateway office:</strong> Cushman &amp; Wakefield&apos;s Far West (8.1%) and Far Northwest (8.3%) office vacancy are the nearest institutional data points to this corridor.</li>
      </UL>

      <H3>New Braunfels / Comal County</H3>
      <UL>
        <li><strong className="text-primary">Retail:</strong> 2.7% vacancy at $27.85/SF NNN, the tightest and highest-rent retail market in the table above. Terry Black&apos;s Barbecue leased 8,649 SF at 1310 E. Common St (Partners).</li>
        <li><strong className="text-primary">Population:</strong> 163,608 (2020) to 209,166 (2025), +27.8% (<A href={CI_COMAL}>Community Impact</A>).</li>
        <li><strong className="text-primary">The Neue:</strong> $27M, 72,000 SF of condos with ground-floor commercial downtown; broke ground Sep 29 2026, completion expected Nov 2027 (<A href="https://communityimpact.com/new-braunfels/development/developers-break-ground-on-the-neue-in-downtown-new-braunfels/">Community Impact</A>).</li>
        <li><strong className="text-primary">Latitude:</strong> 65,000 SF of for-sale office/warehouse bays (45 units) at 710 N. Walnut Ave; groundbreaking expected Q2 2027 (<A href="https://communityimpact.com/new-braunfels/development/gbmc-communities-to-develop-6-5-acre-office-warehouse-space-in-new-braunfels/">Community Impact</A>).</li>
        <li><strong className="text-primary">Corridor Commercial Center Phase 2:</strong> 35,000 SF of flex/retail, spaces from 1,800 to 11,900 SF (<A href="https://communityimpact.com/new-braunfels/development/corridor-commercial-centers-phase-2-underway-in-new-braunfels/">Community Impact</A>).</li>
      </UL>

      <H3>Appraisals</H3>
      <UL>
        <li>Bexar County 2026 commercial values rose <strong>5.99%</strong> while single-family values fell 0.11% (<A href="https://sanantonioreport.org/average-bexar-county-home-property-values-2026/">San Antonio Report, Apr 2026</A>).</li>
      </UL>

      <H2 id="revisions">What changed since Issue 1</H2>
      <UL>
        <li><strong className="text-primary">Reports revise themselves.</strong> Partners moved its Q2 office net absorption to −194,053 SF from the −85,357 SF it first reported, and its Q2 retail net absorption to 266,714 SF from 94,972 SF (Q2 retail vacancy to 4.2% from 4.1%). Issue 1 shows the figures as first published, so compare a report with itself over time.</li>
        <li><strong className="text-primary">Office:</strong> CBRE&apos;s 17.8% is down 20 bps from its Q2 figure and its lowest since a Q1 2025 peak of 19.7%. Cushman &amp; Wakefield&apos;s 15.2% is 160 bps better than a year ago and Partners&apos; 16.6% is 99 bps better.</li>
        <li><strong className="text-primary">Industrial:</strong> Cushman &amp; Wakefield&apos;s vacancy fell 110 bps from Q2, while Partners&apos; rose 19 bps.</li>
        <li><strong className="text-primary">Retail:</strong> metro vacancy edged up 10 bps (Partners) and absorption slowed from Q2, and Kendall County is at 3.2% vacancy against the 2.4% shown in Issue 1 (Comal County 2.7% against 2.6%), though Issue 1 figures are as first published.</li>
      </UL>
      <p className="mt-3 text-body-sm text-foreground-muted">See also <Link href="/answers/why-market-reports-show-different-vacancy" className="font-semibold text-gold-dark hover:text-gold">why market reports show different vacancy rates</Link>.</p>

      <H2 id="what-it-means">What it means: CRECO&apos;s view</H2>
      <p className="mt-3 text-caption font-semibold uppercase tracking-wide text-gold-dark">Opinion, not data</p>
      <H3>For owners</H3>
      <UL>
        <li><strong className="text-primary">Hill Country retail owners still have pricing power.</strong> With Comal and Kendall retail under 3.3% vacant, hold firm on renewals and price against local comps rather than the metro average.</li>
        <li><strong className="text-primary">Office owners face a split market.</strong> The far-west and far-northwest corridors are tight while downtown is not. With no new office under construction, well-located space has less new competition coming.</li>
        <li><strong className="text-primary">Small-bay flex remains the most balanced product,</strong> with vacancy near 8% and positive absorption in every report.</li>
        <li><strong className="text-primary">Price from your own rent roll.</strong> Metro cap-rate averages are a midpoint, not a price for your building; ask for a broker opinion of value built on closed comparable sales.</li>
      </UL>
      <H3>For tenants</H3>
      <UL>
        <li><strong className="text-primary">Hill Country retail and medical tenants should start early.</strong> Begin searches 9 to 12 months ahead: little space is vacant and new medical space is not expected before 2027.</li>
        <li><strong className="text-primary">Office tenants have leverage outside the tight corridors.</strong> With vacancy above 15% in every report, ask for free rent and improvement allowances; asking rent is what a landlord lists, not what you end up paying.</li>
        <li><strong className="text-primary">Industrial users between 100,000 and 500,000 SF have the most choice,</strong> with vacancy near 15% in those size ranges (CBRE) versus 6.6% below 50K SF.</li>
      </UL>

      <H2 id="sources">Sources</H2>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-body-sm text-foreground-muted break-words">
        <li>CBRE Research, <A href={CBRE_OFF}>San Antonio Office Figures Q3 2026</A>, Oct 9 2026.</li>
        <li>CBRE Research, <A href={CBRE_IND}>San Antonio Industrial Figures Q3 2026</A>, Oct 9 2026.</li>
        <li>Cushman &amp; Wakefield, <A href={CW_OFF}>MarketBeat San Antonio Office Q3 2026</A>.</li>
        <li>Cushman &amp; Wakefield, <A href={CW_IND}>MarketBeat San Antonio Industrial Q3 2026</A>.</li>
        <li>Partners Real Estate, <A href={P_OFF}>San Antonio Office Q3 2026</A>, Nov 2 2026.</li>
        <li>Partners Real Estate, <A href={P_IND}>San Antonio Industrial Q3 2026</A>, Nov 8 2026.</li>
        <li>Partners Real Estate, <A href={P_RET}>San Antonio Retail Q3 2026</A>, Oct 19 2026.</li>
        <li>Matthews, <A href={MATTHEWS_RET}>San Antonio Retail Market Report Q3 2026</A>, Nov 4 2026.</li>
        <li>Matthews, <A href={MATTHEWS_MED}>San Antonio Medical Office Q2 2026</A>, Jul 21 2026.</li>
        <li>Community Impact, <A href={CI_COMAL}>Comal County sees 27.8% population increase from 2020–25</A>, Apr 8 2026.</li>
        <li>Community Impact SATX-BNE newsletter, <A href={CI_KENDALL}>Apr 1 2026</A> (Kendall County population).</li>
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
