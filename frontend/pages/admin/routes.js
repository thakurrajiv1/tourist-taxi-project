import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import {
  getTripRoutesAdmin, createTripRoute, updateTripRoute, deactivateTripRoute, UnauthorizedError,
} from '../../lib/adminApi';
import { getCities, getVehicleTypes } from '../../lib/api';

const th = { padding: '10px 14px', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: 13 };
const td = { padding: '10px 14px' };

const TRIP_TYPES = [
  { value: 'one_way', label: 'One Way' },
  { value: 'round_trip', label: 'Round Trip' },
  { value: 'local', label: 'Local / Full Day' },
];

export default function AdminRoutesPage() {
  const ready = useRequireAuth();
  const router = useRouter();

  const [routes, setRoutes] = useState([]);
  const [cities, setCities] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [fromCityId, setFromCityId] = useState('');
  const [toCityId, setToCityId] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [tripType, setTripType] = useState('one_way');
  const [distanceKm, setDistanceKm] = useState('');
  const [fixedPrice, setFixedPrice] = useState('');
  const [seoSlug, setSeoSlug] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rowBusyId, setRowBusyId] = useState(null);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [routesData, citiesData, vehicleTypesData] = await Promise.all([getTripRoutesAdmin(), getCities(), getVehicleTypes()]);
      setRoutes(routesData);
      setCities(citiesData);
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
    setFromCityId(''); setToCityId(''); setVehicleTypeId(''); setTripType('one_way');
    setDistanceKm(''); setFixedPrice(''); setSeoSlug(''); setFormError('');
  }

  function startEdit(r) {
    setEditingId(r.id);
    setFromCityId(r.from_city_id);
    setToCityId(r.to_city_id);
    setVehicleTypeId(r.vehicle_type_id);
    setTripType(r.trip_type);
    setDistanceKm(r.distance_km || '');
    setFixedPrice(r.fixed_price || '');
    setSeoSlug(r.seo_slug || '');
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (editingId) {
      // Editing only touches price/distance/slug — from/to/vehicle/trip
      // type together form the route's identity (and its unique
      // constraint), so changing those is really "create a different
      // route" rather than an edit. Keeping them fixed avoids silently
      // merging into a different existing route.
      if (!fixedPrice) { setFormError('Fixed price is required.'); return; }
      setSubmitting(true);
      try {
        await updateTripRoute(editingId, { distance_km: distanceKm || undefined, fixed_price: fixedPrice, seo_slug: seoSlug || undefined });
        resetForm();
        loadData();
      } catch (err) {
        if (err instanceof UnauthorizedError) { router.replace('/admin/login'); return; }
        setFormError(err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!fromCityId || !toCityId || !vehicleTypeId || !fixedPrice) {
      setFormError('From city, to city, vehicle type, and fixed price are required.');
      return;
    }
    if (fromCityId === toCityId) { setFormError('From and to city cannot be the same.'); return; }

    setSubmitting(true);
    try {
      await createTripRoute({
        from_city_id: fromCityId, to_city_id: toCityId, vehicle_type_id: vehicleTypeId, trip_type: tripType,
        distance_km: distanceKm || undefined, fixed_price: fixedPrice, seo_slug: seoSlug || undefined,
      });
      resetForm();
      loadData();
    } catch (err) {
      if (err instanceof UnauthorizedError) { router.replace('/admin/login'); return; }
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(r) {
    if (r.is_active && !window.confirm(`Deactivate ${r.from_city_name} → ${r.to_city_name}? It falls back to calculated pricing (if a distance is on file) or stops being bookable.`)) return;
    setRowBusyId(r.id);
    try {
      if (r.is_active) await deactivateTripRoute(r.id);
      else await updateTripRoute(r.id, { is_active: true });
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
    <AdminLayout title="Fixed Routes">
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ fontSize: 16 }}>{editingId ? 'Edit Route' : 'Add Fixed Route'}</h3>
          {editingId && (
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: -8, marginBottom: 12 }}>
              Route, vehicle, and trip type can't be changed once created — deactivate this route and add a new one instead if those need to change.
            </p>
          )}
          {formError && <div className="error-banner">{formError}</div>}

          <div className="field">
            <label htmlFor="rfrom">From City</label>
            <select id="rfrom" value={fromCityId} onChange={(e) => setFromCityId(e.target.value)} disabled={!!editingId}>
              <option value="">Select city</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rto">To City</label>
            <select id="rto" value={toCityId} onChange={(e) => setToCityId(e.target.value)} disabled={!!editingId}>
              <option value="">Select city</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rvehicle">Vehicle Type</label>
            <select id="rvehicle" value={vehicleTypeId} onChange={(e) => setVehicleTypeId(e.target.value)} disabled={!!editingId}>
              <option value="">Select vehicle</option>
              {vehicleTypes.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rtrip">Trip Type</label>
            <select id="rtrip" value={tripType} onChange={(e) => setTripType(e.target.value)} disabled={!!editingId}>
              {TRIP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rdist">Distance (km, optional)</label>
            <input id="rdist" type="number" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rprice">Fixed Price (₹)</label>
            <input id="rprice" type="number" step="0.01" value={fixedPrice} onChange={(e) => setFixedPrice(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rslug">SEO Slug (optional)</label>
            <input id="rslug" placeholder="delhi-to-manali-taxi" value={seoSlug} onChange={(e) => setSeoSlug(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Saving…' : editingId ? 'Update Route' : 'Add Route'}
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
                  <th style={th}>Route</th>
                  <th style={th}>Vehicle</th>
                  <th style={th}>Trip</th>
                  <th style={th}>Price</th>
                  <th style={th}>Status</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--color-border)', opacity: r.is_active ? 1 : 0.55 }}>
                    <td style={td}>{r.from_city_name} → {r.to_city_name}</td>
                    <td style={td}>{r.vehicle_type_name}</td>
                    <td style={td}>{r.trip_type}</td>
                    <td style={td}>₹{parseFloat(r.fixed_price).toLocaleString('en-IN')}</td>
                    <td style={td}><span className="badge">{r.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => startEdit(r)}>Edit</button>
                        <button
                          className="btn"
                          style={{ padding: '5px 10px', fontSize: 12, background: r.is_active ? '#fdecea' : '#e9f7ef', color: r.is_active ? 'var(--color-error)' : 'var(--color-success)' }}
                          onClick={() => handleToggleActive(r)}
                          disabled={rowBusyId === r.id}
                        >
                          {rowBusyId === r.id ? '…' : r.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {routes.length === 0 && <tr><td style={td} colSpan={6}>No fixed routes yet.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
