// ============================================================
// GEOCODER UTILITY — Resolves Real Places & Device GPS Coordinates
// Powered by OpenStreetMap Photon & Nominatim APIs with full India & global coverage
// ============================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PlaceSuggestion {
  name: string;
  displayName: string;
  locality?: string;
  city?: string;
  state?: string;
  lat: number;
  lng: number;
}

/**
 * Search places and addresses with fuzzy search & autocomplete
 * Uses Photon (OpenStreetMap) + Nominatim fallback
 */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = (query || '').trim();
  if (!q || q.length < 2) return [];

  const results: PlaceSuggestion[] = [];

  // 1. Photon API — ultra-fast fuzzy geocoder with India points of interest
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.features)) {
        for (const f of data.features) {
          const props = f.properties || {};
          const coords = f.geometry?.coordinates;
          if (coords && coords.length >= 2) {
            const lng = coords[0];
            const lat = coords[1];
            const parts = [
              props.name,
              props.street,
              props.district || props.locality,
              props.city,
              props.state,
            ].filter(Boolean);
            const displayName = parts.length > 0 ? parts.join(', ') : (props.name || q);

            results.push({
              name: props.name || q,
              displayName,
              locality: props.locality || props.district,
              city: props.city,
              state: props.state,
              lat,
              lng,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Geocoder] Photon search error:', err);
  }

  // 2. Nominatim fallback if Photon returned no items
  if (results.length === 0) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            if (!isNaN(lat) && !isNaN(lng)) {
              results.push({
                name: item.name || item.display_name.split(',')[0],
                displayName: item.display_name,
                city: item.address?.city || item.address?.state_district,
                state: item.address?.state,
                lat,
                lng,
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Geocoder] Nominatim search error:', err);
    }
  }

  return results;
}

/**
 * Geocode an address/place to exact GPS coordinates
 */
export async function geocodeAddress(
  address: string,
  businessName?: string
): Promise<{ lat: number; lng: number; displayName: string }> {
  const query = (address || '').trim();
  if (!query) {
    return { lat: 28.5921, lng: 77.0460, displayName: 'Delhi NCR' };
  }

  // If business name is provided, try searching business + address first
  if (businessName && businessName.trim()) {
    const combined = `${businessName.trim()} ${query}`;
    const suggestions = await searchPlaces(combined);
    if (suggestions.length > 0) {
      return {
        lat: suggestions[0].lat,
        lng: suggestions[0].lng,
        displayName: suggestions[0].displayName,
      };
    }
  }

  // Direct address search
  const suggestions = await searchPlaces(query);
  if (suggestions.length > 0) {
    return {
      lat: suggestions[0].lat,
      lng: suggestions[0].lng,
      displayName: suggestions[0].displayName,
    };
  }

  // If no exact match, fallback to city/region default or Delhi NCR
  return { lat: 28.5921, lng: 77.0460, displayName: query };
}

/**
 * Reverse geocode coordinates to human-readable address/neighborhood
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const parts = [
          addr.suburb || addr.neighbourhood || addr.road,
          addr.city || addr.town || addr.city_district,
          addr.state,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : data.display_name;
      }
    }
  } catch (err) {
    console.warn('[Geocoder] Reverse geocode error:', err);
  }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/**
 * Obtain current device GPS coordinates and resolve address
 */
export function getCurrentDeviceLocation(): Promise<{
  lat: number;
  lng: number;
  accuracy: number;
  address: string;
}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        const address = await reverseGeocode(lat, lng);
        resolve({ lat, lng, accuracy, address });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
}
