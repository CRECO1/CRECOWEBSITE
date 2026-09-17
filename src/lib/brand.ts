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
export const BRAND_LEGAL_NAME = 'CRECO LLC';
export const BRAND_TREC_LICENSE = '9014367';

/** THE positioning line — repeated verbatim wherever the firm is described. */
export const CANONICAL_DESCRIPTION =
  'CRECO - Commercial Real Estate Company is a full-service commercial real estate brokerage representing tenants, landlords, owners, and investors across retail, office, industrial, flex, and land — for lease and for sale — throughout Texas, with deep local coverage of San Antonio and the Hill Country.';

/** One-line DBA / license disclosure. */
export const DBA_STATEMENT = `${BRAND_NAME} is a d/b/a of ${BRAND_LEGAL_NAME}, a licensed Texas real estate brokerage (TREC license #${BRAND_TREC_LICENSE}).`;
