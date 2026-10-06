/**
 * Press coverage of CRECO's work — one copy, shared by /about (press block +
 * representative work) and the home page's one-line mention.
 *
 * Keep it to what the article reports. The Headwall deal was reported as
 * under contract (April 2025); its closing is unconfirmed, so never describe
 * it as sold or closed — "represented the families in the transaction" only.
 */

export interface PressMention {
  outlet: string;
  headline: string;
  author: string;
  /** Display date, as published. */
  date: string;
  /** ISO date for <time dateTime>. */
  isoDate: string;
  url: string;
  /** Our one-line summary of what CRECO did. */
  summary: string;
  /** At most one short quote, attributed. */
  quote?: { text: string; by: string };
}

export const HEADWALL_TOBIN_HILL: PressMention = {
  outlet: 'San Antonio Express-News',
  headline: 'Pearl development wave rolls farther into Tobin Hill',
  author: 'Madison Iszler',
  date: 'April 10, 2025',
  isoDate: '2025-04-10',
  url: 'https://www.expressnews.com/business/real-estate/article/san-antonio-pearl-tobin-hill-headwall-development-20265706.php',
  summary:
    "Represented the Stovall and Poole families in Headwall Investments' planned acquisition of a 3.1-acre block on the St. Mary's Strip near the Pearl.",
  quote: { text: 'We just love to see that growth happen and come our way.', by: 'Zachary A. Stovall' },
};
