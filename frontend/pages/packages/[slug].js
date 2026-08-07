import Image from 'next/image';
import Layout from '../../components/Layout';
import { getTourPackageBySlug } from '../../lib/api';
import { buildWhatsAppLink } from '../../lib/whatsapp';

export async function getServerSideProps({ params }) {
  try {
    const pkg = await getTourPackageBySlug(params.slug);
    return { props: { pkg } };
  } catch (err) {
    return { notFound: true };
  }
}

export default function PackageDetailPage({ pkg }) {
  if (!pkg) return null;

  const whatsappMessage = `Hi, I'm interested in the "${pkg.title}" tour package.`;
  const description = pkg.description || `${pkg.duration_days}-day tour package — ${pkg.title}`;

  const tripSchema = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: pkg.title,
    description,
    ...(pkg.cover_image_url ? { image: pkg.cover_image_url } : {}),
    provider: { '@type': 'TravelAgency', name: 'Roaming Route Travel and Transport' },
    offers: {
      '@type': 'Offer',
      price: parseFloat(pkg.price),
      priceCurrency: 'INR',
    },
    itinerary: (pkg.itinerary || []).map((day) => ({
      '@type': 'TouristAttraction',
      name: day.title || `Day ${day.day_number}`,
      description: day.description || undefined,
    })),
  };

  return (
    <Layout
      title={pkg.title}
      description={description}
      ogImage={pkg.cover_image_url}
      structuredData={tripSchema}
    >
      <div className="container" style={{ paddingTop: 40, maxWidth: 760 }}>
        {pkg.cover_image_url && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 7',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            <Image
              src={pkg.cover_image_url}
              alt={pkg.title}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 760px"
              priority
            />
          </div>
        )}
        <span className="badge">{pkg.duration_days} Days</span>
        <h1 className="signage" style={{ marginTop: 12 }}>{pkg.title}</h1>
        {pkg.description && (
          <p style={{ color: 'var(--color-text-muted)' }}>{pkg.description}</p>
        )}

        <div className="card" style={{ marginTop: 20, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Package Price</div>
              <div className="mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-primary)' }}>
                ₹{parseFloat(pkg.price).toLocaleString('en-IN')}
              </div>
            </div>
            <a
              href={buildWhatsAppLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Enquire on WhatsApp
            </a>
          </div>
        </div>

        {pkg.itinerary && pkg.itinerary.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 className="signage" style={{ fontSize: 20 }}>Day-by-Day Itinerary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              {pkg.itinerary.map((day) => (
                <div key={day.day_number} className="card">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                    <span className="badge">Day {day.day_number}</span>
                    {day.title && <strong>{day.title}</strong>}
                  </div>
                  {day.description && (
                    <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 8 }}>
                      {day.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {pkg.inclusions && pkg.inclusions.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16 }}>Inclusions</h3>
              <ul style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                {pkg.inclusions.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {pkg.exclusions && pkg.exclusions.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16 }}>Exclusions</h3>
              <ul style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                {pkg.exclusions.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
