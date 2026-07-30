import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { adminLogin } from '../../lib/adminApi';
import { saveToken } from '../../lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await adminLogin(email, password);
      saveToken(token);
      router.push('/admin/bookings');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login | RouteMitra Cabs</title>
      </Head>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
        }}
      >
        <form onSubmit={handleSubmit} className="card" style={{ width: 360 }}>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Admin Login</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            RouteMitra Cabs — Ops Dashboard
          </p>

          {error && <div className="error-banner">{error}</div>}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>
      </div>
    </>
  );
}
