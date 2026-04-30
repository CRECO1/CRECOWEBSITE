'use client';

import { Button } from '@/components/ui/Button';

export function ListingContactForm({ listingTitle }: { listingTitle: string }) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.get('name'),
        company: data.get('company'),
        email: data.get('email'),
        phone: data.get('phone'),
        message: data.get('message') || `I'm interested in ${listingTitle}`,
        property_interest: listingTitle,
        source: 'listing',
      }),
    });
    form.reset();
    alert("Thank you! A CRECO broker will be in touch within one business day.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="name"
        required
        placeholder="Your Name"
        className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
      />
      <input
        name="company"
        placeholder="Company (optional)"
        className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Email Address"
        className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
      />
      <input
        name="phone"
        type="tel"
        placeholder="Phone (optional)"
        className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
      />
      <textarea
        name="message"
        rows={3}
        placeholder={`I'd like more info on ${listingTitle}`}
        className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold resize-none"
      />
      <Button type="submit" size="lg" fullWidth>
        Request Info
      </Button>
    </form>
  );
}
