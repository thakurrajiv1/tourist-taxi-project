import Link from 'next/link';
import Layout from '../../components/Layout';
import { getTourPackages } from '../../lib/api';

export async function getServerSideProps() {
  try {
    const packages = await getTourPackages();
    return { props: { packages } };
  } catch (err) {
    return { props: { packages: [] } };
  }
}

export default function PackagesPage({ packages }) {
  return (
    <Layout
      title="Tour Packages"
      description="Multi-day tour packages across India — Golden Triangle, hill stations, and more, with a full day-by-day itinerary and one fixed price."
    >
      <div className="container" style={{ paddingTop: 40 }}>
        <h1 className="signage">Tour Packages</h1>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: 600 }}>
          Multi-day trips with a complete day-by-day itinerary and one fixed price — no
          per-day fare guesswork.
        </p>

        {packages.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', marginTop: 24 }}>
            No packages available right now — check back soon.
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
            marginTop: 24,
          }}
        >
          {packages.map((pkg) => (
            <Link key={pkg.id} href={`/packages/${pkg.slug}`} className="card" style={{ display: 'block' }}>
              <span className="badge">{pkg.duration_days} Days</span>
              <h3 style={{ fontSize: 18, marginTop: 10 }}>{pkg.title}</h3>
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
          ))}
        </div>
      </div>
    </Layout>
  );
}
