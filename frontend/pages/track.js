import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { trackBooking } from '../lib/api';

const STATUS_STEPS = [
  { key: 'pending', label: 'Received' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'assigned', label: 'Driver Assigned' },
  { key: 'completed', label: 'Completed' },
];

function currentStepIndex(status) {
  if (status === 'awaiting_payment') return 0;
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function StatusTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="error-banner" style={{ textAlign: 'center', fontWeight: 600 }}>
        This booking was cancelled
      </div>
    );
  }

  const activeIndex = currentStepIndex(status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
      {STATUS_STEPS.map((step, i) => (
        <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div
              className="mono"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                background: i <= activeIndex ? 'var(--color-primary)' : 'var(--color-bg)',
                color: i <= activeIndex ? 'white' : 'var(--color-text-muted)',
                border: i <= activeIndex ? 'none' : '1px solid var(--color-border)',
              }}
            >
              {i + 1}
            </div>
            <span style={{ fontSize: 11, color: i <= activeIndex ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: i <= activeIndex ? 600 : 400, textAlign: 'center', maxWidth: 80 }}>
              {step.label}
            </span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < activeIndex ? 'var(--color-primary)' : 'var(--color-border)', margin: '0 4px 20px' }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function TrackBookingPage() {
  const router = useRouter();
  const [reference, setReference] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function lookup(ref) {
    if (!ref || !ref.trim()) return;
    setLoading(true);
    setError('');
    setBooking(null);
    try {
      const result = await trackBooking(ref.trim());
      setBooking(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!router.isReady) return;
    const refFromUrl = router.query.ref;
    if (refFromUrl) {
      setReference(refFromUrl);
      lookup(refFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.ref]);

  function handleSubmit(e) {
    e.preventDefault();
    router.push(`/track?ref=${encodeURIComponent(reference.trim())}`, undefined, { shallow: true });
    lookup(reference);
  }

  return (
    <Layout
      title="Track Your Booking"
      description="Check the live status of your Roaming Route taxi booking using your booking reference."
      noindex
    >
      <div className="container" style={{ paddingTop: 40, maxWidth: 560, paddingBottom: 60 }}>
        <h1 className="signage">Track Your Booking</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Enter the reference number from your booking confirmation email.
        </p>

        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. 5nUCIgHSz68O"
            className="mono"
            style={{ flex: 1, padding: '11px 12px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 15 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Checking…' : 'Track'}
          </button>
        </form>

        {error && <div className="error-banner">{error}</div>}

        {booking && (
          <div className="card">
            <div className="eyebrow" style={{ marginBottom: 4 }}>Reference</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>
              {booking.booking_reference}
            </div>

            <StatusTimeline status={booking.booking_status} />

            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 0', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>Route</td>
                  <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid var(--color-border)' }}>
                    {booking.from_city_name || booking.from_address} → {booking.to_city_name || booking.to_address}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>Pickup Date</td>
                  <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid var(--color-border)' }}>{booking.pickup_date}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>Vehicle</td>
                  <td style={{ padding: '8px 0', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid var(--color-border)' }}>{booking.vehicle_type_name}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: 'var(--color-text-muted)' }}>Fare</td>
                  <td className="mono" style={{ padding: '8px 0', fontWeight: 700, textAlign: 'right', color: 'var(--color-primary)' }}>
                    ₹{parseFloat(booking.quoted_fare).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>

            {booking.driver_name && (
              <div style={{ marginTop: 20, padding: 16, background: 'var(--color-bg)', borderRadius: 10 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Your Driver</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{booking.driver_name}</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>
                  <a href={`tel:${booking.driver_phone}`} style={{ color: 'var(--color-primary)' }}>{booking.driver_phone}</a>
                </div>
                {booking.driver_vehicle_number && (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    Vehicle: {booking.driver_vehicle_number}
                  </div>
                )}
              </div>
            )}

            {booking.booking_status === 'cancelled' && booking.cancellation_reason && (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 16 }}>
                Reason: {booking.cancellation_reason}
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
