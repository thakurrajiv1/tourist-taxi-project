import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { getFareQuote, getCustomFareQuote, createBooking, createPaymentOrder } from '../lib/api';

export default function BookingPage() {
  const router = useRouter();
  const {
    mode,
    from_city_id,
    to_city_id,
    from_address,
    to_address,
    vehicle_type_id,
    trip_type,
    pickup_date,
    return_date,
  } = router.query;

  const isCustom = mode === 'custom';

  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentPreference, setPaymentPreference] = useState('pay_later');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);

  const searchParams = isCustom
    ? { from_address, to_address, vehicle_type_id, trip_type, pickup_date, return_date: return_date || undefined }
    : { from_city_id, to_city_id, vehicle_type_id, trip_type, pickup_date, return_date: return_date || undefined };

  useEffect(() => {
    if (!router.isReady) return;

    const hasRequiredFields = isCustom
      ? from_address && to_address && vehicle_type_id && trip_type && pickup_date
      : from_city_id && to_city_id && vehicle_type_id && trip_type && pickup_date;

    if (!hasRequiredFields) {
      setQuoteLoading(false);
      setQuoteError('Missing trip details. Please search again from the homepage.');
      return;
    }

    const quoteFn = isCustom ? getCustomFareQuote : getFareQuote;

    quoteFn(searchParams)
      .then((q) => {
        if (q.maps_enabled === false) {
          setQuoteError(q.message);
        } else {
          setQuote(q);
        }
        setQuoteLoading(false);
      })
      .catch((err) => {
        setQuoteError(err.message);
        setQuoteLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, mode, from_city_id, to_city_id, from_address, to_address, vehicle_type_id, trip_type, pickup_date, return_date]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    if (!name.trim() || !phone.trim()) {
      setSubmitError('Name and phone number are required.');
      return;
    }

    setSubmitting(true);
    try {
      const bookingResult = await createBooking({
        ...searchParams,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || undefined,
        payment_preference: paymentPreference,
      });

      let paymentInfo = null;
      if (bookingResult.payment_required) {
        paymentInfo = await createPaymentOrder(bookingResult.booking.id);
      }

      setResult({ ...bookingResult, paymentInfo });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (quoteLoading) {
    return (
      <Layout title="Booking">
        <div className="container" style={{ paddingTop: 40 }}>
          <p>Loading your fare…</p>
        </div>
      </Layout>
    );
  }

  if (quoteError) {
    return (
      <Layout title="Booking">
        <div className="container" style={{ paddingTop: 40 }}>
          <div className="error-banner">{quoteError}</div>
          <a href="/" className="btn btn-secondary" style={{ marginTop: 12 }}>
            Back to Search
          </a>
        </div>
      </Layout>
    );
  }

  // Confirmation view, shown after a successful booking
  if (result) {
    const { booking, paymentInfo } = result;
    return (
      <Layout title="Booking Confirmed">
        <div className="container" style={{ paddingTop: 40, maxWidth: 560 }}>
          <div className="card">
            <div className="success-banner">
              Booking received! Reference #{booking.id}
            </div>
            <h2 style={{ fontSize: 20 }}>Trip Summary</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              Fare: <strong>₹{parseFloat(booking.quoted_fare).toLocaleString('en-IN')}</strong>
              <br />
              Status: <strong>{booking.booking_status}</strong>
            </p>

            {paymentInfo && paymentInfo.payment_gateway_enabled === false && (
              <div className="error-banner" style={{ background: '#fff8e6', color: '#8a6116', border: '1px solid #f0dca0' }}>
                {paymentInfo.message}
              </div>
            )}

            {paymentInfo && paymentInfo.payment_gateway_enabled && (
              <p style={{ fontSize: 14 }}>
                An advance of ₹{paymentInfo.amount} is due. Payment checkout would open here once
                connected to the Razorpay widget.
              </p>
            )}

            {!paymentInfo && (
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                Our team will contact you at {phone} shortly to confirm your trip.
              </p>
            )}

            <a href="/" className="btn btn-secondary" style={{ marginTop: 12 }}>
              Back to Home
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // Booking form view
  return (
    <Layout title="Complete Your Booking">
      <div className="container" style={{ paddingTop: 40, maxWidth: 560 }}>
        <h1 style={{ fontSize: 26 }}>Complete Your Booking</h1>

        {isCustom && quote && (quote.from_resolved || quote.to_resolved) && (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: -8, marginBottom: 12 }}>
            Matched to: {quote.from_resolved} → {quote.to_resolved}. Not right? Go back and refine
            your search.
          </p>
        )}

        {quote && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Fare</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-navy)' }}>
              ₹{quote.fare.toLocaleString('en-IN')}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          {submitError && <div className="error-banner">{submitError}</div>}

          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email (optional)</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <label>Payment Preference</label>
            <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  checked={paymentPreference === 'pay_later'}
                  onChange={() => setPaymentPreference('pay_later')}
                />
                Pay Later
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  checked={paymentPreference === 'pay_now'}
                  onChange={() => setPaymentPreference('pay_now')}
                />
                Pay Now
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
