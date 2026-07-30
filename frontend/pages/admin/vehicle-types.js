import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { createVehicleType, UnauthorizedError } from '../../lib/adminApi';
import { getVehicleTypes } from '../../lib/api';

const th = { padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 13 };
const td = { padding: '10px 14px' };

export default function AdminVehicleTypesPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [seaterCapacity, setSeaterCapacity] = useState('');
  const [perKmRate, setPerKmRate] = useState('');
  const [baseFare, setBaseFare] = useState('');
  const [driverAllowance, setDriverAllowance] = useState('');
  const [nightHaltCharge, setNightHaltCharge] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const data = await getVehicleTypes();
      setVehicleTypes(data);
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

    if (!name.trim() || !perKmRate) {
      setFormError('Name and per-km rate are required.');
      return;
    }

    setSubmitting(true);
    try {
      await createVehicleType({
        name,
        seater_capacity: seaterCapacity || undefined,
        per_km_rate: perKmRate,
        base_fare: baseFare || undefined,
        driver_allowance_per_day: driverAllowance || undefined,
        night_halt_charge: nightHaltCharge || undefined,
      });
      setName('');
      setSeaterCapacity('');
      setPerKmRate('');
      setBaseFare('');
      setDriverAllowance('');
      setNightHaltCharge('');
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
    <AdminLayout title="Vehicle Types">
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ fontSize: 16 }}>Add Vehicle Type</h3>
          {formError && <div className="error-banner">{formError}</div>}

          <div className="field">
            <label htmlFor="vname">Name</label>
            <input
              id="vname"
              placeholder="Sedan, SUV, Tempo Traveller…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="vseats">Seater Capacity</label>
            <input
              id="vseats"
              type="number"
              value={seaterCapacity}
              onChange={(e) => setSeaterCapacity(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="vperkm">Per KM Rate (₹)</label>
            <input
              id="vperkm"
              type="number"
              step="0.01"
              value={perKmRate}
              onChange={(e) => setPerKmRate(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="vbase">Base Fare (₹)</label>
            <input
              id="vbase"
              type="number"
              step="0.01"
              value={baseFare}
              onChange={(e) => setBaseFare(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="vallow">Driver Allowance / Day (₹)</label>
            <input
              id="vallow"
              type="number"
              step="0.01"
              value={driverAllowance}
              onChange={(e) => setDriverAllowance(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="vnight">Night Halt Charge (₹)</label>
            <input
              id="vnight"
              type="number"
              step="0.01"
              value={nightHaltCharge}
              onChange={(e) => setNightHaltCharge(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Vehicle Type'}
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
                  <th style={th}>Name</th>
                  <th style={th}>Seats</th>
                  <th style={th}>₹/km</th>
                  <th style={th}>Base</th>
                  <th style={th}>Driver Allow.</th>
                  <th style={th}>Night Halt</th>
                </tr>
              </thead>
              <tbody>
                {vehicleTypes.map((v) => (
                  <tr key={v.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={td}>{v.name}</td>
                    <td style={td}>{v.seater_capacity || '—'}</td>
                    <td style={td}>₹{v.per_km_rate}</td>
                    <td style={td}>₹{v.base_fare}</td>
                    <td style={td}>₹{v.driver_allowance_per_day}</td>
                    <td style={td}>₹{v.night_halt_charge}</td>
                  </tr>
                ))}
                {vehicleTypes.length === 0 && (
                  <tr>
                    <td style={td} colSpan={6}>
                      No vehicle types yet.
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
