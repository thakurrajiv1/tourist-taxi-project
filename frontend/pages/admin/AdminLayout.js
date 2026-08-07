import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { clearToken } from '../../lib/auth';

function navLinkStyle(active) {
  return {
    padding: '10px 12px',
    borderRadius: 8,
    fontSize: 14,
    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
    color: active ? 'white' : '#b7c3d6',
    display: 'block',
  };
}

export default function AdminLayout({ title, children }) {
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.push('/admin/login');
  }

  return (
    <>
      <Head>
        <title>{title} | Admin — Roaming Route</title>
        {/* Admin screens should never appear in search results — this is
            a second layer of protection alongside the Disallow: /admin
            rule in robots.txt (robots.txt is only a request; a crawler
            that ignores it, or a page that gets linked from elsewhere,
            is still blocked from indexing by this tag). */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside
          style={{
            width: 220,
            background: 'var(--color-primary-dark)',
            color: 'white',
            padding: '24px 16px',
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 28 }}>Roaming Route Admin</div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Link href="/admin/bookings" style={navLinkStyle(router.pathname === '/admin/bookings')}>
              Bookings
            </Link>
            <Link href="/admin/drivers" style={navLinkStyle(router.pathname === '/admin/drivers')}>
              Drivers
            </Link>
            <Link href="/admin/routes" style={navLinkStyle(router.pathname === '/admin/routes')}>
              Fixed Routes
            </Link>
            <Link
              href="/admin/vehicle-types"
              style={navLinkStyle(router.pathname === '/admin/vehicle-types')}
            >
              Vehicle Types
            </Link>
            <Link href="/admin/cities" style={navLinkStyle(router.pathname === '/admin/cities')}>
              Cities
            </Link>
            <Link
              href="/admin/enquiries"
              style={navLinkStyle(router.pathname === '/admin/enquiries')}
            >
              Enquiries
            </Link>
            <Link
              href="/admin/tour-packages"
              style={navLinkStyle(router.pathname === '/admin/tour-packages')}
            >
              Tour Packages
            </Link>
            <Link
              href="/admin/distances"
              style={navLinkStyle(router.pathname === '/admin/distances')}
            >
              Distances
            </Link>
          </nav>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ marginTop: 32, width: '100%', background: 'rgba(255,255,255,0.1)' }}
          >
            Log Out
          </button>
        </aside>
        <main style={{ flex: 1, background: 'var(--color-bg)', padding: '28px 32px' }}>
          <h1 style={{ fontSize: 22, marginBottom: 20 }}>{title}</h1>
          {children}
        </main>
      </div>
    </>
  );
}
