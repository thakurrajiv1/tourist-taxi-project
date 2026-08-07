import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from './Header';
import Footer from './Footer';
import EnquiryButton from './EnquiryButton';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
const SITE_NAME = 'Roaming Route';

export default function Layout({ title, description, ogImage, structuredData, noindex, children }) {
  const router = useRouter();
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Tourist Taxi Booking Across India`;
  const pageDescription =
    description ||
    'Book outstation taxis, round trips, and multi-city tour cabs anywhere in India. Transparent pricing, verified drivers.';
  const canonicalUrl = `${SITE_URL}${router.asPath.split('?')[0]}`;
  const image = ogImage || `${SITE_URL}/og-default.jpg`;

  // Accepts either a single JSON-LD object or an array of them (e.g. a
  // page needing both a Product schema and a BreadcrumbList).
  const structuredDataList = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonicalUrl} />
        {noindex && <meta name="robots" content="noindex, nofollow" />}

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={image} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={image} />

        {structuredDataList.map((data, i) => (
          <script
            key={i}
            type="application/ld+json"
            // JSON.stringify of a controlled, code-generated object. The
            // extra replace guards against a title/description containing
            // "</script>" (e.g. a tour package name someone typed) from
            // breaking out of this tag — standard practice when embedding
            // JSON that may include admin- or user-editable text.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
          />
        ))}
      </Head>
      <Header />
      <main style={{ minHeight: '60vh' }}>{children}</main>
      <Footer />
      <EnquiryButton />
    </>
  );
}
