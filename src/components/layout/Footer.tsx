'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { supabase } from '@/lib/supabase';

const footerLinks = {
  properties: [
    { href: '/listings?type=office', label: 'Office Space' },
    { href: '/listings?type=warehouse', label: 'Warehouse / Industrial' },
    { href: '/listings?type=flex', label: 'Flex Space' },
    { href: '/listings?type=retail', label: 'Retail Space' },
    { href: '/listings?type=land', label: 'Land' },
  ],
  services: [
    { href: '/services/tenant-representation', label: 'Tenant Representation' },
    { href: '/services/investment-advisory', label: 'Investment Advisory' },
    { href: '/services/leasing-sales', label: 'Leasing & Sales' },
    { href: '/services/property-management', label: 'Property Management' },
    { href: '/services/development', label: 'Property Development' },
  ],
};

const DEFAULTS = {
  phone: '(210) 817-3443',
  email: 'info@crecotx.com',
  address: 'San Antonio, TX',
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

  const telHref = `tel:+1${contact.phone.replace(/\D/g, '')}`;
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
                  <a href={telHref}
                    className="flex items-start gap-3 text-body-sm text-white/60 transition-colors hover:text-gold">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    {contact.phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${contact.email}`}
                    className="flex items-start gap-3 text-body-sm text-white/60 transition-colors hover:text-gold">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    {contact.email}
                  </a>
                </li>
                <li>
                  <div className="flex items-start gap-3 text-body-sm text-white/60">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <span>
                      {addressLines.map((line, i) => (
                        <span key={i}>{line}{i < addressLines.length - 1 && <br />}</span>
                      ))}
                    </span>
                  </div>
                </li>
              </ul>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/tenant-needs"
                  className="inline-flex items-center gap-2 rounded-lg border border-gold/50 px-5 py-2.5 text-body-sm font-semibold text-gold transition-all hover:bg-gold hover:text-primary">
                  Submit Tenant Needs
                </Link>
                <Link href="/contact#schedule"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-body-sm font-semibold text-white/70 transition-all hover:border-white/40 hover:text-white">
                  Schedule a Consultation
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Sister Site */}
      <div className="border-t border-white/10 py-5 bg-primary/80">
        <Container>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
            <span className="text-caption text-white/40">Looking for residential?</span>
            <a
              href="https://www.fairoaksrealtygroup.com"
              target="_blank" rel="noopener noreferrer"
              className="text-caption font-semibold text-gold transition-colors hover:text-gold-light">
              Visit our sister company, Fair Oaks Realty Group →
            </a>
          </div>
        </Container>
      </div>

      {/* Disclosure Notices */}
      <div className="border-t border-white/10 py-5 bg-primary/80">
        <Container>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="text-caption font-semibold uppercase tracking-widest text-white/40">Disclosure Notices:</span>
            <a
              href="https://www.dropbox.com/scl/fi/f2mtiupgx22xhzx81vnwn/IABSCRECOTX.pdf?rlkey=7fs8jtl92j3pq97he11blehwm&e=1&dl=0"
              target="_blank" rel="noopener noreferrer"
              className="text-caption text-gold/70 transition-colors hover:text-gold">
              TREC Information About Brokerage Services
            </a>
            <a
              href="https://www.trec.texas.gov/sites/default/files/pdf-forms/CN%201-4_1.pdf"
              target="_blank" rel="noopener noreferrer"
              className="text-caption text-gold/70 transition-colors hover:text-gold">
              Consumer Protection Notice
            </a>
            <Link href="/privacy"
              className="text-caption text-gold/70 transition-colors hover:text-gold">
              Privacy Policy
            </Link>
          </div>
        </Container>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-6">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-caption text-white/40">
              © {currentYear} CRECO – Commercial Real Estate Company. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link href="/terms" className="text-caption text-white/40 transition-colors hover:text-white/70">
                Terms of Service
              </Link>
              <span className="text-caption text-white/40">Licensed Texas Real Estate Brokerage</span>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
