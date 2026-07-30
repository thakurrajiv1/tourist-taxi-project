import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import EnquiryButton from './EnquiryButton';

export default function Layout({ title, description, children }) {
  const pageTitle = title ? `${title} | Roaming Route` : 'Roaming Route — Tourist Taxi Booking Across India';
  const pageDescription =
    description ||
    'Book outstation taxis, round trips, and multi-city tour cabs anywhere in India. Transparent pricing, verified drivers.';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <main style={{ minHeight: '60vh' }}>{children}</main>
      <Footer />
      <EnquiryButton />
    </>
  );
}
