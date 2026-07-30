import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { getCityDistances, upsertCityDistance, UnauthorizedError } from '../../lib/adminApi';
import { getCities } from '../../lib/api';

const th = { padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 13 };
const td = { padding: '10px 14px' };

export default function AdminDistancesPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [distances, setDistances] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fromCityId, setFromCityId] = useState('');
  const [toCityId, setToCityId] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [alsoReverse, setAlsoReverse] = useState(true);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [distancesData, citiesData] = await Promise.all([getCityDistances(), getCities()]);
      setDistances(distancesData);
      setCities(citiesData);
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

    if (!fromCityId || !toCityId || !distanceKm) {
      setFormError('From city, to city, and distance are required.');
      return;
    }
    if (fromCityId === toCityId) {
      setFormError('From and to city cannot be the same.');
      return;
    }

    setSubmitting(true);
    try {
      await upsertCityDistance({
        from_city_id: fromCityId,
        to_city_id: toCityId,
        distance_km: distanceKm,
        also_reverse: alsoReverse,
      });
      setFromCityId('');
      setToCityId('');
      setDistanceKm('');
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
    <AdminLayout title="City Distances">
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: -8, marginBottom: 20 }}>
        The fare calculator needs a distance on file for any route without a fixed price. If a
        customer searches a route and gets a "no distance found" error, add it here.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ fontSize: 16 }}>Add / Update Distance</h3>
          {formError && <div className="error-banner">{formError}</div>}

          <div className="field">
            <label htmlFor="dfrom">From City</label>
            <select id="dfrom" value={fromCityId} onChange={(e) => setFromCityId(e.target.value)}>
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="dto">To City</label>
            <select id="dto" value={toCityId} onChange={(e) => setToCityId(e.target.value)}>
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="dkm">Distance (km)</label>
            <input id="dkm" type="number" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} />
          </div>

          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={alsoReverse}
                onChange={(e) => setAlsoReverse(e.target.checked)}
              />
              Also save the reverse direction (To → From)
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Distance'}
          </button>
        </form>

        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
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
                  <th style={th}>From</th>
                  <th style={th}>To</th>
                  <th style={th}>Distance (km)</th>
                </tr>
              </thead>
              <tbody>
                {distances.map((d) => (
                  <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={td}>{d.from_city_name}</td>
                    <td style={td}>{d.to_city_name}</td>
                    <td style={td}>{d.distance_km}</td>
                  </tr>
                ))}
                {distances.length === 0 && (
                  <tr>
                    <td style={td} colSpan={3}>
                      No distances saved yet.
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
