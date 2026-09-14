// ============================================================
// MAPS & GEOLOCATION ADAPTER (Mock / Production)
// ============================================================

export interface LocationVerificationResult {
  verified: boolean;
  distanceMeters: number;
  accuracy: number;
}

export interface RouteEstimate {
  distanceKm: number;
  durationMinutes: number;
  steps: string[];
}

export class MockMapsProvider {
  async verifyGeofence(
    agentLat: number,
    agentLng: number,
    targetLat: number,
    targetLng: number,
    radiusMeters = 100
  ): Promise<LocationVerificationResult> {
    // Haversine formula
    const R = 6371e3; // metres
    const φ1 = (agentLat * Math.PI) / 180;
    const φ2 = (targetLat * Math.PI) / 180;
    const Δφ = ((targetLat - agentLat) * Math.PI) / 180;
    const Δλ = ((targetLng - agentLng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = Math.round(R * c);

    return {
      verified: distanceMeters <= radiusMeters,
      distanceMeters,
      accuracy: 5.0,
    };
  }

  async calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<RouteEstimate> {
    return {
      distanceKm: 4.8,
      durationMinutes: 14,
      steps: [
        'Head north on Main Ring Road',
        'Turn right onto Sector 62 Expressway',
        'Destination will be on the left',
      ],
    };
  }
}

export function getMapsProvider() {
  return new MockMapsProvider();
}
