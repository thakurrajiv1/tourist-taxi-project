import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import {
  getBookings, confirmBooking, cancelBooking, assignDriver, getDrivers, UnauthorizedError,
} from '../../lib/adminApi';

const th = { padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 13 };
const td = { padding: '10px 14px', verticalAlign: 'top' };

export default function AdminBookingsPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [assigningId, setAssigningId] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [rowErrors, setRowErrors] = useState({});
  const [rowBusyId, setRowBusyId] = useState(null);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [bookingsData, driversData] = await Promise.all([getBookings(), getDrivers()]);
      setBookings(bookingsData);
      setDrivers(driversData);
    } catch (err) {
      if (err instanceof UnauthorizedError) { router.replace('/admin/login'); return; }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (ready) loadData(); }, [ready]);

  async function handleConfirm(id) {
    setRowErrors((prev) => ({ ...prev, [id]: '' }));
    setRowBusyId(id);
    try {
      await confirmBooking(id);
      loadData();
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [id]: err.message }));
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleCancel(id) {
    const reason = window.prompt('Reason for cancellation (optional):', '');
    if (reason === null) return; // user hit Cancel on the prompt itself
    setRowErrors((prev) => ({ ...prev, [id]: '' }));
    setRowBusyId(id);
    try {
      await cancelBooking(id, reason || undefined);
      loadData();
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [id]: err.message }));
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleAssign(id) {
    if (!selectedDriverId) return;
    setRowErrors((prev) => ({ ...prev, [id]: '' }));
    try {
      await assignDriver(id, selectedDriverId);
      setAssigningId(null);
      setSelectedDriverId('');
      loadData();
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [id]: err.message }));
    }
  }

  if (!ready) return null;

  // Bookings that are cancelled or completed have no further actions —
  // keeps the actions column from cluttering with irrelevant buttons.
  const isFinal = (status) => ['cancelled', 'completed'].includes(status);

  return (
    <AdminLayout title="Bookings">
      {loading && <p>Loading…</p>}
      {error && <div className="error-banner">{error}</div>}

      {!loading && !error && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f0f2f5' }}>
                <th style={th}>ID</th>
                <th style={th}>Customer</th>
                <th style={th}>Route</th>
                <th style={th}>Trip</th>
                <th style={th}>Dates</th>
                <th style={th}>Fare</th>
                <th style={th}>Payment</th>
                <th style={th}>Status</th>
                <th style={th}>Driver</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} style={{ borderTop: '1px solid var(--color-border)', opacity: isFinal(b.booking_status) ? 0.6 : 1 }}>
                  <td style={td}>#{b.id}</td>
                  <td style={td}>
                    {b.customer_name}
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{b.customer_phone}</div>
                  </td>
                  <td style={td}>
                    {b.from_city_name || b.from_address} → {b.to_city_name || b.to_address}
                    {!b.from_city_name && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Custom location</div>}
                  </td>
                  <td style={td}>{b.trip_type}</td>
                  <td style={td}>{b.pickup_date}{b.return_date ? ` → ${b.return_date}` : ''}</td>
                  <td style={td}>₹{parseFloat(b.quoted_fare).toLocaleString('en-IN')}</td>
                  <td style={td}>{b.payment_status}</td>
                  <td style={td}>
                    <span className="badge">{b.booking_status}</span>
                    {b.booking_status === 'cancelled' && b.cancellation_reason && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{b.cancellation_reason}</div>
                    )}
                  </td>
                  <td style={td}>{b.assigned_driver_id ? `Driver #${b.assigned_driver_id}` : '—'}</td>
                  <td style={{ ...td, minWidth: 170 }}>
                    {rowErrors[b.id] && <div style={{ color: 'var(--color-error)', fontSize: 12, marginBottom: 6 }}>{rowErrors[b.id]}</div>}

                    {!isFinal(b.booking_status) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {b.booking_status === 'pending' && (
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleConfirm(b.id)} disabled={rowBusyId === b.id}>
                            Confirm
                          </button>
                        )}

                        {b.booking_status === 'confirmed' && assigningId !== b.id && (
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { setAssigningId(b.id); setSelectedDriverId(''); }}>
                            Assign Driver
                          </button>
                        )}

                        {b.booking_status === 'confirmed' && assigningId === b.id && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} style={{ fontSize: 12, padding: 4, borderRadius: 6 }}>
                              <option value="">Select driver</option>
                              {drivers.filter((d) => d.vehicle_type_id === b.vehicle_type_id).map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                            <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => handleAssign(b.id)}>Go</button>
                          </div>
                        )}

                        <button
                          className="btn"
                          style={{ padding: '6px 12px', fontSize: 12, background: '#fdecea', color: 'var(--color-error)' }}
                          onClick={() => handleCancel(b.id)}
                          disabled={rowBusyId === b.id}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td style={td} colSpan={10}>No bookings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
