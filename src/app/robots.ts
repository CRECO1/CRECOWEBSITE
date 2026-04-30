import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/crm', '/manage', '/api/'],
      },
    ],
    sitemap: 'https://www.crecotx.com/sitemap.xml',
    host: 'https://www.crecotx.com',
  };
}
