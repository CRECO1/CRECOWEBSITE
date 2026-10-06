/**
 * BrokerCard — reusable "you'll hear from this actual person" surface
 * that drops in next to inquiry forms and modal buttons across the
 * site.
 *
 * Two sub-parts:
 *   - BrokerAvatar: circular photo (or initials fallback if the
 *     photo_url isn't set on PRIMARY_BROKER). Consistent size + gold
 *     ring across every appearance so the visitor's brain registers
 *     the same person immediately regardless of surface.
 *   - BrokerCard: the full card — avatar, name/title, direct email
 *     + phone + optional Cal.com booking link. Meant to sit next to
 *     forms as a trust signal.
 *
 * Design intent: mention Zach by name (not "a CRECO principal") so the
 * post-submit reply feels expected and personal. Every real-estate
 * conversion study puts named+photographed broker adjacent to a form
 * as a top-3 conversion lift.
 */

import Image from 'next/image';
import { Mail, Calendar, Star } from 'lucide-react';
import { PRIMARY_BROKER, brokerInitials, type Broker } from '@/lib/broker';
import { PhoneCallText } from '@/components/marketing/PhoneCallText';
import { GOOGLE_RATING, GOOGLE_REVIEW_COUNT, GOOGLE_PROFILE_URL } from '@/lib/reviews';

// ─── Avatar ──────────────────────────────────────────────────────────

interface BrokerAvatarProps {
  broker?: Broker;
  /** Diameter in pixels. Tailwind class equivalents: 48=h-12, 64=h-16, 96=h-24. */
  size?: 48 | 64 | 96;
  className?: string;
}

/**
 * Circular broker photo with a gold ring. Falls back to initials on a
 * gold background when photo_url isn't set — so the UI never renders
 * a broken image or empty circle while the headshot is being sourced.
 */
export function BrokerAvatar({
  broker = PRIMARY_BROKER,
  size = 64,
  className = '',
}: BrokerAvatarProps) {
  const sizeClass =
    size === 48 ? 'h-12 w-12 text-body-sm'
    : size === 96 ? 'h-24 w-24 text-heading-sm'
    : 'h-16 w-16 text-body';
  const initials = brokerInitials(broker);

  if (broker.photo_url) {
    return (
      <div
        className={`relative shrink-0 rounded-full overflow-hidden ring-2 ring-gold/50 ${sizeClass} ${className}`}
      >
        <Image
          src={broker.photo_url}
          alt={`${broker.name}, ${broker.title}`}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 rounded-full bg-gold text-primary flex items-center justify-center font-heading font-bold ring-2 ring-gold/50 ${sizeClass} ${className}`}
      aria-label={`${broker.name}, ${broker.title}`}
    >
      {initials}
    </div>
  );
}

// ─── Full card ───────────────────────────────────────────────────────

interface BrokerCardProps {
  broker?: Broker;
  /**
   * Optional lead-in copy above the broker's name. Lets each surface
   * tune the framing:
   *   InquirySuccessCard → "Your reply comes from:"
   *   Inline form sidebar → "You'll hear from:"
   */
  intro?: string;
  /**
   * `dark` variant flips to white text on primary background — used
   * on the hero-adjacent sections. Default is `light` (card on cream).
   */
  variant?: 'light' | 'dark';
  /** Hide the calendar CTA even if the broker has a calendar_url. */
  hideCalendar?: boolean;
  /**
   * The second person on the listing (Zack the broker + Brian the agent).
   * Every listing shows both — a two-person team reads as a firm, one name
   * reads as a solo agent. Contact links stay the lead's (one office line).
   */
  backup?: Broker;
  className?: string;
}

export function BrokerCard({
  broker = PRIMARY_BROKER,
  intro = "You'll hear from:",
  variant = 'light',
  hideCalendar = false,
  backup,
  className = '',
}: BrokerCardProps) {
  const cardBg = variant === 'dark'
    ? 'bg-primary/50 border-white/10 text-white'
    : 'bg-background-cream border-border text-primary';
  const introClass = variant === 'dark' ? 'text-white/60' : 'text-foreground-muted';
  const nameClass = variant === 'dark' ? 'text-white' : 'text-primary';
  const linkClass = variant === 'dark'
    ? 'text-gold hover:text-gold-light'
    : 'text-gold-dark hover:text-gold';

  return (
    <div className={`rounded-2xl border p-5 sm:p-6 ${cardBg} ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <BrokerAvatar broker={broker} size={64} />
        <div className="min-w-0">
          <p className={`text-caption uppercase tracking-widest ${introClass}`}>{intro}</p>
          <p className={`font-heading text-body-lg font-bold leading-tight ${nameClass}`}>
            {broker.name}
          </p>
          <p className={`text-caption ${introClass}`}>{broker.title}</p>
        </div>
      </div>

      {backup && (
        <div className={`flex items-center gap-4 mb-4 pt-4 border-t ${variant === 'dark' ? 'border-white/10' : 'border-border'}`}>
          <BrokerAvatar broker={backup} size={48} className="ml-2" />
          <div className="min-w-0">
            <p className={`text-caption uppercase tracking-widest ${introClass}`}>Also on this listing</p>
            <p className={`font-heading text-body font-bold leading-tight ${nameClass}`}>{backup.name}</p>
            <p className={`text-caption ${introClass}`}>{backup.title}</p>
          </div>
        </div>
      )}

      {/* Quiet on purpose: this card sits next to a form, and its contact
          routes used to be three filled buttons (gold Book, navy Call, gold
          Text) competing with that form's own submit. Now Call · Text is one
          line, and booking and email are text links. */}
      <div className="space-y-1.5">
        <PhoneCallText variant="inline" tone={variant === 'dark' ? 'dark' : 'light'} surface="broker_card" broker={broker} />
        {broker.calendar_url && !hideCalendar && (
          <a
            href={broker.calendar_url}
            target="_blank"
            rel="noreferrer noopener"
            className={`flex items-center gap-2 text-body-sm font-semibold ${linkClass}`}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            Book 15 min directly
          </a>
        )}
        <a
          href={`mailto:${broker.email}`}
          className={`flex items-center gap-2 text-body-sm font-semibold break-all ${linkClass}`}
        >
          <Mail className="h-4 w-4 shrink-0" />
          {broker.email}
        </a>
      </div>
    </div>
  );
}

// ─── Compact trust line for forms ────────────────────────────────────

/**
 * The person and the rating, in one row, to sit at the top of a lead form:
 * photo, "Zachary Stovall, Broker — replies personally", and the Google
 * rating linking to the profile. Small enough to ride inside the form card
 * rather than as a sidebar, so it works at phone width with no layout change.
 */
export function BrokerTrustLine({
  broker = PRIMARY_BROKER,
  tone = 'light',
  className = '',
}: {
  broker?: Broker;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const dark = tone === 'dark';
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <BrokerAvatar broker={broker} size={48} />
      <div className="min-w-0 text-body-sm leading-snug">
        <p className={`font-semibold ${dark ? 'text-white' : 'text-primary'}`}>
          {broker.name}, {broker.title}
          <span className={`font-normal ${dark ? 'text-white/60' : 'text-foreground-muted'}`}> — replies personally</span>
        </p>
        <a
          href={GOOGLE_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-caption hover:underline ${dark ? 'text-white/70' : 'text-foreground-muted'}`}
        >
          <Star className="h-3.5 w-3.5 shrink-0 fill-gold text-gold" aria-hidden="true" />
          {GOOGLE_RATING.toFixed(1)} on Google · {GOOGLE_REVIEW_COUNT} reviews
        </a>
      </div>
    </div>
  );
}
