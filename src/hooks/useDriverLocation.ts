import { useEffect, useRef, useState, useCallback } from 'react';
import { emitDriverLocation } from '@/lib/socket';
import { useSocketStore } from '@/store/socketStore';
import { DriverService } from '@/services/driver.service';

export interface DriverGpsPosition {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
}

interface UseDriverLocationReturn {
  position: DriverGpsPosition | null;
  isTracking: boolean;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
}

const ACTIVE_RIDE_INTERVAL_MS = 3000; // 3 seconds during active ride
const IDLE_INTERVAL_MS = 8000;        // 8 seconds when online & waiting

interface UseDriverLocationOptions {
  hasActiveRide?: boolean;
  activeBookingId?: string;
}

/**
 * useDriverLocation — Continuous GPS tracking for the driver dashboard.
 *
 * Adaptive battery/bandwidth optimization:
 *  - Active ride: emits location every 3s
 *  - Idle / Waiting: emits location every 8s
 *  - Stopped: 0 emits
 */
export function useDriverLocation(options?: UseDriverLocationOptions): UseDriverLocationReturn {
  const hasActiveRide = options?.hasActiveRide ?? false;
  const activeBookingId = options?.activeBookingId;
  const [position, setPosition] = useState<DriverGpsPosition | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastEmitRef = useRef<number>(0);
  const isConnected = useSocketStore((s) => s.isConnected);

  const emitIntervalMs = hasActiveRide ? ACTIVE_RIDE_INTERVAL_MS : IDLE_INTERVAL_MS;

  const handlePosition = useCallback(
    (pos: GeolocationPosition) => {
      const next: DriverGpsPosition = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        accuracy: pos.coords.accuracy,
      };
      setPosition(next);

      // Adaptively throttle location updates based on ride state
      const now = Date.now();
      if (now - lastEmitRef.current >= emitIntervalMs) {
        lastEmitRef.current = now;

        const payload = {
          latitude: next.lat,
          longitude: next.lng,
          heading: next.heading ?? undefined,
          speed: next.speed ?? undefined,
          accuracy: next.accuracy ?? undefined,
        };

        if (isConnected) {
          emitDriverLocation({ ...payload, bookingId: activeBookingId } as any);
        }

        // Persistent REST update if driver has an active booking
        if (activeBookingId) {
          DriverService.updateLocation(activeBookingId, payload).catch((err) => {
            console.warn('[useDriverLocation] REST location update failed:', err.message);
          });
        }
      }
    },
    [isConnected, emitIntervalMs, activeBookingId],
  );

  const handlePositionRef = useRef(handlePosition);
  useEffect(() => {
    handlePositionRef.current = handlePosition;
  }, [handlePosition]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par ce navigateur.');
      return;
    }
    if (watchIdRef.current !== null) return; // already tracking

    setError(null);
    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handlePositionRef.current(pos),
      (err) => {
        console.warn('[useDriverLocation] Geolocation warning:', err.code, err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Permission de géolocalisation refusée.');
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
          setIsTracking(false);
        } else {
          // Temporary timeout or weak GPS signal: do not terminate watchPosition
          setError(null);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 5_000,
      },
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return { position, isTracking, error, startTracking, stopTracking };
}
