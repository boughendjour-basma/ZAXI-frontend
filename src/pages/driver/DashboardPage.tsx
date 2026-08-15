import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  ShieldCheck,
  MapPin,
  Navigation,
  Phone,
  CheckCheck,
  XCircle,
  PlayCircle,
  FlagTriangleRight,
  AlertCircle,
  Power,
  Star,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { useSocketEvent } = useSocket();

  const [isOnline, setIsOnline] = useState<boolean>(true);

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
    todayRides: rawStats.completedRides ?? 0,
    dailyRevenue: rawStats.dailyRevenue ?? 0,
    totalCustomers: rawStats.totalCustomers ?? 0,
    averageRating: rawStats.averageRating ?? 5.0,
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
    useCallback((data: SocketEvents['booking:new']) => {
      if (!isOnline) return;
      setIncomingBooking(data);
      toast('🚗 Nouvelle demande de course !', { duration: 8000 });
    }, [isOnline]),
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-3xl border border-[#FFE0A0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[#1A1A1A]">
              Bonjour, {user?.name ?? 'Chauffeur'}
            </h1>
            <Badge variant="warning" className="px-2.5 py-0.5 text-[10px] font-bold bg-[#FFF3D6] text-[#1A1A1A] border border-[#FFE0A0]">
              <ShieldCheck className="h-3 w-3 mr-1 text-[#FF9900]" /> Chauffeur ZAXI
            </Badge>
          </div>
          <p className="text-xs text-[#888] mt-0.5">
            Centre de contrôle et dispatch en temps réel — Bordj Bou Arréridj
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const nextState = !isOnline;
              setIsOnline(nextState);
              toast(nextState ? '🟢 Vous êtes maintenant EN LIGNE' : '🔴 Vous êtes maintenant HORS LIGNE');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md active:scale-95 ${
              isOnline
                ? 'bg-[#FF9900] text-black shadow-amber-200'
                : 'bg-[#F0F0F0] text-[#555]'
            }`}
          >
            <Power className={`w-4 h-4 ${isOnline ? 'animate-pulse' : ''}`} />
            {isOnline ? 'EN LIGNE (Disponible)' : 'HORS LIGNE (Indisponible)'}
          </button>

          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border ${
              isTracking && isOnline
                ? 'bg-[#FFF3D6] text-[#1A1A1A] border-[#FFE0A0]'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            {isTracking && isOnline ? 'GPS Actif' : 'GPS Inactif'}
          </div>
        </div>
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div className="p-4 rounded-3xl bg-[#FFF3D6] border border-[#FFE0A0] text-[#1A1A1A] text-xs font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#FF9900] shrink-0" />
            <span>Vous êtes actuellement Hors Ligne. Passez En Ligne pour recevoir des courses ZAXI.</span>
          </div>
          <button
            onClick={() => setIsOnline(true)}
            className="px-3.5 py-1.5 bg-[#FF9900] text-black text-xs font-bold rounded-xl shrink-0 shadow-sm"
          >
            Passer En Ligne
          </button>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="flex items-center gap-3 p-4 bg-white border border-[#FFE0A0]">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF3D6] flex items-center justify-center text-[#FF9900] shrink-0">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-[#888] font-bold uppercase tracking-wider">Courses terminées</p>
            <p className="text-xl font-black text-[#1A1A1A]">{stats.todayRides}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4 bg-white border border-[#FFE0A0]">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF3D6] flex items-center justify-center text-[#FF9900] shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-[#888] font-bold uppercase tracking-wider">Recette du jour</p>
            <p className="text-xl font-black text-[#1A1A1A]">{stats.dailyRevenue} DA</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4 bg-white border border-[#FFE0A0]">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF3D6] flex items-center justify-center text-[#FF9900] shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-[#888] font-bold uppercase tracking-wider">Clients inscrits</p>
            <p className="text-xl font-black text-[#1A1A1A]">{stats.totalCustomers}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4 bg-white border border-[#FFE0A0]">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF3D6] flex items-center justify-center text-[#FF9900] shrink-0">
            <Star className="h-5 w-5 fill-[#FF9900]" />
          </div>
          <div>
            <p className="text-[10px] text-[#888] font-bold uppercase tracking-wider">Note Chauffeur</p>
            <p className="text-xl font-black text-[#1A1A1A]">{stats.averageRating} / 5</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          {/* Incoming booking alert */}
          {incomingBooking && (
            <Card className="space-y-4 border-2 border-[#FF9900] bg-[#FFFBF0] shadow-lg animate-pulse">
              <div className="flex items-center justify-between border-b border-[#FFE0A0] pb-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#FF9900] text-black">
                  ⚡ Nouvelle demande de course !
                </span>
                <span className="text-sm font-black text-[#FF9900]">
                  {incomingBooking.estimatedPrice ? `${incomingBooking.estimatedPrice} DA` : 'Calcul...'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-[#FF9900] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#888] font-bold uppercase block">Lieu de prise en charge</span>
                    <span className="text-[#1A1A1A] font-medium">
                      {incomingBooking.pickupAddress || 'Position GPS du client'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Navigation className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#888] font-bold uppercase block">Destination</span>
                    <span className="text-[#1A1A1A] font-medium">
                      {incomingBooking.dropoffAddress || 'Destination'}
                    </span>
                  </div>
                </div>
              </div>

              {incomingBooking.customer && (
                <div className="p-3 rounded-2xl bg-white border border-[#FFE0A0] flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#1A1A1A]">
                      Client : {incomingBooking.customer.name || 'Client ZAXI'}
                    </p>
                    <p className="text-[11px] text-[#888] font-mono">+213 {incomingBooking.customer.phone}</p>
                  </div>
                  {incomingBooking.customer.phone && (
                    <a
                      href={`tel:${incomingBooking.customer.phone}`}
                      className="p-2 rounded-xl bg-[#FFF3D6] text-[#FF9900] hover:bg-[#FFE0A0] transition-colors"
                      title="Appeler"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => rejectMutation.mutate(incomingBooking.bookingId)}
                  disabled={rejectMutation.isPending || acceptMutation.isPending}
                  className="py-2.5 px-3 rounded-xl border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Refuser
                </button>
                <button
                  onClick={() => acceptMutation.mutate(incomingBooking.bookingId)}
                  disabled={acceptMutation.isPending || rejectMutation.isPending}
                  className="py-2.5 px-3 rounded-xl bg-[#FF9900] text-black text-xs font-bold hover:brightness-110 shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4" />
                  {acceptMutation.isPending ? 'Acceptation...' : 'Accepter la course'}
                </button>
              </div>
            </Card>
          )}

          {/* Active ride card */}
          {activeBooking && (rideState === 'accepted' || rideState === 'in_progress') && (
            <Card className="space-y-4 border-2 border-[#FF9900] bg-white">
              <div className="flex items-center justify-between border-b border-[#FFE0A0] pb-3">
                <h3 className="text-sm font-extrabold text-[#1A1A1A] flex items-center gap-2">
                  <Car className="h-4 w-4 text-[#FF9900]" /> Course en cours
                </h3>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    rideState === 'accepted'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-[#FFF3D6] text-[#FF9900]'
                  }`}
                >
                  {rideState === 'accepted' ? 'En route vers le client' : 'Trajet en cours'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-[#FF9900] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#888] font-bold uppercase">Lieu de départ</span>
                    <p className="font-semibold text-[#1A1A1A]">
                      {activeBooking.pickupAddress || 'Position du client'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Navigation className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#888] font-bold uppercase">Destination</span>
                    <p className="font-semibold text-[#1A1A1A]">
                      {activeBooking.dropoffAddress || activeBooking.destinationAddress || 'Destination'}
                    </p>
                  </div>
                </div>
              </div>

              {activeBooking.customer && (
                <div className="p-2.5 bg-[#FFFBF0] border border-[#FFE0A0] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#888] text-[10px] block">Client</span>
                    <span className="font-bold text-[#1A1A1A]">
                      {activeBooking.customer.name}
                    </span>
                  </div>
                  {activeBooking.customer.phone && (
                    <a
                      href={`tel:${activeBooking.customer.phone}`}
                      className="px-3 py-1.5 bg-[#FF9900] text-black font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" /> Appeler
                    </a>
                  )}
                </div>
              )}

              <div className="pt-2">
                {rideState === 'accepted' && (
                  <button
                    onClick={() => startMutation.mutate(activeBooking.id)}
                    disabled={startMutation.isPending}
                    className="w-full py-3 bg-[#1A1A1A] hover:bg-black text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {startMutation.isPending ? 'Démarrage...' : 'Commencer la course'}
                  </button>
                )}
                {rideState === 'in_progress' && (
                  <button
                    onClick={() => completeMutation.mutate(activeBooking.id)}
                    disabled={completeMutation.isPending}
                    className="w-full py-3 bg-[#FF9900] text-black font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <FlagTriangleRight className="w-4 h-4" />
                    {completeMutation.isPending ? 'Finalisation...' : 'Terminer la course'}
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Idle waiting state */}
          {!incomingBooking && rideState === 'waiting' && (
            <Card className="space-y-3 text-center py-8 bg-white border border-[#FFE0A0]">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF3D6] flex items-center justify-center mx-auto text-[#FF9900]">
                <Car className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1A1A1A]">
                  {isOnline ? 'En attente de réservations' : 'Vous êtes Hors Ligne'}
                </h3>
                <p className="text-xs text-[#888] mt-1 max-w-xs mx-auto">
                  {isOnline
                    ? 'Le système de dispatching ZAXI est actif. Dès qu\'un client réserve, vous recevrez une alerte.'
                    : 'Passez En Ligne pour recevoir des commandes de trajet à Bordj Bou Arréridj.'}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
