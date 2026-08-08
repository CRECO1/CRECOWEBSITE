/**
 * Schedule C (IRS Form 1040 Schedule C — Profit or Loss From Business)
 * mapping for the expense categories used in the billing system.
 *
 * The form has a fixed set of expense lines (8-27) that the IRS uses to
 * categorise small-business deductions. This mapping converts the
 * brokerage's working categories ("Marketing & Advertising", "Software &
 * Subscriptions", etc.) into the form's line numbers so the year-end
 * dashboard can pre-total each line and hand a tax-ready summary to the
 * CPA.
 *
 * The mapping is opinionated — some categories could plausibly live on
 * multiple lines (e.g. a brokerage subscription could be Line 17 Legal &
 * professional or Line 22 Supplies). We pick the most common treatment
 * for a CRE brokerage. CPAs will sometimes reclassify; that's fine.
 */

import type { Expense } from './expenses';

export interface ScheduleCLine {
  number: string;        // "8", "20a", etc.
  label: string;         // IRS short name for the line
  description: string;   // What the line means
}

/**
 * Schedule C expense lines we care about for a CRE brokerage. Skipping
 * lines that don't apply (e.g. cost of goods sold, depletion, pension
 * plans). The brokerage's CPA can pick those up separately if needed.
 */
export const SCHEDULE_C_LINES: ScheduleCLine[] = [
  { number: '8',   label: 'Advertising', description: 'Marketing, signage, lead-gen ads, printed materials' },
  { number: '9',   label: 'Car & truck expenses', description: 'Mileage or actual vehicle costs (use mileage log)' },
  { number: '10',  label: 'Commissions & fees', description: 'Outside agent commissions, referral fees' },
  { number: '11',  label: 'Contract labor', description: '1099 contractor payments (photographers, freelancers)' },
  { number: '15',  label: 'Insurance (other than health)', description: 'E&O, general liability, business property' },
  { number: '17',  label: 'Legal & professional services', description: 'Lawyers, accountants, consultants' },
  { number: '18',  label: 'Office expense', description: 'Supplies, postage, small office equipment' },
  { number: '20a', label: 'Rent — vehicles, machinery, equipment', description: 'Equipment leases' },
  { number: '20b', label: 'Rent — other business property', description: 'Office space rent' },
  { number: '21',  label: 'Repairs & maintenance', description: 'Office repairs, equipment maintenance' },
  { number: '22',  label: 'Supplies', description: 'Software subscriptions (CoStar, LoopNet), small tools' },
  { number: '23',  label: 'Taxes & licenses', description: 'TREC license, MLS dues, occupancy permits' },
  { number: '24a', label: 'Travel', description: 'Hotels, flights, meals on overnight business trips' },
  { number: '24b', label: 'Deductible meals', description: 'Client meals (50% deductible in 2026)' },
  { number: '25',  label: 'Utilities', description: 'Phone, internet, office utilities' },
  { number: '27a', label: 'Other expenses', description: 'CE courses, business gifts, anything that doesn\'t fit above' },
];

/**
 * Map a working expense category to a Schedule C line. The fallback is
 * Line 27a ("Other expenses"), which is what the CPA would put it on if
 * pushed.
 */
export const CATEGORY_TO_SCHEDULE_C: Record<string, string> = {
  'Marketing & Advertising':      '8',
  'Travel & Mileage':             '9',
  'Meals & Client Entertainment': '24b',
  'Professional Services':        '17',
  'Office & Supplies':            '18',
  'Software & Subscriptions':     '22',
  'Insurance & Licensing':        '23',
  'Property Operations':          '21',
  'Continuing Education':         '27a',
  'Other':                        '27a',
};

export interface ScheduleCLineRollup {
  line: ScheduleCLine;
  /** Total dollars on this line for the period. */
  total: number;
  /** Number of expenses contributing to the line. */
  count: number;
  /** Map of category name → total for that category (helps the CPA see
   *  what was bucketed where in case they want to reclassify). */
  by_category: Record<string, number>;
}

/**
 * Roll up a list of expenses into Schedule C lines. Optionally also
 * include 1099-NEC eligible expenses on Line 11 (Contract labor) — some
 * CPAs split this from Line 10 (Commissions). We do that automatically
 * here: any expense with `is_1099_eligible = true` goes to Line 11
 * regardless of its working category.
 */
export function rollupScheduleC(expenses: Expense[]): ScheduleCLineRollup[] {
  const byLine: Record<string, ScheduleCLineRollup> = {};
  // Seed with all the lines so even zero-dollar lines render in their
  // canonical order on the report.
  for (const line of SCHEDULE_C_LINES) {
    byLine[line.number] = { line, total: 0, count: 0, by_category: {} };
  }

  for (const e of expenses) {
    // 1099-eligible always goes to Line 11. Otherwise look up by category.
    const num = e.is_1099_eligible ? '11' : (CATEGORY_TO_SCHEDULE_C[e.category] ?? '27a');
    const rollup = byLine[num];
    if (!rollup) continue;
    const amt = Number(e.amount);
    rollup.total = Math.round((rollup.total + amt + Number.EPSILON) * 100) / 100;
    rollup.count++;
    rollup.by_category[e.category] = Math.round(((rollup.by_category[e.category] ?? 0) + amt + Number.EPSILON) * 100) / 100;
  }

  // Return in the canonical IRS line order so the report reads top-down
  // the same way the IRS form does.
  return SCHEDULE_C_LINES.map(line => byLine[line.number]);
}

/**
 * 50% meals limitation — Line 24b is generally deductible at 50% for
 * most years. The CPA will apply this on the actual filing; we surface
 * both the full and the deductible amount on the report so the owner
 * sees their real tax-deductible total.
 *
 * (2021-2022 had a temporary 100% deduction for restaurant meals; that's
 * lapsed. As of 2026 we're back to 50%.)
 */
export function meals50Deductible(rollup: ScheduleCLineRollup[]): {
  meals_full: number;
  meals_deductible: number;
} {
  const meals = rollup.find(r => r.line.number === '24b');
  const full = meals?.total ?? 0;
  return {
    meals_full: full,
    meals_deductible: Math.round((full * 0.5 + Number.EPSILON) * 100) / 100,
  };
}
