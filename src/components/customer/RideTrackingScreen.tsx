import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BookingService } from '@/services/booking.service';
import { useSocket } from '@/hooks/useSocket';
import { joinBookingRoom, leaveBookingRoom } from '@/lib/socket';
import type { Booking, DriverLocation } from '@/types/booking.types';
import { useTranslation } from '@/store/languageStore';
import { Phone, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Fix Leaflet default icons in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const driverIcon = L.divIcon({
  className: '',
  html: `<div style="background:#FF9900;border-radius:50%;width:32px;height:32px;box-shadow:0 4px 12px rgba(255,153,0,0.5);border:3px solid #fff;"></div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});
const pickupIcon = L.divIcon({
  className: '',
  html: `<div style="background:#22C55E;border-radius:50%;width:28px;height:28px;box-shadow:0 4px 10px rgba(34,197,94,0.4);border:3px solid #fff;"></div>`,
  iconSize: [28, 28], iconAnchor: [14, 14],
});
const destIcon = L.divIcon({
  className: '',
  html: `<div style="background:#111;border-radius:50%;width:28px;height:28px;box-shadow:0 4px 10px rgba(0,0,0,0.4);border:3px solid #fff;"></div>`,
  iconSize: [28, 28], iconAnchor: [14, 14],
});

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (
      Array.isArray(center) &&
      typeof center[0] === 'number' &&
      typeof center[1] === 'number' &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      map.setView(center, map.getZoom());
    }
  }, [center[0], center[1], map]);
  return null;
}

// ─── OSRM route fetcher ───────────────────────────────────────────────────────
async function fetchOsrmRoute(
  from: [number, number],
  to: [number, number],
): Promise<[number, number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM error');
    const json = await res.json();
    if (json.code === 'Ok' && json.routes?.[0]?.geometry?.coordinates) {
      return json.routes[0].geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]);
    }
  } catch {
    // Fall back to straight line
  }
  return [from, to];
}

function OsrmRouteLayer({
  from,
  to,
  color = '#FF9900',
}: {
  from: [number, number];
  to: [number, number];
  color?: string;
}) {
  const map = useMap();
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    let cancelled = false;
    if (
      !from || !to ||
      typeof from[0] !== 'number' || typeof from[1] !== 'number' ||
      typeof to[0] !== 'number' || typeof to[1] !== 'number' ||
      isNaN(from[0]) || isNaN(from[1]) ||
      isNaN(to[0]) || isNaN(to[1])
    ) {
      return;
    }

    fetchOsrmRoute(from, to).then((coords) => {
      if (cancelled) return;
      setRouteCoords(coords);
      if (coords.length > 1) {
        try {
          const bounds = L.latLngBounds(coords.map((c) => L.latLng(c[0], c[1])));
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          }
        } catch {
          // ignore fitBounds error if unmounted
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [from[0], from[1], to[0], to[1], map]);

  if (routeCoords.length < 2) return null;

  return (
    <Polyline
      positions={routeCoords}
      pathOptions={{ color, weight: 5, opacity: 0.85, lineJoin: 'round' }}
    />
  );
}

interface RideTrackingScreenProps {
  booking: Booking;
  driverName: string;
  driverVehicle: string;
  driverPlate: string;
  driverPhone: string;
  onBackToHome?: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#FF9900',
  ACCEPTED: '#3B82F6',
  IN_PROGRESS: '#22C55E',
  COMPLETED: '#6B7280',
  CANCELLED: '#EF4444',
};

export function RideTrackingScreen({
  booking,
  driverName,
  driverVehicle,
  driverPlate,
  driverPhone,
  onBackToHome,
}: RideTrackingScreenProps) {
  const queryClient = useQueryClient();
  const { useSocketEvent } = useSocket();
  const { t, language, isRTL } = useTranslation();

  const STATUS_LABEL: Record<string, string> = {
    PENDING: t.history.statusPending,
    ACCEPTED: t.history.statusDriverArriving,
    IN_PROGRESS: t.history.statusInProgress,
    COMPLETED: t.history.statusCompleted,
    CANCELLED: t.history.statusCancelled,
  };

  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const numOr = (val: any, fallback: number): number => {
    const n = typeof val === 'number' ? val : parseFloat(val);
    return isNaN(n) ? fallback : n;
  };

  const pickupLat = numOr(booking.pickupLat ?? booking.pickupLatitude, 36.073);
  const pickupLng = numOr(booking.pickupLng ?? booking.pickupLongitude, 4.761);
  const dropoffLat = numOr(booking.dropoffLat ?? booking.destinationLatitude, 36.073);
  const dropoffLng = numOr(booking.dropoffLng ?? booking.destinationLongitude, 4.761);

  const pickupPos = { lat: pickupLat, lng: pickupLng };
  const destPos = { lat: dropoffLat, lng: dropoffLng };

  // Join the booking socket room to receive driver updates, leave on unmount
  useEffect(() => {
    joinBookingRoom(booking.id);
    return () => {
      leaveBookingRoom(booking.id);
    };
  }, [booking.id]);

  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(Date.now());
  const [isStale, setIsStale] = useState<boolean>(false);

  // Fetch initial driver location from backend
  useEffect(() => {
    BookingService.getDriverLocation(booking.id)
      .then((res) => {
        const raw = res.data?.data;
        const loc = (raw as any)?.location ?? raw;
        if (
          loc &&
          typeof loc.latitude === 'number' &&
          typeof loc.longitude === 'number' &&
          !isNaN(loc.latitude) &&
          !isNaN(loc.longitude)
        ) {
          setDriverPos({ lat: loc.latitude, lng: loc.longitude });
          setLastUpdateTimestamp(Date.now());
          setIsStale(false);
        }
      })
      .catch(() => {});
  }, [booking.id]);

  // Periodically check if driver location updates are stale (> 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastUpdateTimestamp > 30000) {
        setIsStale(true);
        BookingService.getDriverLocation(booking.id)
          .then((res) => {
            const raw = res.data?.data;
            const loc = (raw as any)?.location ?? raw;
            if (
              loc &&
              typeof loc.latitude === 'number' &&
              typeof loc.longitude === 'number' &&
              !isNaN(loc.latitude) &&
              !isNaN(loc.longitude)
            ) {
              setDriverPos({ lat: loc.latitude, lng: loc.longitude });
              setLastUpdateTimestamp(Date.now());
              setIsStale(false);
            }
          })
          .catch(() => {});
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [booking.id, lastUpdateTimestamp]);

  // Real-time driver location updates via socket
  useSocketEvent('driver:location:update', useCallback((data: DriverLocation) => {
    if (data.bookingId !== booking.id) return;
    if (
      typeof data.latitude === 'number' &&
      typeof data.longitude === 'number' &&
      !isNaN(data.latitude) &&
      !isNaN(data.longitude)
    ) {
      setDriverPos({ lat: data.latitude, lng: data.longitude });
      setLastUpdateTimestamp(Date.now());
      setIsStale(false);

      // Rough ETA from driver to pickup (if still ACCEPTED)
      if (booking.status === 'ACCEPTED') {
        const R = 6371;
        const dLat = ((data.latitude - pickupLat) * Math.PI) / 180;
        const dLng = ((data.longitude - pickupLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((pickupLat * Math.PI) / 180) *
            Math.cos((data.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const minutes = Math.max(1, Math.round((dist / 30) * 60));
        setEta(`~${minutes} ${t.common.minutes}`);
      } else {
        setEta(null);
      }
    }
  }, [booking.id, booking.status, pickupLat, pickupLng, t.common.minutes]));

  // Cancel booking
  const cancelMutation = useMutation({
    mutationFn: () => BookingService.cancelBooking(booking.id),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم إلغاء الحجز.' : 'Réservation annulée.');
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء الإلغاء.' : "Erreur lors de l'annulation."));
    },
  });

  const canCancel = booking.status === 'PENDING' || booking.status === 'ACCEPTED';
  const mapCenter: [number, number] = driverPos && !isNaN(driverPos.lat) && !isNaN(driverPos.lng)
    ? [driverPos.lat, driverPos.lng]
    : [pickupPos.lat, pickupPos.lng];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        background: '#F8F8F8',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      {/* ── Map Area ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          ref={(m) => { if (m) mapRef.current = m; }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <RecenterMap center={mapCenter} />

          {/* Driver marker */}
          {driverPos && !isNaN(driverPos.lat) && !isNaN(driverPos.lng) && (
            <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon} title={driverName} />
          )}

          {/* Pickup marker */}
          <Marker position={[pickupPos.lat, pickupPos.lng]} icon={pickupIcon} title={t.home.pickup} />

          {/* Destination marker */}
          <Marker position={[destPos.lat, destPos.lng]} icon={destIcon} title={t.home.destination} />

          {/* OSRM Route: Driver to Pickup when ACCEPTED */}
          {booking.status === 'ACCEPTED' && driverPos && !isNaN(driverPos.lat) && !isNaN(driverPos.lng) && (
            <OsrmRouteLayer
              from={[driverPos.lat, driverPos.lng]}
              to={[pickupPos.lat, pickupPos.lng]}
              color="#3B82F6"
            />
          )}

          {/* OSRM Route: Pickup to Destination when IN_PROGRESS or driver not yet located */}
          {(booking.status === 'IN_PROGRESS' || !driverPos) && (
            <OsrmRouteLayer
              from={[pickupPos.lat, pickupPos.lng]}
              to={[destPos.lat, destPos.lng]}
              color="#FF9900"
            />
          )}
        </MapContainer>

        {/* Back to Home Button */}
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            style={{
              position: 'absolute',
              top: 16,
              ...(isRTL ? { right: 16 } : { left: 16 }),
              zIndex: 20,
              background: '#fff',
              color: '#111',
              borderRadius: '24px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              border: 'none',
              cursor: 'pointer',
            }}
            title={t.tracking.backToHome}
          >
            <span>{t.nav.home}</span>
          </button>
        )}

        {/* Status overlay pill */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: STATUS_COLOR[booking.status] ?? '#333',
            color: '#fff',
            borderRadius: '30px',
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
          {STATUS_LABEL[booking.status] ?? booking.status}
          {eta && <span style={{ opacity: 0.8, fontWeight: 500, fontSize: '11px' }}>· {eta}</span>}
        </div>

        {/* Stale Driver Location Warning */}
        {isStale && (
          <div
            style={{
              position: 'absolute',
              top: 64,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#FFF3C4',
              color: '#78350F',
              border: '1px solid #FCD34D',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              whiteSpace: 'nowrap',
              zIndex: 30,
            }}
          >
            {language === 'ar' ? 'جاري تحديث إشارة GPS للسائق...' : 'Signal GPS chauffeur en attente de mise à jour...'}
          </div>
        )}
      </div>

      {/* ── Bottom Info Panel ── */}
      <div
        style={{
          background: '#fff',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: '20px 20px 32px',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {/* Driver info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#111827',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {driverName ? driverName.charAt(0).toUpperCase() : 'Z'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '16px', color: '#111' }}>{driverName}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: 500 }}>
              {driverVehicle} · <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{driverPlate}</span>
            </p>
          </div>
          {/* Call button */}
          <a
            href={`tel:${driverPhone}`}
            style={{
              background: '#22C55E',
              color: '#fff',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(34,197,94,0.4)',
              flexShrink: 0,
            }}
            title={t.tracking.call}
          >
            <Phone style={{ width: 18, height: 18 }} />
          </a>
        </div>

        {/* Route summary */}
        <div
          style={{
            background: '#F8F8F8',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', marginTop: 5, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.home.pickup}</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#222' }}>
                {booking.pickupAddress || `${pickupLat.toFixed(4)}, ${pickupLng.toFixed(4)}`}
              </p>
            </div>
          </div>
          <div style={{ width: 1, height: 10, background: '#E2E8F0', marginLeft: isRTL ? 'auto' : 3, marginRight: isRTL ? 3 : 'auto' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '2px', background: '#0F172A', marginTop: 5, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.home.destination}</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#222' }}>
                {booking.dropoffAddress || booking.destinationAddress || `${dropoffLat.toFixed(4)}, ${dropoffLng.toFixed(4)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Price + ETA row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#AAA', textTransform: 'uppercase' }}>{t.home.estimatedFare}</p>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#111' }}>
              {booking.estimatedPrice ?? 150} {t.common.currency}
            </p>
          </div>
          {eta && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFF8EC', borderRadius: '12px', padding: '8px 14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FF9900' }}>{eta}</span>
            </div>
          )}
        </div>

        {/* Cancel button */}
        {canCancel && (
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            style={{
              background: 'transparent',
              border: '2px solid #EF4444',
              color: '#EF4444',
              borderRadius: '30px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            <X style={{ width: 14, height: 14 }} />
            {cancelMutation.isPending ? t.common.loading : t.tracking.cancelRide}
          </button>
        )}
      </div>
    </div>
  );
}
