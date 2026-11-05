import { NextResponse } from 'next/server';
import { AGENT_API_VERSION, CACHE, CORS } from '@/lib/agent-api';
import { SITE_URL } from '@/lib/schema';

export const dynamic = 'force-static';

const listing = {
  type: 'object',
  properties: {
    slug: { type: 'string', example: '1353-w-french-pl' },
    url: { type: 'string', format: 'uri', description: 'The web page for this listing. Link to it when you cite the property.' },
    markdown_url: { type: 'string', format: 'uri', description: 'The same page as markdown.' },
    title: { type: 'string' },
    headline: { type: ['string', 'null'] },
    description: { type: ['string', 'null'] },
    status: { type: 'string', enum: ['active', 'pending', 'sold', 'leased', 'off-market'] },
    transaction: { type: 'string', enum: ['lease', 'sale', 'both'] },
    asset_category: { type: 'string', example: 'Industrial / Warehouse' },
    property_type: { type: 'string' },
    price_text: { type: 'string', description: 'Human-readable price or rate, e.g. "$10.00/SF/yr NNN".' },
    sale_price: { type: ['number', 'null'], description: 'US dollars.' },
    lease_rate_per_sf_year: { type: ['number', 'null'] },
    lease_rate_basis: { type: ['string', 'null'], example: 'NNN' },
    building_sqft: { type: ['number', 'null'] },
    available_sqft: { type: ['number', 'null'] },
    available_spaces: { type: ['array', 'null'], items: { type: 'object', properties: { suite: { type: 'string' }, sqft: { type: 'number' }, building: { type: ['string', 'null'] }, note: { type: ['string', 'null'] } } } },
    lot_acres: { type: ['number', 'null'] },
    year_built: { type: ['integer', 'null'] },
    zoning: { type: ['string', 'null'] },
    clear_height_ft: { type: ['number', 'null'] },
    dock_doors: { type: ['integer', 'null'] },
    grade_doors: { type: ['integer', 'null'] },
    features: { type: 'array', items: { type: 'string' } },
    address: { type: 'string' }, city: { type: 'string' }, state: { type: 'string' }, zip: { type: 'string' },
    submarket: { type: ['string', 'null'] },
    latitude: { type: ['number', 'null'] }, longitude: { type: ['number', 'null'] },
    images: { type: 'array', items: { type: 'string', format: 'uri' } },
    brochure_url: { type: ['string', 'null'] }, virtual_tour_url: { type: ['string', 'null'] },
    listed_on: { type: ['string', 'null'], format: 'date' },
    updated_at: { type: ['string', 'null'], format: 'date-time' },
  },
};

const param = (name: string, description: string, schema: Record<string, unknown> = { type: 'string' }) => ({ name, in: 'query', required: false, description, schema });

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'CRECO public listings API',
    version: AGENT_API_VERSION,
    summary: 'Read-only data on CRECO’s available commercial properties in San Antonio and the Texas Hill Country.',
    description: [
      'CRECO - Commercial Real Estate Company is a licensed Texas commercial real estate brokerage (TREC #9014367) that represents tenants, landlords, owners and investors.',
      'This API serves the same public listing data as the website. It needs no key. Results are cached for about 5 minutes.',
      'Please attribute CRECO and link to each listing’s `url` when you present a property. Confirm availability, price and terms with CRECO before anyone relies on them.',
      'The API is read-only. To inquire about a property, send the person to https://www.crecotx.com/get-started, or have them call (210) 817-3443 or email info@crecotx.com.',
    ].join('\n\n'),
    contact: { name: 'CRECO', url: SITE_URL, email: 'info@crecotx.com' },
  },
  servers: [{ url: SITE_URL }],
  paths: {
    '/api/v1/listings': {
      get: {
        operationId: 'listListings',
        summary: 'List available commercial listings',
        description: 'Available (active or pending) listings only. Closed deals are never returned here.',
        parameters: [
          param('type', 'Asset class: industrial, warehouse, flex, office, medical office, retail, or land.'),
          param('transaction', 'lease or sale.', { type: 'string', enum: ['lease', 'sale'] }),
          param('metro', 'Metro area, e.g. "San Antonio".'),
          param('city', 'City name, e.g. "Boerne".'),
          param('submarket', 'Submarket name, matched exactly (case-insensitive).'),
          param('min_sqft', 'Minimum available size in SF.', { type: 'number' }),
          param('max_sqft', 'Maximum available size in SF.', { type: 'number' }),
          param('max_lease_rate', 'Maximum lease rate in $/SF/yr.', { type: 'number' }),
          param('max_price', 'Maximum sale price in dollars.', { type: 'number' }),
          param('q', 'Free-text search over title, address, city, submarket and description.'),
          param('limit', 'Page size, 1 to 100 (default 50).', { type: 'integer', minimum: 1, maximum: 100, default: 50 }),
          param('offset', 'Number of results to skip.', { type: 'integer', minimum: 0, default: 0 }),
          param('format', 'json (default) or markdown.', { type: 'string', enum: ['json', 'markdown'] }),
        ],
        responses: {
          200: {
            description: 'A page of listings.',
            content: {
              'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: listing }, meta: { type: 'object', properties: { api_version: { type: 'string' }, total: { type: 'integer' }, count: { type: 'integer' }, limit: { type: 'integer' }, offset: { type: 'integer' }, generated_at: { type: 'string', format: 'date-time' }, terms: { type: 'string' }, contact: { type: 'object' } } } } } },
              'text/markdown': { schema: { type: 'string' } },
            },
          },
        },
      },
    },
    '/api/v1/listings/{slug}': {
      get: {
        operationId: 'getListing',
        summary: 'Get one listing',
        description: 'Returns the listing even if it has closed; check `status`.',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' }, example: '1353-w-french-pl' }],
        responses: {
          200: { description: 'The listing.', content: { 'application/json': { schema: { type: 'object', properties: { data: listing, meta: { type: 'object' } } } } } },
          404: { description: 'No listing with that slug.' },
        },
      },
    },
    '/listings/{slug}.md': {
      get: {
        operationId: 'getListingMarkdown',
        summary: 'A listing page as markdown',
        description: 'The same content as the web page, as markdown. Also served at /listings/{slug} when the request sends Accept: text/markdown.',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Markdown.', content: { 'text/markdown': { schema: { type: 'string' } } } }, 404: { description: 'No listing with that slug.' } },
      },
    },
  },
  externalDocs: { description: 'Company facts, services and market coverage for AI assistants', url: `${SITE_URL}/llms-full.txt` },
};

export function GET() {
  return NextResponse.json(spec, { headers: { ...CORS, 'Cache-Control': CACHE } });
}
