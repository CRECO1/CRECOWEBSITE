/**
 * Real, public Google reviews of CRECO — verbatim, with attribution.
 *
 * Code-defined on purpose. The `testimonials` table still holds the seeded
 * demo personas that were pulled off the site (featured = false), and putting
 * genuine reviews in version control means a quote on the marketing site is
 * reviewable in a diff rather than editable in a CMS with no provenance.
 *
 * To add one: append to REVIEWS and bump GOOGLE_RATING / GOOGLE_REVIEW_COUNT
 * to match the profile. Quotes must be copied verbatim from the public review
 * — never tightened, never paraphrased, never composited.
 */

export interface Review {
  /** Reviewer's name exactly as Google shows it. */
  name: string;
  /** The review text, verbatim. */
  quote: string;
  /** Where it was left. Displayed next to the name. */
  source: 'Google';
  /** Stars, 1–5. */
  rating: number;
  /** Optional badge Google assigns, e.g. "Local Guide". */
  badge?: string;
}

/**
 * Ordered for the page, not by date: the two substantive reviews carry the
 * section and lead, the one-liner sits last where its length reads as
 * punctuation rather than a thin third column.
 */
export const REVIEWS: Review[] = [
  {
    name: 'Trip Worden',
    quote:
      'Zachary Stovall is as straight shooting and upstanding a person as you will find. I definitely recommend you use him for any of your commercial property management needs.',
    source: 'Google',
    rating: 5,
  },
  {
    name: 'Michael Stuart',
    quote:
      'Mr. Stovall and team are stand up people that do what they say they will do! They are knowledgeable and very capable of assisting you with your commercial property needs.',
    source: 'Google',
    rating: 5,
    badge: 'Local Guide',
  },
  {
    name: 'Robert Hampton',
    quote: 'Great company.',
    source: 'Google',
    rating: 5,
  },
];

/** Profile-level figures. Keep in step with the live Google Business Profile. */
export const GOOGLE_RATING = 5.0;
export const GOOGLE_REVIEW_COUNT = 6;

/**
 * The verified Google Business Profile. This is the same ?cid= URL carried in
 * the Organization schema's sameAs — a canonical profile link rather than a
 * name search, which can resolve to the wrong listing.
 */
export const GOOGLE_PROFILE_URL = 'https://www.google.com/maps?cid=112850793807045067';

/**
 * Google's canonical Place ID for CRECO, derived from the profile's feature id
 * (0x299b8d310999edf5:0x190ed32f57d61cb — its low word is the cid above) and
 * confirmed by resolving https://www.google.com/maps/place/?q=place_id:<id>
 * back to "CRECO - Commercial Real Estate Company".
 */
export const GOOGLE_PLACE_ID = 'ChIJ9e2ZCTGNmykRy2F99TLtkAE';

/**
 * Opens Google's "write a review" dialog straight to the star rating. Google
 * requires the reviewer to be signed in, so an anonymous visitor is sent to a
 * sign-in prompt first and lands on the dialog afterwards — expected, and the
 * same for every business's review link.
 */
export const GOOGLE_WRITE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`;
