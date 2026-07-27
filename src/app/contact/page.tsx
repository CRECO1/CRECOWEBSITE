'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, CheckCircle, Calendar } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { getRecaptchaToken } from '@/components/forms/Recaptcha';
import { Honeypot } from '@/components/forms/Honeypot';
import { googleMapsUrl } from '@/lib/utils';
import { PhoneCallText } from '@/components/marketing/PhoneCallText';

const CONTACT_REASONS = [
  'Looking for space to lease or buy',
  'List My Property (sell or lease)',
  'Property Management',
  'Investment Advisory',
  'Property Development',
  'Schedule a Tour',
  'General Question',
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const recaptchaToken = await getRecaptchaToken('submit_contact');
    const reason = String(data.get('reason') ?? '');
    const { trackEvent, readUtmsFromCookie } = await import('@/lib/analytics');
    const attribution = readUtmsFromCookie();
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.get('name'),
        company: data.get('company'),
        email: data.get('email'),
        phone: data.get('phone'),
        message: `Reason: ${reason}\n\n${data.get('message')}`,
        source: 'contact',
        recaptchaToken,
        website: data.get('website'),  // honeypot field
        ...attribution,
      }),
    }).catch(() => {});
    trackEvent('contact_form_submitted', {
      reason,
      attribution_source: attribution.utm_source ?? 'direct',
    });
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <div className="bg-primary py-14 text-white">
          <Container>
            <p className="overline mb-2 text-gold">We&apos;re Here to Help</p>
            <h1 className="font-heading text-display-sm font-bold">Contact CRECO</h1>
            <p className="mt-2 text-body text-white/60 max-w-lg">
              Whether you&apos;re looking for space, considering a sale, or evaluating an investment — we&apos;d love to hear from you.
            </p>
          </Container>
        </div>

        {/* Main Content */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">

              {/* Info Column */}
              <div className="space-y-8">
                <div>
                  <h2 className="mb-6 font-heading text-heading-xl font-bold text-primary gold-line pb-3">
                    Get in Touch
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20">
                      <Phone className="h-5 w-5 text-gold-dark" />
                    </div>
                    <div>
                      {/* Label reads "Phone / Text" because the number
                          works for both. PhoneCallText renders the
                          real tel: + sms: links below so tapping either
                          option actually does what the label promises.
                          surface="contact_page" attributes the GA
                          events distinctly from Header / Footer etc. */}
                      <p className="font-semibold text-primary">Phone &middot; Text</p>
                      <PhoneCallText
                        variant="inline"
                        tone="light"
                        surface="contact_page"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20">
                      <Mail className="h-5 w-5 text-gold-dark" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary">Email</p>
                      <a href="mailto:info@crecotx.com" className="text-body-sm text-foreground-muted hover:text-gold transition-colors">
                        info@crecotx.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20">
                      <MapPin className="h-5 w-5 text-gold-dark" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary">Office</p>
                      <a
                        href={googleMapsUrl('8000 Fair Oaks Pkwy Suite 102, Fair Oaks Ranch, TX 78015')}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open CRECO office in Google Maps"
                        className="text-body-sm text-foreground-muted hover:text-gold transition-colors block"
                      >
                        8000 Fair Oaks Pkwy, Suite 102<br />
                        Fair Oaks Ranch, TX 78015
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20">
                      <Clock className="h-5 w-5 text-gold-dark" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary">Hours</p>
                      <p className="text-body-sm text-foreground-muted">
                        Mon–Fri: 9am – 6pm<br />
                        Sat & Sun: By Appointment
                      </p>
                    </div>
                  </div>
                </div>

                {/* Schedule CTA — split "Call to Schedule" into Call
                    + Text pair since the site number takes both. Copy
                    updated to say "call or text" so the offering is
                    unambiguous. */}
                <div id="schedule" className="rounded-xl bg-gold p-6">
                  <Calendar className="mb-3 h-6 w-6 text-primary/70" />
                  <h3 className="mb-2 font-heading text-heading-sm font-bold text-primary">Schedule a Consultation</h3>
                  <p className="mb-4 text-body-sm text-primary/70">
                    Prefer to pick a time? Use the form to request your preferred date and time, or call or text us directly.
                  </p>
                  <PhoneCallText variant="stacked" surface="contact_page_schedule" />
                </div>
              </div>

              {/* Form */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl bg-white p-8 shadow-card lg:p-10">
                  {submitted ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
                        <CheckCircle className="h-8 w-8 text-gold-dark" />
                      </div>
                      <h2 className="mb-2 font-heading text-heading-xl font-bold text-primary">Message Sent</h2>
                      <p className="text-body text-foreground-muted max-w-md mx-auto">
                        Thank you for reaching out. A CRECO broker will contact you within one business day.
                      </p>
                    </div>
                  ) : (
                    <>
                      <h2 className="mb-6 font-heading text-heading-xl font-bold text-primary">Send Us a Message</h2>
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <Honeypot />
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <div>
                            <label className="label-readable">Full Name *</label>
                            <input name="name" required placeholder="Jane Smith" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                          </div>
                          <div>
                            <label className="label-readable">Company</label>
                            <input name="company" placeholder="Acme Logistics LLC" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <div>
                            <label className="label-readable">Email *</label>
                            <input name="email" type="email" required placeholder="you@company.com" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                          </div>
                          <div>
                            <label className="label-readable">Phone *</label>
                            <input name="phone" type="tel" required placeholder="(210) 555-0000" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                          </div>
                        </div>
                        <div>
                          <label className="label-readable">How can we help?</label>
                          <select name="reason" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold">
                            <option value="">Select a reason…</option>
                            {CONTACT_REASONS.map(r => <option key={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label-readable">Message</label>
                          <textarea name="message" rows={5} placeholder="Tell us more about what you're looking for…" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold resize-none" />
                        </div>
                        <p className="text-caption text-foreground-muted">
                          By submitting, you agree to be contacted by CRECO regarding your inquiry.
                        </p>
                        <Button type="submit" size="lg" fullWidth loading={loading}>
                          Send Message
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
