import { motion } from 'framer-motion';

const BUSINESS_ADDRESS = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '';
const GOOGLE_REVIEWS_URL = process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_URL || '';
const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || '';

function PlaceholderPanel({ title, instructions }) {
  return (
    <div
      className="card"
      style={{
        border: '1.5px dashed var(--color-border)',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: 200,
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Not Connected Yet
      </div>
      <h3 style={{ fontSize: 15 }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{instructions}</p>
    </div>
  );
}

export default function FindUsSection({ reviews }) {
  const reviewsEnabled = reviews && reviews.reviews_enabled;

  return (
    <section className="container" style={{ marginTop: 56 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        Visit &amp; Follow
      </div>
      <h2 className="signage">Find Us</h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginTop: 20,
        }}
      >
        {/* Map */}
        {BUSINESS_ADDRESS ? (
          <motion.div
            className="card"
            style={{ padding: 0, overflow: 'hidden' }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <iframe
              title="Business location"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(BUSINESS_ADDRESS)}&output=embed`}
              width="100%"
              height="220"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
            />
            <div style={{ padding: 16 }}>
              <h3 style={{ fontSize: 15 }}>Our Office</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{BUSINESS_ADDRESS}</p>
            </div>
          </motion.div>
        ) : (
          <PlaceholderPanel
            title="Map"
            instructions="Set NEXT_PUBLIC_BUSINESS_ADDRESS in frontend/.env.local to show your location here."
          />
        )}

        {/* Reviews */}
        {reviewsEnabled ? (
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Google Reviews
            </div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>
              {reviews.rating.toFixed(1)} ★
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
              Based on {reviews.total_reviews} reviews
            </p>
            {reviews.reviews.slice(0, 2).map((r, i) => (
              <div
                key={i}
                style={{
                  fontSize: 13,
                  marginBottom: 10,
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 10,
                }}
              >
                <strong>{r.author_name}</strong> — {'★'.repeat(r.rating)}
                <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{r.text}</p>
              </div>
            ))}
          </motion.div>
        ) : GOOGLE_REVIEWS_URL ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Google Reviews
            </div>
            <h3 style={{ fontSize: 15 }}>See what past customers say</h3>
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ marginTop: 10, alignSelf: 'flex-start' }}
            >
              Read Reviews on Google
            </a>
          </div>
        ) : (
          <PlaceholderPanel
            title="Google Reviews"
            instructions="Add GOOGLE_PLACES_API_KEY + GOOGLE_PLACE_ID in backend/.env for live reviews, or set NEXT_PUBLIC_GOOGLE_REVIEWS_URL for a simple link button now."
          />
        )}

        {/* Instagram */}
        {INSTAGRAM_URL ? (
          <motion.a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="card"
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
            <h3 style={{ fontSize: 15 }}>Follow Us on Instagram</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              See recent trips &amp; customer photos
            </p>
          </motion.a>
        ) : (
          <PlaceholderPanel
            title="Instagram"
            instructions="Set NEXT_PUBLIC_INSTAGRAM_URL in frontend/.env.local to link your profile here."
          />
        )}
      </div>
    </section>
  );
}
