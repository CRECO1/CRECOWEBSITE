'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { NewsletterSignup } from '@/components/forms/NewsletterSignup';
import { supabase } from '@/lib/supabase';
import { googleMapsUrl } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { PhoneCallText } from '@/components/marketing/PhoneCallText';

const footerLinks = {
  properties: [
    { href: '/listings?type=office', label: 'Office Space' },
    { href: '/listings?type=warehouse', label: 'Warehouse / Industrial' },
    { href: '/listings?type=flex', label: 'Flex Space' },
    { href: '/listings?type=retail', label: 'Retail Space' },
    { href: '/listings?type=land', label: 'Land' },
    { href: '/property-alerts', label: 'Property Alerts' },
    { href: '/compare', label: 'Compare Listings' },
  ],
  services: [
    { href: '/services/tenant-representation', label: 'Tenant Representation' },
    { href: '/services/investment-advisory', label: 'Investment Advisory' },
    { href: '/services/leasing-sales', label: 'Leasing & Sales' },
    { href: '/services/property-management', label: 'Property Management' },
    { href: '/services/development', label: 'Property Development' },
    { href: '/property-valuation', label: "What's My Property Worth?" },
    { href: '/guides', label: 'Free Guides & Market Reports' },
    { href: '/insights', label: 'Insights' },
    { href: '/careers', label: 'Careers' },
  ],
};

const DEFAULTS = {
  phone: '(210) 817-3443',
  email: 'info@crecotx.com',
  // Canonical CRECO office. Multi-line so Footer renders street + city/state on
  // separate lines via the addressLines split.
  address: '8000 Fair Oaks Pkwy, Suite 102\nFair Oaks Ranch, TX 78015',
};

export function Footer() {
  const [contact, setContact] = useState(DEFAULTS);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('phone, email, address')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) setContact({
          phone: data.phone ?? DEFAULTS.phone,
          email: data.email ?? DEFAULTS.email,
          address: data.address ?? DEFAULTS.address,
        });
      });
  }, []);

  const addressLines = contact.address.split('\n');

  return (
    <footer className="bg-primary text-white">
      <div className="py-16 md:py-20">
        <Container>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <Link href="/" className="inline-block mb-6" aria-label="CRECO home">
                <Image
                  src="/images/creco-logo.jpg"
                  alt="CRECO – Commercial Real Estate Company"
                  width={200}
                  height={60}
                  className="h-14 w-auto object-contain bg-white rounded-md p-1"
                />
              </Link>
              <p className="text-foreground-light text-body-sm leading-relaxed mb-6 max-w-xs">
                Where your real estate ventures find the support they deserve. San Antonio commercial real estate experts.
              </p>
              <div className="flex gap-4">
                <a href="https://facebook.com/crecotx" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-gold hover:text-gold">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="https://instagram.com/crecotx" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-gold hover:text-gold">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="https://www.linkedin.com/company/crecotx" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-gold hover:text-gold">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>

              {/* Newsletter signup — extra top margin so the social icons +
                  this block don't visually crash into each other in the brand
                  column. Heading uses the same uppercase-widest treatment as
                  the other column titles for consistent rhythm. */}
              <div className="mt-10">
                <h3 className="mb-3 text-body-sm font-semibold uppercase tracking-widest text-gold">CRECO Insights</h3>
                <NewsletterSignup />
              </div>
            </div>

            {/* Properties Links */}
            <div>
              <h3 className="mb-5 text-body-sm font-semibold uppercase tracking-widest text-gold">Properties</h3>
              <ul className="space-y-3">
                {footerLinks.properties.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-body-sm text-white/60 transition-colors hover:text-gold">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services Links */}
            <div>
              <h3 className="mb-5 text-body-sm font-semibold uppercase tracking-widest text-gold">Services</h3>
              <ul className="space-y-3">
                {footerLinks.services.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-body-sm text-white/60 transition-colors hover:text-gold">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="mb-5 text-body-sm font-semibold uppercase tracking-widest text-gold">Get in Touch</h3>
              <ul className="space-y-4">
                <li>
                  {/* Call + Text — visible SMS affordance next to the
                      number. Both actions fire distinct GA events with
                      surface='footer'. Previously tel: only. Phone icon
                      is inside PhoneCallText so we don't duplicate it
                      at the li level. */}
                  <PhoneCallText
                    variant="inline"
                    tone="dark"
                    surface="footer"
                  />
                </li>
                <li>
                  {/* mailto_click event — was the only major outbound
                      conversion not tracked yet (phone_click + form
                      submits already are). With this in place we can
                      now answer "what do visitors do after they read
                      the page?" with phone, email, or form-submit. */}
                  <a
                    href={`mailto:${contact.email}`}
                    onClick={() => trackEvent('mailto_click', { surface: 'footer' })}
                    className="flex items-start gap-3 text-body-sm text-white/60 transition-colors hover:text-gold"
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    {contact.email}
                  </a>
                </li>
                <li>
                  <a
                    href={googleMapsUrl(contact.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${contact.address} in Google Maps`}
                    className="flex items-start gap-3 text-body-sm text-white/60 transition-colors hover:text-gold"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <span>
                      {addressLines.map((line, i) => (
                        <span key={i}>{line}{i < addressLines.length - 1 && <br />}</span>
                      ))}
                    </span>
                  </a>
                </li>
              </ul>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/get-started"
                  className="inline-flex items-center gap-2 rounded-lg border border-gold/50 px-5 py-2.5 text-body-sm font-semibold text-gold transition-all hover:bg-gold hover:text-primary">
                  Get Started
                </Link>
                <a href="https://www.fairoaksrealtygroup.com/crm/commercial"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-body-sm font-semibold text-white/70 transition-all hover:border-white/40 hover:text-white">
                  Agent Login
                </a>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Markets band — now also carries the sister-site line at the bottom
          so the previously-separate band collapses into the same surface.
          One visual block instead of two stacked nearly-identical ones. */}
      <div className="border-t border-white/10 py-7 bg-primary/80">
        <Container>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <p className="text-caption uppercase tracking-widest text-gold text-center md:text-left">Texas Markets We Serve</p>
            <Link href="/markets" className="text-caption text-gold/80 hover:text-gold font-semibold">
              See all submarkets →
            </Link>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2">
            {[
              { href: '/fair-oaks-ranch-commercial-real-estate', label: 'Fair Oaks Ranch' },
              { href: '/boerne-commercial-real-estate', label: 'Boerne' },
              { href: '/submarkets', label: 'San Antonio' },
              { href: '/austin-commercial-real-estate', label: 'Austin' },
              { href: '/houston-commercial-real-estate', label: 'Houston' },
              { href: '/dallas-commercial-real-estate', label: 'Dallas–Fort Worth' },
              { href: '/markets/round-rock', label: 'Round Rock' },
              { href: '/markets/frisco', label: 'Frisco' },
              { href: '/markets/the-woodlands', label: 'The Woodlands' },
              { href: '/markets/stone-oak', label: 'Stone Oak' },
              { href: '/markets/new-braunfels', label: 'New Braunfels' },
              { href: '/8000-fair-oaks-pkwy', label: '8000 Fair Oaks Pkwy', highlight: true },
            ].map(m => (
              <Link
                key={m.href}
                href={m.href}
                className={`text-body-sm transition-colors ${
                  m.highlight ? 'text-gold font-semibold hover:text-gold-light' : 'text-white/60 hover:text-gold'
                }`}
              >
                {m.label}
              </Link>
            ))}
          </div>

          {/* Sister site — small inline note at the foot of the Markets band
              instead of its own full-width band. Less visual weight, stays
              discoverable. */}
          <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 text-center md:text-left">
            <span className="text-caption text-white/40">Looking for residential?</span>
            <a
              href="https://www.fairoaksrealtygroup.com"
              target="_blank" rel="noopener noreferrer"
              className="text-caption font-semibold text-gold/90 transition-colors hover:text-gold-light">
              Visit Fair Oaks Realty Group →
            </a>
          </div>
        </Container>
      </div>

      {/* Bottom bar — single combined strip carrying legal + disclosures +
          copyright. The previous design split these across three near-
          identical bands; this collapses them into one quieter footer
          strip with a clear two-column treatment on desktop. */}
      <div className="border-t border-white/10 py-5 bg-primary">
        <Container>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Copyright + license */}
            <p className="text-caption text-white/40 text-center md:text-left">
              © {currentYear} CRECO – Commercial Real Estate Company · Licensed Texas Real Estate Brokerage · TREC #9014367-BB
            </p>
            {/* Disclosure + policy links */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-1">
              <a
                href="https://www.dropbox.com/scl/fi/f2mtiupgx22xhzx81vnwn/IABSCRECOTX.pdf?rlkey=7fs8jtl92j3pq97he11blehwm&e=1&dl=0"
                target="_blank" rel="noopener noreferrer"
                className="text-caption text-white/50 transition-colors hover:text-gold"
              >
                Brokerage Services Notice
              </a>
              <a
                href="https://www.trec.texas.gov/sites/default/files/pdf-forms/CN%201-4_1.pdf"
                target="_blank" rel="noopener noreferrer"
                className="text-caption text-white/50 transition-colors hover:text-gold"
              >
                Consumer Protection
              </a>
              <Link href="/privacy" className="text-caption text-white/50 transition-colors hover:text-gold">
                Privacy
              </Link>
              <Link href="/terms" className="text-caption text-white/50 transition-colors hover:text-gold">
                Terms
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
