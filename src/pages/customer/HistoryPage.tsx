import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CustomerService } from '@/services/customer.service';
import { BookingService } from '@/services/booking.service';
import type { Booking } from '@/types/booking.types';
import {
  Car,
  Clock,
  MapPin,
  Navigation,
  Star,
  X,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

function formatFrenchDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

function formatFrenchTime(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
          ✓ Course terminée
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">
          ✕ Annulée
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF3D6] text-amber-700">
          ⚡ En cours
        </span>
      );
    case 'ACCEPTED':
    case 'DRIVER_ARRIVING':
    case 'ARRIVED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
          🚗 Chauffeur en route
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-[#333]">
          En attente
        </span>
      );
  }
}

export default function CustomerHistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Rating modal state
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');

  const { data: bookingsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerBookings'],
    queryFn: () => CustomerService.getMyBookings(),
  });

  const rawData = bookingsRes?.data?.data;
  const bookings: Booking[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as any)?.bookings)
    ? (rawData as any).bookings
    : [];

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'COMPLETED') return b.status === 'COMPLETED';
    if (filterStatus === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  // Rating mutation
  const ratingMutation = useMutation({
    mutationFn: ({ bookingId, score, comment }: { bookingId: string; score: number; comment?: string }) =>
      BookingService.createRating(bookingId, { score, comment }),
    onSuccess: () => {
      toast.success('Merci pour votre évaluation !');
      queryClient.invalidateQueries({ queryKey: ['customerBookings'] });
      setSelectedBooking(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Erreur lors de l'envoi de l'évaluation.";
      toast.error(msg);
    },
  });

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    ratingMutation.mutate({
      bookingId: selectedBooking.id,
      score: ratingScore,
      comment: ratingComment.trim() || undefined,
    });
  };

  return (
    <div className="p-4 space-y-5 max-w-md mx-auto">
      {/* Top Title & Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#1A1A1A] tracking-tight">
            Mes courses
          </h1>
          <p className="text-xs text-[#888] mt-0.5">
            Historique de vos trajets ZAXI
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: 'Toutes' },
          { id: 'COMPLETED', label: 'Terminées' },
          { id: 'CANCELLED', label: 'Annulées' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilterStatus(item.id)}
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

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-4 bg-white rounded-2xl border border-[#FFE0A0] animate-pulse space-y-3"
            >
              <div className="h-4 bg-[#F5F5F5] rounded w-1/3" />
              <div className="h-3 bg-white rounded w-3/4" />
              <div className="h-3 bg-white rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">
            Impossible de charger l'historique de vos courses.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filteredBookings.length === 0 && (
        <div className="py-12 px-4 text-center bg-white rounded-3xl border border-[#FFE0A0] space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#FFF3D6] flex items-center justify-center mx-auto text-[#FF9900]">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A]">
              Vous n'avez encore effectué aucune course.
            </h3>
            <p className="text-xs text-[#888] mt-1 max-w-xs mx-auto">
              Commandez votre premier trajet à Bordj Bou Arréridj en quelques secondes.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#FF9900] text-black text-sm font-bold rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            Réserver une course
          </button>
        </div>
      )}

      {/* History List */}
      {!isLoading && !isError && filteredBookings.length > 0 && (
        <div className="space-y-3">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              onClick={() => setSelectedBooking(b)}
              className="p-4 bg-white rounded-2xl border border-[#FFE0A0] shadow-sm hover:border-amber-500/40 transition-all cursor-pointer space-y-3 group"
            >
              {/* Header: Date + Price */}
              <div className="flex items-center justify-between text-xs text-[#888] border-b border-[#FFE0A0] pb-2.5">
                <span className="font-semibold text-[#333]">
                  {formatFrenchDate(b.createdAt)} • {formatFrenchTime(b.createdAt)}
                </span>
                <span className="text-sm font-black text-[#FF9900]">
                  {b.estimatedPrice ?? b.finalPrice ?? '—'} DA
                </span>
              </div>

              {/* Pickup & Dropoff */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FF9900] shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-[#1A1A1A] line-clamp-1">
                    {b.pickupAddress || `${b.pickupLat?.toFixed(4)}, ${b.pickupLng?.toFixed(4)}`}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Navigation className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-[#1A1A1A] line-clamp-1">
                    {b.dropoffAddress || b.destinationAddress || 'Destination'}
                  </span>
                </div>
              </div>

              {/* Status & Rating */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  {getStatusBadge(b.status)}
                </div>

                <div className="flex items-center gap-1">
                  {b.rating ? (
                    <div className="flex items-center text-[#FF9900] text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                      {b.rating.score}
                    </div>
                  ) : b.status === 'COMPLETED' ? (
                    <span className="text-[11px] text-[#FF9900] font-semibold underline">
                      Évaluer
                    </span>
                  ) : null}
                  <ChevronRight className="w-4 h-4 text-[#888] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ride Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#FFE0A0] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1A1A1A]">
                  Détails de la course
                </h3>
                <p className="text-xs text-[#888]">
                  {formatFrenchDate(selectedBooking.createdAt)} à {formatFrenchTime(selectedBooking.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-full bg-white text-[#888] hover:text-[#1A1A1A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Price Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-[#888]">Statut</div>
                <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#888]">Montant</div>
                <div className="text-xl font-black text-[#FF9900]">
                  {selectedBooking.estimatedPrice ?? selectedBooking.finalPrice ?? '—'} DA
                </div>
              </div>
            </div>

            {/* Course Information */}
            <div className="p-3 bg-white rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-[#888]">Distance</span>
                <span className="font-semibold text-[#1A1A1A]">
                  {selectedBooking.distanceKm ? `${selectedBooking.distanceKm} km` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-[#888]">Durée estimée</span>
                <span className="font-semibold text-[#1A1A1A]">
                  {selectedBooking.durationMinutes ? `${selectedBooking.durationMinutes} min` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#888]">Type de tarification</span>
                <span className="font-semibold text-[#1A1A1A]">
                  {selectedBooking.pricingType === 'CITY' ? 'Tarif Urbain' : 'Tarif au Kilomètre'}
                </span>
              </div>
            </div>

            {/* Locations */}
            <div className="space-y-3 p-3 bg-white rounded-2xl">
              <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider">Itinéraire</h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-[#888] font-semibold">Départ</div>
                    <div className="font-medium text-[#1A1A1A]">
                      {selectedBooking.pickupAddress || 'Position de départ'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Navigation className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-[#888] font-semibold">Destination</div>
                    <div className="font-medium text-[#1A1A1A]">
                      {selectedBooking.dropoffAddress || selectedBooking.destinationAddress || 'Destination'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Information */}
            {selectedBooking.driver && (
              <div className="p-4 bg-white rounded-2xl space-y-2 text-xs">
                <div className="font-bold text-[#1A1A1A] text-sm border-b border-slate-200/60 pb-2 flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#FF9900]" /> Chauffeur ZAXI
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#888]">Nom</span>
                  <span className="font-semibold text-[#1A1A1A]">{selectedBooking.driver.name}</span>
                </div>
                {selectedBooking.driver.phone && (
                  <div className="flex justify-between py-1 border-t border-slate-200/50">
                    <span className="text-[#888]">Téléphone</span>
                    <a href={`tel:${selectedBooking.driver.phone}`} className="font-bold text-[#FF9900] underline">
                      +213 {selectedBooking.driver.phone}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Rating Section */}
            <div className="p-4 bg-white rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Évaluation du chauffeur
              </h4>

              {selectedBooking.rating ? (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= selectedBooking.rating!.score
                            ? 'fill-amber-400 text-[#FF9900]'
                            : 'text-[#AAA]'
                        }`}
                      />
                    ))}
                    <span className="font-bold text-[#1A1A1A] ml-1">
                      {selectedBooking.rating.score} / 5
                    </span>
                  </div>
                  {selectedBooking.rating.comment && (
                    <p className="text-[#555] italic pt-1">
                      "{selectedBooking.rating.comment}"
                    </p>
                  )}
                </div>
              ) : selectedBooking.status === 'COMPLETED' ? (
                <form onSubmit={handleRateSubmit} className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingScore(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= ratingScore
                              ? 'fill-amber-400 text-[#FF9900]'
                              : 'text-[#AAA]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Commentaire facultatif..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#FFE0A0] bg-white text-[#1A1A1A] outline-none focus:border-[#FF9900]"
                  />

                  <button
                    type="submit"
                    disabled={ratingMutation.isPending}
                    className="w-full py-2.5 bg-[#FF9900] text-black font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    {ratingMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Soumettre l'évaluation"
                    )}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-[#888]">
                  L'évaluation est disponible une fois la course terminée.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
