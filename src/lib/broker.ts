/**
 * Primary broker config — the single source of truth for "who will
 * follow up when you inquire." Used across every inquiry surface on
 * the site (InquirySuccessCard, property landing pages, listing detail,
 * contact, etc.) so if the point person ever changes, updating this
 * one file swaps every avatar/name/booking-link at once.
 *
 * Why specific > generic:
 *   Real estate is a trust business. "A CRECO principal will follow
 *   up" reads like a call center. "Zachary Stovall, Broker — reply in
 *   your inbox" reads like a real person.
 *   Every conversion research study we've seen puts a named,
 *   photographed broker adjacent to a form as one of the top-3 lifts.
 *
 * Photo:
 *   `photo_url` is optional. If unset, the UI renders a gold-circle
 *   initials avatar (see the BrokerAvatar component) so nothing breaks
 *   while the file is missing. Once the owner drops a headshot at
 *   /public/team/zach-stovall.jpg, set photo_url to '/team/zach-stovall.jpg'
 *   and every surface picks it up on the next deploy.
 *
 * Calendar:
 *   `calendar_url` is optional too. Cal.com free tier is the intended
 *   provider — sign up, create a "15-minute call" event, and paste the
 *   share link here (e.g. 'https://cal.com/zach-stovall/15min').
 *   Until set, the "Book a call" CTA is hidden and the phone/email
 *   fallbacks carry the load.
 */

export interface Broker {
  /** Full name — first + last */
  name: string;
  /** Job title as it appears on inquiry cards */
  title: string;
  /** Direct email address the broker actually monitors */
  email: string;
  /** Display phone, e.g. "(210) 817-3443" */
  phone_display: string;
  /** Tel href, e.g. "tel:+12108173443" */
  phone_href: string;
  /**
   * SMS deep-link href, e.g. "sms:+12108173443". Both iOS and Android
   * recognize the plain form — iOS opens Messages, Android opens the
   * default SMS app. Included alongside phone_href so every contact
   * surface can offer Call + Text side-by-side. Same number as
   * phone_href — kept as a separate field so we could ever route the
   * SMS traffic to a different (e.g. business-line) number later
   * without touching phone_href.
   */
  sms_href: string;
  /** Private inbox the "new lead" alert is sent to (never shown on the site). */
  alert_email: string;
  /**
   * The broker's CRM login email — how the CRM finds the profile that owns
   * the contact and its call-back task. Differs from alert_email for Zack,
   * whose CRM profile sits under the Fair Oaks address.
   */
  crm_profile_email: string;
  /**
   * Public URL to the broker's headshot. Optional — when unset the
   * UI shows an initials avatar. Prefer a local /public/team/*.jpg
   * over a remote Supabase URL so we own the asset lifecycle.
   */
  photo_url?: string;
  /**
   * Public share URL of the broker's Cal.com booking event.
   * Optional — when unset the "Book a call" CTA is hidden and the
   * phone/email links take over.
   */
  calendar_url?: string;
}

export const PRIMARY_BROKER: Broker = {
  // Full legal first name, matching the agents table ("Zachary A. Stovall"),
  // the TREC license and every syndication feed. The site used to render the
  // short "Zach" here, which read as a different person from the broker of
  // record on the same page.
  name: 'Zachary Stovall',
  title: 'Broker',
  email: 'info@crecotx.com',
  phone_display: '(210) 817-3443',
  phone_href: 'tel:+12108173443',
  sms_href: 'sms:+12108173443',
  alert_email: 'zack@crecotx.com',
  crm_profile_email: 'info@fairoaksrealtygroup.com',
  // Real headshot (512px square, sourced from the agents table / About page)
  // — switches every avatar sitewide from the initials fallback to the photo.
  photo_url: '/team/zach-stovall.jpg',
  // Live Cal.com 15-min booking link — the owner set this up on the
  // free tier. Activates "Book 15 min with Zach" CTAs everywhere
  // BrokerCard + InquirySuccessCard are rendered (Plaza, Elkhorn,
  // Lytle, /listings/[slug] sidebars, and every form's post-submit
  // card). Visitors land straight on Cal.com's slot picker — no
  // email tag needed to schedule.
  calendar_url: 'https://cal.com/zachary-stovall-przz4r/15min',
};

/**
 * Brian Blanco — Director of Leasing. Second broker in the roster.
 * Handles medical + specialty retail leases where his Amazon site-
 * selection background maps directly onto tenant needs. Same office
 * phone + email as Zach for now — swap to Brian-specific direct lines
 * whenever he wants them exposed publicly.
 */
export const BRIAN_BLANCO: Broker = {
  name: 'Brian Blanco',
  title: 'Director of Leasing',
  email: 'info@crecotx.com',
  phone_display: '(210) 817-3443',
  phone_href: 'tel:+12108173443',
  sms_href: 'sms:+12108173443',
  alert_email: 'brian@crecotx.com',
  crm_profile_email: 'brian@crecotx.com',
  // Real headshot (512px square, face-cropped from the agents-table photo).
  photo_url: '/team/brian-blanco.jpg',
  // Add Brian's Cal.com share URL here to activate his "Book 15 min
  // directly" CTA on listings he's assigned to.
  // calendar_url: 'https://cal.com/brian-blanco/15min',
};

/**
 * Who a listing's inquiries go to when the listing has no explicit
 * assignment. Brian owns inbound leads (Oct 2026), so the person a visitor
 * sees on the listing is the person who will call them back.
 */
export const LISTING_DEFAULT_BROKER: Broker = BRIAN_BLANCO;

/**
 * Per-listing broker assignment. Maps listing slugs to broker records —
 * anything not listed here falls through to LISTING_DEFAULT_BROKER (Brian).
 *
 * Why by-slug and not a DB column: the roster is small (2 brokers)
 * and stable, and slug matching is O(1) in a small map. When the
 * roster grows past ~5, or brokers start owning listings dynamically,
 * this should migrate to a Supabase agent_id column on listings and
 * a join. Until then, editing this constant + a redeploy is the
 * lightest workflow.
 */
const LISTING_BROKER_MAP: Record<string, Broker> = {
  // Zack is the point of contact on these (his own listings / sales).
  '1353-w-french-pl': PRIMARY_BROKER,   // French Pl warehouse
  '5402-us-hwy-87-e': PRIMARY_BROKER,   // AutoBrite car wash sale
  'elkhorn-point-pad': PRIMARY_BROKER,  // Elkhorn Point
  '8000-fair-oaks-pkwy': PRIMARY_BROKER, // 8000 Fair Oaks Plaza
  // 7830 Louis Pasteur — medical office building, Brian's specialty
  'move-in-ready-medical-building': BRIAN_BLANCO,
};

/**
 * Lead sources that belong to a broker regardless of listing — the custom
 * property pages whose forms don't carry a listing slug.
 */
const SOURCE_BROKER_PREFIXES: Array<[string, Broker]> = [
  ['8923-dietz-elkhorn', PRIMARY_BROKER], // Elkhorn Point leasing page
  ['8000-fair-oaks-pkwy', PRIMARY_BROKER], // 8000 Fair Oaks Pkwy plaza page
  ['owner-report', PRIMARY_BROKER],        // owner property reports — Zack prepares the BOV
];

/**
 * Return the broker responsible for a given listing slug. Falls back
 * to LISTING_DEFAULT_BROKER when the listing isn't explicitly assigned. Every
 * inquiry surface that renders a broker card should call this rather
 * than reading PRIMARY_BROKER directly, so per-listing overrides
 * always land.
 */
export function getBrokerForListing(slug: string | null | undefined): Broker {
  if (!slug) return LISTING_DEFAULT_BROKER;
  return LISTING_BROKER_MAP[slug] ?? LISTING_DEFAULT_BROKER;
}

/**
 * Who owns a lead: the alert goes to them and the CRM contact + call-back
 * task are theirs. Listing assignment wins, then the page's source, then the
 * default owner (Brian).
 */
export function getLeadOwner(opts: { listingSlug?: string | null; source?: string | null }): Broker {
  if (opts.listingSlug && LISTING_BROKER_MAP[opts.listingSlug]) return LISTING_BROKER_MAP[opts.listingSlug];
  const src = opts.source ?? '';
  for (const [prefix, broker] of SOURCE_BROKER_PREFIXES) {
    if (src.startsWith(prefix)) return broker;
  }
  return LISTING_DEFAULT_BROKER;
}

/**
 * The other person on a lead — Zack (the broker) and Brian (agent) back each
 * other up on every listing. Copied on the alert, shares the CRM contact, and gets the lead
 * escalated to them if the owner hasn't made contact in time.
 */
export function getLeadBackup(owner: Broker): Broker {
  return owner === PRIMARY_BROKER ? BRIAN_BLANCO : PRIMARY_BROKER;
}

/** Derive initials from a full name for the avatar fallback. */
export function brokerInitials(broker: Broker): string {
  return broker.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}
