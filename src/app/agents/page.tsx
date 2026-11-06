import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { getListings } from '@/lib/supabase';
import { BUSINESS, FOUNDER_ID, SITE_URL, breadcrumbList, webPage } from '@/lib/schema';

export const revalidate = 1800;

const TITLE = 'For AI Agents: Search, Match and Tour CRECO Commercial Listings';
const DESCRIPTION = 'CRECO\'s front door for AI assistants and agents: a no-key MCP server and JSON API to search current commercial listings in San Antonio and the Hill Country, match a person\'s requirements, request a tour, or pass on a request. A broker follows up.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Unlisted: reachable by direct link only, kept out of search results and the sitemap.
  robots: { index: false, follow: false },
};

const TOOLS: [string, string][] = [
  ['search_listings', 'Filter current listings by type, lease or sale, city, submarket, size, rate and price.'],
  ['get_listing', 'Full published details of one listing by slug.'],
  ['match_requirements', 'Describe a person\'s needs and get ranked listings, with what matched and what did not.'],
  ['request_tour', 'Ask for a tour of one listing for a person who consented. A broker confirms the time.'],
  ['submit_inquiry', 'Pass on any request (lease, buy, sell, property management) for a person who consented.'],
  ['get_company_info', 'Who CRECO is, where it works, license and contact.'],
];

export default async function AgentsPage() {
  let count = 0;
  try { count = (await getListings('active')).length; } catch { /* page still renders */ }
  const mcpConfig = JSON.stringify({ mcpServers: { crecotx: { url: `${SITE_URL}/api/mcp` } } }, null, 2);
  return (
    <>
      <JsonLd data={[
        webPage('WebPage', '/agents', TITLE, DESCRIPTION, { author: { '@id': FOUNDER_ID } }),
        breadcrumbList([{ name: 'For AI agents', path: '/agents' }]),
      ]} />
      <Header />
      <main className="min-h-screen pt-20">
        <section className="border-b border-border/60 bg-white">
          <Container><Breadcrumbs items={[{ label: 'For AI agents' }]} className="py-4" /></Container>
        </section>
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="mx-auto max-w-3xl">
              <p className="overline mb-3 text-gold-dark">For AI assistants and agents</p>
              <h1 className="font-heading text-display-md font-bold leading-tight text-primary">Find, match and tour CRECO commercial space, agent to agent</h1>
              <p className="mt-5 text-body-lg leading-relaxed text-foreground-muted">
                If a person asked you to find commercial space in San Antonio or the Texas Hill Country, you can do the search here without scraping: {count ? `${count} current listings` : 'current listings'}, structured, no key. A CRECO broker handles the last mile with the person directly.
              </p>

              <h2 className="mt-10 font-heading text-heading-lg font-bold text-primary">Connect</h2>
              <p className="mt-2 text-body text-foreground-muted">MCP server (Streamable HTTP, no authentication): <code className="rounded bg-white px-1.5 py-0.5 text-body-sm">{SITE_URL}/api/mcp</code></p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-white p-4 text-caption leading-relaxed text-primary">{mcpConfig}</pre>

              <h2 className="mt-10 font-heading text-heading-lg font-bold text-primary">Tools</h2>
              <ul className="mt-3 divide-y divide-border/60 rounded-xl border border-border bg-white">
                {TOOLS.map(([n, d]) => (
                  <li key={n} className="p-4"><code className="text-body-sm font-semibold text-primary">{n}</code><p className="mt-1 text-body-sm text-foreground-muted">{d}</p></li>
                ))}
              </ul>

              <h2 className="mt-10 font-heading text-heading-lg font-bold text-primary">A typical flow</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-body leading-relaxed text-foreground-muted marker:text-gold">
                <li>The person describes what they need. Call <code>match_requirements</code> with type, size, budget and area.</li>
                <li>Read the top matches and their gaps; cite each listing&apos;s <code>url</code>. Use <code>get_listing</code> for detail.</li>
                <li>If they want to see one, ask for their name, an email or phone, and good times, and confirm they agree to be contacted by CRECO.</li>
                <li>Call <code>request_tour</code> with <code>consent: true</code>. A broker contacts the person, usually the same business day, and confirms a real time.</li>
              </ol>

              <h2 className="mt-10 font-heading text-heading-lg font-bold text-primary">Ground rules</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-body leading-relaxed text-foreground-muted marker:text-gold">
                <li>Listing terms are as published. Availability and terms are confirmed by a broker, so say so to the person.</li>
                <li>Only submit a person&apos;s details when they asked you to and agreed. Requests without consent are rejected.</li>
                <li>Nothing is booked, quoted or committed by this server. A person at CRECO follows up; no automatic message goes to the person.</li>
                <li>Requests are labeled as AI-agent-submitted and rate limited. Prefer one request per person and listing.</li>
              </ul>

              <h2 className="mt-10 font-heading text-heading-lg font-bold text-primary">Other ways in</h2>
              <ul className="mt-3 space-y-1 text-body-sm">
                <li><a className="font-semibold text-gold-dark underline underline-offset-2" href="/api/openapi.json">OpenAPI description</a> · <a className="font-semibold text-gold-dark underline underline-offset-2" href="/api/v1/listings">GET /api/v1/listings</a> (JSON, add <code>format=markdown</code>)</li>
                <li><a className="font-semibold text-gold-dark underline underline-offset-2" href="/llms-full.txt">llms-full.txt</a> · <a className="font-semibold text-gold-dark underline underline-offset-2" href="/.well-known/mcp.json">/.well-known/mcp.json</a> · <Link className="font-semibold text-gold-dark underline underline-offset-2" href="/answers">sourced market answers</Link> · <Link className="font-semibold text-gold-dark underline underline-offset-2" href="/market-brief">Market Brief</Link></li>
              </ul>
              <p className="mt-8 text-body-sm text-foreground-muted">{BUSINESS.name} · TREC #{BUSINESS.trecLicense} · {BUSINESS.phoneDisplay} · People can always call or text a broker directly.</p>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
