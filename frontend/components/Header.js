import Link from 'next/link';
import { buildWhatsAppLink } from '../lib/whatsapp';

export default function Header() {
  return (
    <header
      style={{
        background: 'var(--color-navy)',
        color: 'white',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🧭</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Roaming Route</span>
        </Link>

        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/" style={{ color: '#dbe4f0', fontSize: 15 }}>
            Home
          </Link>
          <Link href="/packages" style={{ color: '#dbe4f0', fontSize: 15 }}>
            Tour Packages
          </Link>
          <a
            href={buildWhatsAppLink("Hi, I'd like to know more about booking a taxi.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ padding: '9px 16px', fontSize: 14 }}
          >
            WhatsApp Us
          </a>
        </nav>
      </div>
    </header>
  );
}
