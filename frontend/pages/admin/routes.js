import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRequireAuth } from '../../lib/useRequireAuth';
import { createTripRoute, UnauthorizedError } from '../../lib/adminApi';
import { getCities, getVehicleTypes, getTripRoutes } from '../../lib/api';

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

  const [fromCityId, setFromCityId] = useState('');
  const [toCityId, setToCityId] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [tripType, setTripType] = useState('one_way');
  const [distanceKm, setDistanceKm] = useState('');
  const [fixedPrice, setFixedPrice] = useState('');
  const [seoSlug, setSeoSlug] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [routesData, citiesData, vehicleTypesData] = await Promise.all([
        getTripRoutes(),
        getCities(),
        getVehicleTypes(),
      ]);
      setRoutes(routesData);
      setCities(citiesData);
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

    if (!fromCityId || !toCityId || !vehicleTypeId || !fixedPrice) {
      setFormError('From city, to city, vehicle type, and fixed price are required.');
      return;
    }
    if (fromCityId === toCityId) {
      setFormError('From and to city cannot be the same.');
      return;
    }

    setSubmitting(true);
    try {
      await createTripRoute({
        from_city_id: fromCityId,
        to_city_id: toCityId,
        vehicle_type_id: vehicleTypeId,
        trip_type: tripType,
        distance_km: distanceKm || undefined,
        fixed_price: fixedPrice,
        seo_slug: seoSlug || undefined,
      });
      setFromCityId('');
      setToCityId('');
      setVehicleTypeId('');
      setTripType('one_way');
      setDistanceKm('');
      setFixedPrice('');
      setSeoSlug('');
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
    <AdminLayout title="Fixed Routes">
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ fontSize: 16 }}>Add Fixed Route</h3>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: -8, marginBottom: 12 }}>
            Overrides the calculated fare for this exact route + vehicle + trip type.
          </p>
          {formError && <div className="error-banner">{formError}</div>}

          <div className="field">
            <label htmlFor="rfrom">From City</label>
            <select id="rfrom" value={fromCityId} onChange={(e) => setFromCityId(e.target.value)}>
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="rto">To City</label>
            <select id="rto" value={toCityId} onChange={(e) => setToCityId(e.target.value)}>
              <option value="">Select city</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="rvehicle">Vehicle Type</label>
            <select id="rvehicle" value={vehicleTypeId} onChange={(e) => setVehicleTypeId(e.target.value)}>
              <option value="">Select vehicle</option>
              {vehicleTypes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="rtrip">Trip Type</label>
            <select id="rtrip" value={tripType} onChange={(e) => setTripType(e.target.value)}>
              {TRIP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="rdist">Distance (km, optional)</label>
            <input id="rdist" type="number" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="rprice">Fixed Price (₹)</label>
            <input
              id="rprice"
              type="number"
              step="0.01"
              value={fixedPrice}
              onChange={(e) => setFixedPrice(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="rslug">SEO Slug (optional)</label>
            <input
              id="rslug"
              placeholder="delhi-to-manali-taxi"
              value={seoSlug}
              onChange={(e) => setSeoSlug(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Route'}
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
                  <th style={th}>Route</th>
                  <th style={th}>Vehicle</th>
                  <th style={th}>Trip</th>
                  <th style={th}>Price</th>
                  <th style={th}>Slug</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={td}>
                      {r.from_city_name} → {r.to_city_name}
                    </td>
                    <td style={td}>{r.vehicle_type_name}</td>
                    <td style={td}>{r.trip_type}</td>
                    <td style={td}>₹{parseFloat(r.fixed_price).toLocaleString('en-IN')}</td>
                    <td style={td}>{r.seo_slug || '—'}</td>
                  </tr>
                ))}
                {routes.length === 0 && (
                  <tr>
                    <td style={td} colSpan={5}>
                      No fixed routes yet.
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
