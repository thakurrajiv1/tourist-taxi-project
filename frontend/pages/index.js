import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import SearchForm from '../components/SearchForm';
import FareQuoteCard from '../components/FareQuoteCard';
import RouteMapHero from '../components/RouteMapHero';
import RouteDivider from '../components/RouteDivider';
import DestinationsSection from '../components/DestinationsSection';
import FindUsSection from '../components/FindUsSection';
import { getLandmarkIcon } from '../components/LandmarkIcons';
import { getAvailableDestinationImages } from '../lib/destinationImages';
import {
  getCities,
  getVehicleTypes,
  getTripRoutes,
  getFareQuote,
  getCustomFareQuote,
  getTourPackages,
  getBusinessReviews,
} from '../lib/api';

export async function getServerSideProps() {
  const destinations = getAvailableDestinationImages();

  try {
    const [cities, vehicleTypes, tripRoutes, tourPackages, reviews] = await Promise.all([
      getCities(),
      getVehicleTypes(),
      getTripRoutes(),
      getTourPackages(),
      getBusinessReviews().catch(() => ({ reviews_enabled: false })),
    ]);
    return { props: { cities, vehicleTypes, tripRoutes, tourPackages, reviews, destinations } };
  } catch (err) {
    return {
      props: {
        cities: [],
        vehicleTypes: [],
        tripRoutes: [],
        tourPackages: [],
        reviews: { reviews_enabled: false },
        destinations,
      },
    };
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage({ cities, vehicleTypes, tripRoutes, tourPackages, reviews, destinations }) {
  const router = useRouter();
  const [quote, setQuote] = useState(null);
  const [lastSearch, setLastSearch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(searchParams) {
    setLoading(true);
    setError('');
    setQuote(null);
    try {
      const { mode, ...payload } = searchParams;
      const result =
        mode === 'custom' ? await getCustomFareQuote(payload) : await getFareQuote(payload);

      if (result.maps_enabled === false) {
        setError(result.message);
        return;
      }

      setQuote(result);
      setLastSearch(searchParams);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleBookNow() {
    if (!lastSearch) return;
    const query = new URLSearchParams(
      Object.entries(lastSearch).filter(([, v]) => v !== undefined)
    ).toString();
    router.push(`/booking?${query}`);
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const businessAddress = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '';

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'TaxiService',
    name: 'Roaming Route Travel and Transport',
    url: SITE_URL,
    ...(businessAddress ? { address: businessAddress } : {}),
    areaServed: tripRoutes
      .map((r) => r.to_city_name)
      .filter((v, i, arr) => v && arr.indexOf(v) === i),
    ...(reviews && reviews.reviews_enabled
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: reviews.rating,
            reviewCount: reviews.total_reviews,
          },
        }
      : {}),
  };

  return (
    <Layout
      structuredData={localBusinessSchema}
      description="Book outstation taxis, round trips, and multi-day tour packages across North India. Fixed upfront pricing, verified drivers — Delhi, Agra, Jaipur, Manali, Shimla, and more."
    >
      <section
        style={{
          background: 'linear-gradient(165deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
          color: 'white',
          padding: '52px 20px 96px',
          overflow: 'hidden',
        }}
      >
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: 32,
            alignItems: 'center',
          }}
        >
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.5 }}>
            <div className="eyebrow" style={{ color: 'var(--color-accent)', marginBottom: 14 }}>
              North India · Outstation Taxi &amp; Tours
            </div>
            <h1 className="signage" style={{ color: 'white', maxWidth: 620 }}>
              Every Route,<br />Priced Upfront
            </h1>
            <p style={{ color: '#c7d6cd', fontSize: 16, maxWidth: 480, marginBottom: 24 }}>
              One-way drops, round trips, and full-day sightseeing cabs across North India's hill
              stations and heritage circuits — verified drivers, no meter surprises.
            </p>
            <div className="mono" style={{ display: 'flex', gap: 24, fontSize: 13, color: '#a9bdb0' }}>
              <div><strong style={{ color: 'white', fontSize: 18 }}>13</strong><br />Cities Covered</div>
              <div><strong style={{ color: 'white', fontSize: 18 }}>14</strong><br />Fixed Routes</div>
              <div><strong style={{ color: 'white', fontSize: 18 }}>4</strong><br />Tour Circuits</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <RouteMapHero />
          </motion.div>
        </div>
      </section>

      <div className="container" style={{ marginTop: -64, position: 'relative', zIndex: 2 }}>
        <SearchForm
          cities={cities}
          vehicleTypes={vehicleTypes}
          onSearch={handleSearch}
          loading={loading}
        />
        {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}
        <FareQuoteCard quote={quote} onBookNow={handleBookNow} />
      </div>

      {tripRoutes.length > 0 && (
        <section className="container" style={{ marginTop: 72 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Fixed-Price Routes</div>
          <h2 className="signage">Popular Routes</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
              marginTop: 20,
            }}
          >
            {tripRoutes.map((route, i) => {
              const Icon = getLandmarkIcon(route.to_city_name);
              return (
                <motion.div
                  key={route.id}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-40px' }}
                  variants={fadeUp}
                  transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}
                  whileHover={{ y: -4 }}
                >
                  <Link
                    href={route.seo_slug ? `/taxi/${route.seo_slug}` : '#'}
                    className="card"
                    style={{ display: 'block', height: '100%' }}
                  >
                    <div
                      style={{
                        color: 'var(--color-sandstone)',
                        marginBottom: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Icon />
                      <span className="badge">
                        {route.trip_type === 'one_way' ? 'ONE WAY' : route.trip_type === 'round_trip' ? 'ROUND TRIP' : 'LOCAL'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                      {route.from_city_name} <span style={{ color: 'var(--color-accent-dark)' }}>&#8594;</span> {route.to_city_name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                      {route.vehicle_type_name}
                    </div>
                    <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>
                      ₹{parseFloat(route.fixed_price).toLocaleString('en-IN')}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      <div className="container" style={{ marginTop: 56 }}>
        <RouteDivider />
      </div>

      <DestinationsSection destinations={destinations} />

      {tourPackages.length > 0 && (
        <section className="container" style={{ marginTop: 40 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Multi-Day Circuits</div>
          <h2 className="signage">Tour Packages</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
              marginTop: 20,
            }}
          >
            {tourPackages.slice(0, 4).map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <Link href={`/packages/${pkg.slug}`} className="card" style={{ display: 'block', height: '100%' }}>
                  <span className="badge" style={{ marginBottom: 10, display: 'inline-block' }}>
                    {pkg.duration_days} DAYS
                  </span>
                  <h3 style={{ fontSize: 17, marginBottom: 6 }}>{pkg.title}</h3>
                  {pkg.description && (
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--color-text-muted)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {pkg.description}
                    </p>
                  )}
                  <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', marginTop: 8 }}>
                    ₹{parseFloat(pkg.price).toLocaleString('en-IN')}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <Link href="/packages" className="btn btn-secondary" style={{ fontSize: 14 }}>
              View All Tour Packages
            </Link>
          </div>
        </section>
      )}

      <section className="container" style={{ marginTop: 72, marginBottom: 56 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>The Process</div>
        <h2 className="signage">How It Works</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
            marginTop: 24,
          }}
        >
          {[
            ['01', 'Search', 'Pick your route, vehicle, and travel date to see an instant fare.'],
            ['02', 'Book', 'Confirm your trip — pay a portion online or arrange it with our team.'],
            ['03', 'Travel', 'A verified driver and vehicle are assigned to your trip before pickup.'],
          ].map(([num, title, text], i) => (
            <motion.div
              key={num}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="card"
              style={{ position: 'relative' }}
            >
              <div
                className="mono"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 15,
                  marginBottom: 14,
                }}
              >
                {num}
              </div>
              <h3>{title}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <FindUsSection reviews={reviews} />
    </Layout>
  );
}
