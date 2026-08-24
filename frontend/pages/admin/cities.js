import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { getCitiesAdmin, createCity, updateCity, deactivateCity, UnauthorizedError } from '../../lib/adminApi';

const th = { padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 13 };
const td = { padding: '10px 14px' };

export default function AdminCitiesPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rowBusyId, setRowBusyId] = useState(null);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      setCities(await getCitiesAdmin());
    } catch (err) {
      if (err instanceof UnauthorizedError) { router.replace('/admin/login'); return; }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (ready) loadData(); }, [ready]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setState('');
    setLatitude('');
    setLongitude('');
    setFormError('');
  }

  function startEdit(city) {
    setEditingId(city.id);
    setName(city.name || '');
    setState(city.state || '');
    setLatitude(city.latitude || '');
    setLongitude(city.longitude || '');
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) { setFormError('City name is required.'); return; }

    setSubmitting(true);
    try {
      const payload = { name, state: state || undefined, latitude: latitude || undefined, longitude: longitude || undefined };
      if (editingId) {
        await updateCity(editingId, payload);
      } else {
        await createCity(payload);
      }
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof UnauthorizedError) { router.replace('/admin/login'); return; }
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(city) {
    if (city.is_active) {
      if (!window.confirm(`Deactivate "${city.name}"? It will disappear from customer search but existing bookings are unaffected.`)) return;
    }
    setRowBusyId(city.id);
    try {
      if (city.is_active) {
        await deactivateCity(city.id);
      } else {
        await updateCity(city.id, { is_active: true });
      }
      loadData();
    } catch (err) {
      if (err instanceof UnauthorizedError) { router.replace('/admin/login'); return; }
      setError(err.message);
    } finally {
      setRowBusyId(null);
    }
  }

  if (!ready) return null;

  return (
    <AdminLayout title="Cities">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ fontSize: 16 }}>{editingId ? 'Edit City' : 'Add City'}</h3>
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
            {submitting ? 'Saving…' : editingId ? 'Update City' : 'Add City'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn btn-secondary btn-block" style={{ marginTop: 8 }}>
              Cancel Edit
            </button>
          )}
        </form>

        <div className="card" style={{ padding: 0 }}>
          {loading && <p style={{ padding: 16 }}>Loading…</p>}
          {error && <div className="error-banner" style={{ margin: 16 }}>{error}</div>}
          {!loading && !error && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f0f2f5' }}>
                  <th style={th}>ID</th>
                  <th style={th}>Name</th>
                  <th style={th}>State</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => (
                  <tr key={c.id} style={{ borderTop: '1px solid var(--color-border)', opacity: c.is_active ? 1 : 0.55 }}>
                    <td style={td}>#{c.id}</td>
                    <td style={td}>{c.name}</td>
                    <td style={td}>{c.state || '—'}</td>
                    <td style={td}>
                      <span className="badge">{c.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => startEdit(c)}>
                          Edit
                        </button>
                        <button
                          className="btn"
                          style={{ padding: '5px 10px', fontSize: 12, background: c.is_active ? '#fdecea' : '#e9f7ef', color: c.is_active ? 'var(--color-error)' : 'var(--color-success)' }}
                          onClick={() => handleToggleActive(c)}
                          disabled={rowBusyId === c.id}
                        >
                          {rowBusyId === c.id ? '…' : c.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {cities.length === 0 && (
                  <tr><td style={td} colSpan={5}>No cities yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
