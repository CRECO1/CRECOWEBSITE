import { NextRequest, NextResponse } from 'next/server';
import { CACHE, CORS, findListing, listingMarkdown } from '@/lib/agent-api';
import { SITE_URL } from '@/lib/schema';

export const revalidate = 300;

/**
 * The markdown version of a listing page, for AI agents. Reached as /listings/{slug}.md or by sending
 * `Accept: text/markdown` to /listings/{slug} (both rewritten here in next.config.js). Marked noindex
 * with a canonical Link back to the web page, so search engines keep indexing the HTML page only.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = /^[a-z0-9-]{1,120}$/.test(slug) ? await findListing(slug) : null;
  if (!l) return new NextResponse('# Not found\n\nNo listing with that slug. See https://www.crecotx.com/api/v1/listings?format=markdown\n', { status: 404, headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
  return new NextResponse(listingMarkdown(l), {
    headers: {
      ...CORS, 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': CACHE, Vary: 'Accept',
      'X-Robots-Tag': 'noindex', Link: `<${SITE_URL}/listings/${l.slug}>; rel="canonical"`,
    },
  });
}
