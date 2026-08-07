import { motion } from 'framer-motion';
import Image from 'next/image';

export default function DestinationsSection({ destinations }) {
  if (!destinations || destinations.length === 0) {
    return (
      <section className="container" style={{ marginTop: 56 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          The Roads We Cover
        </div>
        <h2 className="signage">Destinations</h2>
        <div
          className="card"
          style={{
            border: '1.5px dashed var(--color-border)',
            boxShadow: 'none',
            marginTop: 16,
            textAlign: 'center',
            padding: 40,
          }}
        >
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            Destination photos will appear here once added — see{' '}
            <code>frontend/public/images/destinations/README.md</code> for how.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container" style={{ marginTop: 56 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        The Roads We Cover
      </div>
      <h2 className="signage">Destinations</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginTop: 20,
        }}
      >
        {destinations.map((dest, i) => (
          <motion.div
            key={dest.slug}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: (i % 4) * 0.06 }}
            whileHover={{ y: -4 }}
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow)',
              aspectRatio: '4 / 5',
            }}
          >
            <Image
              src={dest.src}
              alt={dest.label}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(18,41,31,0.75), transparent 50%)',
              }}
            />
            <div
              className="mono"
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {dest.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
