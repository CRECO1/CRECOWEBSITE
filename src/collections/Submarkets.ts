import type { CollectionConfig } from 'payload';

export const Submarkets: CollectionConfig = {
  slug: 'submarkets',
  admin: {
    useAsTitle: 'name',
    group: 'Real Estate',
    defaultColumns: ['name', 'featured', 'order', 'updatedAt'],
  },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'e.g. Northwest, Downtown' } },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea', admin: { description: 'Submarket overview shown on the index card and detail hero' } },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'highlights', type: 'array',
      fields: [{ name: 'highlight', type: 'text' }],
      admin: { description: 'e.g. "Class A office demand", "Distribution corridor"' },
    },
    {
      name: 'zip_codes', type: 'array',
      fields: [{ name: 'zip', type: 'text' }],
      admin: { description: 'Zip codes covered by this submarket' },
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'order', type: 'number', defaultValue: 99 },
  ],
};
