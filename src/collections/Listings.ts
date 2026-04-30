import type { CollectionConfig } from 'payload';

export const Listings: CollectionConfig = {
  slug: 'listings',
  admin: {
    useAsTitle: 'title',
    group: 'Real Estate',
    defaultColumns: ['title', 'status', 'property_type', 'transaction_type', 'city', 'sqft', 'updatedAt'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug', type: 'text', required: true, unique: true,
      admin: { description: 'URL-friendly identifier, e.g. 1222-chulie-dr' },
    },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Pending', value: 'pending' },
        { label: 'Leased', value: 'leased' },
        { label: 'Sold', value: 'sold' },
        { label: 'Off Market', value: 'off-market' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'property_type', type: 'select', required: true, defaultValue: 'office',
          options: [
            { label: 'Office', value: 'office' },
            { label: 'Warehouse / Industrial', value: 'warehouse' },
            { label: 'Flex', value: 'flex' },
            { label: 'Retail', value: 'retail' },
            { label: 'Land', value: 'land' },
            { label: 'Multifamily', value: 'multifamily' },
            { label: 'Mixed-Use', value: 'mixed-use' },
            { label: 'Industrial', value: 'industrial' },
          ],
        },
        {
          name: 'transaction_type', type: 'select', required: true, defaultValue: 'lease',
          options: [
            { label: 'Lease', value: 'lease' },
            { label: 'Sale', value: 'sale' },
            { label: 'Lease or Sale', value: 'both' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'address', type: 'text', required: true },
        { name: 'city', type: 'text', required: true, defaultValue: 'San Antonio' },
        { name: 'state', type: 'text', required: true, defaultValue: 'TX' },
        { name: 'zip', type: 'text', required: true },
      ],
    },
    {
      name: 'submarket', type: 'select',
      options: [
        { label: 'Northwest', value: 'Northwest' },
        { label: 'North Central', value: 'North Central' },
        { label: 'Northeast', value: 'Northeast' },
        { label: 'Downtown / Central', value: 'Downtown' },
        { label: 'South Side', value: 'South Side' },
        { label: 'Far West / 1604', value: 'Far West' },
        { label: 'East Side', value: 'East Side' },
        { label: 'West Side', value: 'West Side' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'sale_price', type: 'number',
          admin: { description: 'Sale price in USD', condition: (data) => data.transaction_type !== 'lease' },
        },
        {
          name: 'lease_rate', type: 'number',
          admin: { description: 'Lease rate in $/SF/yr', condition: (data) => data.transaction_type !== 'sale' },
        },
        {
          name: 'lease_rate_basis', type: 'select',
          options: [
            { label: 'NNN (Triple Net)', value: 'NNN' },
            { label: 'Modified Gross', value: 'Modified Gross' },
            { label: 'Full Service', value: 'Full Service' },
            { label: 'Industrial Gross', value: 'Industrial Gross' },
          ],
          admin: { condition: (data) => data.transaction_type !== 'sale' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'sqft', type: 'number', admin: { description: 'Total building SF' } },
        { name: 'available_sqft', type: 'number', admin: { description: 'Available SF (if divisible)' } },
        { name: 'lot_size', type: 'number', admin: { description: 'Lot size in acres' } },
        { name: 'zoning', type: 'text', admin: { description: 'e.g. I-1, C-2, MXD' } },
        { name: 'year_built', type: 'number' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'clear_height', type: 'number', admin: { description: 'Clear height in feet' } },
        { name: 'dock_doors', type: 'number' },
        { name: 'grade_doors', type: 'number' },
      ],
    },
    {
      name: 'headline', type: 'text',
      admin: { description: 'Short marketing one-liner shown on cards' },
    },
    { name: 'description', type: 'richText' },
    {
      name: 'features', type: 'array',
      fields: [{ name: 'feature', type: 'text' }],
      admin: { description: 'Highlights — dock doors, clear height, parking, etc.' },
    },
    {
      name: 'images', type: 'array',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    { name: 'brochure_url', type: 'text', admin: { description: 'Marketing brochure (PDF) URL' } },
    { name: 'virtual_tour_url', type: 'text' },
    { name: 'agent', type: 'relationship', relationTo: 'agents' },
    { name: 'listing_date', type: 'date' },
    {
      name: 'closed_date', type: 'date',
      admin: { condition: (data) => ['sold', 'leased'].includes(data.status) },
    },
  ],
};
