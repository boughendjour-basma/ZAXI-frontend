import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import type { Booking } from '@/types/booking.types';
import {
  Car,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Navigation,
  Phone,
  X,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

function formatTime(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  } catch { return ''; }
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(dateStr));
  } catch { return dateStr; }
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
          Activités d'Aujourd'hui
        </h1>
        <p className="text-xs text-[#888] mt-0.5">
          Résumé opérationnel de la journée du {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3 bg-white border border-[#FFE0A0]">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF3D6] flex items-center justify-center text-[#FF9900] shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#888] uppercase">Recette du jour</p>
            <p className="text-xl font-black text-[#1A1A1A]">{stats.dailyRevenue} DA</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 bg-white border border-[#FFE0A0]">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF3D6] flex items-center justify-center text-[#FF9900] shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#888] uppercase">Courses réalisées</p>
            <p className="text-xl font-black text-[#1A1A1A]">{stats.completedRides}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 bg-white border border-[#FFE0A0]">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#888] uppercase">Annulées</p>
            <p className="text-xl font-black text-[#1A1A1A]">{stats.cancelledRides}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 bg-white border border-[#FFE0A0]">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF3D6] flex items-center justify-center text-[#FF9900] shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#888] uppercase">Distance Moyenne</p>
            <p className="text-xl font-black text-[#1A1A1A]">{stats.averageDistanceKm} km</p>
          </div>
        </Card>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-4 bg-white rounded-2xl border border-[#FFE0A0] animate-pulse space-y-2">
              <div className="h-4 bg-[#FFF3D6] rounded w-1/4" />
              <div className="h-3 bg-[#FFF3D6] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">Impossible de charger les courses du jour.</p>
          <button onClick={() => refetch()} className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl">
            Réessayer
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && todayBookings.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-3xl border border-[#FFE0A0] space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF3D6] flex items-center justify-center mx-auto text-[#FF9900]">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A]">Aucune course enregistrée aujourd'hui</h3>
            <p className="text-xs text-[#888] mt-1 max-w-xs mx-auto">
              Les demandes acceptées ou complétées aujourd'hui s'afficheront ici en temps réel.
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {!isLoading && !isError && todayBookings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-[#888] uppercase tracking-wider">
            Liste des courses ({todayBookings.length})
          </h2>
          <div className="grid gap-3">
            {todayBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="p-4 bg-white rounded-2xl border border-[#FFE0A0] shadow-sm hover:border-[#FF9900] transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between text-xs border-b border-[#FFE0A0] pb-2">
                  <span className="font-bold text-[#555] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#FF9900]" /> {formatTime(b.createdAt)}
                  </span>
                  <span className="text-sm font-black text-[#FF9900]">
                    {b.estimatedPrice ?? b.finalPrice ?? '—'} DA
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#FF9900] shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A] font-medium line-clamp-1">{b.pickupAddress || 'Point de départ'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A] font-medium line-clamp-1">
                      {b.dropoffAddress || b.destinationAddress || 'Destination'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#888]">
                    Client : <strong className="text-[#1A1A1A]">{(b.customer as any)?.name ?? 'Client'}</strong>
                  </span>
                  <div className="flex items-center gap-1 text-[#FF9900] font-semibold">
                    <span>Détails</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-[#FFE0A0]">
            <div className="flex items-center justify-between border-b border-[#FFE0A0] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1A1A1A]">Détails de la course</h3>
                <p className="text-xs text-[#888]">{formatTime(selectedBooking.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-full bg-[#FFF3D6] text-[#555]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#FFFBF0] border border-[#FFE0A0] rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#888]">Montant</span>
                <span className="font-black text-[#FF9900]">
                  {selectedBooking.estimatedPrice ?? selectedBooking.finalPrice ?? '—'} DA
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">Statut</span>
                <span className="font-bold text-[#1A1A1A]">{selectedBooking.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">Distance</span>
                <span className="font-bold text-[#1A1A1A]">{selectedBooking.distanceKm ?? '—'} km</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[#888] font-bold block text-[10px]">Départ</span>
                <p className="font-medium text-[#1A1A1A]">{selectedBooking.pickupAddress || 'Position du client'}</p>
              </div>
              <div>
                <span className="text-[#888] font-bold block text-[10px]">Destination</span>
                <p className="font-medium text-[#1A1A1A]">{selectedBooking.dropoffAddress || selectedBooking.destinationAddress || 'Destination'}</p>
              </div>
            </div>

            {(selectedBooking.customer as any)?.phone && (
              <a
                href={`tel:${(selectedBooking.customer as any).phone}`}
                className="w-full py-2.5 bg-[#FF9900] text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Appeler le client ({(selectedBooking.customer as any).phone})
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
