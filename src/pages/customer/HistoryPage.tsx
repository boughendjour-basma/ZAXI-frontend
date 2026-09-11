import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CustomerService } from '@/services/customer.service';
import { BookingService } from '@/services/booking.service';
import type { Booking } from '@/types/booking.types';
import { useTranslation } from '@/store/languageStore';
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
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

function formatLocalizedDate(dateStr: string, lang: string) {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

function formatLocalizedTime(dateStr: string, lang: string) {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '';
  }
}

export default function CustomerHistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, language, isRTL } = useTranslation();

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
      toast.success(language === 'ar' ? 'شكراً لتقييمك !' : 'Merci pour votre évaluation !');
      queryClient.invalidateQueries({ queryKey: ['customerBookings'] });
      setSelectedBooking(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء إرسال التقييم.' : "Erreur lors de l'envoi de l'évaluation.");
      toast.error(msg);
    },
  });

  function getStatusBadge(status: string) {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t.history.statusCompleted}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
            <XCircle className="w-3.5 h-3.5" /> {t.history.statusCancelled}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            ⚡ {t.history.statusInProgress}
          </span>
        );
      case 'ACCEPTED':
      case 'DRIVER_ARRIVING':
      case 'ARRIVED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            <Car className="w-3.5 h-3.5" /> {t.history.statusDriverArriving}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {t.history.statusPending}
          </span>
        );
    }
  }

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
    <div
      className="min-h-screen pb-10"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <div className="px-5 pt-7 pb-8 max-w-lg mx-auto space-y-5">
        {/* Top Title */}
        <div className="text-start">
          <h1
            className="text-[22px] font-extrabold tracking-tight text-slate-900"
          >
            {t.history.title}
          </h1>
          <p
            className="text-[13px] mt-0.5 text-slate-500"
          >
            {t.history.subtitle}
          </p>
        </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: t.history.filterAll },
          { id: 'COMPLETED', label: t.history.filterCompleted },
          { id: 'CANCELLED', label: t.history.filterCancelled },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilterStatus(item.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
              filterStatus === item.id
                ? 'bg-[#FF9900] text-slate-950 border-[#FF9900] shadow-md shadow-[#FF9900]/20'
                : 'bg-white text-slate-700 border-slate-200/80 hover:border-amber-300'
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
              className="p-5 bg-white rounded-3xl border border-slate-200/80 animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-100 rounded-xl w-1/3" />
              <div className="h-3 bg-slate-100 rounded-xl w-3/4" />
              <div className="h-3 bg-slate-100 rounded-xl w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-700 font-medium">
            {t.common.error}
          </p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2 bg-rose-600 text-white text-xs font-bold rounded-2xl hover:bg-rose-700 transition-colors cursor-pointer"
          >
            {t.common.confirm}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filteredBookings.length === 0 && (
        <div className="py-14 px-6 text-center bg-white rounded-3xl border border-slate-200/80 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-[#FF9900] border border-amber-200/60">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t.history.noRides}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {t.history.noRidesDesc}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-7 py-3.5 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 text-sm font-extrabold rounded-2xl shadow-lg shadow-[#FF9900]/20 active:scale-95 transition-all cursor-pointer"
          >
            {t.history.bookFirstRide}
          </button>
        </div>
      )}

      {/* History List */}
      {!isLoading && !isError && filteredBookings.length > 0 && (
        <div className="space-y-3 text-start">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              onClick={() => setSelectedBooking(b)}
              className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:border-[#FF9900]/60 transition-all cursor-pointer space-y-3.5 group"
            >
              {/* Header: Date + Price */}
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-3">
                <span className="font-semibold text-slate-500">
                  {formatLocalizedDate(b.createdAt, language)} • {formatLocalizedTime(b.createdAt, language)}
                </span>
                <span className="text-sm font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-xl border border-amber-200/60">
                  {b.estimatedPrice ?? b.finalPrice ?? '—'} {t.common.currency}
                </span>
              </div>

              {/* Pickup & Dropoff */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FF9900] shrink-0 mt-0.5" />
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">
                    {b.pickupAddress || `${b.pickupLat?.toFixed(4)}, ${b.pickupLng?.toFixed(4)}`}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Navigation className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold text-slate-700 line-clamp-1">
                    {b.dropoffAddress || b.destinationAddress || t.home.destination}
                  </span>
                </div>
              </div>

              {/* Status & Rating */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  {getStatusBadge(b.status)}
                </div>

                <div className="flex items-center gap-1.5">
                  {b.rating ? (
                    <div className="flex items-center text-amber-600 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                      <Star className="w-3.5 h-3.5 fill-amber-400 mx-1" />
                      {b.rating.score}
                    </div>
                  ) : b.status === 'COMPLETED' ? (
                    <span className="text-[11px] text-[#FF9900] font-bold underline">
                      {t.history.rateRide}
                    </span>
                  ) : null}
                  <ChevronRight className={cn('w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform', isRTL && 'rotate-180 group-hover:-translate-x-0.5')} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ride Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[36px] sm:rounded-[36px] p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200 text-start">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {t.history.rideDetails}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatLocalizedDate(selectedBooking.createdAt, language)} {formatLocalizedTime(selectedBooking.createdAt, language)}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Price Banner */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-md">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {language === 'ar' ? 'الحالة' : 'Statut'}
                </div>
                <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
              </div>
              <div className="text-end">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {t.history.totalPaid}
                </div>
                <div className="text-xl font-black text-[#FF9900]">
                  {selectedBooking.estimatedPrice ?? selectedBooking.finalPrice ?? '—'} {t.common.currency}
                </div>
              </div>
            </div>

            {/* Course Information */}
            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs border border-slate-100">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">{t.history.distance}</span>
                <span className="font-bold text-slate-900">
                  {selectedBooking.distanceKm ? `${selectedBooking.distanceKm} ${t.common.kilometers}` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">{t.history.duration}</span>
                <span className="font-bold text-slate-900">
                  {selectedBooking.durationMinutes ? `${selectedBooking.durationMinutes} ${t.common.minutes}` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">{t.history.baseFare}</span>
                <span className="font-bold text-slate-900">
                  {selectedBooking.pricingType === 'CITY'
                    ? (language === 'ar' ? 'تسعيرة داخل المدينة' : 'Tarif Urbain')
                    : (language === 'ar' ? 'تسعيرة بالكيلومتر' : 'Tarif au Kilomètre')}
                </span>
              </div>
            </div>

            {/* Locations */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'ar' ? 'المسار' : 'Itinéraire'}
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FF9900] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">{t.home.pickup}</div>
                    <div className="font-bold text-slate-900">
                      {selectedBooking.pickupAddress || t.home.currentPosition}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Navigation className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">{t.home.destination}</div>
                    <div className="font-bold text-slate-900">
                      {selectedBooking.dropoffAddress || selectedBooking.destinationAddress || t.home.destination}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Information */}
            {selectedBooking.driver && (
              <div className="p-4 bg-amber-50/60 rounded-2xl space-y-2 text-xs border border-amber-200/60">
                <div className="font-bold text-slate-900 text-sm border-b border-amber-200/60 pb-2 flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#FF9900]" /> {t.history.driverInfo}
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">{t.profile.fullName}</span>
                  <span className="font-bold text-slate-900">{selectedBooking.driver.name}</span>
                </div>
                {selectedBooking.driver.phone && (
                  <div className="flex justify-between py-1 border-t border-amber-200/40">
                    <span className="text-slate-600">{t.profile.phone}</span>
                    <a href={`tel:${selectedBooking.driver.phone}`} className="font-bold text-amber-700 underline">
                      +213 {selectedBooking.driver.phone}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Rating Section */}
            <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t.history.ratingTitle}
              </h4>

              {selectedBooking.rating ? (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= selectedBooking.rating!.score
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="font-bold text-slate-900 mx-1">
                      {selectedBooking.rating.score} / 5
                    </span>
                  </div>
                  {selectedBooking.rating.comment && (
                    <p className="text-slate-600 italic pt-1">
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
                        className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= ratingScore
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    placeholder={t.history.ratingCommentPlaceholder}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-[#FF9900]"
                  />

                  <button
                    type="submit"
                    disabled={ratingMutation.isPending}
                    className="w-full py-3 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {ratingMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t.history.submitRating
                    )}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-slate-500">
                  {language === 'ar' ? 'التقييم متاح فقط بعد اكتمال الرحلة.' : 'L’évaluation est disponible une fois la course terminée.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
