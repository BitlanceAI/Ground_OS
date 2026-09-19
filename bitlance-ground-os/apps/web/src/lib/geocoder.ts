// ============================================================
// GEOCODER UTILITY — Resolves Addresses to Real GPS Coordinates
// Instant lookup for popular Indian cities & neighborhoods + Nominatim fallback
// ============================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

const LOCAL_COORDINATES: Record<string, Coordinates> = {
  'dwarka': { lat: 28.5921, lng: 77.0460 },
  'dwarka delhi': { lat: 28.5921, lng: 77.0460 },
  'dwarka sec': { lat: 28.5800, lng: 77.0500 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'connaught place': { lat: 28.6304, lng: 77.2177 },
  'cp': { lat: 28.6304, lng: 77.2177 },
  'south delhi': { lat: 28.5244, lng: 77.2167 },
  'saket': { lat: 28.5244, lng: 77.2167 },
  'hauz khas': { lat: 28.5494, lng: 77.2001 },
  'karol bagh': { lat: 28.6514, lng: 77.1907 },
  'chandni chowk': { lat: 28.6506, lng: 77.2303 },
  'rohini': { lat: 28.7495, lng: 77.0565 },
  'janakpuri': { lat: 28.6219, lng: 77.0878 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'sector 62 noida': { lat: 28.6280, lng: 77.3649 },
  'sector 63 noida': { lat: 28.6255, lng: 77.3780 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'andheri': { lat: 19.1136, lng: 72.8697 },
  'andheri west': { lat: 19.1236, lng: 72.8371 },
};

export async function geocodeAddress(address: string): Promise<Coordinates> {
  const query = (address || '').toLowerCase().trim();
  if (!query) {
    return { lat: 28.5921, lng: 77.0460 }; // Default to Dwarka, Delhi
  }

  // 1. Direct dictionary match
  for (const [key, coords] of Object.entries(LOCAL_COORDINATES)) {
    if (query.includes(key)) {
      return coords;
    }
  }

  // 2. Fetch from OpenStreetMap Nominatim
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
  } catch (err) {
    console.warn('[Geocoder] Nominatim fetch error:', err);
  }

  // 3. Smart fallback: if contains delhi, place in Delhi; else default Dwarka
  if (query.includes('delhi') || query.includes('dwarka') || query.includes('ncr')) {
    return { lat: 28.5921, lng: 77.0460 };
  }

  return { lat: 28.6139, lng: 77.2090 };
}
