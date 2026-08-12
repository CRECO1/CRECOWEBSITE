/**
 * LeadMagnetBand — a loud, dual-audience capture band for high-traffic pages.
 *
 * Surfaces the two lowest-commitment lead magnets side by side so both of
 * CRECO's audiences get an on-ramp without having to hunt for it:
 *   - Owners/investors → the instant cap-rate valuation tool (no contact info
 *     required to see the number).
 *   - Tenants/buyers   → one-field property-alerts email capture.
 *
 * Previously these lived only deep on the homepage (section 8 of 12) and at the
 * very bottom of /listings — places most visitors never scroll to. Dropping
 * this band high on a page turns passive traffic into captured leads.
 */

import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { PropertyAlertsInline } from './PropertyAlertsInline';

export function LeadMagnetBand({ surface = 'lead-magnet-band' }: { surface?: string }) {
  return (
    <section className="bg-primary py-14 sm:py-16">
      <Container>
        <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Owners → instant valuation */}
          <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 shrink-0 text-gold" />
              <h3 className="font-heading text-body-lg font-bold text-white">
                Own commercial property in Texas?
              </h3>
            </div>
            <p className="mb-5 flex-1 text-body-sm leading-relaxed text-white/70">
              Get an instant, cap-rate-based value range for your property in about 60 seconds — no contact info required to see the number.
            </p>
            <Link
              href="/property-valuation"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-body-sm font-bold text-primary shadow-sm transition-colors hover:bg-gold-light"
            >
              What&apos;s my property worth? <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </div>

          {/* Tenants → new-listing alerts (functional one-field capture) */}
          <PropertyAlertsInline variant="dark" surface={surface} />
        </div>
      </Container>
    </section>
  );
}
