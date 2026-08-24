import { getToken, clearToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export class UnauthorizedError extends Error {}

async function adminFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    clearToken();
    throw new UnauthorizedError(data.error || 'Session expired, please log in again');
  }

  if (!res.ok) {
    const message =
      data.error || (Array.isArray(data.errors) ? data.errors.join(', ') : 'Request failed');
    throw new Error(message);
  }

  return data;
}

export async function adminLogin(email, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

// Bookings
export const getBookings = () => adminFetch('/api/bookings');
export const confirmBooking = (id) => adminFetch(`/api/bookings/${id}/confirm`, { method: 'POST' });
export const cancelBooking = (id, reason) =>
  adminFetch(`/api/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
export const assignDriver = (id, driverId) =>
  adminFetch(`/api/bookings/${id}/assign-driver`, { method: 'POST', body: JSON.stringify({ driver_id: driverId }) });

// Drivers
export const getDrivers = () => adminFetch('/api/drivers');
export const createDriver = (payload) => adminFetch('/api/drivers', { method: 'POST', body: JSON.stringify(payload) });
export const updateDriver = (id, payload) => adminFetch(`/api/drivers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deactivateDriver = (id) => adminFetch(`/api/drivers/${id}`, { method: 'DELETE' });

// Cities
export const getCitiesAdmin = () => adminFetch('/api/cities/admin');
export const createCity = (payload) => adminFetch('/api/cities', { method: 'POST', body: JSON.stringify(payload) });
export const updateCity = (id, payload) => adminFetch(`/api/cities/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deactivateCity = (id) => adminFetch(`/api/cities/${id}`, { method: 'DELETE' });

// Vehicle Types
export const getVehicleTypesAdmin = () => adminFetch('/api/vehicle-types/admin');
export const createVehicleType = (payload) => adminFetch('/api/vehicle-types', { method: 'POST', body: JSON.stringify(payload) });
export const updateVehicleType = (id, payload) => adminFetch(`/api/vehicle-types/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deactivateVehicleType = (id) => adminFetch(`/api/vehicle-types/${id}`, { method: 'DELETE' });

// Trip Routes
export const getTripRoutesAdmin = () => adminFetch('/api/trip-routes/admin');
export const createTripRoute = (payload) => adminFetch('/api/trip-routes', { method: 'POST', body: JSON.stringify(payload) });
export const updateTripRoute = (id, payload) => adminFetch(`/api/trip-routes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deactivateTripRoute = (id) => adminFetch(`/api/trip-routes/${id}`, { method: 'DELETE' });

// Enquiries
export const getEnquiries = () => adminFetch('/api/enquiries');
export const deleteEnquiry = (id) => adminFetch(`/api/enquiries/${id}`, { method: 'DELETE' });

// Tour Packages
export const getTourPackagesAdmin = () => adminFetch('/api/tour-packages/admin');
export const getTourPackageAdmin = (id) => adminFetch(`/api/tour-packages/admin/${id}`);
export const createTourPackage = (payload) => adminFetch('/api/tour-packages', { method: 'POST', body: JSON.stringify(payload) });
export const updateTourPackage = (id, payload) => adminFetch(`/api/tour-packages/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
export const deactivateTourPackage = (id) => adminFetch(`/api/tour-packages/${id}`, { method: 'DELETE' });

// City Distances
export const getCityDistances = () => adminFetch('/api/city-distances');
export const upsertCityDistance = (payload) => adminFetch('/api/city-distances', { method: 'POST', body: JSON.stringify(payload) });
export const deleteCityDistance = (id) => adminFetch(`/api/city-distances/${id}`, { method: 'DELETE' });
