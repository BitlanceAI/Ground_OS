import { useState, useEffect, useCallback, useRef } from 'react';

export interface GPSState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null; // meters
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  isLocating: boolean;
  error: string | null;
  status: 'IDLE' | 'LOCATING' | 'HIGH_ACCURACY_LOCK' | 'LOW_ACCURACY' | 'ERROR' | 'UNSUPPORTED';
}

interface UseHighAccuracyGPSOptions {
  autoStart?: boolean;
  agentId?: string;
  onLocationUpdate?: (location: { latitude: number; longitude: number; accuracy: number }) => void;
}

export function useHighAccuracyGPS(options: UseHighAccuracyGPSOptions = {}) {
  const { autoStart = true, agentId, onLocationUpdate } = options;

  const [gpsState, setGpsState] = useState<GPSState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    heading: null,
    speed: null,
    timestamp: null,
    isLocating: autoStart,
    error: null,
    status: autoStart ? 'LOCATING' : 'IDLE',
  });

  const watchIdRef = useRef<number | null>(null);

  const postLocationToApi = useCallback(async (lat: number, lng: number, acc: number) => {
    if (!agentId) return;
    try {
      await fetch(`/api/v1/agents/${agentId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // Non-critical background sync
      console.warn('[GPS] API sync failed:', err);
    }
  }, [agentId]);

  const handlePositionSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
    const timestamp = position.timestamp;

    const isHighPrecision = accuracy <= 15;
    const newStatus = isHighPrecision ? 'HIGH_ACCURACY_LOCK' : 'LOW_ACCURACY';

    setGpsState({
      latitude,
      longitude,
      accuracy,
      altitude,
      heading,
      speed,
      timestamp,
      isLocating: false,
      error: null,
      status: newStatus,
    });

    if (onLocationUpdate) {
      onLocationUpdate({ latitude, longitude, accuracy });
    }

    if (agentId) {
      postLocationToApi(latitude, longitude, accuracy);
    }
  }, [onLocationUpdate, agentId, postLocationToApi]);

  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Failed to obtain GPS fix.';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied by user or browser setting.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'GPS position unavailable. Please ensure location services are enabled.';
        break;
      case error.TIMEOUT:
        errorMessage = 'GPS hardware lock timed out. Retrying with network location...';
        break;
    }

    setGpsState(prev => ({
      ...prev,
      isLocating: false,
      error: errorMessage,
      status: 'ERROR',
    }));
  }, []);

  const requestGPSPosition = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsState(prev => ({
        ...prev,
        isLocating: false,
        error: 'Geolocation is not supported by this browser.',
        status: 'UNSUPPORTED',
      }));
      return;
    }

    setGpsState(prev => ({ ...prev, isLocating: true, error: null, status: 'LOCATING' }));

    // Force high accuracy hardware GNSS lookup with zero max age
    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      (err) => {
        // If high accuracy times out, attempt fallback without strict hardware high accuracy
        if (err.code === err.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            handlePositionSuccess,
            handlePositionError,
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 5000 }
          );
        } else {
          handlePositionError(err);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0, // Force fresh satellite/hardware sensor scan
        timeout: 15000,
      }
    );
  }, [handlePositionSuccess, handlePositionError]);

  const startWatch = useCallback(() => {
    if (!('geolocation' in navigator)) return;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setGpsState(prev => ({ ...prev, isLocating: true, error: null, status: 'LOCATING' }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );
  }, [handlePositionSuccess, handlePositionError]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoStart) {
      startWatch();
    }
    return () => {
      stopWatch();
    };
  }, [autoStart, startWatch, stopWatch]);

  return {
    ...gpsState,
    requestGPSPosition,
    startWatch,
    stopWatch,
  };
}
