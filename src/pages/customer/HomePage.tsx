import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import { BookingService } from '@/services/booking.service';
import { CustomerBookingCard } from '@/components/customer/CustomerBookingCard';
import { OfferBookingCard } from '@/components/customer/OfferBookingCard';
import { RideTrackingScreen } from '@/components/customer/RideTrackingScreen';
import { useTranslation } from '@/store/languageStore';
import { useSocket } from '@/hooks/useSocket';
import { X, Phone, MessageCircle, Home, ArrowRight, Tag, Clock, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

import car1Url from '@/assets/car_1.jpg';
import car2Url from '@/assets/car_2.jpg';

export default function CustomerHomePage() {
  const queryClient = useQueryClient();
  const { t, language, isRTL } = useTranslation();

  const [activeTab, setActiveTab] = useState<'main' | 'finished' | 'scheduled' | 'offers'>('main');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [showTrackingMap, setShowTrackingMap] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  // ── Driver public profile ──────────────────────────────────────────────────
  const { data: driverProfileRes } = useQuery({
    queryKey: ['publicDriverProfile'],
    queryFn: () => DriverService.getPublicProfile(),
    refetchInterval: 15_000,
  });

  const rawDriver = driverProfileRes?.data?.data?.driver ?? (driverProfileRes?.data as any);
  const driver = rawDriver ?? {
    driverName: 'Zakaria Boukedjar',
    vehicleMake: 'Volkswagen',
    vehicleModel: 'Golf',
    vehiclePlate: '00000000000',
    vehicleColor: 'Blanc',
    phoneNumber: '+213795598182',
    whatsappNumber: '+213795598182',
    rating: 4.98,
    totalRides: 420,
    carPhotos: null,
  };

  const carPhotosList: string[] = (Array.isArray(driver.carPhotos) && driver.carPhotos.length > 0)
    ? driver.carPhotos
    : [car2Url, car1Url];

  const { useSocketEvent } = useSocket();

  // ── Customer bookings (poll every 2.5s for instant status updates) ─────────
  const { data: bookingsRes, refetch: refetchBookings } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => BookingService.getMyBookings(),
    refetchInterval: 2500,
  });

  // Listen in real-time when the driver accepts the ride
  useSocketEvent('booking:accepted', () => {
    toast.success(
      language === 'ar'
        ? 'تم قبول طلب مشوارك من طرف السائق ! 🚖'
        : 'Votre course a été acceptée par le chauffeur ! 🚖',
      { duration: 6000 }
    );
    queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    setShowTrackingMap(true);
  });

  useSocketEvent('booking:started', () => {
    toast.success(
      language === 'ar' ? 'انطلقت رحلتك مع السائق ! 🚗' : 'Votre course a démarré ! 🚗'
    );
    queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    setShowTrackingMap(true);
  });

  useSocketEvent('booking:completed', () => {
    toast.success(
      language === 'ar' ? 'وصلت إلى وجهتك ! اكتملت الرحلة 🎉' : 'Course terminée avec succès ! 🎉'
    );
    queryClient.invalidateQueries({ queryKey: ['myBookings'] });
  });

  useSocketEvent('booking:cancelled', () => {
    toast(
      language === 'ar' ? 'تم إلغاء الرحلة.' : 'La course a été annulée.',
      { icon: 'ℹ️' }
    );
    queryClient.invalidateQueries({ queryKey: ['myBookings'] });
  });

  // ── Real-time Socket.IO Listeners for Announcements ───────────────────────
  useSocketEvent('announcement:new', () => {
    queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
  });
  useSocketEvent('announcement:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
  });
  useSocketEvent('announcement:removed', () => {
    queryClient.invalidateQueries({ queryKey: ['driverAnnouncements'] });
  });

  // ── Driver announcements ───────────────────────────────────────────────────
  const { data: announcementsRes } = useQuery({
    queryKey: ['driverAnnouncements'],
    queryFn: () => DriverService.getPublicAnnouncements(),
    refetchInterval: 5000,
  });

  const rawBookings = bookingsRes?.data?.data;
  const bookings: any[] = Array.isArray(rawBookings)
    ? rawBookings
    : Array.isArray((rawBookings as any)?.bookings)
    ? (rawBookings as any).bookings
    : [];

  const rawAnnouncements = (announcementsRes?.data?.data as any) ?? (announcementsRes?.data as any);
  const announcements: any[] = Array.isArray(rawAnnouncements)
    ? rawAnnouncements
    : Array.isArray(rawAnnouncements?.announcements)
    ? rawAnnouncements.announcements
    : [];

  // Active booking: anything not yet completed/cancelled
  const activeBooking = bookings.find(
    (b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED',
  );

  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED');
  const scheduledBookings = bookings.filter(
    (b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED',
  );

  // ── Cancel mutation ────────────────────────────────────────────────────────
  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => BookingService.cancelBooking(id),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم إلغاء الحجز بنجاح.' : 'Réservation annulée.');
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || (language === 'ar' ? 'حدث خطأ أثناء الإلغاء.' : "Erreur lors de l'annulation.");
      toast.error(msg);
    },
  });

  // ── Active Ride Tracking Screen ───────────────────────────────────────────
  if (
    activeBooking &&
    (activeBooking.status === 'ACCEPTED' || activeBooking.status === 'IN_PROGRESS') &&
    showTrackingMap
  ) {
    return (
      <RideTrackingScreen
        booking={activeBooking}
        driverName={driver.driverName ?? driver.name ?? 'Zakaria Boukedjar'}
        driverVehicle={driver.vehicleModel ?? 'Golf 7'}
        driverPlate={driver.vehiclePlate ?? '00000000000'}
        driverPhone={driver.phoneNumber ?? driver.phone ?? ''}
        onBackToHome={() => setShowTrackingMap(false)}
      />
    );
  }

  const serviceList = [
    t.home.services.city,
    t.home.services.airport,
    t.home.services.interWilayas,
    t.home.services.beaches,
    t.home.services.tourist,
  ];

  return (
    <div
      className="min-h-screen pb-10"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <div className="px-5 pt-7 pb-8 max-w-lg mx-auto">

      {/* Floating Active Ride Banner */}
      {activeBooking && (activeBooking.status === 'ACCEPTED' || activeBooking.status === 'IN_PROGRESS') && (
        <div
          onClick={() => setShowTrackingMap(true)}
          className="mb-4 p-4 rounded-2xl bg-[#FF9900] text-slate-950 font-bold text-xs flex items-center justify-between cursor-pointer shadow-md hover:opacity-95 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="text-start">
              <p className="text-slate-900 font-black text-sm">{t.home.activeRideTitle}</p>
              <p className="text-slate-800 text-[11px] font-medium">{t.home.activeRideSubtitle}</p>
            </div>
          </div>
          <span className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold group-hover:scale-105 transition-transform">
            {t.home.showRide}
          </span>
        </div>
      )}


      {/* ── 1. Action Tabs Row (Home + Reservations finis + Reservations programmes) ── */}
      <div className="flex items-center gap-2.5 my-4 overflow-x-auto pb-1 scrollbar-none">
        {/* Home Button */}
        <button
          type="button"
          onClick={() => setActiveTab('main')}
          className={`px-3 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'main'
              ? 'bg-[#FF9900] text-slate-950 font-bold border-[#FF9900] shadow-md shadow-[#FF9900]/25'
              : 'bg-white text-slate-700 border-slate-200/80 hover:border-[#FF9900]/50 hover:bg-[#FF9900]/10'
          }`}
        >
          <Home style={{ width: 16, height: 16 }} />
        </button>

        {/* Button: Reservations finis */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'finished' ? 'main' : 'finished')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'finished'
              ? 'bg-[#FF9900] text-slate-950 font-bold border-[#FF9900] shadow-md shadow-[#FF9900]/25'
              : 'bg-white text-slate-700 border-slate-200/80 hover:border-[#FF9900]/50 hover:bg-[#FF9900]/10'
          }`}
        >
          <Clock style={{ width: 13, height: 13, flexShrink: 0 }} />
          <span>{t.home.tabFinished}</span>
          {completedBookings.length > 0 && (
            <span className="mx-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-white font-bold">
              {completedBookings.length}
            </span>
          )}
        </button>

        {/* Button: Reservations programmes */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'scheduled' ? 'main' : 'scheduled')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'scheduled'
              ? 'bg-[#FF9900] text-slate-950 font-bold border-[#FF9900] shadow-md shadow-[#FF9900]/25'
              : 'bg-white text-slate-700 border-slate-200/80 hover:border-[#FF9900]/50 hover:bg-[#FF9900]/10'
          }`}
        >
          <Calendar style={{ width: 13, height: 13, flexShrink: 0 }} />
          <span>{t.home.tabScheduled}</span>
          {scheduledBookings.length > 0 && (
            <span className="mx-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-white font-bold">
              {scheduledBookings.length}
            </span>
          )}
        </button>

        {/* Button: Nos Offres */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'offers' ? 'main' : 'offers')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'offers'
              ? 'bg-[#FF9900] text-slate-950 font-bold border-[#FF9900] shadow-md shadow-[#FF9900]/25'
              : 'bg-white text-slate-700 border-slate-200/80 hover:border-[#FF9900]/50 hover:bg-[#FF9900]/10'
          }`}
        >
          <Tag style={{ width: 13, height: 13, flexShrink: 0 }} />
          <span>{t.home.ourOffers}</span>
          {announcements.length > 0 && (
            <span className="mx-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-white font-bold">
              {announcements.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Finished Reservations Tab Content ── */}
      {activeTab === 'finished' && (
        <div className="mb-6 space-y-4 text-start">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900">
              {t.home.finishedRidesTitle}
            </h3>
            {completedBookings.length > 0 && (
              <span className="text-[11px] font-bold text-[#FF9900] bg-[#FFF8EC] border border-[#FFE0A0] px-2.5 py-0.5 rounded-full">
                {completedBookings.length} {language === 'ar' ? 'حجز' : 'réservation(s)'}
              </span>
            )}
          </div>

          {completedBookings.length > 0 ? (
            <div className="space-y-3">
              {completedBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-3xl border border-slate-200/80 bg-white shadow-sm flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{b.destinationAddress || t.home.cityRide}</p>
                    <p className="text-[#666] text-[11px] mt-0.5">{b.pickupAddress}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="font-extrabold text-[#FF9900]">{b.estimatedPrice} {t.home.currency}</p>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {t.common.completed}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-2 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">
                {t.home.noFinishedRides}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Scheduled Reservations Tab Content ── */}
      {activeTab === 'scheduled' && (
        <div className="mb-6 space-y-4 text-start">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900">
              {t.home.scheduledRidesTitle}
            </h3>
            {scheduledBookings.length > 0 && (
              <span className="text-[11px] font-bold text-[#FF9900] bg-[#FFF8EC] border border-[#FFE0A0] px-2.5 py-0.5 rounded-full">
                {scheduledBookings.length} {language === 'ar' ? 'حجز' : 'réservation(s)'}
              </span>
            )}
          </div>

          {scheduledBookings.length > 0 ? (
            scheduledBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-[#FF9900]/30 p-5 shadow-lg shadow-[#FF9900]/5 space-y-4 text-start"
              >
                {/* Header with status badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {b.status === 'PENDING' ? (
                      <>
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9900] opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF9900]" />
                        </span>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          {t.home.pendingConfirmation}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="relative flex h-3 w-3">
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                        </span>
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                          {b.status === 'ACCEPTED' ? (language === 'ar' ? 'تم تأكيد الحجز' : 'Réservation confirmée') : b.status}
                        </span>
                      </>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    b.status === 'PENDING'
                      ? 'bg-[#FF9900]/10 text-slate-950 border border-[#FF9900]/30'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {b.status === 'PENDING' ? t.home.pending : (language === 'ar' ? 'مؤكدة' : 'Confirmée')}
                  </span>
                </div>

                {/* Details box */}
                <div className="p-3.5 rounded-2xl bg-[#FF9900]/5 border border-[#FF9900]/20 space-y-2 text-xs text-slate-700 text-start">
                  <div>
                    <span><strong>{t.home.pickup}:</strong> {b.pickupAddress || t.home.currentPosition}</span>
                  </div>
                  <div>
                    <span><strong>{t.home.destination}:</strong> {b.destinationAddress || b.dropoffAddress || t.home.notSpecified}</span>
                  </div>
                  {b.scheduledAt && (
                    <div className="pt-1 border-t border-[#FF9900]/20 text-slate-800 font-medium">
                      <span><strong>{t.home.plannedOn}:</strong> {new Date(b.scheduledAt).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#FF9900]/20 flex justify-between items-center font-bold text-slate-900">
                    <span>{t.home.estimatedFare}</span>
                    <span className="text-[#FF9900] text-sm font-extrabold">{b.estimatedPrice || 150} {t.home.currency}</span>
                  </div>
                </div>

                {/* Pending CCP Notice & WhatsApp Contact Button */}
                {b.status === 'PENDING' && (
                  <div className="rounded-2xl bg-[#FF9900]/10 border-2 border-[#FF9900]/40 p-3.5 space-y-2.5 text-xs text-start">
                    <div className="font-black text-slate-950">
                      <span>{language === 'ar' ? 'تحويل العربون عبر CCP مطلوب لتأكيد الرحلة' : 'Versement CCP requis pour confirmer'}</span>
                    </div>
                    <p className="text-[11px] text-slate-800 leading-relaxed font-semibold">
                      {language === 'ar'
                        ? `طلبك مسجل بنجاح. يرجى العلم بأن السائق لن يؤكد الرحلة ولن يقبلها إلا بعد أن تتواصل معه عبر واتساب وتحول العربون إلى حسابه البريدي الجاري CCP (${driver.phoneNumber || '+213795598182'}).`
                        : `Votre demande est enregistrée. Le chauffeur ne confirmera PAS cette course tant que vous ne l'avez pas contacté sur WhatsApp pour lui verser l'acompte sur son compte CCP (${driver.phoneNumber || '+213795598182'}).`}
                    </p>
                    <a
                      href={`https://wa.me/${(driver.phoneNumber || '+213795598182').replace(/\D/g, '')}?text=${encodeURIComponent(
                        language === 'ar'
                          ? `مرحباً كابتن زكريا، بخصوص طلبي المبرمج رقم #${b.id.slice(0, 8)} (${b.destinationAddress || ''}) بمبلغ ${b.estimatedPrice || ''} دج : أود إرسال العربون إلى حسابك البريدي CCP لتأكيد الرحلة. يرجى تزويدي برقم حسابك CCP.`
                          : `Bonjour Capitaine Zakaria, concernant ma réservation #${b.id.slice(0, 8)} (${b.destinationAddress || ''}) d'un montant de ${b.estimatedPrice || ''} DA : je souhaite effectuer le versement de l'acompte sur votre compte CCP pour confirmer la course. Merci de me communiquer votre numéro CCP.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25D366] text-white text-xs font-black hover:brightness-105 transition-all shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4 text-white shrink-0" />
                      <span>{language === 'ar' ? 'مراسلة السائق على واتساب لتحويل CCP' : 'Contacter sur WhatsApp (Versement CCP)'}</span>
                    </a>
                  </div>
                )}

                {/* Action button */}
                {b.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => cancelBookingMutation.mutate(b.id)}
                    disabled={cancelBookingMutation.isPending}
                    className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-2xl font-bold text-xs tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    {t.home.cancelBooking}
                  </button>
                )}
                {(b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS') && (
                  <button
                    type="button"
                    onClick={() => setShowTrackingMap(true)}
                    className="w-full bg-[#FF9900] hover:brightness-105 text-slate-950 py-3 rounded-2xl font-extrabold text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center shadow-sm"
                  >
                    {t.home.showRide}
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-2 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">
                {t.home.noScheduledRides}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Driver Info & Main Cards (Only shown on main view) ── */}
      {activeTab === 'main' && (
        <>
          {/* ── 2. Driver Header & Title Card ── */}
          <div className="text-start mb-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {driver.driverName || driver.name || 'Zakaria Boukedjar'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t.home.driverCertified}
                </p>
              </div>

              {/* Direct Call & WhatsApp buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {(driver.phoneNumber || driver.phone) && (
                  <a
                    href={`tel:${driver.phoneNumber || driver.phone}`}
                    className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:text-[#FF9900] shadow-xs flex items-center justify-center transition-all"
                    title={language === 'ar' ? 'اتصال مباشر بالسائق' : 'Appeler le chauffeur'}
                  >
                    <Phone className="w-4 h-4 text-[#FF9900]" />
                  </a>
                )}
                {(driver.whatsappNumber || driver.phoneNumber || driver.phone) && (
                  <a
                    href={`https://wa.me/${(driver.whatsappNumber || driver.phoneNumber || driver.phone || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-2xl bg-[#25D366] text-white hover:brightness-105 shadow-sm flex items-center justify-center transition-all"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Vehicle & Plate Specs Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xs">
                {driver.vehicleMake ? `${driver.vehicleMake} ` : ''}{driver.vehicleModel || 'Golf 7'}
                {driver.vehicleColor ? ` • ${driver.vehicleColor}` : ''}
              </span>
              {driver.vehiclePlate && (
                <span className="inline-flex items-center font-mono text-[11px] font-black bg-[#FF9900]/15 text-slate-950 border border-[#FF9900]/30 px-2.5 py-1 rounded-xl shadow-xs">
                  {driver.vehiclePlate}
                </span>
              )}
            </div>
          </div>

          {/* ── 3. Main Info Card (Orange Border Frame) ── */}
          <div className="bg-white rounded-3xl border-2 border-[#FF9900] shadow-xl shadow-[#FF9900]/10 text-start overflow-hidden">
            
            {/* Content Section */}
            <div className="p-5 sm:p-6 space-y-4 text-slate-800 text-sm leading-relaxed">
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-base">
                  {t.home.mainCardTitle}
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  {t.home.mainCardSubtitle}
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 font-medium px-1">
                {serviceList.map((service, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF9900] shrink-0" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>

              <div className="p-3.5 rounded-2xl bg-[#FF9900]/5 border border-[#FF9900]/20 text-xs text-slate-700 italic space-y-1">
                <p className="font-semibold text-slate-950 not-italic">
                  {t.home.vipTitle}
                </p>
                <p>
                  {t.home.vipText}
                </p>
              </div>
            </div>

            {/* Dynamic Vehicle Photos Gallery (Driver uploaded photos or defaults) */}
            <div className="relative border-t border-slate-100 bg-slate-100">
              {carPhotosList.length === 1 ? (
                <div
                  className="relative group overflow-hidden cursor-pointer"
                  onClick={() => setActivePhotoModal(carPhotosList[0])}
                >
                  <img
                    src={carPhotosList[0]}
                    alt={driver.vehicleModel || 'Voiture'}
                    className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className={`grid ${carPhotosList.length > 2 ? 'grid-cols-3' : 'grid-cols-2'} gap-0.5`}>
                  {carPhotosList.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group overflow-hidden cursor-pointer aspect-[4/3]"
                      onClick={() => setActivePhotoModal(photoUrl)}
                    >
                      <img
                        src={photoUrl}
                        alt={`Photo véhicule ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── 4. Reserver maintenant CTA Button ── */}
          <div className="mt-6 mb-8 flex justify-center">
            <button
              type="button"
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full sm:w-auto bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 font-black text-base px-10 py-4 rounded-full shadow-lg shadow-[#FF9900]/30 hover:shadow-[#FF9900]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.home.bookNow}</span>
              <ArrowRight style={{ width: 18, height: 18, flexShrink: 0 }} />
            </button>
          </div>
        </>
      )}

      {/* ── 5. Bottom "Nos offres" Section (Only shown on main or offers view) ── */}
      {(activeTab === 'main' || activeTab === 'offers') && (
        <div className="relative pt-4 flex flex-col items-center">
          {/* Floating Badge */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'offers' ? 'main' : 'offers')}
            className="z-10 -mb-4 bg-white border-2 border-[#FF9900] text-slate-900 font-extrabold text-sm px-8 py-2.5 rounded-full shadow-md hover:bg-amber-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Tag style={{ width: 15, height: 15, flexShrink: 0 }} />
            <span>{t.home.ourOffers}</span>
            {announcements.length > 0 && (
              <span className="bg-[#FF9900] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                {announcements.length}
              </span>
            )}
          </button>

          {/* Solid Orange Background Container */}
          <div className="w-full bg-[#FF9900] rounded-3xl p-6 pt-10 text-start text-slate-950 space-y-4 shadow-lg">
            {announcements.length > 0 ? (
              announcements.map((ann: any) => (
                <div
                  key={ann.id}
                  className="bg-white rounded-2xl p-4 shadow-md text-slate-900 border border-amber-100 hover:shadow-lg transition-all space-y-2.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                      {ann.title}
                    </h4>
                    {ann.price != null && (
                      <span className="font-black text-[#FF9900] text-sm whitespace-nowrap bg-[#FF9900]/10 px-2.5 py-1 rounded-xl border border-[#FF9900]/30">
                        {ann.price.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')} {t.home.currency}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {ann.description || ann.content}
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedOffer(ann)}
                    className="w-full bg-slate-900 hover:bg-black text-white rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                  >
                    <span>{t.home.bookThisOffer}</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl p-5 text-center text-slate-950 space-y-1.5">
                <p className="font-bold text-sm">{t.home.offersFallbackTitle}</p>
                <p className="text-xs text-slate-900/80">
                  {t.home.offersFallbackText}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Regular Booking Modal Drawer ── */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end justify-center transition-all duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[36px] px-6 pt-6 pb-10 shadow-2xl relative text-start" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              type="button"
              onClick={() => setIsBookingModalOpen(false)}
              className={cn(
                'absolute top-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer',
                isRTL ? 'left-5' : 'right-5'
              )}
            >
              <X className="h-5 w-5" />
            </button>

            <CustomerBookingCard
              onBooked={() => {
                setIsBookingModalOpen(false);
                refetchBookings();
                setActiveTab('scheduled');
              }}
            />
          </div>
        </div>
      )}

      {/* ── Offer Booking Modal Drawer ── */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end justify-center transition-all duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[36px] px-6 pt-6 pb-10 shadow-2xl relative text-start" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <button
              type="button"
              onClick={() => setSelectedOffer(null)}
              className={cn(
                'absolute top-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer',
                isRTL ? 'left-5' : 'right-5'
              )}
            >
              <X className="h-5 w-5" />
            </button>

            <OfferBookingCard
              offer={selectedOffer}
              onBooked={() => {
                setSelectedOffer(null);
                refetchBookings();
                setActiveTab('scheduled');
              }}
            />
          </div>
        </div>
      )}
      {/* ── Vehicle Photo Zoom Modal (Lightbox) ── */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActivePhotoModal(null)}
        >
          <div
            className="relative max-w-lg w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activePhotoModal}
              alt="Photo du véhicule"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <button
              type="button"
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black/90 text-white rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
