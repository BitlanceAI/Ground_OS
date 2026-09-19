/**
 * Utility functions for high-accuracy GPS tracking & geofencing.
 */

/**
 * Calculates the exact Haversine distance between two sets of GPS coordinates in meters.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

/**
 * Formats distance into human-readable format (meters or kilometers).
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Formats GPS coordinates to clean 5-decimal precision (~1.1 meter accuracy).
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}

/**
 * Returns a human-friendly accuracy rating badge color & text based on margin of error in meters.
 */
export function getAccuracyInfo(accuracyMeters: number | null): {
  label: string;
  badgeClass: string;
  color: string;
} {
  if (accuracyMeters === null) {
    return { label: 'Acquiring GPS...', badgeClass: 'badge-blue', color: '#3b82f6' };
  }
  if (accuracyMeters <= 5) {
    return { label: `High Precision (±${accuracyMeters.toFixed(1)}m)`, badgeClass: 'badge-emerald', color: '#10b981' };
  }
  if (accuracyMeters <= 15) {
    return { label: `Good Fix (±${accuracyMeters.toFixed(1)}m)`, badgeClass: 'badge-emerald', color: '#34d399' };
  }
  if (accuracyMeters <= 50) {
    return { label: `Moderate Fix (±${accuracyMeters.toFixed(1)}m)`, badgeClass: 'badge-gold', color: '#f59e0b' };
  }
  return { label: `Low Accuracy (±${accuracyMeters.toFixed(0)}m)`, badgeClass: 'badge-red', color: '#ef4444' };
}
