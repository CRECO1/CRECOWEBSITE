import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle, Phone } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { SERVICES } from '../page';

interface Props { params: Promise<{ slug: string }> }

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = SERVICES.find(s => s.slug === slug);
  if (!service) notFound();

  const Icon = service.icon;

  return (
    <>
      <Header variant="minimal" />
      <main className="min-h-screen pt-20">
        {/* Back */}
        <div className="border-b border-border bg-background-cream py-4">
          <Container>
            <Link href="/services" className="inline-flex items-center gap-2 text-body-sm text-foreground-muted hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> All Services
            </Link>
          </Container>
        </div>

        {/* Hero */}
        <section className="bg-primary py-16 text-white">
          <Container>
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gold text-primary">
                <Icon className="h-7 w-7" />
              </div>
              <p className="overline mb-3 text-gold">CRECO Services</p>
              <h1 className="font-heading text-display font-bold">{service.title}</h1>
              <p className="mt-4 text-body-lg text-white/80">{service.description}</p>
            </div>
          </Container>
        </section>

        {/* Body */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="mb-6 font-heading text-heading-xl font-bold text-primary">What&apos;s Included</h2>
                <ul className="space-y-4">
                  {service.body.map(item => (
                    <li key={item} className="flex items-start gap-3 text-body text-foreground-muted">
                      <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <aside>
                <div className="sticky top-28 rounded-xl border border-border bg-background-cream p-6">
                  <h3 className="mb-2 font-heading text-heading-sm font-bold text-primary">Talk to a CRECO broker</h3>
                  <p className="mb-5 text-body-sm text-foreground-muted">
                    No-pressure consultation. We&apos;ll listen first and recommend an approach.
                  </p>
                  <Button size="md" fullWidth asChild>
                    <Link href="/contact">Schedule a Call <ArrowRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                  <a href="tel:+12108173443" className="mt-4 flex items-center justify-center gap-2 font-semibold text-primary hover:text-gold transition-colors">
                    <Phone className="h-4 w-4" /> (210) 817-3443
                  </a>
                </div>
              </aside>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

export function generateStaticParams() {
  return SERVICES.map(s => ({ slug: s.slug }));
}
