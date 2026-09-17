import { MetadataRoute } from 'next';

/**
 * robots.txt.
 *
 * /admin, /manage, /api/   — internal surfaces, never index
 * /billing                 — operator-facing billing/admin pages (also auth-gated)
 * /client/                 — token-based client portal URLs. The portal pages
 *                            carry a `<meta robots="noindex,nofollow">` tag too,
 *                            but the robots.txt belt-and-suspenders prevents
 *                            crawlers from ever fetching a token URL in the
 *                            first place (which would also surface tokens in
 *                            referrer logs, GSC, etc.).
 *
 * AI crawlers: CRECO WANTS to be read, cited, and recommended by AI assistants
 * and answer engines. Each major AI user-agent gets an explicit group that
 * allows the public site (same private-path disallows as everyone else) so no
 * crawler has to infer intent from the wildcard rule. Note: a crawler that
 * matches a named group ignores the `*` group, so the disallows are repeated.
 */
const PRIVATE_PATHS = ['/admin', '/manage', '/api/', '/billing', '/client/'];

const AI_CRAWLERS = [
  // OpenAI
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
  // Anthropic
  'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'Claude-Web',
  // Perplexity
  'PerplexityBot', 'Perplexity-User',
  // Google (Gemini / AI training control) + Apple Intelligence
  'Google-Extended', 'Applebot', 'Applebot-Extended',
  // Common Crawl (feeds many LLM datasets), ByteDance, Amazon, Meta, Microsoft, others
  'CCBot', 'Bytespider', 'Amazonbot', 'Meta-ExternalAgent', 'FacebookBot', 'Bingbot',
  'DuckAssistBot', 'MistralAI-User', 'cohere-ai', 'YouBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // llms.txt / llms-full.txt are listed explicitly (not just covered by
        // '/') so any crawler reading robots.txt as a discovery document finds
        // the AI-facing summaries without having to guess the convention.
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: 'https://www.crecotx.com/sitemap.xml',
    host: 'https://www.crecotx.com',
  };
}
