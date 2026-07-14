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
import { Phone, Mail, Calendar, ArrowRight } from 'lucide-react';
import { PRIMARY_BROKER, brokerInitials, type Broker } from '@/lib/broker';

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
  className?: string;
}

export function BrokerCard({
  broker = PRIMARY_BROKER,
  intro = "You'll hear from:",
  variant = 'light',
  hideCalendar = false,
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

      <div className="space-y-2">
        {broker.calendar_url && !hideCalendar && (
          <a
            href={broker.calendar_url}
            target="_blank"
            rel="noreferrer noopener"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-body-sm font-bold text-primary hover:bg-gold-light shadow-sm transition-colors"
          >
            <Calendar className="h-4 w-4 shrink-0" />
            Book 15 min directly
            <ArrowRight className="h-4 w-4 shrink-0" />
          </a>
        )}
        <a
          href={broker.phone_href}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-lg border ${variant === 'dark' ? 'border-white/20 text-white hover:bg-white/10' : 'border-border text-primary hover:border-gold hover:text-gold'} px-4 py-2.5 text-body-sm font-semibold transition-colors`}
        >
          <Phone className="h-4 w-4 shrink-0" />
          {broker.phone_display}
        </a>
        <a
          href={`mailto:${broker.email}`}
          className={`w-full inline-flex items-center justify-center gap-2 text-body-sm font-semibold ${linkClass}`}
        >
          <Mail className="h-4 w-4 shrink-0" />
          {broker.email}
        </a>
      </div>
    </div>
  );
}
