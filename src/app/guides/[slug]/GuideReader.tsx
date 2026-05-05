'use client';

/**
 * Client-side guide reader. Shows the email gate by default; once the user
 * unlocks (or has previously unlocked), renders the full content inline.
 *
 * Unlock state is persisted in localStorage by LeadMagnetForm so users don't
 * have to re-submit on refresh. SEO note: the gated content lives only in the
 * client; teaser + outline are rendered server-side for indexing.
 */

import { useState } from 'react';
import { LeadMagnetForm } from '@/components/forms/LeadMagnetForm';
import type { Guide } from '@/lib/guides';

export function GuideReader({ guide }: { guide: Guide }) {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return (
      <>
        <LeadMagnetForm
          assetSlug={guide.slug}
          outcomes={guide.outcomes}
          onUnlock={() => setUnlocked(true)}
        />
        {/* Outline — visible to give users a sense of what's behind the gate (and helps SEO) */}
        <div className="rounded-xl border border-border bg-white p-6 sm:p-8">
          <h3 className="font-heading text-heading-sm font-bold text-primary mb-4">What's inside</h3>
          <ol className="space-y-3 list-decimal list-inside text-body-sm text-foreground-muted">
            {guide.sections.map(s => (
              <li key={s.heading} className="leading-relaxed">{s.heading}</li>
            ))}
          </ol>
        </div>
      </>
    );
  }

  return (
    <div className="prose-creco">
      {guide.sections.map((section, i) => (
        <section key={i} className="mb-10">
          <h2 className="font-heading text-heading-lg font-bold text-primary mt-10 mb-4">{section.heading}</h2>
          {section.paragraphs.map((p, j) => (
            <p key={j} className="text-body text-foreground leading-relaxed mb-4">{p}</p>
          ))}
          {section.bullets && (
            <ul className="space-y-2 mt-4 mb-4">
              {section.bullets.map((b, j) => (
                <li key={j} className="flex items-start gap-3 text-body text-foreground leading-relaxed">
                  <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <hr className="my-10 border-border" />
      <h2 className="font-heading text-heading-lg font-bold text-primary mb-4">Closing thoughts</h2>
      {guide.conclusion.map((p, i) => (
        <p key={i} className="text-body text-foreground leading-relaxed mb-4">{p}</p>
      ))}
    </div>
  );
}
