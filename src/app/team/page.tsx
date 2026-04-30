'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, Mail, Award, User, X } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { supabase } from '@/lib/supabase';

const DEMO_AGENTS = [
  {
    id: '1', name: 'Add your team in /admin', slug: 'placeholder', title: 'Principal Broker', email: 'info@crecotx.com', phone: '(210) 817-3443', image_url: null, license_number: 'TX-XXXXXXX', years_experience: 15, featured: true, order: 1,
    specialties: ['Office Leasing', 'Investment Sales', 'Tenant Representation'],
    bio: 'Replace this placeholder with your team. Add agents in the Payload admin panel at /admin → Agents.',
  },
];

type Agent = typeof DEMO_AGENTS[0];

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);

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

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">

        {/* Hero */}
        <div className="bg-primary py-16 text-white">
          <Container>
            <p className="overline mb-2 text-gold">Your Commercial Real Estate Partners</p>
            <h1 className="font-heading text-display-sm font-bold">Meet the CRECO Team</h1>
            <p className="mt-3 max-w-xl text-body text-white/60">
              Principal-level brokers who live and work in San Antonio — and who treat every assignment like our name is on the building.
            </p>
          </Container>
        </div>

        {/* Agent Grid */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelected(agent)}
                  className="card-luxury group p-6 text-center w-full text-left focus:outline-none focus:ring-2 focus:ring-gold rounded-2xl transition-all hover:-translate-y-1"
                >
                  <div className="mx-auto mb-5 h-28 w-28 rounded-full bg-background-warm overflow-hidden">
                    {agent.image_url ? (
                      <Image src={agent.image_url as string} alt={agent.name} width={112} height={112} className="object-cover w-full h-full" />
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
                      {(agent.specialties as string[]).slice(0, 3).map(s => (
                        <span key={s} className="rounded-full border border-border px-3 py-1 text-caption text-foreground-muted">
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
        </section>

        {/* Join CTA */}
        <section className="section-compact bg-background-cream">
          <Container>
            <div className="text-center max-w-xl mx-auto">
              <h2 className="font-heading text-display-sm font-bold text-primary mb-4">Join the CRECO Team</h2>
              <p className="text-body text-foreground-muted mb-8">
                We&apos;re always looking for experienced commercial brokers and analysts who share our commitment to client outcomes.
              </p>
              <Button size="lg" asChild>
                <Link href="/contact?subject=Joining the Team">Get in Touch</Link>
              </Button>
            </div>
          </Container>
        </section>
      </main>
      <Footer />

      {/* Bio Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-foreground-muted hover:text-primary shadow-sm transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative h-40 w-full bg-background-warm">
              {selected.image_url ? (
                <Image src={selected.image_url as string} alt={selected.name} fill className="object-cover object-top" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <User className="h-20 w-20 text-foreground-subtle" />
                </div>
              )}
            </div>

            <div className="p-6 overflow-y-auto">
              <p className="text-caption font-semibold uppercase tracking-widest text-gold mb-0.5">{selected.title}</p>
              <h2 className="font-heading text-heading-xl font-bold text-primary mb-2">{selected.name}</h2>

              {selected.years_experience && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Award className="h-3.5 w-3.5 text-gold" />
                  <span className="text-caption text-foreground-muted">{selected.years_experience}+ years of experience</span>
                </div>
              )}

              {selected.bio && (
                <p className="text-body-sm text-foreground-muted leading-relaxed mb-4">{selected.bio as string}</p>
              )}

              {selected.specialties && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {(selected.specialties as string[]).map(s => (
                    <span key={s} className="rounded-full bg-background-cream border border-border px-2.5 py-0.5 text-caption text-foreground-muted">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                {selected.phone && (
                  <a
                    href={`tel:${(selected.phone as string).replace(/\D/g, '')}`}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-caption font-semibold text-white hover:bg-primary/90 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" /> {selected.phone as string}
                  </a>
                )}
                <a
                  href={`mailto:${selected.email}`}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-caption font-semibold text-primary hover:border-gold hover:text-gold transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" /> Email {(selected.name as string).split(' ')[0]}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
