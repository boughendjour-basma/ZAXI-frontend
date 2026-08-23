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
  ChevronLeft,
} from 'lucide-react';

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function DriverRideHistoryPage() {
  const [page, setPage] = useState<number>(1);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: bookingsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['driverBookingsHistory', page, filterStatus],
    queryFn: () =>
      DriverService.getBookings({
        page,
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        limit: 15,
      }),
  });

  const rawData = bookingsRes?.data?.data;
  const bookings: Booking[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.bookings)
    ? (rawData as any).bookings
    : [];

  const pagination = (rawData as any)?.pagination ?? { page: 1, totalPages: 1 };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-8 pt-7 px-5 max-w-lg mx-auto space-y-5 text-left">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Historique des courses
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Toutes les courses enregistrées sur la plateforme ZAXI
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'Toutes' },
          { id: 'COMPLETED', label: 'Terminées' },
          { id: 'CANCELLED', label: 'Annulées' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => { setFilterStatus(item.id); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === item.id
                ? 'bg-[#FF9900] text-slate-950 shadow-xs'
                : 'bg-white text-slate-600 border border-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-4 bg-white rounded-[22px] border border-slate-100 animate-pulse space-y-3">
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">Impossible de charger l'historique des courses.</p>
          <button onClick={() => refetch()} className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl">
            Réessayer
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && bookings.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-[22px] border border-slate-100 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto text-[#FF9900]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Aucune course dans l'historique</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-medium">
              Les courses effectuées ou annulées s'afficheront ici.
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {!isLoading && !isError && bookings.length > 0 && (
        <div className="space-y-3">
          <div className="grid gap-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-sm hover:border-[#FF9900] transition-all cursor-pointer space-y-3 text-left"
              >
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#FF9900]" /> {formatDate(b.createdAt)}
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
                    {b.status === 'COMPLETED' ? 'Terminée' : b.status === 'CANCELLED' ? 'Annulée' : b.status}
                  </span>
                  <span className="text-slate-400 font-medium flex items-center gap-0.5">
                    Détails <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 disabled:opacity-40 flex items-center gap-1 bg-white"
              >
                <ChevronLeft className="w-4 h-4" /> Précédent
              </button>
              <span className="text-xs text-slate-400 font-bold">
                Page {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 disabled:opacity-40 flex items-center gap-1 bg-white"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
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
