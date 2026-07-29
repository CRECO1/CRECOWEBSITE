'use client';

/**
 * InquirySuccessCard — shared post-submit confirmation surface for every
 * meaningful inquiry form on the site (Plaza, Elkhorn, listings detail,
 * /get-started, /sell, /contact, etc.).
 *
 * Why a shared component? Three reasons:
 *   1. The previous per-form success states all said roughly the same
 *      thing ("Thanks, we'll be in touch within one business day") but
 *      with different copy, alignments, and trust signals. Visitors
 *      who submit on Plaza then later on Elkhorn shouldn't get two
 *      visually-different confirmations.
 *   2. The bare "Thanks" surface was the single biggest missed moment
 *      in the funnel — no expectation-setting, no anxiety-reducing
 *      timeline, no "while you wait" capture path. Visitor anxiety
 *      after submit drives the "did you get my email?" follow-up
 *      calls; a stronger confirmation reduces that load.
 *   3. Centralizing it means future tweaks (broker headshot, ICS file
 *      download, calendar booking link) ship to every form at once.
 *
 * Design intent:
 *   - 3-step "what happens next" with icons. Numbered timeline removes
 *     ambiguity about response time.
 *   - "While you wait" branch lets the engaged visitor keep moving on
 *     the site rather than refreshing their inbox.
 *   - Phone fallback is the last line because the prospect just chose
 *     to submit instead of calling — re-presenting the number too
 *     prominently second-guesses their choice.
 *   - Small "Send another message" reset link kept for the rare case
 *     of "wait I forgot to mention X."
 *
 * Future tweak: when the agents data is server-rendered, accept a
 * `principal` prop with name + image_url and show the real broker who
 * will respond. For now we keep it brand-level ("a CRECO principal")
 * to avoid statically-baked names going stale.
 */

import Link from 'next/link';
import { CheckCircle, Clock, Mail, Phone, ArrowRight, BookOpen, Building2, Calendar } from 'lucide-react';
import { BrokerAvatar } from '@/components/marketing/BrokerCard';
import { PRIMARY_BROKER, type Broker } from '@/lib/broker';

interface InquirySuccessCardProps {
  /**
   * Which broker the inquiry routes to. Overrides PRIMARY_BROKER —
   * used by ListingContactForm on listings with a per-listing broker
   * assignment (e.g. Louis Pasteur → Brian Blanco). When omitted,
   * falls back to PRIMARY_BROKER (Zach) so all existing forms keep
   * working unchanged.
   */
  broker?: Broker;
  /**
   * Property or surface name shown in the confirmation copy, e.g.
   * "8979 Dietz Elkhorn" or "your retail bay inquiry". Optional —
   * cards on general /contact or /get-started don't need it.
   */
  propertyName?: string;
  /**
   * One-sentence specific note about what the broker will do. Falls
   * back to a sensible generic if omitted.
   */
  customMessage?: string;
  /**
   * "Send another message" reset handler — passed by the parent form
   * so the reset stays scoped to that form's state.
   */
  onReset?: () => void;
  /**
   * Whether to show the "browse other properties" CTA in the
   * keep-them-engaged branch. Defaults true; the /listings detail
   * page may want to disable it (they were just browsing properties).
   */
  showBrowseProperties?: boolean;
  /**
   * Whether to show the "read insights" CTA. Defaults true.
   */
  showInsights?: boolean;
}

const PHONE_DISPLAY = '(210) 817-3443';
const PHONE_HREF = 'tel:+12108173443';

export function InquirySuccessCard({
  broker,
  propertyName,
  customMessage,
  onReset,
  showBrowseProperties = true,
  showInsights = true,
}: InquirySuccessCardProps = {}) {
  // Resolve the actual broker to use — the `broker` prop overrides,
  // falling back to PRIMARY_BROKER (Zach) when omitted. Everything
  // downstream (copy, avatar, booking link, first-name references)
  // reads from `activeBroker` so we don't accidentally hardcode the
  // primary anywhere.
  const activeBroker = broker ?? PRIMARY_BROKER;
  const firstName = activeBroker.name.split(' ')[0];

  const specificMessage = customMessage
    ?? (propertyName
        ? `${activeBroker.name} will follow up about ${propertyName} personally — current availability, the right space recommendation, and a proposed tour time.`
        : `${activeBroker.name} will follow up personally with the right next step for your situation.`);

  return (
    <div className="rounded-2xl bg-white border border-gold/30 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto">
      {/* Header — clear ack + emotional resolution. Broker avatar + name
          inline with the checkmark so the visitor immediately sees the
          real person who will reply, not an anonymous "principal". */}
      <div className="text-center mb-7">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-heading text-heading-lg font-bold text-primary mb-3">
          Got it. We received your inquiry.
        </h3>
        <div className="flex items-center justify-center gap-3 mb-3">
          <BrokerAvatar broker={activeBroker} size={48} />
          <div className="text-left">
            <p className="font-heading text-body-sm font-bold text-primary leading-tight">
              {activeBroker.name}
            </p>
            <p className="text-caption text-foreground-muted">{activeBroker.title}</p>
          </div>
        </div>
        <p className="text-body text-foreground-muted leading-relaxed">
          {specificMessage}
        </p>
      </div>

      {/* Direct booking shortcut — only rendered when a Cal.com URL is
          configured. Sits above the timeline because "book now" is a
          higher-intent shortcut than "wait for a reply". */}
      {activeBroker.calendar_url && (
        <div className="border-t border-border pt-6 mb-6 text-center">
          <p className="font-heading text-body-sm font-bold text-primary uppercase tracking-widest mb-3">
            Skip the wait
          </p>
          <a
            href={activeBroker.calendar_url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-body-sm font-bold text-primary hover:bg-gold-light shadow-sm transition-colors"
          >
            <Calendar className="h-4 w-4 shrink-0" />
            Book 15 min with {firstName}
            <ArrowRight className="h-4 w-4 shrink-0" />
          </a>
          <p className="text-caption text-foreground-muted mt-3">
            Grab a slot on {firstName}&apos;s calendar directly — no waiting on email.
          </p>
        </div>
      )}

      {/* 3-step timeline — removes the "when will I hear back?" anxiety
          loop. Numbered + iconed so the steps are scannable at a glance. */}
      <div className="border-t border-border pt-6 mb-7">
        <p className="font-heading text-body-sm font-bold text-primary uppercase tracking-widest text-center mb-5">
          What happens next
        </p>
        <ol className="space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold text-primary font-heading font-bold text-body-sm">
              1
            </span>
            <div className="flex-1">
              <p className="font-heading text-body-sm font-bold text-primary mb-0.5 flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" /> Confirmation email — within minutes
              </p>
              <p className="text-body-sm text-foreground-muted leading-relaxed">
                Check the inbox you submitted. If it&apos;s not there in 5 minutes, check your spam folder.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold text-primary font-heading font-bold text-body-sm">
              2
            </span>
            <div className="flex-1">
              <p className="font-heading text-body-sm font-bold text-primary mb-0.5 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold" /> {firstName} replies personally — within one business day
              </p>
              <p className="text-body-sm text-foreground-muted leading-relaxed">
                By phone if you left a number, by email otherwise. Not a router, not a form-response — the actual broker.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold text-primary font-heading font-bold text-body-sm">
              3
            </span>
            <div className="flex-1">
              <p className="font-heading text-body-sm font-bold text-primary mb-0.5 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gold" /> Walk-through or call setup
              </p>
              <p className="text-body-sm text-foreground-muted leading-relaxed">
                We&apos;ll propose a tour time or a 15-minute briefing call — whichever fits your stage.
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* "While you wait" — captures the engaged visitor before they
          tab away. Two-CTA grid so it doesn't feel like a busy menu. */}
      {(showBrowseProperties || showInsights) && (
        <div className="border-t border-border pt-6 mb-6">
          <p className="font-heading text-body-sm font-bold text-primary uppercase tracking-widest text-center mb-4">
            While you wait
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {showBrowseProperties && (
              <Link
                href="/listings"
                className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-background-cream px-4 py-3 hover:border-gold hover:bg-gold/5 transition-colors"
              >
                <div>
                  <p className="font-heading text-body-sm font-bold text-primary group-hover:text-gold">
                    Browse Texas properties
                  </p>
                  <p className="text-caption text-foreground-muted">Office, retail, industrial</p>
                </div>
                <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-gold shrink-0" />
              </Link>
            )}
            {showInsights && (
              <Link
                href="/insights"
                className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-background-cream px-4 py-3 hover:border-gold hover:bg-gold/5 transition-colors"
              >
                <div>
                  <p className="font-heading text-body-sm font-bold text-primary group-hover:text-gold">
                    Read latest CRECO insights
                  </p>
                  <p className="text-caption text-foreground-muted">Market reports + analysis</p>
                </div>
                <BookOpen className="h-4 w-4 text-foreground-muted group-hover:text-gold shrink-0" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Phone fallback — small, last line. Visitor already chose to
          submit instead of calling, so re-presenting the number too
          prominently second-guesses their decision. */}
      <p className="text-caption text-foreground-muted text-center">
        Need to talk now? Call{' '}
        <a href={PHONE_HREF} className="text-gold-dark hover:underline font-semibold inline-flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {PHONE_DISPLAY}
        </a>
        .
      </p>

      {onReset && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onReset}
            className="text-caption text-foreground-muted hover:text-primary underline"
          >
            Send another message
          </button>
        </div>
      )}
    </div>
  );
}
