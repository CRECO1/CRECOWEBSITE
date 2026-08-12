import { permanentRedirect } from 'next/navigation';

/**
 * /team has been folded into /about — the team grid lives at
 * /about#team now. This server-side redirect (308 permanent) preserves
 * any external bookmarks, email links, or business-card URLs that
 * still point at /team. SEO authority transfers cleanly.
 *
 * If we ever decide to revive a standalone team route, the original
 * page implementation lives at src/components/team/TeamSection.tsx —
 * just drop it back into a route file with the page-level chrome
 * (Header/Footer/hero band) restored.
 */
export default function TeamPage(): never {
  permanentRedirect('/about#team');
}
