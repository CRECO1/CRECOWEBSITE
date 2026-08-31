'use client';

/**
 * TeamSection — the agent grid + bio modal extracted from the old
 * standalone /team route so it can live inside /about instead. The
 * page-level chrome (Header/Footer, hero band, "Join the CRECO Team"
 * CTA) was specific to the /team route and stays out of this
 * component — embed contexts compose their own surrounding sections.
 *
 * The data flow is unchanged: hit Supabase `agents` ordered by `order`,
 * fall back to DEMO_AGENTS when empty or errored so the section never
 * renders blank. Clicking a card opens a centered bio modal with
 * phone + email CTAs; click-outside or X closes it.
 *
 * The wrapping <section> includes id="team" so /about#team deep-links
 * (and the /team → /about#team redirect) scroll the user straight to
 * the grid.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Phone, Mail, Award, User, X, ArrowRight, Send, Loader2, CheckCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Honeypot } from '@/components/forms/Honeypot';
import { supabase } from '@/lib/supabase';
import { trackEvent, readUtmsFromCookie } from '@/lib/analytics';

const DEMO_AGENTS = [
  {
    id: '1',
    name: 'Add your team in /admin',
    slug: 'placeholder',
    title: 'Principal Broker',
    email: 'info@crecotx.com',
    phone: '(210) 817-3443',
    image_url: null,
    license_number: 'TX-XXXXXXX',
    years_experience: 15,
    featured: true,
    order: 1,
    specialties: ['Office Leasing', 'Investment Sales', 'Tenant Representation'],
    bio: 'Replace this placeholder with your team. Add agents in the Payload admin panel at /admin → Agents.',
  },
];

type Agent = typeof DEMO_AGENTS[0];

interface TeamSectionProps {
  /**
   * Eyebrow + heading copy. About-page embed uses different copy than
   * the old /team route would have, so the parent supplies it. Both
   * default to the original /team strings if not overridden.
   */
  eyebrow?: string;
  heading?: string;
  description?: string;
  /** Background class for the section. About uses `bg-white`. */
  className?: string;
}

export function TeamSection({
  eyebrow = 'Your Commercial Real Estate Partners',
  heading = 'Meet the CRECO Team',
  description = 'Principal-level brokers who live and work in San Antonio — and who treat every assignment like our name is on the building.',
  className = 'section-luxury bg-white',
}: TeamSectionProps = {}) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);

  // Broker-message capture (opened from inside the profile modal). Turns a
  // profile view into a real lead routed to that broker, instead of relying on
  // a mailto: that opens the visitor's email app and captures nothing.
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [msgName, setMsgName] = useState('');
  const [msgEmail, setMsgEmail] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSubmitting, setMsgSubmitting] = useState(false);
  const [msgSubmitted, setMsgSubmitted] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('agents')
      .select('*')
      .order('order', { ascending: true })
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          setAgents(DEMO_AGENTS);
        } else {
          setAgents(data as Agent[]);
        }
      });
  }, []);

  function openProfile(agent: Agent) {
    trackEvent('team_profile_opened', { agent_slug: agent.slug, agent_name: agent.name });
    // Fresh capture state each time a profile opens.
    setShowMessageForm(false);
    setMsgSubmitted(false);
    setMsgError(null);
    setSelected(agent);
  }

  async function handleBrokerMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setMsgError(null);
    setMsgSubmitting(true);
    try {
      const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';
      if (honeypot) { setMsgSubmitted(true); setMsgSubmitting(false); return; }
      const attribution = readUtmsFromCookie();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: msgName,
          email: msgEmail,
          message: `Message to ${selected.name} (${selected.title}) sent from their team profile:\n\n${msgBody || '(no message provided)'}`,
          property_interest: `Broker: ${selected.name}`,
          source: 'broker-profile',
          website: honeypot,
          ...attribution,
        }),
      });
      if (!res.ok) throw new Error('Could not send your message — please try again.');
      setMsgSubmitted(true);
      trackEvent('broker_message_submitted', { agent_slug: selected.slug, agent_name: selected.name });
    } catch (err) {
      setMsgError((err as Error).message);
      trackEvent('broker_message_failed', { reason: (err as Error).message?.slice(0, 80) });
    } finally {
      setMsgSubmitting(false);
    }
  }

  return (
    <section id="team" className={`scroll-mt-24 ${className}`}>
      <Container>
        {/* Section header — full Container width with text-center, so
            the eyebrow + h2 sit on the optical center of the page
            instead of inside a narrower max-w wrapper that looked
            shifted on wide viewports. The description does keep a
            narrower max-w for readability — long line lengths on a
            wide column are hard to scan. */}
        <div className="mb-12 text-center">
          <p className="overline mb-3 text-gold text-center">{eyebrow}</p>
          <h2 className="font-heading text-display-sm font-bold text-primary leading-tight">
            {heading}
          </h2>
          <p className="mt-4 text-body text-foreground-muted leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => openProfile(agent)}
              className="card-luxury group p-6 text-center w-full focus:outline-none focus:ring-2 focus:ring-gold rounded-2xl transition-all hover:-translate-y-1"
            >
              <div className="mx-auto mb-5 h-28 w-28 rounded-full bg-background-warm overflow-hidden">
                {agent.image_url ? (
                  <Image
                    src={agent.image_url as string}
                    alt={agent.name}
                    width={112}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <User className="h-12 w-12 text-foreground-subtle" />
                  </div>
                )}
              </div>
              <h3 className="font-heading text-heading font-semibold text-primary">{agent.name}</h3>
              <p className="text-body-sm text-foreground-muted mt-1 mb-4">{agent.title}</p>
              {agent.specialties && (
                <div className="flex flex-wrap justify-center gap-2 mb-5">
                  {(agent.specialties as string[]).slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border px-3 py-1 text-caption text-foreground-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <span className="text-caption font-semibold text-gold group-hover:underline">View Profile →</span>
            </button>
          ))}
        </div>
      </Container>

      {/* Bio Modal — mounted at section root so it overlays the rest of
          /about cleanly, click-outside closes, fixed inset-0 keeps it
          centered across viewports. */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-foreground-muted hover:text-primary shadow-sm transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Square headshot crop (was aspect-[3/4], a ~512px-tall portrait
                that dominated the card). aspect-square (~384px on the ~384px-wide
                modal) is meaningfully shorter, so the name, bio, specialties, and
                message form sit higher and more is visible without scrolling —
                owner preference to weight the text over the photo. object-cover
                object-top keeps the face framed at the top as the lower torso
                crops out. */}
            <div className="relative w-full aspect-square bg-background-warm">
              {selected.image_url ? (
                <Image
                  src={selected.image_url as string}
                  alt={selected.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 384px"
                  className="object-cover object-top"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <User className="h-20 w-20 text-foreground-subtle" />
                </div>
              )}
            </div>

            <div className="p-6 overflow-y-auto">
              <p className="text-caption font-semibold uppercase tracking-widest text-gold mb-0.5">
                {selected.title}
              </p>
              <h2 className="font-heading text-heading-xl font-bold text-primary mb-2">{selected.name}</h2>

              {selected.years_experience && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Award className="h-3.5 w-3.5 text-gold" />
                  <span className="text-caption text-foreground-muted">
                    {selected.years_experience}+ years of experience
                  </span>
                </div>
              )}

              {selected.bio && (
                <p className="text-body-sm text-foreground-muted leading-relaxed mb-4">
                  {selected.bio as string}
                </p>
              )}

              {selected.specialties && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {(selected.specialties as string[]).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-background-cream border border-border px-2.5 py-0.5 text-caption text-foreground-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Contact — a real lead-capturing message form (primary), with
                  direct phone/email as secondary options. The message routes to
                  this broker and lands as a lead, unlike a bare mailto link. */}
              {msgSubmitted ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-700 mb-1.5" />
                  <p className="text-body-sm font-semibold text-green-900">Message sent.</p>
                  <p className="text-caption text-green-800">
                    {selected.name.split(' ')[0]} will follow up shortly — usually the same day.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {!showMessageForm ? (
                    <button
                      type="button"
                      onClick={() => setShowMessageForm(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-caption font-semibold text-primary hover:bg-gold-light transition-colors"
                    >
                      Message {selected.name.split(' ')[0]} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <form onSubmit={handleBrokerMessage} className="space-y-2.5 rounded-lg border border-border bg-background-cream/40 p-3">
                      <Honeypot />
                      <p className="text-caption text-foreground-muted">
                        Send {selected.name.split(' ')[0]} a note — the reply comes straight to your inbox.
                      </p>
                      <input
                        type="text" required value={msgName} onChange={(e) => setMsgName(e.target.value)}
                        placeholder="Your name"
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-caption text-primary focus:outline-none focus:border-gold"
                      />
                      <input
                        type="email" required value={msgEmail} onChange={(e) => setMsgEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-caption text-primary focus:outline-none focus:border-gold"
                      />
                      <textarea
                        rows={3} value={msgBody} onChange={(e) => setMsgBody(e.target.value)}
                        placeholder={`What can ${selected.name.split(' ')[0]} help with? (property, timeline, question)`}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-caption text-primary focus:outline-none focus:border-gold"
                      />
                      {msgError && <p className="text-caption text-red-500">{msgError}</p>}
                      <button
                        type="submit" disabled={msgSubmitting}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-caption font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                      >
                        {msgSubmitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</> : <>Send message <Send className="h-3.5 w-3.5" /></>}
                      </button>
                    </form>
                  )}

                  {/* Direct lines — secondary */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {selected.phone && (
                      <a
                        href={`tel:${(selected.phone as string).replace(/\D/g, '')}`}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-caption font-semibold text-foreground-muted hover:border-gold hover:text-gold transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    )}
                    <a
                      href={`mailto:${selected.email}`}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-caption font-semibold text-foreground-muted hover:border-gold hover:text-gold transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
