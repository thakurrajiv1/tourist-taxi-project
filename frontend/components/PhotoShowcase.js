import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * A full-width photographic section for the homepage — separate from the
 * illustrated hero, per the "both" design decision. Looks for a real
 * photo at /images/hero/showcase.jpg; falls back to an on-brand gradient
 * placeholder if that file hasn't been added yet, so the site never
 * shows a broken-image icon.
 */
export default function PhotoShowcase() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      style={{
        marginTop: 72,
        height: 340,
        position: 'relative',
        overflow: 'hidden',
        background: imageFailed
          ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-sandstone) 100%)'
          : undefined,
      }}
    >
      {!imageFailed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/hero/showcase.jpg"
          alt="A North India road trip destination"
          onError={() => setImageFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(0deg, rgba(18,41,31,0.75) 0%, rgba(18,41,31,0.15) 55%, transparent 100%)',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <div className="container" style={{ paddingBottom: 28 }}>
          <div className="eyebrow" style={{ color: 'var(--color-accent)', marginBottom: 6 }}>
            The Open Road
          </div>
          <h2 className="signage" style={{ color: 'white', margin: 0, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
            From City Streets to Mountain Passes
          </h2>
          {imageFailed && (
            <p className="mono" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 8 }}>
              Add your photo at frontend/public/images/hero/showcase.jpg
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
