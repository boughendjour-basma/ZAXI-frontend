import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import type { Booking } from '@/types/booking.types';
import { useTranslation } from '@/store/languageStore';
import {
  MapPin,
  Navigation,
  Clock,
  ChevronRight,
  AlertCircle,
  X,
  User,
  Phone,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

function formatLocalizedTime(dateStr?: string, lang: string = 'fr') {
  if (!dateStr) return '--:--';
  try {
    return new Date(dateStr).toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

function formatLocalizedDate(dateStr?: string, lang: string = 'fr') {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function DriverTodayPage() {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const { t, language, isRTL } = useTranslation();

  const acceptMutation = useMutation({
    mutationFn: (id: string) => DriverService.acceptBooking(id),
    onSuccess: () => {
      setSelectedBooking(null);
      queryClient.invalidateQueries({ queryKey: ['driverTodayBookings'] });
      queryClient.invalidateQueries({ queryKey: ['driverActiveBooking'] });
      queryClient.invalidateQueries({ queryKey: ['driverPendingBookings'] });
      queryClient.invalidateQueries({ queryKey: ['driverStatistics'] });
      toast.success(language === 'ar' ? 'تم قبول الرحلة بنجاح !' : 'Course acceptée avec succès !');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || (language === 'ar' ? 'خطأ أثناء القبول' : "Erreur lors de l'acceptation")),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => DriverService.rejectBooking(id),
    onSuccess: () => {
      setSelectedBooking(null);
      queryClient.invalidateQueries({ queryKey: ['driverTodayBookings'] });
      queryClient.invalidateQueries({ queryKey: ['driverPendingBookings'] });
      toast(language === 'ar' ? 'تم رفض الرحلة.' : 'Course refusée.', { icon: '✋' });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const { data: statsRes } = useQuery({
    queryKey: ['driverStatistics'],
    queryFn: () => DriverService.getStatistics(),
  });

  const rawStats = (statsRes?.data?.data as any) ?? (statsRes?.data as any) ?? {};
  const stats = {
    dailyRevenue: rawStats.dailyRevenue ?? 0,
    completedRides: rawStats.todayCompletedRides ?? 0,
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
    <div className="min-h-screen bg-[#F8F9FA] pb-8 pt-7 px-5 max-w-lg mx-auto space-y-5 text-start">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {t.driver.today.title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          {t.driver.today.subtitle} — {formatLocalizedDate(new Date().toISOString(), language)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.driver.dashboard.todayEarnings}</p>
          <p className="text-xl font-black text-slate-900">{stats.dailyRevenue} {t.common.currency}</p>
        </Card>

        <Card className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.driver.dashboard.completedRides}</p>
          <p className="text-xl font-black text-slate-900">{stats.completedRides}</p>
        </Card>

        <Card className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.driver.dashboard.cancelledRides}</p>
          <p className="text-xl font-black text-slate-900">{stats.cancelledRides}</p>
        </Card>

        <Card className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.driver.statistics.avgDistance}</p>
          <p className="text-xl font-black text-slate-900">{stats.averageDistanceKm} {t.common.kilometers}</p>
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
          <p className="text-xs text-rose-700 font-medium">{t.common.error}</p>
          <button onClick={() => refetch()} className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer">
            {t.common.confirm}
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
            <h3 className="text-sm font-extrabold text-slate-900">{t.driver.today.noRidesToday}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-medium">
              {t.driver.today.noRidesTodayDesc}
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {!isLoading && !isError && todayBookings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'ar' ? `قائمة الرحلات (${todayBookings.length})` : `Liste des courses (${todayBookings.length})`}
          </h2>
          <div className="grid gap-3">
            {todayBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="p-4 bg-white rounded-[22px] border border-slate-100 shadow-sm hover:border-[#FF9900] transition-all cursor-pointer space-y-3 text-start"
              >
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#FF9900]" /> {formatLocalizedTime(b.createdAt, language)}
                  </span>
                  <span className="text-sm font-black text-[#FF9900]">
                    {b.estimatedPrice ?? b.finalPrice ?? '—'} {t.common.currency}
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
                    {b.status === 'COMPLETED' ? t.history.statusCompleted : b.status === 'CANCELLED' ? t.history.statusCancelled : t.history.statusInProgress}
                  </span>
                  <span className="text-slate-400 font-medium flex items-center gap-0.5">
                    {t.history.rideDetails} <ChevronRight className={cn('w-3.5 h-3.5', isRTL && 'rotate-180')} />
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
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-start"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">{t.history.rideDetails}</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t.history.totalPaid}</p>
                  <p className="text-lg font-black text-[#FF9900]">
                    {selectedBooking.estimatedPrice ?? selectedBooking.finalPrice ?? '—'} {t.common.currency}
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
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{t.home.pickup}</span>
                    <p className="font-bold text-slate-900">{selectedBooking.pickupAddress || t.home.currentPosition}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{t.home.destination}</span>
                    <p className="font-bold text-slate-900">
                      {selectedBooking.dropoffAddress || selectedBooking.destinationAddress || t.home.destination}
                    </p>
                  </div>
                </div>
              </div>

              {selectedBooking.customer && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <User className="w-4 h-4 text-[#FF9900]" />
                    {selectedBooking.customer.name || t.header.client}
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

            {/* Google Maps link */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selectedBooking.pickupAddress || 'Bordj Bou Arréridj')}&destination=${encodeURIComponent(selectedBooking.dropoffAddress || selectedBooking.destinationAddress || '')}&travelmode=driving`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {language === 'ar' ? 'فتح في خرائط Google' : 'Ouvrir dans Google Maps'}
            </a>

            {selectedBooking.status === 'PENDING' ? (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => rejectMutation.mutate(selectedBooking.id)}
                    disabled={rejectMutation.isPending}
                    className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {t.driver.today.reject}
                  </button>
                  <button
                    onClick={() => acceptMutation.mutate(selectedBooking.id)}
                    disabled={acceptMutation.isPending}
                    className="py-3 px-3 rounded-2xl bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 text-xs font-black shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {acceptMutation.isPending ? t.common.loading : `✓ ${t.driver.today.accept}`}
                  </button>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-full py-2.5 bg-white border border-slate-200 text-slate-500 font-bold text-xs rounded-2xl hover:bg-slate-50 cursor-pointer"
                >
                  {t.common.cancel}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full py-3 bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 font-black text-xs rounded-2xl shadow-md cursor-pointer"
              >
                {t.common.cancel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
