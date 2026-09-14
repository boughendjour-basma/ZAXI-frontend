import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Booking } from '@/types/booking.types';
import type { DriverGpsPosition } from '@/hooks/useDriverLocation';
// ─── Fix Leaflet default marker icons (broken in Vite) ───────────────────────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

// ─── Custom div icons ─────────────────────────────────────────────────────────
function makeDivIcon(color: string, label: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};border-radius:50%;width:40px;height:40px;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 14px ${color}88;border:3px solid #fff;
      font-size:10px;font-weight:700;color:#fff;
    ">${label}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

const driverIcon = makeDivIcon('#FF9900', '🚗');
const pickupIcon = makeDivIcon('#22C55E', '📍');
const destIcon   = makeDivIcon('#111111', '🏁');

// ─── OSRM route fetcher ───────────────────────────────────────────────────────
async function fetchOsrmRoute(
  from: [number, number],
  to: [number, number],
): Promise<[number, number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.code === 'Ok' && json.routes?.[0]) {
      return json.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]);
    }
  } catch {
    // Fall back to straight line
  }
  return [from, to];
}

// ─── Inner component that draws the route ────────────────────────────────────
interface RouteLayerProps {
  from: [number, number];
  to: [number, number];
  color?: string;
}

function RouteLayer({ from, to, color = '#FF9900' }: RouteLayerProps) {
  const map = useMap();
  const polyRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchOsrmRoute(from, to).then((coords) => {
      if (cancelled) return;
      if (polyRef.current) {
        polyRef.current.setLatLngs(coords);
      } else {
        polyRef.current = L.polyline(coords, { color, weight: 5, opacity: 0.85 }).addTo(map);
      }
      if (coords.length > 0) map.fitBounds(L.polyline(coords).getBounds(), { padding: [40, 40] });
    });
    return () => {
      cancelled = true;
      polyRef.current?.remove();
      polyRef.current = null;
    };
  }, [from[0], from[1], to[0], to[1], map, color]);

  return null;
}

// ─── Map re-center helper ─────────────────────────────────────────────────────
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center[0], center[1]]);
  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface DriverMapPanelProps {
  driverPosition: DriverGpsPosition | null;
  activeBooking: Booking | null;
  rideState: 'waiting' | 'accepted' | 'in_progress' | 'completed';
}

const DEFAULT_CENTER: [number, number] = [36.0711, 4.7591]; // BBA

/**
 * DriverMapPanel — Leaflet (OpenStreetMap) map for the driver dashboard.
 * No API key required.
 *
 * waiting     → driver marker only
 * accepted    → route: driver → customer pickup
 * in_progress → route: pickup → destination
 * completed   → resets to waiting (driver marker only)
 */
export function DriverMapPanel({ driverPosition, activeBooking, rideState }: DriverMapPanelProps) {
  const driverLatLng: [number, number] | null = driverPosition
    ? [driverPosition.lat, driverPosition.lng]
    : null;

  const pickupLatLng: [number, number] | null = activeBooking
    ? [
        activeBooking.pickupLat ?? activeBooking.pickupLatitude ?? DEFAULT_CENTER[0],
        activeBooking.pickupLng ?? activeBooking.pickupLongitude ?? DEFAULT_CENTER[1],
      ]
    : null;

  const destLatLng: [number, number] | null = activeBooking
    ? [
        activeBooking.dropoffLat ?? activeBooking.destinationLatitude ?? DEFAULT_CENTER[0],
        activeBooking.dropoffLng ?? activeBooking.destinationLongitude ?? DEFAULT_CENTER[1],
      ]
    : null;

  const mapCenter = driverLatLng ?? DEFAULT_CENTER;

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1000,
    background:
      rideState === 'waiting'     ? 'rgba(0,0,0,0.7)'      :
      rideState === 'accepted'    ? 'rgba(59,130,246,0.9)'  :
      rideState === 'in_progress' ? 'rgba(34,197,94,0.9)'   :
                                    'rgba(107,114,128,0.8)',
    color: '#fff',
    borderRadius: '10px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: 700,
    backdropFilter: 'blur(6px)',
    pointerEvents: 'none',
  };

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
      <MapContainer
        center={mapCenter}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <RecenterMap center={mapCenter} />

        {/* Driver marker */}
        {driverLatLng && (
          <Marker position={driverLatLng} icon={driverIcon} title="Votre position" />
        )}

        {/* ACCEPTED: driver → pickup route + pickup marker */}
        {rideState === 'accepted' && pickupLatLng && (
          <>
            <Marker position={pickupLatLng} icon={pickupIcon} title="Client (départ)" />
            {driverLatLng && (
              <RouteLayer from={driverLatLng} to={pickupLatLng} color="#3B82F6" />
            )}
          </>
        )}

        {/* IN_PROGRESS: pickup → destination route */}
        {rideState === 'in_progress' && pickupLatLng && destLatLng && (
          <>
            <Marker position={pickupLatLng} icon={pickupIcon} title="Départ" />
            <Marker position={destLatLng} icon={destIcon} title="Destination" />
            <RouteLayer from={pickupLatLng} to={destLatLng} color="#FF9900" />
          </>
        )}
      </MapContainer>

      {/* Ride state badge */}
      <div style={badgeStyle}>
        {rideState === 'waiting'     && '● En attente'}
        {rideState === 'accepted'    && '● Route vers le client'}
        {rideState === 'in_progress' && '● Course en cours'}
        {rideState === 'completed'   && '● Course terminée'}
      </div>

      {/* No GPS warning */}
      {!driverPosition && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
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
