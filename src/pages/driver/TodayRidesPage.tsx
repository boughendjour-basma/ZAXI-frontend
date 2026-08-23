import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import type { Booking } from '@/types/booking.types';
import {
  MapPin,
  Navigation,
  Clock,
  ChevronRight,
  AlertCircle,
  X,
  User,
  Phone,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

function formatTime(dateStr?: string) {
  if (!dateStr) return '--:--';
  try {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function DriverTodayPage() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: statsRes } = useQuery({
    queryKey: ['driverStatistics'],
    queryFn: () => DriverService.getStatistics(),
  });

  const rawStats = (statsRes?.data?.data as any) ?? (statsRes?.data as any) ?? {};
  const stats = {
    dailyRevenue: rawStats.dailyRevenue ?? 0,
    completedRides: rawStats.completedRides ?? 0,
    cancelledRides: rawStats.cancelledRides ?? 0,
    averageDistanceKm: rawStats.averageDistanceKm ?? 0,
  };

  const { data: bookingsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['driverTodayBookings'],
    queryFn: () => DriverService.getBookings({ limit: 50 }),
  });

  const rawBookings = (bookingsRes?.data?.data as any)?.bookings ?? (bookingsRes?.data as any) ?? [];
  const bookings: Booking[] = Array.isArray(rawBookings) ? rawBookings : [];

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((b) => {
    if (!b.createdAt) return true;
    return new Date(b.createdAt).toISOString().slice(0, 10) === todayStr;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-8 pt-7 px-5 max-w-lg mx-auto space-y-5 text-left">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Activités d'Aujourd'hui
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Résumé opérationnel du {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recette du jour</p>
          <p className="text-xl font-black text-slate-900">{stats.dailyRevenue} DA</p>
        </Card>

        <Card className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Courses réalisées</p>
          <p className="text-xl font-black text-slate-900">{stats.completedRides}</p>
        </Card>

        <Card className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annulées</p>
          <p className="text-xl font-black text-slate-900">{stats.cancelledRides}</p>
        </Card>

        <Card className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distance Moyenne</p>
          <p className="text-xl font-black text-slate-900">{stats.averageDistanceKm} km</p>
        </Card>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-4 bg-white rounded-[22px] border border-slate-100 animate-pulse space-y-2">
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">Impossible de charger les courses du jour.</p>
          <button onClick={() => refetch()} className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl">
            Réessayer
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && todayBookings.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-[22px] border border-slate-100 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto text-[#FF9900]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Aucune course enregistrée aujourd'hui</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-medium">
              Les demandes acceptées ou complétées aujourd'hui s'afficheront ici en temps réel.
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {!isLoading && !isError && todayBookings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Liste des courses ({todayBookings.length})
          </h2>
          <div className="grid gap-3">
            {todayBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-sm hover:border-[#FF9900] transition-all cursor-pointer space-y-3 text-left"
              >
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#FF9900]" /> {formatTime(b.createdAt)}
                  </span>
                  <span className="text-sm font-black text-[#FF9900]">
                    {b.estimatedPrice ?? b.finalPrice ?? '—'} DA
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-medium">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#FF9900] shrink-0 mt-0.5" />
                    <p className="text-slate-900 font-bold truncate">
                      {b.pickupAddress || 'Bordj Bou Arréridj'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-3.5 h-3.5 text-slate-900 shrink-0 mt-0.5" />
                    <p className="text-slate-900 font-bold truncate">
                      {b.dropoffAddress || b.destinationAddress || 'Sétif'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-extrabold ${
                      b.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-600'
                        : b.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {b.status === 'COMPLETED' ? 'Terminée' : b.status === 'CANCELLED' ? 'Annulée' : 'En cours'}
                  </span>
                  <span className="text-slate-400 font-medium flex items-center gap-0.5">
                    Détails <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-left"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Détails de la course</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Prix total</p>
                  <p className="text-lg font-black text-[#FF9900]">
                    {selectedBooking.estimatedPrice ?? selectedBooking.finalPrice ?? '—'} DA
                  </p>
                </div>
                <span className="px-3 py-1 bg-white rounded-full text-xs font-black text-slate-900 shadow-xs">
                  {selectedBooking.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#FF9900] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Départ</span>
                    <p className="font-bold text-slate-900">{selectedBooking.pickupAddress || 'Non spécifié'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Destination</span>
                    <p className="font-bold text-slate-900">
                      {selectedBooking.dropoffAddress || selectedBooking.destinationAddress || 'Non spécifié'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedBooking.customer && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <User className="w-4 h-4 text-[#FF9900]" />
                    {selectedBooking.customer.name || 'Client'}
                  </div>
                  {selectedBooking.customer.phone && (
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedBooking.customer.phone}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedBooking(null)}
              className="w-full py-3 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 font-black text-xs rounded-2xl shadow-md cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
