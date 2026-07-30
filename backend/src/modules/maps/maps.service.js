const { MAPBOX_ACCESS_TOKEN } = require('../../config/maps.config');

/**
 * Resolves a free-text address/place name to coordinates, biased to India.
 * Throws a clear, user-facing error if nothing matches — callers should
 * surface this directly rather than guessing a location.
 */
async function geocodeAddress(address) {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json` +
    `?access_token=${MAPBOX_ACCESS_TOKEN}&country=IN&limit=1`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Location lookup service returned an error. Please try again shortly.');
  }
  const data = await res.json();

  if (!data.features || data.features.length === 0) {
    throw new Error(`Could not find a matching location for "${address}". Try a more specific address.`);
  }

  const [lng, lat] = data.features[0].center;
  return { lat, lng, place_name: data.features[0].place_name };
}

/**
 * Geocodes both addresses, then asks Mapbox for the driving distance
 * between them. Returns distance in whole km plus the resolved place
 * names, so the UI can show the customer what location was actually
 * matched (useful for catching a wrong geocode before booking).
 */
async function getDrivingDistanceKm(fromAddress, toAddress) {
  const [origin, destination] = await Promise.all([
    geocodeAddress(fromAddress),
    geocodeAddress(toAddress),
  ]);

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    `?access_token=${MAPBOX_ACCESS_TOKEN}&overview=false`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Route calculation service returned an error. Please try again shortly.');
  }
  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('Could not find a driving route between these two locations.');
  }

  return {
    distance_km: Math.round(data.routes[0].distance / 1000),
    from_resolved: origin.place_name,
    to_resolved: destination.place_name,
  };
}

module.exports = { geocodeAddress, getDrivingDistanceKm };
