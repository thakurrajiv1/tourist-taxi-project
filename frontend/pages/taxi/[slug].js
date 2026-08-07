import Layout from '../../components/Layout';
import { getTripRoutes } from '../../lib/api';

export async function getServerSideProps({ params }) {
  try {
    const routes = await getTripRoutes();
    const route = routes.find((r) => r.seo_slug === params.slug);
    if (!route) return { notFound: true };
    return { props: { route } };
  } catch (err) {
    return { notFound: true };
  }
}

export default function RoutePage({ route }) {
  const title = `${route.from_city_name} to ${route.to_city_name} Taxi`;
  const tripTypeLabel =
    route.trip_type === 'one_way' ? 'One Way' : route.trip_type === 'round_trip' ? 'Round Trip' : 'Local / Full Day';

  const bookingQuery = new URLSearchParams({
    from_city_id: route.from_city_id,
    to_city_id: route.to_city_id,
    vehicle_type_id: route.vehicle_type_id,
    trip_type: route.trip_type,
  }).toString();

  const description = `Book a ${route.vehicle_type_name} for ${tripTypeLabel.toLowerCase()} travel from ${route.from_city_name} to ${route.to_city_name}. Upfront pricing, verified drivers.`;

  // Service + Offer schema — the specific, priced thing being sold on
  // this page, which is what a search engine actually wants to index for
  // a query like "delhi to manali taxi price".
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Taxi Service',
    name: title,
    description,
    provider: { '@type': 'TaxiService', name: 'Roaming Route Travel and Transport' },
    areaServed: [route.from_city_name, route.to_city_name],
    offers: {
      '@type': 'Offer',
      price: parseFloat(route.fixed_price),
      priceCurrency: 'INR',
    },
  };

  return (
    <Layout title={title} description={description} structuredData={serviceSchema}>
      <div className="container" style={{ paddingTop: 40, maxWidth: 700 }}>
        <span className="badge">{tripTypeLabel}</span>
        <h1 className="signage" style={{ marginTop: 12 }}>
          {route.from_city_name} to {route.to_city_name} Taxi
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Book a comfortable {route.vehicle_type_name} for your {tripTypeLabel.toLowerCase()} trip
          from {route.from_city_name} to {route.to_city_name}
          {route.distance_km ? ` — approximately ${Math.round(route.distance_km)} km` : ''}.
          Transparent pricing with no last-minute surprises.
        </p>

        <div className="card" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Fixed Price</div>
              <div className="mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-primary)' }}>
                ₹{parseFloat(route.fixed_price).toLocaleString('en-IN')}
              </div>
            </div>
            {route.distance_km && <span className="badge">{Math.round(route.distance_km)} KM</span>}
          </div>

          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 12 }}>
            Vehicle: {route.vehicle_type_name}. Toll, parking, and state permit charges (if any)
            are extra, paid directly during the trip.
          </p>

          <a href={`/booking?${bookingQuery}`} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
            Book This Route
          </a>
        </div>

        <div style={{ marginTop: 40 }}>
          <h2 className="signage" style={{ fontSize: 20 }}>Why Book With Us</h2>
          <ul style={{ color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.9 }}>
            <li>Upfront, fixed pricing for this route — no meter surprises</li>
            <li>Verified drivers and well-maintained vehicles</li>
            <li>Flexible payment — pay online in advance, or arrange payment with our team</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
