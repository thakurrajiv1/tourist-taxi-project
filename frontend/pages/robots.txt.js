// Dynamic robots.txt so the sitemap URL always matches your real domain
// (set via NEXT_PUBLIC_SITE_URL) instead of a hardcoded placeholder
// someone has to remember to edit by hand.
export async function getServerSideProps({ res }) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /booking

Sitemap: ${SITE_URL}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain');
  res.write(body);
  res.end();

  return { props: {} };
}

export default function Robots() {
  return null;
}
