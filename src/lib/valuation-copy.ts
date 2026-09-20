/**
 * Valuation copy — one wording for the tool, wherever it is promoted.
 *
 * The same offer used to be described three different ways on the homepage
 * alone. Everything that links to /property-valuation now reads from here, so
 * the promise on the button matches what the page actually delivers.
 *
 * On accuracy: the tool returns a RANGE derived from cap rates, and those cap
 * rates are CRECO's own estimates — no third-party data service stands behind
 * them. Nothing in this file may imply an appraisal, a guaranteed price, or a
 * figure sourced from a provider we do not actually use.
 */

export const VALUATION_CTA = {
  heading: 'What is your Texas commercial property worth?',
  body:
    'Get an instant, cap-rate-based value range for your property in about 60 seconds. The number is free and nothing is gated — no email, no phone, no account.',
  action: 'Value my property',
  reassurance: 'Free · No contact details required to see your range',
} as const;

/**
 * The second step, once an owner has their range and wants the real analysis.
 * A Broker Opinion of Value is work a person does — never describe it as
 * instant, automated, or as a formal appraisal.
 */
export const BOV_CTA = {
  heading: 'Want the full Broker Opinion of Value?',
  body:
    'The instant range is a starting point built from cap rates and the numbers you entered. A Broker Opinion of Value is the real analysis: recent comparable sales and leases, your actual rent roll and lease terms, condition and deferred maintenance, submarket demand, and what a buyer would underwrite today.',
  action: 'Request my Broker Opinion of Value',
  reassurance: 'Prepared personally by Zachary A. Stovall, Broker. No cost, no obligation.',
} as const;

/**
 * Required wherever a number is shown. A range from an online calculator is
 * not an appraisal and must never be presented as one.
 */
export const VALUATION_DISCLAIMER =
  'This range is a preliminary estimate produced from the figures you entered and CRECO’s own cap-rate estimates. It is not an appraisal, a broker price opinion, or an offer, and it has not been reviewed by a licensed appraiser. Actual value depends on comparable sales, lease terms, condition, and market conditions at the time of sale.';
