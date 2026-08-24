import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import {
  getVehicleTypesAdmin, createVehicleType, updateVehicleType, deactivateVehicleType, UnauthorizedError,
} from '../../lib/adminApi';

const th = { padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 13 };
const td = { padding: '10px 14px' };

const emptyForm = { name: '', seaterCapacity: '', perKmRate: '', baseFare: '', driverAllowance: '', nightHaltCharge: '' };

export default function AdminVehicleTypesPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rowBusyId, setRowBusyId] = useState(null);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      setVehicleTypes(await getVehicleTypesAdmin());
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
    setForm(emptyForm);
    setFormError('');
  }

  function startEdit(v) {
    setEditingId(v.id);
    setForm({
      name: v.name || '',
      seaterCapacity: v.seater_capacity ?? '',
      perKmRate: v.per_km_rate ?? '',
      baseFare: v.base_fare ?? '',
      driverAllowance: v.driver_allowance_per_day ?? '',
      nightHaltCharge: v.night_halt_charge ?? '',
    });
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.perKmRate) { setFormError('Name and per-km rate are required.'); return; }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        seater_capacity: form.seaterCapacity || undefined,
        per_km_rate: form.perKmRate,
        base_fare: form.baseFare || undefined,
        driver_allowance_per_day: form.driverAllowance || undefined,
        night_halt_charge: form.nightHaltCharge || undefined,
      };
      if (editingId) {
        await updateVehicleType(editingId, payload);
      } else {
        await createVehicleType(payload);
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

  async function handleToggleActive(v) {
    if (v.is_active && !window.confirm(`Deactivate "${v.name}"? It will disappear from customer selection but existing bookings are unaffected.`)) return;
    setRowBusyId(v.id);
    try {
      if (v.is_active) await deactivateVehicleType(v.id);
      else await updateVehicleType(v.id, { is_active: true });
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
    <AdminLayout title="Vehicle Types">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ fontSize: 16 }}>{editingId ? 'Edit Vehicle Type' : 'Add Vehicle Type'}</h3>
          {formError && <div className="error-banner">{formError}</div>}

          <div className="field">
            <label htmlFor="vname">Name</label>
            <input id="vname" placeholder="Sedan, SUV, Tempo Traveller…" value={form.name} onChange={(e) => setField('name', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="vseats">Seater Capacity</label>
            <input id="vseats" type="number" value={form.seaterCapacity} onChange={(e) => setField('seaterCapacity', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="vperkm">Per KM Rate (₹)</label>
            <input id="vperkm" type="number" step="0.01" value={form.perKmRate} onChange={(e) => setField('perKmRate', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="vbase">Base Fare (₹)</label>
            <input id="vbase" type="number" step="0.01" value={form.baseFare} onChange={(e) => setField('baseFare', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="vallow">Driver Allowance / Day (₹)</label>
            <input id="vallow" type="number" step="0.01" value={form.driverAllowance} onChange={(e) => setField('driverAllowance', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="vnight">Night Halt Charge (₹)</label>
            <input id="vnight" type="number" step="0.01" value={form.nightHaltCharge} onChange={(e) => setField('nightHaltCharge', e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Saving…' : editingId ? 'Update Vehicle Type' : 'Add Vehicle Type'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn btn-secondary btn-block" style={{ marginTop: 8 }}>
              Cancel Edit
            </button>
          )}
        </form>

        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          {loading && <p style={{ padding: 16 }}>Loading…</p>}
          {error && <div className="error-banner" style={{ margin: 16 }}>{error}</div>}
          {!loading && !error && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f0f2f5' }}>
                  <th style={th}>Name</th>
                  <th style={th}>Seats</th>
                  <th style={th}>₹/km</th>
                  <th style={th}>Base</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicleTypes.map((v) => (
                  <tr key={v.id} style={{ borderTop: '1px solid var(--color-border)', opacity: v.is_active ? 1 : 0.55 }}>
                    <td style={td}>{v.name}</td>
                    <td style={td}>{v.seater_capacity || '—'}</td>
                    <td style={td}>₹{v.per_km_rate}</td>
                    <td style={td}>₹{v.base_fare}</td>
                    <td style={td}><span className="badge">{v.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => startEdit(v)}>Edit</button>
                        <button
                          className="btn"
                          style={{ padding: '5px 10px', fontSize: 12, background: v.is_active ? '#fdecea' : '#e9f7ef', color: v.is_active ? 'var(--color-error)' : 'var(--color-success)' }}
                          onClick={() => handleToggleActive(v)}
                          disabled={rowBusyId === v.id}
                        >
                          {rowBusyId === v.id ? '…' : v.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vehicleTypes.length === 0 && <tr><td style={td} colSpan={6}>No vehicle types yet.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
