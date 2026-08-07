import { getTripRoutes, getTourPackages } from '../lib/api';

// This page renders nothing itself — getServerSideProps writes raw XML
// directly to the response and ends it, which is the standard way to
// serve a dynamic sitemap from the Next.js Pages Router without a
// separate custom server.
export async function getServerSideProps({ res }) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  let routes = [];
  let packages = [];
  try {
    [routes, packages] = await Promise.all([getTripRoutes(), getTourPackages()]);
  } catch (err) {
    // If the API is briefly unreachable, still serve a sitemap with the
    // static pages rather than failing the whole request.
  }

  const staticUrls = [
    { loc: '/', priority: '1.0' },
    { loc: '/packages', priority: '0.8' },
  ];

  const routeUrls = routes
    .filter((r) => r.seo_slug)
    .map((r) => ({ loc: `/taxi/${r.seo_slug}`, priority: '0.7' }));

  const packageUrls = packages.map((p) => ({ loc: `/packages/${p.slug}`, priority: '0.7' }));

  const allUrls = [...staticUrls, ...routeUrls, ...packageUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}
