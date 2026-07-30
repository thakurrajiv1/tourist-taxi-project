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
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data; // { token, admin }
}

export const getBookings = () => adminFetch('/api/bookings');
export const confirmBooking = (id) => adminFetch(`/api/bookings/${id}/confirm`, { method: 'POST' });
export const assignDriver = (id, driverId) =>
  adminFetch(`/api/bookings/${id}/assign-driver`, {
    method: 'POST',
    body: JSON.stringify({ driver_id: driverId }),
  });

export const getDrivers = () => adminFetch('/api/drivers');
export const createDriver = (payload) =>
  adminFetch('/api/drivers', { method: 'POST', body: JSON.stringify(payload) });
