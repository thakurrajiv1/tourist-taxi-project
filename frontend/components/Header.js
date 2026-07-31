import { useEffect, useState } from 'react';
import Link from 'next/link';
import { buildWhatsAppLink } from '../lib/whatsapp';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        background: 'var(--color-primary)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: scrolled ? '0 4px 16px rgba(18,41,31,0.25)' : 'none',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
            <path
              d="M8 48 C 20 38 26 34 32 26 C 38 18 44 14 56 12"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="5"
              strokeDasharray="8 7"
              strokeLinecap="round"
            />
            <circle cx="8" cy="48" r="4" fill="var(--color-accent)" />
            <circle cx="56" cy="12" r="4" fill="white" />
          </svg>
          <span
            className="signage"
            style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800, color: 'white', letterSpacing: '0.01em' }}
          >
            Roaming Route
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/" style={{ color: '#dbe4d9', fontSize: 15, fontWeight: 500 }}>
            Home
          </Link>
          <Link href="/packages" style={{ color: '#dbe4d9', fontSize: 15, fontWeight: 500 }}>
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
