import { permanentRedirect } from 'next/navigation';

/**
 * /join → /careers.
 *
 * Recruiting lives at /careers, which is what the site links to and what
 * search engines have indexed. /join exists because it is the address people
 * reach for (and the one the Fair Oaks side uses), so it should not 404 —
 * a 308 keeps one canonical recruiting page instead of two competing ones.
 */
export default function JoinRedirect(): never {
  permanentRedirect('/careers');
}
