'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

const navLinks = [
  { href: '/listings', label: 'Properties' },
  { href: '/services', label: 'Services' },
  { href: '/owner-services', label: 'Owner Services' },
  { href: '/property-valuation', label: 'Free Valuation' },
  { href: '/insights', label: 'Insights' },
  { href: '/about', label: 'About' },
  { href: '/get-started', label: 'Get Started', isHighlight: true },
];

interface HeaderProps {
  variant?: 'default' | 'minimal' | 'transparent';
  phone?: string;
}

export function Header({ variant = 'default', phone = '(210) 817-3443' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isTransparent = variant === 'transparent' && !isScrolled;
  const textShadowStyle = isTransparent ? { textShadow: '0 2px 4px rgba(0,0,0,0.5)' } : {};

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
        isTransparent
          ? 'bg-gradient-to-b from-black/40 to-transparent'
          : 'bg-white shadow-sm',
        variant === 'minimal' && 'bg-white shadow-sm'
      )}
    >
      <Container>
        <nav className="flex h-20 items-center justify-between">
          {/* Logo — different file per header variant so the colors read
              against the background (transparent black BG over dark hero,
              transparent white BG on solid white headers). No more pill. */}
          <Link href="/" className="flex items-center" aria-label="CRECO – Commercial Real Estate Company home">
            <Image
              src={isTransparent ? '/images/creco-logo-dark.png' : '/images/creco-logo-light.png'}
              alt="CRECO – Texas Commercial Real Estate Company"
              width={240}
              height={64}
              className="h-14 w-auto object-contain transition-opacity"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          {/* Desktop nav. Bumped the breakpoint from lg (1024px) to xl
              (1280px) — at 7 items + the highlight CTA + phone + Schedule
              button + logo on the same row, lg was too tight and labels
              like "Free Valuation" and "Owner Services" wrapped to two
              lines. Below xl we surface the hamburger instead.
              whitespace-nowrap on every link is a belt-and-suspenders
              guarantee against text wrapping even at the narrowest xl
              widths. */}
          {variant !== 'minimal' && (
            <div className="hidden items-center gap-5 xl:flex">
              {navLinks.map((link) => (
                'isHighlight' in link && link.isHighlight ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-full text-body-sm font-semibold transition-all whitespace-nowrap',
                      isTransparent
                        ? 'bg-gold text-primary hover:bg-gold-light'
                        : 'bg-gold/10 text-gold-dark hover:bg-gold hover:text-primary',
                      pathname === link.href && 'bg-gold text-primary'
                    )}
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    {link.label}
                  </Link>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'relative text-body-sm font-medium transition-colors whitespace-nowrap',
                      isTransparent
                        ? 'text-white hover:text-gold-light'
                        : 'text-primary hover:text-gold',
                      pathname === link.href && 'text-gold'
                    )}
                    style={textShadowStyle}
                  >
                    {link.label}
                    {pathname === link.href && (
                      <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-gold" />
                    )}
                  </Link>
                )
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {/* Phone — single-line display "(210) 817-3443" with the icon
                inline. The old stacked two-line layout looked cluttered next
                to Get Started; flattening reads cleaner and matches the rest
                of the header's horizontal rhythm. whitespace-nowrap keeps the
                number from wrapping at narrow desktop widths. */}
            <a
              href={`tel:+1${phone.replace(/\D/g, '')}`}
              className={cn(
                'hidden sm:inline-flex items-center gap-2 font-semibold transition-colors whitespace-nowrap',
                isTransparent ? 'text-white' : 'text-primary',
                'hover:text-gold'
              )}
              style={textShadowStyle}
              aria-label={`Call CRECO at ${phone}`}
            >
              <Phone className="h-4 w-4 shrink-0" />
              <span className="text-body-sm">{phone}</span>
            </a>

            {/* "Get Started" already sits in the nav links above (isHighlight=true),
                so we don't repeat it here. The Schedule button used to live in this
                slot but was removed per request — Get Started covers the same intent. */}

            {variant !== 'minimal' && (
              <button
                className={cn(
                  'ml-2 p-2 xl:hidden',
                  isTransparent ? 'text-white' : 'text-primary'
                )}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
        </nav>
      </Container>

      {/* Mobile Menu */}
      {isMenuOpen && variant !== 'minimal' && (
        <div className="fixed inset-0 top-20 z-40 bg-white xl:hidden">
          <Container>
            <nav className="flex flex-col py-8">
              {navLinks.filter(link => !('isHighlight' in link && link.isHighlight)).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'border-b border-border py-4 text-heading font-medium text-primary transition-colors',
                    'hover:text-gold',
                    pathname === link.href && 'text-gold'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {/* Team link now anchors directly into /about#team — the
                  team grid was folded into the About page, so a dedicated
                  /team route would just redirect anyway. Skips the
                  redirect hop on mobile. */}
              <Link
                href="/about#team"
                onClick={() => setIsMenuOpen(false)}
                className="border-b border-border py-4 text-heading font-medium text-primary transition-colors hover:text-gold"
              >
                Team
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="border-b border-border py-4 text-heading font-medium text-primary transition-colors hover:text-gold"
              >
                Contact
              </Link>

              {/* Action button stack — extra top margin clears the link
                  stack visually, space-y-3 keeps the three buttons reading
                  as a single group rather than three drifting CTAs. */}
              <div className="mt-10 space-y-3">
                <Button
                  size="lg"
                  fullWidth
                  className="bg-gold hover:bg-gold-dark text-primary font-semibold"
                  asChild
                >
                  <Link href="/get-started" onClick={() => setIsMenuOpen(false)}>
                    <Building2 className="mr-2 h-5 w-5" />
                    Get Started
                  </Link>
                </Button>
                <Button variant="primary" size="lg" fullWidth asChild>
                  <a href={`tel:${phone.replace(/\D/g, '')}`}>
                    <Phone className="mr-2 h-5 w-5" />
                    Call Now: {phone}
                  </a>
                </Button>
              </div>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
