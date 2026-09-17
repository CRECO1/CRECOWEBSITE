import { BUSINESS } from '@/lib/schema';

export const CONTACT_FAQS = [
  {
    q: 'What is CRECO\'s phone number, email, and address?',
    a: `Phone ${BUSINESS.phoneDisplay} (call or text), email ${BUSINESS.email}. Office: ${BUSINESS.fullAddress} — in the 8000 Fair Oaks Plaza center on Fair Oaks Pkwy, in the San Antonio metro off I-10.`,
  },
  {
    q: 'What are CRECO\'s office hours?',
    a: `${BUSINESS.hours}. Tours and meetings outside those hours are available by appointment, and web inquiries are answered within one business day.`,
  },
  {
    q: 'Does it cost anything to talk to CRECO?',
    a: 'No. Consultations are free. For tenants and buyers, CRECO\'s fee is typically paid by the landlord or seller under market-standard commission agreements; owners receive a no-obligation broker opinion of value before signing anything.',
  },
];
