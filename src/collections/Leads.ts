import type { CollectionConfig } from 'payload';

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    group: 'Administration',
    defaultColumns: ['name', 'company', 'email', 'source', 'status', 'createdAt'],
    hideAPIURL: true,
  },
  access: {
    create: () => true,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'company', type: 'text' },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'message', type: 'textarea' },
    {
      name: 'source', type: 'select', defaultValue: 'contact',
      options: [
        { label: 'Contact Form', value: 'contact' },
        { label: 'Tenant Needs Form', value: 'tenant-needs' },
        { label: 'Listing Inquiry', value: 'listing' },
        { label: 'Owner Inquiry (Sell/Lease)', value: 'owner-inquiry' },
        { label: 'Schedule Call', value: 'schedule' },
      ],
    },
    {
      name: 'status', type: 'select', defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Tour Scheduled', value: 'tour-scheduled' },
        { label: 'LOI Sent', value: 'loi-sent' },
        { label: 'Closed', value: 'closed' },
        { label: 'Lost', value: 'lost' },
      ],
    },
    {
      name: 'property_interest', type: 'text',
      admin: { description: 'Which property or area they inquired about' },
    },
    {
      name: 'intake_data', type: 'json',
      admin: { description: 'Tenant Needs intake answers (if from tenant-needs form)' },
    },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal notes' } },
    { name: 'assigned_agent', type: 'relationship', relationTo: 'agents' },
  ],
};
