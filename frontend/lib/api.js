const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data.error || (Array.isArray(data.errors) ? data.errors.join(', ') : 'Request failed');
    throw new Error(message);
  }

  return data;
}

export const getCities = () => apiFetch('/api/cities');
export const getVehicleTypes = () => apiFetch('/api/vehicle-types');
export const getTripRoutes = () => apiFetch('/api/trip-routes');

export const getFareQuote = (payload) =>
  apiFetch('/api/fare/quote', { method: 'POST', body: JSON.stringify(payload) });

export const getCustomFareQuote = (payload) =>
  apiFetch('/api/fare/quote-custom', { method: 'POST', body: JSON.stringify(payload) });

export const createBooking = (payload) =>
  apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });

export const createPaymentOrder = (bookingId) =>
  apiFetch(`/api/payments/create-order/${bookingId}`, { method: 'POST' });

export const createEnquiry = (payload) =>
  apiFetch('/api/enquiries', { method: 'POST', body: JSON.stringify(payload) });

export const getTourPackages = () => apiFetch('/api/tour-packages');
export const getTourPackageBySlug = (slug) => apiFetch(`/api/tour-packages/${slug}`);

export default apiFetch;
