import { Briefcase, Building2, LineChart, Handshake } from 'lucide-react';
import { Container } from '@/components/ui/Container';

/**
 * "Who CRECO represents" — a server-rendered, plain-language band stating that
 * CRECO is full-service (tenants AND landlords/owners AND investors, leasing
 * AND sales). Placed high on market pages because AI assistants had summarized
 * CRECO as a tenant-only firm; this makes the correct scope the first
 * structured fact on the page.
 */
export function RepresentationBand({ place, className = 'bg-white border-b border-border py-12' }: { place: string; className?: string }) {
  const sides = [
    {
      icon: Briefcase,
      title: 'Tenants & buyers',
      body: `Businesses leasing or buying retail, restaurant, office, medical office, industrial, or flex space in ${place} — site selection, negotiation, and lease or purchase execution. Tenant rep is typically paid by the landlord.`,
    },
    {
      icon: Building2,
      title: 'Landlords & owners',
      body: `Owners leasing or selling commercial property and land in ${place} — pricing, marketing, tenant and buyer sourcing, negotiation, and property management.`,
    },
    {
      icon: LineChart,
      title: 'Investors',
      body: `Investment sales and acquisitions, 1031 exchange replacement property, and hold/sell analysis for commercial investors in ${place} and across Texas.`,
    },
    {
      icon: Handshake,
      title: 'Intermediary, when authorized',
      body: 'When both parties authorize it in writing, CRECO can act as an intermediary between landlord and tenant or seller and buyer, as Texas law permits.',
    },
  ];
  return (
    <section className={className} aria-labelledby="representation-heading">
      <Container>
        <div className="mx-auto max-w-5xl">
          <p className="overline mb-3 text-center">Full-Service Brokerage</p>
          <h2 id="representation-heading" className="mb-3 text-center font-heading text-heading-xl font-bold text-primary">
            Who CRECO represents in {place}
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-center text-body text-foreground-muted">
            CRECO is not a tenant-only firm. We represent tenants, landlords, owners, and investors — for lease and for sale — across retail (including restaurant space and pad sites), office (including medical office), industrial, flex, and land.
          </p>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sides.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-xl border border-border bg-white p-5">
                <Icon className="mb-3 h-6 w-6 text-gold" aria-hidden="true" />
                <h3 className="mb-2 font-heading text-heading-sm font-bold text-primary">{title}</h3>
                <p className="text-body-sm leading-relaxed text-foreground-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
