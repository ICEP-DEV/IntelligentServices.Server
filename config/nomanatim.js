import fetch from 'node-fetch';

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
if (!MAPBOX_TOKEN) {
  throw new Error("Missing MAPBOX_TOKEN in environment variables.");
}

async function geocodeAddress(address) {
  if (!address || typeof address !== 'string' || address.trim() === '') {
    console.warn("Geocode attempt with invalid address:", address);
    return null;
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.features || data.features.length === 0) {
        console.warn(`Geocoding failed for address: "${address}". No features found.`, data.message ? `API Message: ${data.message}`: '');
        return null;
    }

    return {
        lon: data.features[0].center[0],
        lat: data.features[0].center[1],
    };
  } catch (error) {
    console.error(`Geocoding error for address "${address}":`, error);
    return null;
  }
}

export { geocodeAddress };
