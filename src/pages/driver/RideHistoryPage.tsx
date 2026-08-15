import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import type { Booking } from '@/types/booking.types';
import {
  Clock,
  MapPin,
  Navigation,
  Star,
  X,
  ChevronRight,
  AlertCircle,
  Phone,
  ChevronLeft,
} from 'lucide-react';

function formatFrenchDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr));
  } catch { return dateStr; }
}

function formatFrenchTime(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  } catch { return ''; }
}

export default function DriverRideHistoryPage() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);

  const { data: bookingsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['driverRideHistory', filterStatus, page],
    queryFn: () =>
      DriverService.getBookings({
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        page,
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
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
            Historique des courses
          </h1>
          <p className="text-xs text-[#888] mt-0.5">
            Toutes les courses enregistrées sur la plateforme ZAXI
          </p>
        </div>
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              filterStatus === item.id
                ? 'bg-[#FF9900] text-black shadow-sm'
                : 'bg-white text-[#555] border border-[#FFE0A0]'
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
            <div key={n} className="p-4 bg-white rounded-2xl border border-[#FFE0A0] animate-pulse space-y-3">
              <div className="h-4 bg-[#FFF3D6] rounded w-1/3" />
              <div className="h-3 bg-[#FFF3D6] rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">Impossible de charger l'historique des courses.</p>
          <button onClick={() => refetch()} className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl">
            Réessayer
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && bookings.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-3xl border border-[#FFE0A0] space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF3D6] flex items-center justify-center mx-auto text-[#FF9900]">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A]">Aucune course dans l'historique</h3>
            <p className="text-xs text-[#888] mt-1 max-w-xs mx-auto">
              Les courses effectuées ou annulées s'afficheront ici.
            </p>
          </div>
        </div>
      )}

      {/* History list */}
      {!isLoading && !isError && bookings.length > 0 && (
        <div className="space-y-3">
          <div className="grid gap-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="p-4 bg-white rounded-2xl border border-[#FFE0A0] shadow-sm hover:border-[#FF9900] transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between text-xs border-b border-[#FFE0A0] pb-2">
                  <span className="font-semibold text-[#555]">
                    {formatFrenchDate(b.createdAt)} à {formatFrenchTime(b.createdAt)}
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
                    <span>Voir détails</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl border border-[#FFE0A0] bg-white disabled:opacity-50 flex items-center gap-1 text-[#555]"
              >
                <ChevronLeft className="w-4 h-4" /> Précédent
              </button>
              <span className="text-[#888]">Page {page} sur {pagination.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-xl border border-[#FFE0A0] bg-white disabled:opacity-50 flex items-center gap-1 text-[#555]"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto border border-[#FFE0A0]">
            <div className="flex items-center justify-between border-b border-[#FFE0A0] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1A1A1A]">Fiche de la course</h3>
                <p className="text-xs text-[#888]">
                  {formatFrenchDate(selectedBooking.createdAt)} à {formatFrenchTime(selectedBooking.createdAt)}
                </p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-2 rounded-full bg-[#FFF3D6] text-[#555]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#FFFBF0] border border-[#FFE0A0] rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#888]">Montant total</span>
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
                <span className="font-semibold text-[#1A1A1A]">{selectedBooking.distanceKm ?? '—'} km</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs p-3 bg-[#FFFBF0] border border-[#FFE0A0] rounded-2xl">
              <div>
                <span className="text-[10px] text-[#888] font-bold block">Départ</span>
                <p className="font-medium text-[#1A1A1A]">{selectedBooking.pickupAddress || 'Position du client'}</p>
              </div>
              <div>
                <span className="text-[10px] text-[#888] font-bold block">Destination</span>
                <p className="font-medium text-[#1A1A1A]">{selectedBooking.dropoffAddress || selectedBooking.destinationAddress || 'Destination'}</p>
              </div>
            </div>

            {selectedBooking.rating && (
              <div className="p-3 bg-[#FFF3D6] border border-[#FFE0A0] rounded-2xl space-y-1 text-xs">
                <div className="flex items-center gap-1 text-[#FF9900] font-bold">
                  <Star className="w-4 h-4 fill-[#FF9900]" />
                  <span>Avis client ({selectedBooking.rating.score}/5)</span>
                </div>
                {selectedBooking.rating.comment && (
                  <p className="text-[#555] italic">"{selectedBooking.rating.comment}"</p>
                )}
              </div>
            )}

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
