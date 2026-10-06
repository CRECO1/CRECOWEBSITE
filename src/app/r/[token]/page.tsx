/**
 * Personalized owner property report — /r/<token>.
 *
 * A private page for one property owner: their parcels from the county
 * appraisal roll, how they compare with the county, one plain-English
 * takeaway, and a one-tap request for a free Broker Opinion of Value.
 * Data + rules: lib/owner-report.ts. Not indexed, not in the sitemap, and
 * tracked in GA with a generic page path so the token never leaves our own logs.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { BrokerAvatar } from '@/components/marketing/BrokerCard';
import { PRIMARY_BROKER, BRIAN_BLANCO } from '@/lib/broker';
import { getOwnerReport, displayEntity, reportInsight, usd, intl, type OwnerReport, type ReportProperty } from '@/lib/owner-report';
import { OwnerReportActions } from './OwnerReportActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your property report | CRECO',
  description: 'A private property report prepared by CRECO.',
  robots: { index: false, follow: false, nocache: true },
};

function Bold({ text }: { text: string }) {
  return <>{text.split('**').map((part, i) => (i % 2 ? <strong key={i} className="text-primary">{part}</strong> : part))}</>;
}

function Stat({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={big
      ? 'col-span-full rounded-xl bg-primary px-5 py-4 text-white'
      : 'rounded-xl border border-border bg-background-cream px-4 py-3'}>
      <div className={`text-caption font-bold uppercase tracking-widest ${big ? 'text-gold-light' : 'text-foreground-muted'}`}>{label}</div>
      <div className={`font-heading font-bold tabular-nums lining-nums ${big ? 'text-[2rem] leading-tight' : 'text-[1.35rem]'}`}>{value}</div>
    </div>
  );
}

/** Where a value falls among the county's: the median sits at the midpoint. */
function PercentileBar({ pct, yours, median }: { pct: number; yours: string; median: string }) {
  const pos = Math.max(3, Math.min(97, pct));
  return (
    <div className="mt-8 mb-1">
      <div className="relative h-3 rounded-full bg-gradient-to-r from-[#efe9dc] to-[#e2d3ad]">
        <div className="absolute -top-1.5 -bottom-1.5 left-1/2 w-0.5 bg-foreground-muted/60" aria-hidden />
        <div className="absolute -top-7 -translate-x-1/2 whitespace-nowrap text-caption font-bold text-primary" style={{ left: `${pos}%` }}>Yours: {yours}</div>
        <div className="absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-gold bg-primary" style={{ left: `${pos}%` }} aria-hidden />
      </div>
      <div className="mt-2 flex justify-between text-caption text-foreground-muted">
        <span>Lower</span><span>County median {median}</span><span>Higher</span>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="ml-2 inline-block rounded-full bg-gold-light px-2.5 py-0.5 align-middle text-caption font-bold text-[#5c4a1f]">{children}</span>;
}

function SingleRecord({ p }: { p: ReportProperty }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat big label="County appraised value" value={usd(p.appraised)} />
        <Stat label="Land" value={usd(p.land)} />
        <Stat label="Improvements" value={usd(p.improvements)} />
        <Stat label="Land area" value={`${p.acres.toFixed(2)} ac`} />
        <Stat label="Building" value={p.building_sf ? `${intl(p.building_sf)} SF` : '—'} />
      </div>
      <p className="mt-4 text-body-sm text-foreground-muted">
        <a href={p.cad_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-dark underline-offset-2 hover:underline">View the county record ↗</a>
        <span className="mx-2">·</span>Parcel {p.parcel}
      </p>
    </>
  );
}

function PortfolioRecord({ r }: { r: OwnerReport }) {
  const total = r.properties.reduce((s, p) => s + p.appraised, 0);
  const sf = r.properties.reduce((s, p) => s + p.building_sf, 0);
  const acres = r.properties.reduce((s, p) => s + p.acres, 0);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat big label="Combined appraised value" value={usd(total)} />
        <Stat label="Properties" value={String(r.properties.length)} />
        <Stat label="Buildings" value={`${intl(sf)} SF`} />
        <Stat label="Land" value={`${acres.toFixed(2)} ac`} />
      </div>
      <table className="mt-5 w-full border-collapse text-body-sm">
        <thead>
          <tr className="border-b-2 border-border text-left text-caption uppercase tracking-widest text-foreground-muted">
            <th className="py-2 pr-2 font-bold">Property</th>
            <th className="py-2 px-2 text-right font-bold">Appraised</th>
            <th className="hidden py-2 px-2 text-right font-bold sm:table-cell">Building</th>
            <th className="hidden py-2 pl-2 text-right font-bold sm:table-cell">Acres</th>
          </tr>
        </thead>
        <tbody>
          {r.properties.map(p => (
            <tr key={p.parcel} className="border-b border-border">
              <td className="py-2.5 pr-2"><a href={p.cad_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-dark hover:underline">{p.address}</a></td>
              <td className="py-2.5 px-2 text-right tabular-nums">{usd(p.appraised)}</td>
              <td className="hidden py-2.5 px-2 text-right tabular-nums sm:table-cell">{p.building_sf ? `${intl(p.building_sf)} SF` : '—'}</td>
              <td className="hidden py-2.5 pl-2 text-right tabular-nums sm:table-cell">{p.acres.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function WhereYouStand({ r }: { r: OwnerReport }) {
  const b = r.benchmark;
  const one = r.properties.length === 1;
  const p = r.properties[0];
  return (
    <section className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-card sm:p-7">
      <h2 className="font-heading text-heading font-bold text-primary lining-nums">Where you stand</h2>
      <p className="mt-1 text-body-sm text-foreground-muted">
        Compared with {intl(b.n_psf)} improved commercial properties across {b.county} County (same {b.roll_year} roll)
      </p>
      {one ? (
        <>
          {p.psf != null && p.psf_pct != null && (
            <div className="mt-6">
              <h3 className="font-heading text-[1.05rem] font-bold text-primary">
                Appraised value per building SF: {usd(p.psf)}/SF<Pill>Higher than {p.psf_pct}%</Pill>
              </h3>
              <PercentileBar pct={p.psf_pct} yours={`${usd(p.psf)}/SF`} median={`${usd(b.med_psf)}/SF`} />
            </div>
          )}
          {p.land_per_acre != null && p.land_per_acre_pct != null && (
            <div className="mt-8">
              <h3 className="font-heading text-[1.05rem] font-bold text-primary">
                Land value per acre: {usd(p.land_per_acre)}<Pill>Higher than {p.land_per_acre_pct}%</Pill>
              </h3>
              <PercentileBar pct={p.land_per_acre_pct} yours={`$${intl(p.land_per_acre / 1000)}K/ac`} median={`$${intl(b.med_lpa / 1000)}K/ac`} />
            </div>
          )}
        </>
      ) : (
        <>
          <table className="mt-5 w-full border-collapse text-body-sm">
            <thead>
              <tr className="border-b-2 border-border text-left text-caption uppercase tracking-widest text-foreground-muted">
                <th className="py-2 pr-2 font-bold">Property</th>
                <th className="py-2 px-2 text-right font-bold">$/SF</th>
                <th className="py-2 px-2 text-right font-bold">vs. county</th>
                <th className="hidden py-2 pl-2 text-right font-bold sm:table-cell">Land share</th>
              </tr>
            </thead>
            <tbody>
              {r.properties.map(x => (
                <tr key={x.parcel} className="border-b border-border">
                  <td className="py-2.5 pr-2">{x.address}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{x.psf != null ? usd(x.psf) : '—'}</td>
                  <td className="py-2.5 px-2 text-right">{x.psf_pct != null ? <span className="inline-block rounded-full bg-gold-light px-2.5 py-0.5 text-caption font-bold text-[#5c4a1f]">Higher than {x.psf_pct}%</span> : '—'}</td>
                  <td className="hidden py-2.5 pl-2 text-right tabular-nums sm:table-cell">{x.land_share != null ? `${x.land_share}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-body-sm text-foreground-muted">
            County median: {usd(b.med_psf)}/SF · middle half {usd(b.p25_psf)}–{usd(b.p75_psf)}/SF
          </p>
        </>
      )}
      <div className="mt-6 rounded-r-xl border-l-4 border-gold bg-[#fffaf0] px-4 py-3.5 text-body text-foreground">
        <strong className="text-primary">What stands out: </strong><Bold text={reportInsight(r)} />
      </div>
    </section>
  );
}

export default async function OwnerReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await getOwnerReport(token);
  if (!r || !r.properties?.length) notFound();

  const entity = displayEntity(r.owner_entity);
  const one = r.properties.length === 1;
  const preparedFor = r.contact_name ? `${r.contact_name} · ${entity}` : entity;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background-cream pt-20 pb-12">
        <section className="bg-primary py-10 text-white sm:py-12">
          <Container size="md">
            <p className="mb-3 text-caption font-bold uppercase tracking-[0.18em] text-gold">Prepared for {preparedFor}</p>
            <h1 className="font-heading text-[clamp(1.75rem,5vw,2.5rem)] font-bold leading-tight lining-nums">
              Your {r.county} County {one ? 'property' : 'portfolio'}, by the numbers.
            </h1>
            <p className="mt-3 max-w-2xl text-body text-white/75">
              A private snapshot of {one ? r.properties[0].address : `your ${r.properties.length} properties`} from {r.county} County&rsquo;s {r.roll_year} appraisal roll — and what it means if you&rsquo;re thinking about leasing, selling, or simply holding.
            </p>
          </Container>
        </section>

        <Container size="md">
          <section className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-card sm:p-7">
            <h2 className="font-heading text-heading font-bold text-primary lining-nums">{one ? `${r.properties[0].address}, ${r.county} County, TX` : 'Your properties'}</h2>
            <p className="mb-5 mt-1 text-body-sm text-foreground-muted">{r.county} County Appraisal District · {r.roll_year} appraisal roll</p>
            {one ? <SingleRecord p={r.properties[0]} /> : <PortfolioRecord r={r} />}
          </section>

          <WhereYouStand r={r} />

          <section className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-card sm:p-7">
            <OwnerReportActions token={r.token} one={one} alreadyRequested={!!r.bov_requested_at} />
            <div className="mt-6 flex flex-wrap gap-6 border-t border-border pt-5">
              {[PRIMARY_BROKER, BRIAN_BLANCO].map(b => (
                <div key={b.name} className="flex items-center gap-3">
                  <BrokerAvatar broker={b} size={48} />
                  <div className="leading-tight">
                    <div className="font-semibold text-primary">{b.name}</div>
                    <div className="text-body-sm text-foreground-muted">{b.title}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-body-sm text-foreground-muted">
              Rather talk? Call or text <a href={PRIMARY_BROKER.phone_href} className="font-bold text-gold-dark">{PRIMARY_BROKER.phone_display}</a>.
            </p>
          </section>

          <p className="mt-6 text-caption leading-relaxed text-foreground-muted">
            Source: {r.county} County Appraisal District, {r.roll_year} appraisal roll (public record). Appraised values are set for property-tax purposes and may differ from market value. This page was prepared for {entity} and is not listed publicly.
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
