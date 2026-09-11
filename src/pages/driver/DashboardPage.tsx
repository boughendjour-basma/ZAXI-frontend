import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDriverStore } from '@/store/driverStore';
import { DriverService } from '@/services/driver.service';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useSocket } from '@/hooks/useSocket';
import { joinBookingRoom } from '@/lib/socket';
import type { Booking } from '@/types/booking.types';
import type { SocketEvents } from '@/lib/socket';
import { useTranslation } from '@/store/languageStore';
import {
  Car,
  MapPin,
  Navigation,
  PlayCircle,
  FlagTriangleRight,
  Power,
  Radio,
  Clock,
  Banknote,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

/** Build a Google Maps directions URL from pickup to destination */
function buildGoogleMapsUrl(params: {
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupAddress?: string | null;
  destLat?: number | null;
  destLng?: number | null;
  destAddress?: string | null;
}): string {
  const origin = (params.pickupLat && params.pickupLng)
    ? `${params.pickupLat},${params.pickupLng}`
    : encodeURIComponent(params.pickupAddress || 'Bordj Bou Arréridj, Algérie');
  const destination = (params.destLat && params.destLng)
    ? `${params.destLat},${params.destLng}`
    : encodeURIComponent(params.destAddress || '');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

function deriveRideState(activeBooking: Booking | null) {
  if (!activeBooking) return 'waiting';
  switch (activeBooking.status) {
    case 'ACCEPTED':
      return 'accepted';
    case 'ARRIVED':
    case 'IN_PROGRESS':
      return 'in_progress';
    default:
      return 'waiting';
  }
}

export default function DriverDashboardPage() {
  const queryClient = useQueryClient();
  const { useSocketEvent } = useSocket();
  const { t, language, isRTL } = useTranslation();

  const isOnline = useDriverStore((s) => s.isOnline);
  const setOnlineInStore = useDriverStore((s) => s.setOnline);

  // ── Load initial online status from backend ───────────────────────────────
  const { data: profileRes } = useQuery({
    queryKey: ['driverProfileAvailability'],
    queryFn: () => DriverService.getProfile(),
    staleTime: 0,
  });

  useEffect(() => {
    const rawDriver = (profileRes?.data?.data as any)?.driver ?? (profileRes?.data?.data as any) ?? profileRes?.data;
    if (rawDriver && typeof rawDriver.isOnline === 'boolean') {
      setOnlineInStore(rawDriver.isOnline);
    }
  }, [profileRes, setOnlineInStore]);

  // ── Persist availability to DB with optimistic update & rollback ────────
  const availabilityMutation = useMutation({
    mutationFn: (online: boolean) => DriverService.setAvailability(online),
    onMutate: async (newOnlineState) => {
      await queryClient.cancelQueries({ queryKey: ['driverProfileAvailability'] });
      const previousOnline = isOnline;
      setOnlineInStore(newOnlineState);
      return { previousOnline };
    },
    onError: (_err, _newOnlineState, context) => {
      if (context?.previousOnline !== undefined) {
        setOnlineInStore(context.previousOnline);
      }
      toast.error(language === 'ar' ? 'حدث خطأ أثناء تحديث الحالة.' : 'Erreur lors de la mise à jour du statut.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverProfileAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['publicDriverProfile'] });
    },
  });

  const { data: activeBookingRes } = useQuery({
    queryKey: ['driverActiveBooking'],
    queryFn: async () => {
      const res = await DriverService.getBookings({ status: 'ACCEPTED' });
      const acceptedBookings = (res.data?.data as any)?.bookings ?? (res.data?.data as any) ?? [];
      if (Array.isArray(acceptedBookings) && acceptedBookings.length > 0) return acceptedBookings[0];
      const inProgressRes = await DriverService.getBookings({ status: 'IN_PROGRESS' });
      const inProgressBookings = (inProgressRes.data?.data as any)?.bookings ?? (inProgressRes.data?.data as any) ?? [];
      if (Array.isArray(inProgressBookings) && inProgressBookings.length > 0) return inProgressBookings[0];
      return null;
    },
    refetchInterval: 5000,
  });

  const { data: statsRes } = useQuery({
    queryKey: ['driverStatistics'],
    queryFn: () => DriverService.getStatistics(),
    refetchInterval: 10000,
  });

  const rawStats = (statsRes?.data?.data as any) ?? (statsRes?.data as any) ?? {};
  const stats = {
    todayRides: rawStats.todayCompletedRides ?? 0,
    dailyRevenue: rawStats.dailyRevenue ?? 0,
    totalCustomers: rawStats.totalCustomers ?? 0,
    averageRating: rawStats.averageRating ?? 0,
  };

  const activeBooking = activeBookingRes ?? null;
  const rideState = deriveRideState(activeBooking);

  const { startTracking, stopTracking } = useDriverLocation({
    hasActiveRide: rideState !== 'waiting',
  });

  useEffect(() => {
    if (isOnline) {
      startTracking();
    } else {
      stopTracking();
    }
  }, [isOnline, startTracking, stopTracking]);

  const [incomingBooking, setIncomingBooking] = useState<SocketEvents['booking:new'] | null>(null);

  // Poll for pending booking requests from customers (so driver always sees them even if page was refreshed)
  const { data: pendingBookingsRes } = useQuery({
    queryKey: ['driverPendingBookings'],
    queryFn: async () => {
      const res = await DriverService.getBookings({ status: 'PENDING', limit: 10 });
      const raw = (res.data?.data as any)?.bookings ?? (res.data?.data as any) ?? [];
      return Array.isArray(raw) ? (raw as Booking[]) : [];
    },
    refetchInterval: 3000,
  });

  const pendingBookings = pendingBookingsRes ?? [];

  // Active pending request to show to the driver: either from socket or from database
  const displayPendingBooking = incomingBooking
    ? {
        bookingId: incomingBooking.bookingId,
        pickupLat: incomingBooking.pickupLat,
        pickupLng: incomingBooking.pickupLng,
        pickupAddress: incomingBooking.pickupAddress,
        dropoffLat: incomingBooking.dropoffLat,
        dropoffLng: incomingBooking.dropoffLng,
        dropoffAddress: incomingBooking.dropoffAddress,
        estimatedPrice: incomingBooking.estimatedPrice,
        distanceKm: incomingBooking.distanceKm,
        durationMinutes: incomingBooking.durationMinutes,
        customer: incomingBooking.customer,
      }
    : (!activeBooking && pendingBookings.length > 0)
    ? {
        bookingId: pendingBookings[0].id,
        pickupLat: pendingBookings[0].pickupLatitude,
        pickupLng: pendingBookings[0].pickupLongitude,
        pickupAddress: pendingBookings[0].pickupAddress,
        dropoffLat: pendingBookings[0].destinationLatitude ?? pendingBookings[0].dropoffLat,
        dropoffLng: pendingBookings[0].destinationLongitude ?? pendingBookings[0].dropoffLng,
        dropoffAddress: pendingBookings[0].destinationAddress ?? pendingBookings[0].dropoffAddress,
        estimatedPrice: pendingBookings[0].estimatedPrice,
        distanceKm: pendingBookings[0].distanceKm,
        durationMinutes: pendingBookings[0].durationMinutes,
        customer: pendingBookings[0].customer,
      }
    : null;

  useSocketEvent(
    'booking:new',
    useCallback(
      (data: SocketEvents['booking:new']) => {
        if (!isOnline) return;
        setIncomingBooking(data);
        toast(language === 'ar' ? '🚗 طلب رحلة جديد !' : '🚗 Nouvelle demande de course !', { duration: 8000 });
      },
      [isOnline, language],
    ),
  );

  useEffect(() => {
    if (activeBooking?.id) joinBookingRoom(activeBooking.id);
  }, [activeBooking?.id]);

  useSocketEvent(
    'booking:accepted',
    useCallback(
      (data) => {
        queryClient.invalidateQueries({ queryKey: ['driverActiveBooking'] });
        queryClient.invalidateQueries({ queryKey: ['driverStatistics'] });
        toast.success(language === 'ar' ? `تم قبول الرحلة #${data.bookingId.slice(0, 8)}` : `Course #${data.bookingId.slice(0, 8)} acceptée`);
      },
      [queryClient, language],
    ),
  );

  useSocketEvent(
    'booking:started',
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['driverActiveBooking'] });
    }, [queryClient]),
  );

  useSocketEvent(
    'booking:completed',
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['driverActiveBooking'] });
      queryClient.invalidateQueries({ queryKey: ['driverStatistics'] });
      toast.success(language === 'ar' ? 'اكتملت الرحلة بنجاح ! 🎉' : 'Course terminée avec succès ! 🎉');
    }, [queryClient, language]),
  );

  useSocketEvent(
    'booking:cancelled',
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['driverActiveBooking'] });
      setIncomingBooking(null);
      toast(language === 'ar' ? 'تم إلغاء الرحلة من طرف الزبون.' : 'Course annulée par le client.', { icon: '⚠️' });
    }, [queryClient, language]),
  );

  const acceptMutation = useMutation({
    mutationFn: (id: string) => DriverService.acceptBooking(id),
    onSuccess: () => {
      setIncomingBooking(null);
      queryClient.invalidateQueries({ queryKey: ['driverActiveBooking'] });
      queryClient.invalidateQueries({ queryKey: ['driverPendingBookings'] });
      queryClient.invalidateQueries({ queryKey: ['driverTodayBookings'] });
      queryClient.invalidateQueries({ queryKey: ['driverStatistics'] });
      toast.success(language === 'ar' ? 'تم قبول الرحلة بنجاح !' : 'Course acceptée avec succès !');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || (language === 'ar' ? 'خطأ أثناء القبول' : 'Erreur lors de l\'acceptation')),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => DriverService.rejectBooking(id),
    onSuccess: () => {
      setIncomingBooking(null);
      queryClient.invalidateQueries({ queryKey: ['driverPendingBookings'] });
      queryClient.invalidateQueries({ queryKey: ['driverTodayBookings'] });
      toast(language === 'ar' ? 'تم رفض الرحلة.' : 'Course refusée.', { icon: '✋' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => DriverService.startRide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverActiveBooking'] });
      toast.success(language === 'ar' ? 'انطلقت الرحلة !' : 'Course démarrée !');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => DriverService.completeRide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverActiveBooking'] });
      queryClient.invalidateQueries({ queryKey: ['driverStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['driverTodayBookings'] });
      queryClient.invalidateQueries({ queryKey: ['driverPendingBookings'] });
      toast.success(language === 'ar' ? 'اكتملت الرحلة بنجاح ! 🎉' : 'Course terminée avec succès ! 🎉');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const toggleAvailability = () => {
    const nextState = !isOnline;
    availabilityMutation.mutate(nextState);
    toast(nextState ? (language === 'ar' ? '🟢 أنت الآن متصل ومتاح' : '🟢 Vous êtes maintenant EN LIGNE') : (language === 'ar' ? '🔴 أنت الآن غير متصل' : '🔴 Vous êtes maintenant HORS LIGNE'));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-8 pt-7 sm:pt-8">
      <div className="max-w-lg mx-auto px-5 space-y-4">

        {/* ── 6. ONLINE / OFFLINE CARD ────────────────────────────────────── */}
        <div className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-3 text-start">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-[#FF9900] shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                {isOnline
                  ? (language === 'ar' ? 'أنت متصل ومتاح لاستقبال الرحلات.' : 'Vous êtes actuellement En Ligne.')
                  : (language === 'ar' ? 'أنت حالياً غير متصل.' : 'Vous êtes actuellement Hors Ligne.')}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isOnline
                  ? (language === 'ar' ? 'أنت مستعد لاستقبال طلبات الحجز الفورية.' : 'Vous êtes prêt à recevoir des courses ZAXI.')
                  : (language === 'ar' ? 'اتصل لتتمكن من استقبال طلبات الزبائن.' : 'Passez En Ligne pour recevoir des courses ZAXI.')}
              </p>
            </div>
          </div>

          <button
            onClick={toggleAvailability}
            disabled={availabilityMutation.isPending}
            className="bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 text-xs font-black px-4 py-2.5 rounded-2xl shadow-md shadow-orange-500/20 flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
          >
            <Power className="w-4 h-4" />
            {isOnline ? t.driver.dashboard.goOffline : t.driver.dashboard.goOnline}
          </button>
        </div>

        {/* ── PENDING BOOKING CARD (From Socket or Database) ── */}
        {displayPendingBooking && (
          <div className="bg-[#FF9900] p-4 rounded-[24px] text-slate-950 shadow-xl space-y-3 text-start border-2 border-orange-600/30">
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-black text-white animate-pulse">
                ⚡ {language === 'ar' ? 'طلب رحلة جديد في انتظار القبول !' : 'Nouvelle demande de course en attente !'}
              </span>
              <span className="text-sm font-extrabold">
                {displayPendingBooking.estimatedPrice ? `${displayPendingBooking.estimatedPrice} ${t.common.currency}` : `— ${t.common.currency}`}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-black/70">{t.home.pickup}</span>
                  <p className="font-bold text-slate-950 break-words">
                    {displayPendingBooking.pickupAddress || 'Bordj Bou Arréridj, Centre Ville'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-black/70">{t.home.destination}</span>
                  <p className="font-bold text-slate-950 break-words">
                    {displayPendingBooking.dropoffAddress || 'Destination'}
                  </p>
                </div>
              </div>
              {/* Distance & duration info */}
              {(displayPendingBooking.distanceKm || displayPendingBooking.durationMinutes) && (
                <div className="flex items-center gap-3 pt-1 text-[11px] text-black/70 font-semibold">
                  {displayPendingBooking.distanceKm && <span>📍 {displayPendingBooking.distanceKm} km</span>}
                  {displayPendingBooking.durationMinutes && <span>⏱ ~{displayPendingBooking.durationMinutes} min</span>}
                </div>
              )}
            </div>

            {/* Google Maps directions button */}
            <a
              href={buildGoogleMapsUrl({
                pickupLat: displayPendingBooking.pickupLat,
                pickupLng: displayPendingBooking.pickupLng,
                pickupAddress: displayPendingBooking.pickupAddress,
                destLat: displayPendingBooking.dropoffLat,
                destLng: displayPendingBooking.dropoffLng,
                destAddress: displayPendingBooking.dropoffAddress,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/80 text-slate-900 text-xs font-black hover:bg-white transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {language === 'ar' ? 'فتح في خرائط Google' : 'Ouvrir dans Google Maps'}
            </a>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => rejectMutation.mutate(displayPendingBooking.bookingId)}
                disabled={rejectMutation.isPending}
                className="py-2.5 px-3 rounded-xl bg-white/30 text-slate-950 text-xs font-bold hover:bg-white/40 cursor-pointer disabled:opacity-50"
              >
                {t.driver.today.reject}
              </button>
              <button
                onClick={() => acceptMutation.mutate(displayPendingBooking.bookingId)}
                disabled={acceptMutation.isPending}
                className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {acceptMutation.isPending ? t.common.loading : `✓ ${t.driver.today.accept}`}
              </button>
            </div>
          </div>
        )}

        {/* ── 7. PROCHAINE COURSE CARD — only shown when there is a real active booking ── */}
        {activeBooking ? (
          <div className="bg-[#FFF9F2] rounded-[24px] p-5 border border-amber-100/70 shadow-sm space-y-4 text-start">
            {/* Tag + Status badge */}
            <div className="flex items-center justify-between">
              <span className="text-[#FF9900] font-black text-[10px] tracking-wider uppercase bg-white/90 px-3 py-1 rounded-full border border-amber-200/60 inline-block">
                {language === 'ar' ? 'الرحلة القادمة' : 'PROCHAINE COURSE'}
              </span>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                rideState === 'in_progress'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>
                {rideState === 'in_progress'
                  ? (language === 'ar' ? 'جارية' : 'En cours')
                  : (language === 'ar' ? 'مقبولة' : 'Acceptée')}
              </span>
            </div>

            {/* Route Section */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {/* Pickup */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[#FF9900] text-[11px] font-extrabold uppercase">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {t.home.pickup}
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 truncate">
                  {(activeBooking.pickupAddress ?? '').split(',')[0] || (language === 'ar' ? 'غير محدد' : 'Non défini')}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {language === 'ar' ? 'موقع الزبون' : 'Position du client'}
                </p>
              </div>

              {/* Dashed line with Car icon */}
              <div className="flex-1 px-1 flex items-center justify-center relative">
                <div className="w-full border-t-2 border-dashed border-amber-300 absolute" />
                <div className="w-8 h-8 rounded-full bg-white border border-amber-200 shadow-xs flex items-center justify-center text-slate-900 relative z-10 shrink-0">
                  <Car className="w-4 h-4 text-slate-900" />
                </div>
              </div>

              {/* Destination */}
              <div className="min-w-0 flex-1 text-end">
                <div className="flex items-center justify-end gap-1 text-[#FF9900] text-[11px] font-extrabold uppercase">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {t.home.destination}
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 truncate">
                  {((activeBooking.destinationAddress ?? activeBooking.dropoffAddress ?? '') as string).split(',')[0] || (language === 'ar' ? 'غير محدد' : 'Non défini')}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {language === 'ar' ? 'وجهة الزبون' : 'Destination client'}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-amber-200/60" />

            {/* Info row: distance / duration / price */}
            <div className="grid grid-cols-2 gap-4">
              {/* Duration */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100/60 flex items-center justify-center text-[#FF9900] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block leading-tight">
                    {language === 'ar' ? 'المدة المقدرة' : 'Durée estimée'}
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">
                    {activeBooking.durationMinutes
                      ? `~${activeBooking.durationMinutes} min`
                      : (language === 'ar' ? 'غير محدد' : 'N/A')}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100/60 flex items-center justify-center text-[#FF9900] shrink-0">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-bold block leading-tight">
                    {t.home.estimatedFare}
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">
                    {activeBooking.estimatedPrice != null
                      ? `${activeBooking.estimatedPrice} ${t.common.currency}`
                      : (language === 'ar' ? 'غير محدد' : 'N/A')}
                  </span>
                </div>
              </div>
            </div>

            {/* Guidance banner for driver on earnings calculation */}
            <div className="rounded-2xl bg-amber-100/70 border border-amber-200/80 p-3 text-[11px] text-amber-950 flex items-start gap-2.5">
              <span className="text-sm shrink-0">💡</span>
              <p className="leading-snug font-medium">
                {rideState === 'accepted'
                  ? (language === 'ar'
                      ? 'تم قبول الرحلة بنجاح ! اضغط على "بدء الرحلة" عند استقبال الزبون، ثم "إنهاء الرحلة" عند الوصول ليتم تسجيل الأرباح في رصيدك اليومي.'
                      : 'Course acceptée ! Cliquez sur "Démarrer" lors de la prise en charge, puis "Terminer" à l\'arrivée pour enregistrer vos gains dans votre recette du jour.')
                  : (language === 'ar'
                      ? 'الرحلة جارية حالياً. اضغط على "إنهاء الرحلة" عند الوصول للوجهة لاحتساب وإضافة الأرباح فوراً إلى إحصائياتك.'
                      : 'Course en cours. Cliquez sur "Terminer la course" dès l\'arrivée pour valider et ajouter les gains à vos statistiques.')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {/* Google Maps directions */}
              <a
                href={buildGoogleMapsUrl({
                  pickupLat: activeBooking.pickupLatitude ?? activeBooking.pickupLat,
                  pickupLng: activeBooking.pickupLongitude ?? activeBooking.pickupLng,
                  pickupAddress: activeBooking.pickupAddress,
                  destLat: activeBooking.destinationLatitude ?? activeBooking.dropoffLatitude ?? activeBooking.dropoffLat,
                  destLng: activeBooking.destinationLongitude ?? activeBooking.dropoffLongitude ?? activeBooking.dropoffLng,
                  destAddress: activeBooking.destinationAddress ?? activeBooking.dropoffAddress,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {language === 'ar' ? 'فتح الاتجاهات في خرائط Google' : 'Itinéraire via Google Maps'}
              </a>

              {rideState === 'accepted' ? (
                <button
                  onClick={() => startMutation.mutate(activeBooking.id)}
                  disabled={startMutation.isPending}
                  className="w-full py-3.5 bg-slate-950 hover:bg-black text-white text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <PlayCircle className="w-4 h-4 text-[#FF9900]" />
                  {startMutation.isPending ? t.common.loading : t.driver.today.startRide}
                </button>
              ) : (
                <button
                  onClick={() => completeMutation.mutate(activeBooking.id)}
                  disabled={completeMutation.isPending}
                  className="w-full py-3.5 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <FlagTriangleRight className="w-4 h-4" />
                  {completeMutation.isPending ? t.common.loading : t.driver.today.completeRide}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── No active trip: empty idle card ── */
          <div className="bg-[#FFF9F2] rounded-[24px] p-6 border border-amber-100/70 shadow-sm text-start flex flex-col items-center justify-center gap-3 py-8">
            <div className="w-14 h-14 rounded-full bg-amber-100/60 flex items-center justify-center">
              <Car className="w-7 h-7 text-amber-300" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-black text-slate-700">
                {language === 'ar' ? 'لا توجد رحلة نشطة حالياً' : 'Aucune course active'}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                {isOnline
                  ? (language === 'ar' ? 'أنت متصل وفي انتظار طلب جديد...' : 'Vous êtes en ligne, en attente d\'une course...')
                  : (language === 'ar' ? 'اتصل لتبدأ في استقبال الرحلات' : 'Passez en ligne pour recevoir des courses')}
              </p>
            </div>
            <button
              type="button"
              className="mt-1 w-full py-3 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 text-xs font-black rounded-2xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>{language === 'ar' ? 'في انتظار طلب جديد...' : 'En attente de course...'}</span>
              <ArrowRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
            </button>
          </div>
        )}

        {/* ── 8. STATISTICS GRID ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3.5 text-start">
          {/* Card 1: Courses du Jour */}
          <div className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              {language === 'ar' ? 'رحلات اليوم' : "Courses d'aujourd'hui"}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-slate-900">
                {stats.todayRides}
              </span>
              <span className={`font-extrabold text-xs ${stats.todayRides > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {stats.todayRides > 0 ? `✓ ${language === 'ar' ? 'مكتملة' : 'Terminée(s)'}` : (language === 'ar' ? 'لا يوجد بعد' : 'Aucune')}
              </span>
            </div>
            {activeBooking && (
              <div className="pt-1 flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{language === 'ar' ? '1 رحلة جارية' : '1 course en cours'}</span>
              </div>
            )}
          </div>

          {/* Card 2: Recette du Jour */}
          <div className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              {t.driver.dashboard.todayEarnings}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {stats.dailyRevenue.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')} {t.common.currency}
              </span>
              <span className={`font-extrabold text-xs ${stats.dailyRevenue > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {stats.dailyRevenue > 0 ? '↗' : '—'}
              </span>
            </div>
            {activeBooking && activeBooking.estimatedPrice != null && (
              <div className="pt-1 flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  +{activeBooking.estimatedPrice} {t.common.currency} ({language === 'ar' ? 'قيد الإنجاز' : 'en cours'})
                </span>
              </div>
            )}
          </div>

          {/* Card 3: Clients inscrits */}
          <div className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              {t.driver.customers.totalCustomers}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-slate-900">
                {stats.totalCustomers}
              </span>
              <span className="text-slate-500 font-extrabold text-xs">
                {language === 'ar' ? 'زبون' : 'client(s)'}
              </span>
            </div>
          </div>

          {/* Card 4: Note Chauffeur */}
          <div className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              {t.driver.dashboard.ratingAverage}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {stats.averageRating > 0 ? `${stats.averageRating} / 5` : (language === 'ar' ? 'لا يوجد' : 'N/A')}
              </span>
              <span className={`font-extrabold text-xs ${stats.averageRating >= 4 ? 'text-emerald-600' : stats.averageRating > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                {stats.averageRating > 0 ? `★ ${stats.averageRating >= 4.5 ? (language === 'ar' ? 'ممتاز' : 'Excellent') : stats.averageRating >= 3.5 ? (language === 'ar' ? 'جيد' : 'Bien') : (language === 'ar' ? 'متوسط' : 'Moyen')}` : '—'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
