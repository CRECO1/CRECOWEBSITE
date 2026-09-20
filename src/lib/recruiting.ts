/**
 * CRECO recruiting copy — what we tell commercial agents.
 *
 * Every claim here is one the broker has confirmed. Economics are the
 * exception: the terms ARE settled, but Zack does not want them public, so no
 * split percentage, cap, fee figure or contractor classification may appear in
 * this file or anything it feeds. See PRIVATE_TERMS below.
 *
 * The residential mirror of this lives in the Fair Oaks repo at
 * src/lib/recruiting.ts. Keep the two in step — an agent may well read both.
 */

/**
 * How economics are described in PUBLIC copy. The real terms live off the web
 * surface entirely, in
 * /Users/creco/Documents/CRECO/Marketing/recruiting/INTERNAL-recruiting-terms.md.
 * Do not put a number in this string — anything here renders on a public page.
 */
export const PRIVATE_TERMS =
  'Competitive commission structure and terms discussed directly with qualified candidates.';

export interface ValueProp {
  icon: 'UserCheck' | 'Laptop' | 'Megaphone' | 'Search' | 'Network' | 'DollarSign';
  title: string;
  body: string;
}

export const CRECO_VALUE_PROPS: ValueProp[] = [
  {
    icon: 'UserCheck',
    title: 'Principal-led, not an agent farm',
    body:
      'You work assignments alongside Zachary Stovall, the broker/owner, and Brian Blanco, who runs an active leasing pipeline. Small team, direct access to the people making the decisions, and you learn how deals actually get done.',
  },
  {
    icon: 'Laptop',
    title: 'Deal infrastructure that already exists',
    body:
      'A custom CRM with e-signature and automation built in — LOIs and lease documents out for signature, tenant and landlord records, tasks and follow-up sequences that run themselves. You are not rebuilding a tech stack on your own dime.',
  },
  {
    icon: 'Megaphone',
    title: 'Live leasing pipeline and lead flow',
    body:
      "Brian's leasing pipeline is active, and we run ongoing lead generation into the CRM. There is real product to work from your first week rather than a cold start.",
  },
  {
    icon: 'Search',
    title: 'Search presence that surfaces your listings',
    body:
      'We put serious work into how CRECO ranks on Google and how AI search tools cite us. Tenants and investors researching Texas space find our listings — which means they find yours.',
  },
  {
    icon: 'Network',
    title: 'Commercial and residential under one owner',
    body:
      'CRECO handles commercial; our sister brokerage Fair Oaks Realty Group handles residential. Your tenant buying a house, your investor selling a personal residence — that referral stays in the family instead of walking out the door.',
  },
  {
    icon: 'DollarSign',
    title: 'Economics worth a conversation',
    body:
      `${PRIVATE_TERMS} Zack sets them directly with you — no committee and no sliding scale to decode.`,
  },
];
