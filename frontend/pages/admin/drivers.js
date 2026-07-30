import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { getDrivers, createDriver, UnauthorizedError } from '../../lib/adminApi';
import { getVehicleTypes } from '../../lib/api';

const th = { padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 13 };
const td = { padding: '10px 14px' };

export default function AdminDriversPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [drivers, setDrivers] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [driversData, vehicleTypesData] = await Promise.all([getDrivers(), getVehicleTypes()]);
      setDrivers(driversData);
      setVehicleTypes(vehicleTypesData);
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

    if (!name.trim() || !phone.trim()) {
      setFormError('Name and phone are required.');
      return;
    }

    setSubmitting(true);
    try {
      await createDriver({
        name,
        phone,
        vehicle_number: vehicleNumber || undefined,
        vehicle_type_id: vehicleTypeId || undefined,
      });
      setName('');
      setPhone('');
      setVehicleNumber('');
      setVehicleTypeId('');
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) return null;

  return (
    <AdminLayout title="Drivers">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ fontSize: 16 }}>Add Driver</h3>
          {formError && <div className="error-banner">{formError}</div>}

          <div className="field">
            <label htmlFor="dname">Name</label>
            <input id="dname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="dphone">Phone</label>
            <input id="dphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="dvnum">Vehicle Number</label>
            <input id="dvnum" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="dvtype">Vehicle Type</label>
            <select id="dvtype" value={vehicleTypeId} onChange={(e) => setVehicleTypeId(e.target.value)}>
              <option value="">Select type</option>
              {vehicleTypes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Driver'}
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
                  <th style={th}>Name</th>
                  <th style={th}>Phone</th>
                  <th style={th}>Vehicle</th>
                  <th style={th}>Type</th>
                  <th style={th}>Active</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={td}>{d.name}</td>
                    <td style={td}>{d.phone}</td>
                    <td style={td}>{d.vehicle_number || '—'}</td>
                    <td style={td}>{d.vehicle_type_name || '—'}</td>
                    <td style={td}>{d.is_active ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {drivers.length === 0 && (
                  <tr>
                    <td style={td} colSpan={5}>
                      No drivers yet.
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
