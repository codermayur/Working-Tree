const OPENCAGE_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;

export async function reverseGeocode(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Invalid coordinates');
  }

  if (!OPENCAGE_KEY) {
    // Fallback: just return lat/lng as text if key missing
    return {
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      components: {},
    };
  }

  const url = new URL('https://api.opencagedata.com/geocode/v1/json');
  url.searchParams.set('q', `${lat},${lng}`);
  url.searchParams.set('key', OPENCAGE_KEY);
  url.searchParams.set('language', 'en');
  url.searchParams.set('no_annotations', '1');
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Failed to reverse geocode location');
  }

  const data = await res.json();
  const result = Array.isArray(data.results) ? data.results[0] : null;
  if (!result) {
    return {
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      components: {},
    };
  }

  const {
    formatted,
    components = {},
  } = result;

  return {
    address: formatted || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    components,
  };
}

