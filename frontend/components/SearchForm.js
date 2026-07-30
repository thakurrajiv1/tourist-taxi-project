import { useState } from 'react';

const TRIP_TYPES = [
  { value: 'one_way', label: 'One Way' },
  { value: 'round_trip', label: 'Round Trip' },
  { value: 'local', label: 'Local / Full Day' },
];

export default function SearchForm({ cities, vehicleTypes, onSearch, loading }) {
  const [mode, setMode] = useState('city'); // 'city' | 'custom'

  const [fromCityId, setFromCityId] = useState('');
  const [toCityId, setToCityId] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');

  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [tripType, setTripType] = useState('one_way');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [formError, setFormError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!vehicleTypeId || !pickupDate) {
      setFormError('Please fill in vehicle and pickup date.');
      return;
    }
    if (tripType === 'round_trip' && !returnDate) {
      setFormError('Please choose a return date for a round trip.');
      return;
    }

    if (mode === 'city') {
      if (!fromCityId || !toCityId) {
        setFormError('Please select a pickup city and a drop city.');
        return;
      }
      if (fromCityId === toCityId) {
        setFormError('Pickup and drop city cannot be the same.');
        return;
      }
      onSearch({
        mode: 'city',
        from_city_id: fromCityId,
        to_city_id: toCityId,
        vehicle_type_id: vehicleTypeId,
        trip_type: tripType,
        pickup_date: pickupDate,
        return_date: tripType === 'round_trip' ? returnDate : undefined,
      });
    } else {
      if (!fromAddress.trim() || !toAddress.trim()) {
        setFormError('Please enter both a pickup and a drop location.');
        return;
      }
      onSearch({
        mode: 'custom',
        from_address: fromAddress.trim(),
        to_address: toAddress.trim(),
        vehicle_type_id: vehicleTypeId,
        trip_type: tripType,
        pickup_date: pickupDate,
        return_date: tripType === 'round_trip' ? returnDate : undefined,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setMode('city')}
          className={mode === 'city' ? 'btn btn-secondary' : 'btn'}
          style={{
            padding: '7px 14px',
            fontSize: 13,
            background: mode === 'city' ? undefined : 'var(--color-bg)',
            color: mode === 'city' ? undefined : 'var(--color-text-muted)',
            border: mode === 'city' ? 'none' : '1px solid var(--color-border)',
          }}
        >
          Choose from Cities
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={mode === 'custom' ? 'btn btn-secondary' : 'btn'}
          style={{
            padding: '7px 14px',
            fontSize: 13,
            background: mode === 'custom' ? undefined : 'var(--color-bg)',
            color: mode === 'custom' ? undefined : 'var(--color-text-muted)',
            border: mode === 'custom' ? 'none' : '1px solid var(--color-border)',
          }}
        >
          Enter Custom Location
        </button>
      </div>

      {formError && <div className="error-banner">{formError}</div>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
        }}
      >
        {mode === 'city' ? (
          <>
            <div className="field">
              <label htmlFor="fromCity">From</label>
              <select id="fromCity" value={fromCityId} onChange={(e) => setFromCityId(e.target.value)}>
                <option value="">Select city</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="toCity">To</label>
              <select id="toCity" value={toCityId} onChange={(e) => setToCityId(e.target.value)}>
                <option value="">Select city</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="fromAddress">Pickup Location</label>
              <input
                id="fromAddress"
                type="text"
                placeholder="e.g. XYZ Resort, Manali"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="toAddress">Drop Location</label>
              <input
                id="toAddress"
                type="text"
                placeholder="e.g. ABC Homestay, Kasol"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="tripType">Trip Type</label>
          <select id="tripType" value={tripType} onChange={(e) => setTripType(e.target.value)}>
            {TRIP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="vehicleType">Vehicle</label>
          <select
            id="vehicleType"
            value={vehicleTypeId}
            onChange={(e) => setVehicleTypeId(e.target.value)}
          >
            <option value="">Select vehicle</option>
            {vehicleTypes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.seater_capacity} seater)
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="pickupDate">Pickup Date</label>
          <input
            id="pickupDate"
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
          />
        </div>

        {tripType === 'round_trip' && (
          <div className="field">
            <label htmlFor="returnDate">Return Date</label>
            <input
              id="returnDate"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
        )}
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? 'Checking Fare…' : 'Get Fare & Book'}
      </button>
    </form>
  );
}
