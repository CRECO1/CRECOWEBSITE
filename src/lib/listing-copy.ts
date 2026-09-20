/**
 * Landlord listing-acquisition copy — one wording wherever we ask an owner to
 * list space with CRECO.
 *
 * Distinct from valuation-copy on purpose. A valuation request asks "what is
 * this worth"; this asks "will you lease my space". Different intent, different
 * source, different CRM tags — and the two must never be described as if they
 * were the same offer.
 *
 * On claims: every benefit below is qualitative. No lease-up speeds, no
 * occupancy percentages, no days-on-market, and no commission figure. Nothing
 * here may state or imply a rate — how CRECO is paid is settled with the owner,
 * not published on a landing page. If a number ever belongs here, it arrives
 * from the broker, with a source.
 */

export const LISTING_CTA = {
  heading: 'List your space with CRECO',
  body:
    'Retail, office, industrial, flex or land — put a broker on it who works the deal himself and gets it in front of the tenants and tenant-rep brokers actually looking.',
  action: 'List your space',
  reassurance: 'No cost to discuss · Representation is success-based',
} as const;

export interface ListingBenefit {
  /** lucide-react icon name, resolved by the page. */
  icon: 'Megaphone' | 'Scale' | 'ShieldCheck' | 'Clock' | 'FileText' | 'UserCheck' | 'Handshake' | 'Building2';
  title: string;
  body: string;
}

/**
 * The case for using a broker, told in short punches rather than paragraphs.
 * Each is something CRECO genuinely does — nothing here is aspirational.
 */
export const LISTING_BENEFITS: ListingBenefit[] = [
  {
    icon: 'Megaphone',
    title: 'Maximum exposure',
    body: 'Professional marketing, syndicated to LoopNet, Crexi and CoStar — where tenants and tenant-rep brokers actually search — plus CRECO’s own broker network.',
  },
  {
    icon: 'Scale',
    title: 'The right price and terms',
    body: 'Rent set against real comps and cap rates, then negotiated properly — term, escalations, concessions and TI, not just the headline number.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Tenants who can perform',
    body: 'Prospects are screened before they reach your lease. A tenant who defaults or leaves early costs more than the one who took longer to find.',
  },
  {
    icon: 'Clock',
    title: 'Less vacancy',
    body: 'Empty space is the expense nobody invoices you for. Representation exists to shorten that window.',
  },
  {
    icon: 'FileText',
    title: 'The whole process handled',
    body: 'LOIs, negotiation, diligence, documentation and renewals — coordinated with your attorney so the work does not land on your desk.',
  },
  {
    icon: 'UserCheck',
    title: 'You work with the broker',
    body: 'Zachary A. Stovall, broker and owner, runs your listing himself. No handoff to a junior once the agreement is signed.',
  },
  {
    icon: 'Handshake',
    title: 'Success-based',
    body: 'CRECO is paid when your space is leased. The terms are agreed with you directly before anything is signed.',
  },
  {
    icon: 'Building2',
    title: 'Every category',
    body: 'Retail, office, industrial, flex and land — for lease and for sale.',
  },
];

/** Asset categories offered in the listing form, matching the copy above. */
export const LISTING_PROPERTY_TYPES = [
  'Retail',
  'Office',
  'Industrial / warehouse',
  'Flex',
  'Land',
  'Mixed-use',
  'Other',
] as const;

export const LISTING_INTENT = ['Lease', 'Sale', 'Either'] as const;
