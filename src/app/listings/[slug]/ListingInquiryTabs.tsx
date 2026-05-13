'use client';

/**
 * Wrapper for the listing-detail sidebar that lets visitors toggle between
 * "Schedule a tour" (date+time picker, sends a calendar invite) and "Send a
 * message" (the existing free-text inquiry form).
 *
 * Tour is the primary action — it converts better than free-text on intent —
 * so it's the default tab. The Message tab remains for prospects who'd rather
 * just ask a question first.
 */

import { useState } from 'react';
import { CalendarClock, MessageSquare } from 'lucide-react';
import { ListingContactForm } from './ListingContactForm';
import { TourSchedulerForm } from '@/components/forms/TourSchedulerForm';

export function ListingInquiryTabs({
  listingTitle,
  listingSlug,
  listingAddress,
}: {
  listingTitle: string;
  listingSlug: string;
  listingAddress: string;
}) {
  const [tab, setTab] = useState<'tour' | 'message'>('tour');

  return (
    <>
      <div className="mb-5 inline-flex w-full rounded-lg border border-border bg-background-cream/40 p-1">
        <button
          type="button"
          onClick={() => setTab('tour')}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-body-sm font-semibold transition-colors ${
            tab === 'tour' ? 'bg-primary text-white shadow-sm' : 'text-foreground-muted hover:text-primary'
          }`}
          aria-pressed={tab === 'tour'}
        >
          <CalendarClock className="h-4 w-4" />
          Schedule tour
        </button>
        <button
          type="button"
          onClick={() => setTab('message')}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-body-sm font-semibold transition-colors ${
            tab === 'message' ? 'bg-primary text-white shadow-sm' : 'text-foreground-muted hover:text-primary'
          }`}
          aria-pressed={tab === 'message'}
        >
          <MessageSquare className="h-4 w-4" />
          Send a message
        </button>
      </div>

      {tab === 'tour' ? (
        <>
          <h3 className="mb-2 font-heading text-heading-sm font-semibold text-primary">
            Schedule a tour
          </h3>
          <p className="mb-5 text-body-sm text-foreground-muted">
            Pick a date and time. A CRECO broker will confirm within an hour during business hours.
          </p>
          <TourSchedulerForm
            listingSlug={listingSlug}
            listingTitle={listingTitle}
            listingAddress={listingAddress}
          />
        </>
      ) : (
        <>
          <h3 className="mb-2 font-heading text-heading-sm font-semibold text-primary">
            Interested in this property?
          </h3>
          <p className="mb-5 text-body-sm text-foreground-muted">
            Ask a question, request additional financials, or get the brochure. A CRECO broker will respond within one business day.
          </p>
          <ListingContactForm listingTitle={listingTitle} />
        </>
      )}
    </>
  );
}
