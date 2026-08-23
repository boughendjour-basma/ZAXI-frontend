import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { DriverService } from '@/services/driver.service';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useSocket } from '@/hooks/useSocket';
import { joinBookingRoom } from '@/lib/socket';
import type { Booking } from '@/types/booking.types';
import type { SocketEvents } from '@/lib/socket';
import {
  Car,
  DollarSign,
  Users,
  MapPin,
  Navigation,
  CheckCheck,
  XCircle,
  PlayCircle,
  FlagTriangleRight,
  Power,
  Star,
  Radio,
  Clock,
  Banknote,
  ChevronRight,
  Gift,
  ArrowRight,
  CheckCircle,
  Menu,
  Bell,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import logoUrl from '@/assets/logo.png';
import toast from 'react-hot-toast';

type RideState = 'waiting' | 'accepted' | 'in_progress' | 'completed';

function deriveRideState(booking: Booking | null): RideState {
  if (!booking) return 'waiting';
  switch (booking.status) {
    case 'ACCEPTED':
      return 'accepted';
    case 'IN_PROGRESS':
      return 'in_progress';
    case 'COMPLETED':
      return 'completed';
    default:
      return 'waiting';
  }
}

export default function DriverDashboardPage() {
  const { setMobileOpen } = useOutletContext<{ setMobileOpen?: (open: boolean) => void }>() ?? {};
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { useSocketEvent } = useSocket();

  const [isOnline, setIsOnline] = useState<boolean>(false);

  // ── Load initial online status from backend ───────────────────────────────
  const { data: profileRes } = useQuery({
    queryKey: ['driverProfileAvailability'],
    queryFn: () => DriverService.getProfile(),
    staleTime: 0,
  });

  useEffect(() => {
    const backendIsOnline = (profileRes?.data as any)?.isOnline;
    if (typeof backendIsOnline === 'boolean') {
      setIsOnline(backendIsOnline);
    }
  }, [profileRes]);

  // ── Persist availability to DB ────────────────────────────────────────────
  const availabilityMutation = useMutation({
    mutationFn: (online: boolean) => DriverService.setAvailability(online),
    onError: () => toast.error('Erreur lors de la mise à jour du statut'),
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
    todayRides: rawStats.completedRides ?? 12,
    dailyRevenue: rawStats.dailyRevenue ?? 5840,
    totalCustomers: rawStats.totalCustomers ?? 48,
    averageRating: rawStats.averageRating ?? 4.9,
  };

  const activeBooking = activeBookingRes ?? null;
  const rideState = deriveRideState(activeBooking);

  const { isTracking, startTracking, stopTracking } = useDriverLocation({
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

  useSocketEvent(
    'booking:new',
    useCallback(
      (data: SocketEvents['booking:new']) => {
        if (!isOnline) return;
        setIncomingBooking(data);
        toast('🚗 Nouvelle demande de course !', { duration: 8000 });
      },
      [isOnline],
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
        toast.success(`Course #${data.bookingId.slice(0, 8)} acceptée`);
      },
      [queryClient],
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
      toast.success('Course terminée !');
    }, [queryClient]),
  );

  useSocketEvent(
    'booking:cancelled',
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['driverActiveBooking'] });
      setIncomingBooking(null);
      toast('Course annulée par le client.', { icon: '⚠️' });
    }, [queryClient]),
  );

  const acceptMutation = useMutation({
    mutationFn: (id: string) => DriverService.acceptBooking(id),
    onSuccess: () => {
      setIncomingBooking(null);
      queryClient.invalidateQueries({ queryKey: ['driverActiveBooking'] });
      queryClient.invalidateQueries({ queryKey: ['driverStatistics'] });
      toast.success('Course acceptée !');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur lors de l\'acceptation'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => DriverService.rejectBooking(id),
    onSuccess: () => {
      setIncomingBooking(null);
      toast('Course refusée.', { icon: '✋' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => DriverService.startRide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverActiveBooking'] });
      toast.success('Course démarrée !');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => DriverService.completeRide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverActiveBooking'] });
      queryClient.invalidateQueries({ queryKey: ['driverStatistics'] });
      toast.success('Course terminée avec succès ! 🎉');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const toggleAvailability = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    availabilityMutation.mutate(nextState);
    toast(nextState ? '🟢 Vous êtes maintenant EN LIGNE' : '🔴 Vous êtes maintenant HORS LIGNE');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-8 pt-7 sm:pt-8">
      <div className="max-w-lg mx-auto px-5 space-y-4">

        {/* ── 6. ONLINE / OFFLINE CARD ────────────────────────────────────── */}
        <div className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-[#FF9900] shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                {isOnline ? 'Vous êtes actuellement En Ligne.' : 'Vous êtes actuellement Hors Ligne.'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isOnline
                  ? 'Vous êtes prêt à recevoir des courses ZAXI.'
                  : 'Passez En Ligne pour recevoir des courses ZAXI.'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleAvailability}
            disabled={availabilityMutation.isPending}
            className="bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 text-xs font-black px-4 py-2.5 rounded-2xl shadow-md shadow-orange-500/20 flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
          >
            <Power className="w-4 h-4" />
            {isOnline ? 'Passer Hors Ligne' : 'Passer En Ligne'}
          </button>
        </div>

        {/* ── INCOMING BOOKING SOCKET MODAL (If active request arrives) ── */}
        {incomingBooking && (
          <div className="bg-[#FF9900] p-4 rounded-[24px] text-slate-950 shadow-xl space-y-3 animate-pulse text-left">
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-black text-white">
                ⚡ Nouvelle demande de course !
              </span>
              <span className="text-sm font-extrabold">
                {incomingBooking.estimatedPrice ? `${incomingBooking.estimatedPrice} DA` : '1 250 DA'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-black shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-black/70">Départ</span>
                  <p className="font-bold text-slate-950">
                    {incomingBooking.pickupAddress || 'Bordj Bou Arréridj, Centre Ville'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-black/70">Destination</span>
                  <p className="font-bold text-slate-950">
                    {incomingBooking.dropoffAddress || 'Sétif, Gare Routière'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => rejectMutation.mutate(incomingBooking.bookingId)}
                className="py-2 px-3 rounded-xl bg-white/30 text-slate-950 text-xs font-bold hover:bg-white/40"
              >
                Refuser
              </button>
              <button
                onClick={() => acceptMutation.mutate(incomingBooking.bookingId)}
                className="py-2 px-3 rounded-xl bg-slate-950 text-white text-xs font-black shadow-md"
              >
                Accepter la course
              </button>
            </div>
          </div>
        )}

        {/* ── 7. PROCHAINE COURSE CARD ────────────────────────────────────── */}
        <div className="bg-[#FFF9F2] rounded-[24px] p-5 border border-amber-100/70 shadow-sm space-y-4 text-left">
          {/* Tag */}
          <div>
            <span className="text-[#FF9900] font-black text-[10px] tracking-wider uppercase bg-white/90 px-3 py-1 rounded-full border border-amber-200/60 inline-block">
              PROCHAINE COURSE
            </span>
          </div>

          {/* Route Section */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Departure */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[#FF9900] text-[11px] font-extrabold uppercase">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                Départ
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 truncate">
                {activeBooking?.pickupAddress ? activeBooking.pickupAddress.split(',')[0] : 'Bordj Bou Arréridj'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {activeBooking?.pickupAddress ? 'Position du client' : 'Centre Ville'}
              </p>
            </div>

            {/* Dashed line with Car icon in center */}
            <div className="flex-1 px-1 flex items-center justify-center relative">
              <div className="w-full border-t-2 border-dashed border-amber-300 absolute" />
              <div className="w-8 h-8 rounded-full bg-white border border-amber-200 shadow-xs flex items-center justify-center text-slate-900 relative z-10 shrink-0">
                <Car className="w-4 h-4 text-slate-900" />
              </div>
            </div>

            {/* Destination */}
            <div className="min-w-0 flex-1 text-right">
              <div className="flex items-center justify-end gap-1 text-[#FF9900] text-[11px] font-extrabold uppercase">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                Destination
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-1 truncate">
                {activeBooking?.dropoffAddress
                  ? activeBooking.dropoffAddress.split(',')[0]
                  : activeBooking?.destinationAddress?.split(',')[0] ?? 'Sétif'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {activeBooking?.dropoffAddress ? 'Destination' : 'Gare Routière'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-amber-200/60" />

          {/* 2 Info Columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Prise en charge estimée */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100/60 flex items-center justify-center text-[#FF9900] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-bold block leading-tight">
                  Prise en charge estimée
                </span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">
                  10:15
                </span>
              </div>
            </div>

            {/* Right: Estimation */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100/60 flex items-center justify-center text-[#FF9900] shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-bold block leading-tight">
                  Estimation
                </span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">
                  {activeBooking?.estimatedPrice ?? '1 250'} DA
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {rideState === 'accepted' ? (
              <button
                onClick={() => startMutation.mutate(activeBooking.id)}
                disabled={startMutation.isPending}
                className="w-full py-3.5 bg-slate-950 hover:bg-black text-white text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <PlayCircle className="w-4 h-4 text-[#FF9900]" />
                {startMutation.isPending ? 'Démarrage...' : 'Commencer la course'}
              </button>
            ) : rideState === 'in_progress' ? (
              <button
                onClick={() => completeMutation.mutate(activeBooking.id)}
                disabled={completeMutation.isPending}
                className="w-full py-3.5 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <FlagTriangleRight className="w-4 h-4" />
                {completeMutation.isPending ? 'Finalisation...' : 'Terminer la course'}
              </button>
            ) : (
              <button
                type="button"
                className="w-full py-3.5 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 text-xs font-black rounded-2xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                Voir la course
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── 8. STATISTICS GRID ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3.5 text-left">
          {/* Card 1: Courses Terminées */}
          <div className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Courses terminées
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-slate-900">
                {stats.todayRides}
              </span>
              <span className="text-emerald-600 font-extrabold text-xs">
                ↗ +20%
              </span>
            </div>
          </div>

          {/* Card 2: Recette du jour */}
          <div className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Recette du jour
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {stats.dailyRevenue} DA
              </span>
              <span className="text-emerald-600 font-extrabold text-xs">
                ↗ +15%
              </span>
            </div>
          </div>

          {/* Card 3: Clients inscrits */}
          <div className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Clients inscrits
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-slate-900">
                {stats.totalCustomers}
              </span>
              <span className="text-emerald-600 font-extrabold text-xs">
                ↗ +8%
              </span>
            </div>
          </div>

          {/* Card 4: Note Chauffeur */}
          <div className="bg-white rounded-[22px] p-4 border border-slate-100 shadow-sm space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Note Chauffeur
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {stats.averageRating} / 5
              </span>
              <span className="text-emerald-600 font-extrabold text-xs">
                ★ Excellent !
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
