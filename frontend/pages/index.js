import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import SearchForm from '../components/SearchForm';
import FareQuoteCard from '../components/FareQuoteCard';
import { getCities, getVehicleTypes, getTripRoutes, getFareQuote, getCustomFareQuote } from '../lib/api';

export async function getServerSideProps() {
  try {
    const [cities, vehicleTypes, tripRoutes] = await Promise.all([
      getCities(),
      getVehicleTypes(),
      getTripRoutes(),
    ]);
    return { props: { cities, vehicleTypes, tripRoutes } };
  } catch (err) {
    // If the API is unreachable, still render the page instead of crashing —
    // the search form will just have empty dropdowns until the backend is up.
    return { props: { cities: [], vehicleTypes: [], tripRoutes: [] } };
  }
}

export default function HomePage({ cities, vehicleTypes, tripRoutes }) {
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
        // Custom-location pricing isn't live yet (no Mapbox token configured) —
        // show the graceful message instead of a fare card.
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

  return (
    <Layout>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(180deg, var(--color-navy) 0%, var(--color-navy-dark) 100%)',
          color: 'white',
          padding: '56px 20px 90px',
        }}
      >
        <div className="container">
          <h1 style={{ color: 'white', fontSize: 34, maxWidth: 640 }}>
            Outstation Taxis, Anywhere in India
          </h1>
          <p style={{ color: '#c6d3e6', fontSize: 16, maxWidth: 560, marginBottom: 28 }}>
            One-way drops, round trips, and full-day sightseeing cabs — upfront pricing, verified
            drivers, no surprises.
          </p>
        </div>
      </section>

      {/* Search card, overlapping the hero */}
      <div className="container" style={{ marginTop: -60 }}>
        <SearchForm
          cities={cities}
          vehicleTypes={vehicleTypes}
          onSearch={handleSearch}
          loading={loading}
        />
        {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}
        <FareQuoteCard quote={quote} onBookNow={handleBookNow} />
      </div>

      {/* Popular routes - SEO content */}
      {tripRoutes.length > 0 && (
        <section className="container" style={{ marginTop: 64 }}>
          <h2>Popular Routes</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
              marginTop: 16,
            }}
          >
            {tripRoutes.map((route) => (
              <Link
                key={route.id}
                href={route.seo_slug ? `/taxi/${route.seo_slug}` : '#'}
                className="card"
                style={{ display: 'block' }}
              >
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                  {route.from_city_name} → {route.to_city_name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                  {route.vehicle_type_name} &middot;{' '}
                  {route.trip_type === 'one_way' ? 'One Way' : route.trip_type === 'round_trip' ? 'Round Trip' : 'Local'}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-navy)' }}>
                  ₹{parseFloat(route.fixed_price).toLocaleString('en-IN')}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="container" style={{ marginTop: 64, marginBottom: 40 }}>
        <h2>How It Works</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
            marginTop: 16,
          }}
        >
          {[
            ['1. Search', 'Pick your route, vehicle, and travel date to see an instant fare.'],
            ['2. Book', 'Confirm your trip — pay a portion online or arrange it with our team.'],
            ['3. Travel', 'A verified driver and vehicle are assigned to your trip before pickup.'],
          ].map(([title, text]) => (
            <div key={title} className="card">
              <h3 style={{ fontSize: 17 }}>{title}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
