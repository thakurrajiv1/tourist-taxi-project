export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--color-navy-dark)',
        color: '#b7c3d6',
        marginTop: 64,
      }}
    >
      <div
        className="container"
        style={{
          padding: '32px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          justifyContent: 'space-between',
          fontSize: 14,
        }}
      >
        <div>
          <div style={{ color: 'white', fontWeight: 700, marginBottom: 6 }}>Roaming Route</div>
          <div>Outstation taxi & tour bookings across India.</div>
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 600, marginBottom: 6 }}>Popular Routes</div>
          <div>Delhi → Manali &middot; Delhi → Agra &middot; Shimla → Manali</div>
        </div>
        <div>
          <div style={{ color: 'white', fontWeight: 600, marginBottom: 6 }}>Contact</div>
          <div>+91 00000 00000</div>
          <div>support@routemitra.example</div>
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
