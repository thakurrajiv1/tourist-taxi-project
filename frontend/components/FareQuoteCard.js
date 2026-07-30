export default function FareQuoteCard({ quote, onBookNow }) {
  if (!quote) return null;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Estimated Fare</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-navy)' }}>
            ₹{quote.fare.toLocaleString('en-IN')}
          </div>
        </div>
        {quote.distance_km && (
          <span className="badge">{Math.round(quote.distance_km)} km</span>
        )}
      </div>

      {quote.breakdown && quote.source === 'calculated' && (
        <div style={{ marginTop: 16, fontSize: 14, color: 'var(--color-text-muted)' }}>
          <div>Distance cost: ₹{quote.breakdown.distance_cost}</div>
          <div>Base fare: ₹{quote.breakdown.base_fare}</div>
          <div>Driver allowance: ₹{quote.breakdown.driver_allowance}</div>
          {quote.breakdown.night_halt_charge > 0 && (
            <div>Night halt charge: ₹{quote.breakdown.night_halt_charge}</div>
          )}
        </div>
      )}

      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 12 }}>
        Toll, parking, and state permit charges (if any) are extra, paid directly during the
        trip.
      </p>

      <button className="btn btn-secondary btn-block" onClick={onBookNow} style={{ marginTop: 8 }}>
        Book This Cab
      </button>
    </div>
  );
}
