import type { GlobalConfig } from 'payload';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Administration' },
  fields: [
    { name: 'siteName', type: 'text', defaultValue: 'CRECO – Commercial Real Estate Company' },
    { name: 'phone', type: 'text', defaultValue: '(210) 817-3443' },
    { name: 'email', type: 'email', defaultValue: 'info@crecotx.com' },
    {
      name: 'address', type: 'group',
      fields: [
        { name: 'street', type: 'text' },
        { name: 'city', type: 'text', defaultValue: 'San Antonio' },
        { name: 'state', type: 'text', defaultValue: 'TX' },
        { name: 'zip', type: 'text' },
      ],
    },
    {
      name: 'socialLinks', type: 'group',
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'linkedin', type: 'text' },
      ],
    },
    {
      name: 'hero_headline', type: 'text',
      defaultValue: 'San Antonio Commercial Real Estate',
    },
    {
      name: 'hero_subheadline', type: 'textarea',
      defaultValue: 'Where your real estate ventures find the support they deserve. Office, warehouse, flex, retail, and land — for tenants, owners, and investors across South Texas.',
    },
    {
      name: 'hero_image_url', type: 'text',
      admin: { description: 'Hero background image URL (optional — defaults to /images/sa-hero.jpg)' },
    },
    {
      name: 'about_headline', type: 'text',
      defaultValue: 'A trailblazing approach to commercial real estate.',
    },
    {
      name: 'about_text', type: 'textarea',
      defaultValue: 'CRECO is built on innovation, expertise, and a relentless commitment to client outcomes. We blend deep San Antonio market knowledge with the analytical rigor you would expect from a national firm — and we keep our roster small enough that every client works directly with a principal.',
    },
    {
      name: 'cta_headline', type: 'text',
      defaultValue: 'Need space? Tell us what you\'re looking for.',
    },
    {
      name: 'cta_subheadline', type: 'textarea',
      defaultValue: 'Submit your tenant needs in 2 minutes and we\'ll send vetted options that match your size, budget, and submarket.',
    },
    {
      name: 'stats', type: 'group',
      fields: [
        { name: 'stat_sf_transacted', type: 'text', defaultValue: '2.4M' },
        { name: 'stat_years_experience', type: 'number', defaultValue: 15 },
        { name: 'stat_satisfaction', type: 'text', defaultValue: '98%' },
        { name: 'stat_active_listings', type: 'number', defaultValue: 30 },
      ],
    },
    { name: 'metaTitle', type: 'text' },
    { name: 'metaDescription', type: 'textarea' },
  ],
};
