/// <reference types="google.maps" />
import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { BookingService } from '@/services/booking.service';
import { useSocket } from '@/hooks/useSocket';
import { joinBookingRoom, leaveBookingRoom } from '@/lib/socket';
import type { Booking, DriverLocation } from '@/types/booking.types';
import { useTranslation } from '@/store/languageStore';
import { Phone, X, Clock, MapPin, Navigation, ChevronRight, Car, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

interface RideTrackingScreenProps {
  booking: Booking;
  driverName: string;
  driverVehicle: string;
  driverPlate: string;
  driverPhone: string;
  onBackToHome?: () => void;
}

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#F59E0B',
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
  const mapRef = useRef<google.maps.Map | null>(null);

  const pickupLat = booking.pickupLat ?? booking.pickupLatitude ?? 36.073;
  const pickupLng = booking.pickupLng ?? booking.pickupLongitude ?? 4.761;
  const dropoffLat = booking.dropoffLat ?? booking.destinationLatitude ?? 36.073;
  const dropoffLng = booking.dropoffLng ?? booking.destinationLongitude ?? 4.761;

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
        const loc = res.data?.data;
        if (loc) {
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
            const loc = res.data?.data;
            if (loc) {
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
    setDriverPos({ lat: data.latitude, lng: data.longitude });
    setLastUpdateTimestamp(Date.now());
    setIsStale(false);

    // Rough ETA from driver to pickup (if still ACCEPTED)
    if (booking.status === 'ACCEPTED' && driverPos) {
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
  }, [booking.id, booking.status, pickupLat, pickupLng, driverPos, t.common.minutes]));

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
  const mapCenter = driverPos ?? pickupPos;

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
        <APIProvider apiKey={GOOGLE_MAPS_KEY}>
          <Map
            mapId="zaxi-customer-tracking"
            center={mapCenter}
            zoom={15}
            gestureHandling="greedy"
            disableDefaultUI
            style={{ width: '100%', height: '100%' }}
            onCameraChanged={(ev) => {
              if (!mapRef.current) mapRef.current = ev.map;
            }}
          >
            {/* Driver marker */}
            {driverPos && (
              <AdvancedMarker position={driverPos} title={driverName}>
                <div
                  style={{
                    background: '#FF9900',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255,153,0,0.5)',
                    border: '3px solid #fff',
                  }}
                >
                  <Car style={{ color: '#fff', width: 18, height: 18 }} />
                </div>
              </AdvancedMarker>
            )}

            {/* Pickup marker */}
            <AdvancedMarker position={pickupPos} title={t.home.pickup}>
              <Pin background="#22C55E" borderColor="#fff" glyphColor="#fff" />
            </AdvancedMarker>

            {/* Destination marker */}
            <AdvancedMarker position={destPos} title={t.home.destination}>
              <Pin background="#111" borderColor="#fff" glyphColor="#fff" />
            </AdvancedMarker>
          </Map>
        </APIProvider>

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
            <Home style={{ width: 16, height: 16, color: '#FF9900' }} />
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
            ⚠️ {language === 'ar' ? 'جاري تحديث إشارة GPS للسائق...' : 'Signal GPS chauffeur en attente de mise à jour...'}
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
              background: 'linear-gradient(135deg, #FF9900, #E08514)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Car style={{ color: '#fff', width: 22, height: 22 }} />
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
            <MapPin style={{ color: '#22C55E', width: 14, height: 14, marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.home.pickup}</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#222' }}>
                {booking.pickupAddress || `${pickupLat.toFixed(4)}, ${pickupLng.toFixed(4)}`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: 2 }}>
            <ChevronRight className={cn('w-3 h-3 text-slate-300', isRTL && 'rotate-180')} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Navigation style={{ color: '#111', width: 14, height: 14, marginTop: 2, flexShrink: 0 }} />
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
              <Clock style={{ color: '#FF9900', width: 14, height: 14 }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#AA6600' }}>{eta}</span>
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
