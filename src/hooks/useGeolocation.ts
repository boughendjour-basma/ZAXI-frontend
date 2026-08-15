import { useState, useCallback } from 'react';
import apiClient from '@/api/axios';
import type { ApiResponse } from '@/types/api.types';

export interface GpsLocation {
  lat: number;
  lng: number;
  address: string;
}

type GeolocationStatus = 'idle' | 'detecting' | 'success' | 'denied' | 'error';

interface UseGeolocationReturn {
  location: GpsLocation | null;
  status: GeolocationStatus;
  /** Call this to trigger GPS detection + reverse geocoding */
  detect: () => void;
  /** Allow user to manually override the address text */
  setAddress: (address: string) => void;
  /** Allow the user to manually override coords (e.g. if they type an address) */
  setManual: (lat: number, lng: number, address: string) => void;
  reset: () => void;
}

/**
 * useGeolocation — On-demand GPS detection for the customer booking form.
 *
 * Flow:
 *  1. detect() called → browser asks permission
 *  2. On success → POST /public/reverse-geocode { lat, lng } → backend returns address
 *  3. status = 'success', location is set
 *  4. On denial or error → status = 'denied' | 'error', user can type manually
 *
 * Reverse geocoding is intentionally done backend-side to protect the API key.
 */
export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GpsLocation | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }

    setStatus('detecting');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        try {
          // 1. First try backend reverse-geocode endpoint (protects key)
          const res = await apiClient.post<ApiResponse<{ address: string }>>(
            '/public/reverse-geocode',
            { lat, lng },
          );
          const address = res.data?.data?.address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setLocation({ lat, lng, address });
          setStatus('success');
        } catch {
          // 2. Fallback: try free OpenStreetMap Nominatim API (no API key required)
          try {
            const nomRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`,
            );
            const nomData = await nomRes.json();
            const nomAddress = nomData.display_name
              ? nomData.display_name.split(',').slice(0, 3).join(',')
              : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setLocation({ lat, lng, address: nomAddress });
            setStatus('success');
          } catch {
            // 3. Final fallback: display raw coordinates
            setLocation({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
            setStatus('success');
          }
        }
      },
      (err) => {
        console.warn('[useGeolocation] Error:', err.message);
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 30_000,
      },
    );
  }, []);

  const setAddress = useCallback((address: string) => {
    setLocation((prev) => (prev ? { ...prev, address } : null));
  }, []);

  const setManual = useCallback((lat: number, lng: number, address: string) => {
    setLocation({ lat, lng, address });
    setStatus('success');
  }, []);

  const reset = useCallback(() => {
    setLocation(null);
    setStatus('idle');
  }, []);

  return { location, status, detect, setAddress, setManual, reset };
}
