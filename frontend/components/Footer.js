import RouteDivider from './RouteDivider';

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--color-primary-dark)',
        color: '#b7c8bb',
        marginTop: 64,
      }}
    >
      <div style={{ padding: '0 20px' }}>
        <div className="container" style={{ padding: 0 }}>
          <RouteDivider color="rgba(255,255,255,0.18)" />
        </div>
      </div>
      <div
        className="container"
        style={{
          padding: '28px 20px 32px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          justifyContent: 'space-between',
          fontSize: 14,
        }}
      >
        <div>
          <div className="signage" style={{ color: 'white', fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font-display)', fontSize: 17 }}>
            Roaming Route
          </div>
          <div>Outstation taxi &amp; tour bookings across North India.</div>
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 600, marginBottom: 6 }}>Popular Routes</div>
          <div>Delhi → Manali &middot; Delhi → Agra &middot; Shimla → Manali</div>
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 600, marginBottom: 6 }}>Contact</div>
          <div className="mono">+91 7018265332</div>
          <div className="mono">contactus@roamingroute.in</div>
        </div>
      </div>
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '14px 20px',
          textAlign: 'center',
          fontSize: 12,
        }}
      >
        © {new Date().getFullYear()} Roaming Route Travel and Transport. All rights reserved.
      </div>
    </footer>
  );
}
