/**
 * Shown instead of a broken-image icon when a tour package has no
 * cover_image_url set yet. On-brand (route-line motif) rather than a
 * generic gray box, so the site looks intentional even before real
 * photos are added.
 */
export default function PlaceholderPackageImage({ height = 160, style = {} }) {
  return (
    <div
      style={{
        height,
        borderRadius: 'var(--radius)',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      <svg viewBox="0 0 200 100" width="70%" style={{ opacity: 0.85 }} aria-hidden="true">
        <path
          d="M10,85 C 50,70 70,60 100,50 C 140,38 160,30 190,15"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeDasharray="9 8"
          strokeLinecap="round"
        />
        <circle cx="10" cy="85" r="4" fill="var(--color-accent)" />
        <circle cx="190" cy="15" r="4" fill="white" />
      </svg>
      <span
        className="mono"
        style={{
          position: 'absolute',
          bottom: 10,
          right: 12,
          fontSize: 10,
          letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        PHOTO COMING SOON
      </span>
    </div>
  );
}
