import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { getDrivers, createDriver, updateDriver, deactivateDriver, UnauthorizedError } from '../../lib/adminApi';
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

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rowBusyId, setRowBusyId] = useState(null);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [driversData, vehicleTypesData] = await Promise.all([getDrivers(), getVehicleTypes()]);
      setDrivers(driversData);
      setVehicleTypes(vehicleTypesData);
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
    setPhone('');
    setVehicleNumber('');
    setVehicleTypeId('');
    setFormError('');
  }

  function startEdit(d) {
    setEditingId(d.id);
    setName(d.name || '');
    setPhone(d.phone || '');
    setVehicleNumber(d.vehicle_number || '');
    setVehicleTypeId(d.vehicle_type_id || '');
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!name.trim() || !phone.trim()) { setFormError('Name and phone are required.'); return; }

    setSubmitting(true);
    try {
      const payload = { name, phone, vehicle_number: vehicleNumber || undefined, vehicle_type_id: vehicleTypeId || undefined };
      if (editingId) await updateDriver(editingId, payload);
      else await createDriver(payload);
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof UnauthorizedError) { router.replace('/admin/login'); return; }
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(d) {
    if (d.is_active && !window.confirm(`Deactivate "${d.name}"? They'll no longer be assignable to new bookings.`)) return;
    setRowBusyId(d.id);
    try {
      if (d.is_active) await deactivateDriver(d.id);
      else await updateDriver(d.id, { is_active: true });
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
    <AdminLayout title="Drivers">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ fontSize: 16 }}>{editingId ? 'Edit Driver' : 'Add Driver'}</h3>
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
              {vehicleTypes.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Saving…' : editingId ? 'Update Driver' : 'Add Driver'}
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
                  <th style={th}>Name</th>
                  <th style={th}>Phone</th>
                  <th style={th}>Vehicle</th>
                  <th style={th}>Type</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)', opacity: d.is_active ? 1 : 0.55 }}>
                    <td style={td}>{d.name}</td>
                    <td style={td}>{d.phone}</td>
                    <td style={td}>{d.vehicle_number || '—'}</td>
                    <td style={td}>{d.vehicle_type_name || '—'}</td>
                    <td style={td}><span className="badge">{d.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => startEdit(d)}>Edit</button>
                        <button
                          className="btn"
                          style={{ padding: '5px 10px', fontSize: 12, background: d.is_active ? '#fdecea' : '#e9f7ef', color: d.is_active ? 'var(--color-error)' : 'var(--color-success)' }}
                          onClick={() => handleToggleActive(d)}
                          disabled={rowBusyId === d.id}
                        >
                          {rowBusyId === d.id ? '…' : d.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {drivers.length === 0 && <tr><td style={td} colSpan={6}>No drivers yet.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
