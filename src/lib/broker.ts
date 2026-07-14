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
  // Drop a compressed headshot at /public/team/zach-stovall.jpg (max
  // 1000px wide is plenty for the surfaces this renders on) and
  // uncomment this line to switch every avatar sitewide from the
  // initials fallback to the real photo.
  // photo_url: '/team/zach-stovall.jpg',
  // Create a Cal.com "15-minute call" event, paste the share link
  // below, and every inquiry surface gets a "Book 15 min directly"
  // CTA next to the form. Free tier of Cal.com is sufficient.
  // calendar_url: 'https://cal.com/zach-stovall/15min',
};

/** Derive initials from a full name for the avatar fallback. */
export function brokerInitials(broker: Broker): string {
  return broker.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}
