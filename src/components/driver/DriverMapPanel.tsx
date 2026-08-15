/// <reference types="google.maps" />
import { useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import type { Booking } from '@/types/booking.types';
import type { DriverGpsPosition } from '@/hooks/useDriverLocation';
import { Car, MapPin, Navigation } from 'lucide-react';


interface DriverMapPanelProps {
  driverPosition: DriverGpsPosition | null;
  activeBooking: Booking | null;
  rideState: 'waiting' | 'accepted' | 'in_progress' | 'completed';
}

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// Default center: Bordj Bou Arréridj
const DEFAULT_CENTER = { lat: 36.0711, lng: 4.7591 };

/**
 * DirectionsLayer — Renders a route polyline between two points using the Directions API.
 * Mounted only when origin and destination are both available.
 */
function DirectionsLayer({
  origin,
  destination,
}: {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
}) {
  const map = useMap();
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!map) return;

    const service = new google.maps.DirectionsService();
    if (!rendererRef.current) {
      rendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#FF9900',
          strokeWeight: 5,
          strokeOpacity: 0.85,
        },
      });
      rendererRef.current.setMap(map);
    }

    service.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          rendererRef.current?.setDirections(result);
        }
      },
    );

    return () => {
      // Cleanup is handled by the parent unmounting DirectionsLayer
    };
  }, [map, origin.lat, origin.lng, destination.lat, destination.lng]);

  // Clear renderer when unmounted
  useEffect(() => {
    return () => {
      rendererRef.current?.setMap(null);
      rendererRef.current = null;
    };
  }, []);

  return null;
}

/** Inner map content — needs to be inside APIProvider */
function MapContent({ driverPosition, activeBooking, rideState }: DriverMapPanelProps) {
  const driverLatLng = driverPosition
    ? { lat: driverPosition.lat, lng: driverPosition.lng }
    : null;

  const pickupLatLng = activeBooking
    ? {
        lat: activeBooking.pickupLat ?? activeBooking.pickupLatitude ?? DEFAULT_CENTER.lat,
        lng: activeBooking.pickupLng ?? activeBooking.pickupLongitude ?? DEFAULT_CENTER.lng,
      }
    : null;

  const destLatLng = activeBooking
    ? {
        lat: activeBooking.dropoffLat ?? activeBooking.destinationLatitude ?? DEFAULT_CENTER.lat,
        lng: activeBooking.dropoffLng ?? activeBooking.destinationLongitude ?? DEFAULT_CENTER.lng,
      }
    : null;

  const mapCenter = driverLatLng ?? DEFAULT_CENTER;

  return (
    <Map
      mapId="zaxi-driver-map"
      center={mapCenter}
      zoom={15}
      gestureHandling="greedy"
      disableDefaultUI={false}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Driver marker — always present */}
      {driverLatLng && (
        <AdvancedMarker position={driverLatLng} title="Votre position">
          <div
            style={{
              background: '#FF9900',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(255,153,0,0.55)',
              border: '3px solid #fff',
            }}
          >
            <Car style={{ color: '#fff', width: 20, height: 20 }} />
          </div>
        </AdvancedMarker>
      )}

      {/* ACCEPTED: show customer pickup marker + route from driver to pickup */}
      {(rideState === 'accepted') && pickupLatLng && (
        <>
          <AdvancedMarker position={pickupLatLng} title="Client (départ)">
            <div
              style={{
                background: '#22C55E',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(34,197,94,0.4)',
                border: '3px solid #fff',
              }}
            >
              <MapPin style={{ color: '#fff', width: 16, height: 16 }} />
            </div>
          </AdvancedMarker>
          {driverLatLng && (
            <DirectionsLayer origin={driverLatLng} destination={pickupLatLng} />
          )}
        </>
      )}

      {/* IN_PROGRESS: show both pickup + destination + route pickup → dest */}
      {rideState === 'in_progress' && pickupLatLng && destLatLng && (
        <>
          <AdvancedMarker position={pickupLatLng} title="Départ">
            <Pin background="#22C55E" borderColor="#fff" glyphColor="#fff" />
          </AdvancedMarker>
          <AdvancedMarker position={destLatLng} title="Destination">
            <div
              style={{
                background: '#111',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                border: '3px solid #fff',
              }}
            >
              <Navigation style={{ color: '#fff', width: 16, height: 16 }} />
            </div>
          </AdvancedMarker>
          <DirectionsLayer origin={pickupLatLng} destination={destLatLng} />
        </>
      )}
    </Map>
  );
}

/**
 * DriverMapPanel — Always-visible Google Maps panel for the driver dashboard.
 *
 * State-aware routing:
 *  waiting     → driver marker only
 *  accepted    → route: driver → customer pickup
 *  in_progress → route: pickup → destination
 *  completed   → resets to waiting (driver marker only)
 */
export function DriverMapPanel({ driverPosition, activeBooking, rideState }: DriverMapPanelProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 360,
        borderRadius: '20px',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }}
    >
      <APIProvider apiKey={GOOGLE_MAPS_KEY}>
        <MapContent
          driverPosition={driverPosition}
          activeBooking={activeBooking}
          rideState={rideState}
        />
      </APIProvider>

      {/* Ride state badge overlay */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          background: rideState === 'waiting'
            ? 'rgba(0,0,0,0.7)'
            : rideState === 'accepted'
            ? 'rgba(59,130,246,0.9)'
            : rideState === 'in_progress'
            ? 'rgba(34,197,94,0.9)'
            : 'rgba(107,114,128,0.8)',
          color: '#fff',
          borderRadius: '10px',
          padding: '6px 12px',
          fontSize: '11px',
          fontWeight: 700,
          backdropFilter: 'blur(6px)',
          pointerEvents: 'none',
        }}
      >
        {rideState === 'waiting' && '● En attente'}
        {rideState === 'accepted' && '● Route vers le client'}
        {rideState === 'in_progress' && '● Course en cours'}
        {rideState === 'completed' && '● Course terminée'}
      </div>

      {/* No GPS warning */}
      {!driverPosition && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239,68,68,0.9)',
            color: '#fff',
            borderRadius: '10px',
            padding: '6px 14px',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          GPS non activé
        </div>
      )}
    </div>
  );
}
