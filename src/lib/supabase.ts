import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set - using placeholder for build');
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };

// ─── Type Definitions (Commercial Real Estate) ──────────────────────────────

export type PropertyType = 'office' | 'warehouse' | 'flex' | 'retail' | 'land' | 'multifamily' | 'mixed-use' | 'industrial';
export type TransactionType = 'lease' | 'sale' | 'both';

export interface Listing {
  id: string;
  title: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: PropertyType;
  transaction_type: TransactionType;
  // Pricing — only one is typically set depending on transaction_type
  sale_price: number | null;
  lease_rate: number | null;          // $/SF/yr (NNN by default)
  lease_rate_basis: string | null;    // e.g. "NNN", "Full Service", "Modified Gross"
  // Specs
  sqft: number | null;
  available_sqft: number | null;      // for divisible spaces
  lot_size: number | null;            // acres
  zoning: string | null;
  year_built: number | null;
  // Industrial / warehouse specific
  clear_height: number | null;        // feet
  dock_doors: number | null;
  grade_doors: number | null;
  // Marketing
  headline: string | null;            // short one-liner
  description: string | null;
  features: string[] | null;
  images: string[] | null;
  brochure_url: string | null;
  virtual_tour_url: string | null;
  status: 'active' | 'pending' | 'sold' | 'leased' | 'off-market';
  listing_date: string | null;
  closed_date: string | null;
  submarket: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  name: string;
  slug: string;
  title: string;
  email: string;
  phone: string | null;
  bio: string | null;
  image_url: string | null;
  license_number: string | null;
  specialties: string[] | null;
  years_experience: number | null;
  featured: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Submarket {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  highlights: string[] | null;
  zip_codes: string[] | null;
  featured: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  client_name: string;
  client_location: string | null;
  quote: string;
  rating: number;
  image_url: string | null;
  featured: boolean;
  created_at: string;
}

export interface ClosedDeal {
  id: string;
  address: string;
  city: string;
  property_type: PropertyType;
  transaction_type: TransactionType;
  sale_price: number | null;
  sqft: number | null;
  closed_date: string;
  image_url: string | null;
  created_at: string;
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

export async function getListings(status: 'active' | 'pending' | 'sold' | 'leased' | 'all' = 'active'): Promise<Listing[]> {
  let query = supabase.from('listings').select('*');
  if (status === 'active') {
    query = query.in('status', ['active', 'pending']);
  } else if (status !== 'all') {
    query = query.eq('status', status);
  }
  const { data, error } = await query.order('listing_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

export async function getListingsByType(type: PropertyType): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('property_type', type)
    .in('status', ['active', 'pending'])
    .order('listing_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getListingsBySubmarket(submarket: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .ilike('submarket', submarket)
    .in('status', ['active', 'pending'])
    .order('listing_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getFeaturedAgent(): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('featured', true)
    .order('order', { ascending: true })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function getSubmarkets(): Promise<Submarket[]> {
  const { data, error } = await supabase
    .from('submarkets')
    .select('*')
    .order('order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getSubmarketBySlug(slug: string): Promise<Submarket | null> {
  const { data, error } = await supabase
    .from('submarkets')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

export async function getTestimonials(featuredOnly = false): Promise<Testimonial[]> {
  let query = supabase.from('testimonials').select('*');
  if (featuredOnly) query = query.eq('featured', true);
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getClosedDeals(limit = 12): Promise<ClosedDeal[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, address, city, property_type, transaction_type, sale_price, sqft, closed_date, images, created_at')
    .in('status', ['sold', 'leased'])
    .order('closed_date', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    ...p,
    image_url: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
  })) as unknown as ClosedDeal[];
}

export async function submitLead(lead: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  property_interest?: string;
  source?: string;
}) {
  const { data, error } = await supabase
    .from('leads')
    .insert([{
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? null,
      company: lead.company ?? null,
      message: lead.message ?? null,
      property_interest: lead.property_interest ?? null,
      source: lead.source ?? 'contact',
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}
