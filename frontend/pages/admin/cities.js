import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { createCity, UnauthorizedError } from '../../lib/adminApi';
import { getCities } from '../../lib/api';

const th = { padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 13 };
const td = { padding: '10px 14px' };

export default function AdminCitiesPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const data = await getCities();
      setCities(data);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.replace('/admin/login');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('City name is required.');
      return;
    }

    setSubmitting(true);
    try {
      await createCity({
        name,
        state: state || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
      });
      setName('');
      setState('');
      setLatitude('');
      setLongitude('');
      loadData();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.replace('/admin/login');
        return;
      }
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) return null;

  return (
    <AdminLayout title="Cities">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ fontSize: 16 }}>Add City</h3>
          {formError && <div className="error-banner">{formError}</div>}

          <div className="field">
            <label htmlFor="cname">Name</label>
            <input id="cname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="cstate">State</label>
            <input id="cstate" value={state} onChange={(e) => setState(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="clat">Latitude (optional)</label>
            <input id="clat" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="clng">Longitude (optional)</label>
            <input id="clng" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add City'}
          </button>
        </form>

        <div className="card" style={{ padding: 0 }}>
          {loading && <p style={{ padding: 16 }}>Loading…</p>}
          {error && (
            <div className="error-banner" style={{ margin: 16 }}>
              {error}
            </div>
          )}
          {!loading && !error && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f0f2f5' }}>
                  <th style={th}>ID</th>
                  <th style={th}>Name</th>
                  <th style={th}>State</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={td}>#{c.id}</td>
                    <td style={td}>{c.name}</td>
                    <td style={td}>{c.state || '—'}</td>
                  </tr>
                ))}
                {cities.length === 0 && (
                  <tr>
                    <td style={td} colSpan={3}>
                      No cities yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
