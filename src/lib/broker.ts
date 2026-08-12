/**
 * Primary broker config — the single source of truth for "who will
 * follow up when you inquire." Used across every inquiry surface on
 * the site (InquirySuccessCard, property landing pages, listing detail,
 * contact, etc.) so if the point person ever changes, updating this
 * one file swaps every avatar/name/booking-link at once.
 *
 * Why specific > generic:
 *   Real estate is a trust business. "A CRECO principal will follow
 *   up" reads like a call center. "Zach Stovall, Broker — reply in
 *   your inbox within one business day" reads like a real person.
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
  name: 'Zach Stovall',
  title: 'Broker',
  email: 'info@crecotx.com',
  phone_display: '(210) 817-3443',
  phone_href: 'tel:+12108173443',
  sms_href: 'sms:+12108173443',
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
  // Real headshot (512px square, face-cropped from the agents-table photo).
  photo_url: '/team/brian-blanco.jpg',
  // Add Brian's Cal.com share URL here to activate his "Book 15 min
  // directly" CTA on listings he's assigned to.
  // calendar_url: 'https://cal.com/brian-blanco/15min',
};

/**
 * Per-listing broker assignment. Maps listing slugs to broker records —
 * anything not listed here falls through to PRIMARY_BROKER (Zach).
 *
 * Why by-slug and not a DB column: the roster is small (2 brokers)
 * and stable, and slug matching is O(1) in a small map. When the
 * roster grows past ~5, or brokers start owning listings dynamically,
 * this should migrate to a Supabase agent_id column on listings and
 * a join. Until then, editing this constant + a redeploy is the
 * lightest workflow.
 */
const LISTING_BROKER_MAP: Record<string, Broker> = {
  // 7830 Louis Pasteur — medical office building, Brian's specialty
  'move-in-ready-medical-building': BRIAN_BLANCO,
};

/**
 * Return the broker responsible for a given listing slug. Falls back
 * to PRIMARY_BROKER when the listing isn't explicitly assigned. Every
 * inquiry surface that renders a broker card should call this rather
 * than reading PRIMARY_BROKER directly, so per-listing overrides
 * always land.
 */
export function getBrokerForListing(slug: string | null | undefined): Broker {
  if (!slug) return PRIMARY_BROKER;
  return LISTING_BROKER_MAP[slug] ?? PRIMARY_BROKER;
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
