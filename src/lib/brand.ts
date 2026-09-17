/**
 * CRECO's canonical public identity. Dependency-free so client components
 * (Footer) can import it without pulling in the schema builders.
 *
 * Confirmed by Zack (Sept 2026): the public name is the d/b/a
 * "CRECO - Commercial Real Estate Company" (plain hyphen) of the licensed
 * Texas brokerage, TREC #9014367. Use these strings verbatim — never retype
 * the name with an em/en dash or paraphrase the positioning line.
 */
export const BRAND_NAME = 'CRECO - Commercial Real Estate Company';
/** Short form for tight spaces — email subject lines, nav, tab titles.
 *  The full DBA still appears in the body and footer of every email. */
export const BRAND_SHORT_NAME = 'CRECO';
export const BRAND_LEGAL_NAME = 'CRECO LLC';
export const BRAND_TREC_LICENSE = '9014367';

/** THE positioning line — repeated verbatim wherever the firm is described. */
export const CANONICAL_DESCRIPTION =
  'CRECO - Commercial Real Estate Company is a full-service commercial real estate brokerage representing tenants, landlords, owners, and investors across retail, office, industrial, flex, and land — for lease and for sale — throughout Texas, with deep local coverage of San Antonio and the Hill Country.';

/** One-line DBA / license disclosure. */
export const DBA_STATEMENT = `${BRAND_NAME} is a d/b/a of ${BRAND_LEGAL_NAME}, a licensed Texas real estate brokerage (TREC license #${BRAND_TREC_LICENSE}).`;

/**
 * NAP — one copy, so an address correction can't drift between templates.
 *
 * Suite 100 is CRECO's own office. Suite 102 at the same address belongs to
 * Fair Oaks Realty Group, a different company — never use it for CRECO.
 *
 * `src/lib/schema.ts` still declares the same address for the JSON-LD graph;
 * if you change the office, change it in both places.
 */
export const BRAND_STREET = '8000 Fair Oaks Pkwy, Suite 100';
export const BRAND_CITY_STATE_ZIP = 'Fair Oaks Ranch, TX 78015';
export const BRAND_FULL_ADDRESS = `${BRAND_STREET}, ${BRAND_CITY_STATE_ZIP}`;
export const BRAND_PHONE_DISPLAY = '(210) 817-3443';
export const BRAND_PHONE_TEL = '+12108173443';
export const BRAND_EMAIL = 'info@crecotx.com';
export const BRAND_SITE_URL = 'https://www.crecotx.com';
