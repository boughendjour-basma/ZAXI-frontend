import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import { BookingService } from '@/services/booking.service';
import { CustomerBookingCard } from '@/components/customer/CustomerBookingCard';
import { RideTrackingScreen } from '@/components/customer/RideTrackingScreen';
import {
  Home as HomeIcon,
  Calendar,
  X,
  ShieldCheck,
  Star,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';

import car1Url from '@/assets/car_1.jpg';
import car2Url from '@/assets/car_2.jpg';

export default function CustomerHomePage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'main' | 'finished' | 'scheduled' | 'offers'>('main');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [showTrackingMap, setShowTrackingMap] = useState(true);

  // ── Driver public profile ──────────────────────────────────────────────────
  const { data: driverProfileRes } = useQuery({
    queryKey: ['publicDriverProfile'],
    queryFn: () => DriverService.getPublicProfile(),
    refetchInterval: 30_000,
  });

  const rawDriver = driverProfileRes?.data?.data?.driver ?? (driverProfileRes?.data as any);
  const driver = rawDriver ?? {
    driverName: 'Zakaria boukejar',
    vehicleModel: 'Golf 7',
    vehiclePlate: '029954-112-34',
    phoneNumber: '0555123456',
    rating: 4.98,
    totalRides: 420,
  };

  // ── Customer bookings (poll every 5s for status updates) ──────────────────
  const { data: bookingsRes, refetch: refetchBookings } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => BookingService.getMyBookings(),
    refetchInterval: 5000,
  });

  // ── Driver announcements ───────────────────────────────────────────────────
  const { data: announcementsRes } = useQuery({
    queryKey: ['driverAnnouncements'],
    queryFn: () => DriverService.getPublicAnnouncements(),
  });

  const rawBookings = bookingsRes?.data?.data;
  const bookings: any[] = Array.isArray(rawBookings)
    ? rawBookings
    : Array.isArray((rawBookings as any)?.bookings)
    ? (rawBookings as any).bookings
    : [];

  const rawAnnouncements = announcementsRes?.data?.data ?? (announcementsRes?.data as any);
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
    (b) => b.scheduledAt && new Date(b.scheduledAt) > new Date(),
  );

  // ── Cancel mutation ────────────────────────────────────────────────────────
  const cancelBookingMutation = useMutation({
    mutationFn: (id: string) => BookingService.cancelBooking(id),
    onSuccess: () => {
      toast.success('Réservation annulée.');
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Erreur lors de l'annulation.";
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
        driverName={driver.driverName ?? driver.name ?? 'Chauffeur'}
        driverVehicle={driver.vehicleModel ?? 'Golf 7'}
        driverPlate={driver.vehiclePlate ?? '029954-112-34'}
        driverPhone={driver.phoneNumber ?? driver.phone ?? ''}
        onBackToHome={() => setShowTrackingMap(false)}
      />
    );
  }

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
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Car className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <p className="text-slate-900 font-black text-sm">Course en cours</p>
              <p className="text-slate-800 text-[11px] font-medium">Touchez pour ouvrir la carte de suivi en direct</p>
            </div>
          </div>
          <span className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
            Afficher <ArrowRight className="h-3.5 w-3.5 inline" />
          </span>
        </div>
      )}

      {/* PENDING booking: status card */}
      {activeBooking && activeBooking.status === 'PENDING' ? (
        <div className="bg-white rounded-3xl border border-amber-200/70 p-5 shadow-lg shadow-amber-500/5 mb-6 text-left space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                En attente de confirmation
              </span>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
              En attente
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
              <span><strong>Départ:</strong> {activeBooking.pickupAddress || 'Position Actuelle'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-900 shrink-0" />
              <span><strong>Destination:</strong> {activeBooking.destinationAddress || activeBooking.dropoffAddress || 'Non spécifiée'}</span>
            </div>
            <div className="pt-2 border-t border-amber-200/50 flex justify-between items-center font-bold text-slate-900">
              <span>Tarif estimé</span>
              <span className="text-amber-600 text-sm">{activeBooking.estimatedPrice || 150} DA</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => cancelBookingMutation.mutate(activeBooking.id)}
            disabled={cancelBookingMutation.isPending}
            className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-2xl font-bold text-xs tracking-wider transition-all disabled:opacity-50"
          >
            Annuler la réservation
          </button>
        </div>
      ) : null}

      {/* ── 1. Action Tabs Row (Home icon + Reservations finis + Reservations programmes) ── */}
      <div className="flex items-center gap-2.5 my-4 overflow-x-auto pb-1 scrollbar-none">
        {/* Home Button */}
        <button
          type="button"
          onClick={() => setActiveTab('main')}
          className={`p-2.5 rounded-2xl transition-all flex items-center justify-center shrink-0 ${
            activeTab === 'main'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-400 hover:text-amber-500 border border-slate-200/80 hover:border-amber-300'
          }`}
          title="Accueil"
        >
          <HomeIcon className="h-5 w-5 fill-current" />
        </button>

        {/* Button: Reservations finis */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'finished' ? 'main' : 'finished')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
            activeTab === 'finished'
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-700 border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/50'
          }`}
        >
          <Clock className="h-3.5 w-3.5 opacity-80" />
          <span>Reservations finis</span>
          {completedBookings.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-white font-bold">
              {completedBookings.length}
            </span>
          )}
        </button>

        {/* Button: Reservations programmes */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === 'scheduled' ? 'main' : 'scheduled')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
            activeTab === 'scheduled'
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-700 border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/50'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 opacity-80" />
          <span>Reservations programmes</span>
          {scheduledBookings.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-white font-bold">
              {scheduledBookings.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Finished Reservations Tab Content ── */}
      {activeTab === 'finished' && (
        <div className="mb-6 bg-white rounded-3xl border border-slate-200/80 p-5 text-left shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Réservations terminées
          </h3>
          {completedBookings.length > 0 ? (
            completedBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{b.destinationAddress || 'Course en ville'}</p>
                  <p className="text-[#666] text-[11px] mt-0.5">{b.pickupAddress}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-amber-600">{b.estimatedPrice} DA</p>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Terminée
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic py-3 text-center">
              Aucune réservation terminée pour le moment.
            </p>
          )}
        </div>
      )}

      {/* ── Scheduled Reservations Tab Content ── */}
      {activeTab === 'scheduled' && (
        <div className="mb-6 bg-white rounded-3xl border border-slate-200/80 p-5 text-left shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" />
            Réservations programmées
          </h3>
          {scheduledBookings.length > 0 ? (
            scheduledBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl border border-amber-100 bg-amber-50/30 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{b.destinationAddress || 'Course programmée'}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Prévue le: {new Date(b.scheduledAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-xl">
                  Programmée
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic py-3 text-center">
              Aucune réservation programmée à venir.
            </p>
          )}
        </div>
      )}

      {/* ── Driver Info & Main Cards (Only shown on main view) ── */}
      {(activeTab === 'main' || activeTab === 'offers') && (
        <>
          {/* ── 2. Driver Header & Title Card ── */}
          <div className="text-left mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {driver.driverName || 'Zakaria boukejar'}
              </h2>
              <ShieldCheck className="h-5 w-5 text-amber-500 inline shrink-0" />
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              Chauffeur privé VTC certifié • Bordj Bou Arréridj
            </p>
          </div>

          {/* ── 3. Main Info Card (Orange Border Frame) ── */}
          <div className="bg-white rounded-3xl border-2 border-amber-500 shadow-xl shadow-amber-500/5 text-left overflow-hidden">
            
            {/* Content Section */}
            <div className="p-5 sm:p-6 space-y-4 text-slate-800 text-sm leading-relaxed">
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-base">
                  Votre chauffeur privé à Bordj Bou Arréridj
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  Pour tous vos déplacements locaux et longues distances :
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 font-medium pl-1">
                {[
                  'courses en ville',
                  'transferts aéroport',
                  'trajets inter-wilayas',
                  'excursions vers les plages',
                  'les sites touristiques.',
                ].map((service, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-slate-700 italic space-y-1">
                <p className="font-semibold text-amber-900 not-italic flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  Service d'Excellence Personnalisé
                </p>
                <p>
                  Profitez d'un service sur-mesure avec mise à disposition à la journée pour vous accompagner et assurer votre retour en toute sérénité.
                </p>
              </div>
            </div>

            {/* Side-by-Side Vehicle Gallery Photos */}
            <div className="grid grid-cols-2 gap-0.5 bg-slate-200 relative border-t border-slate-100">
              <div className="relative group overflow-hidden">
                <img
                  src={car2Url}
                  alt="Golf 7 vue arrière"
                  className="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/20">
                    Golf 7 — Confort VIP
                  </span>
                </div>
              </div>

              <div className="relative group overflow-hidden">
                <img
                  src={car1Url}
                  alt="Golf 7 vue avant"
                  className="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/20">
                    Climatisation & Wifi
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. Reserver maintenant CTA Button ── */}
          <div className="mt-6 mb-8 flex justify-center">
            <button
              type="button"
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full sm:w-auto bg-[#FF9900] hover:bg-[#FF8800] text-slate-950 font-black text-base px-10 py-4 rounded-full shadow-lg shadow-[#FF9900]/30 hover:shadow-[#FF9900]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Reserver maintenant</span>
              <ArrowRight className="h-4 w-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
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
            <Tag className="h-4 w-4 text-[#FF9900]" />
            <span>Nos offres</span>
            {announcements.length > 0 && (
              <span className="bg-[#FF9900] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                {announcements.length}
              </span>
            )}
          </button>

          {/* Solid Orange Background Container */}
          <div className="w-full bg-[#FF9900] rounded-3xl p-6 pt-10 text-left text-slate-950 space-y-4 shadow-lg">
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
                      <span className="font-black text-amber-600 text-sm whitespace-nowrap bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                        {ann.price.toLocaleString('fr-DZ')} DA
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {ann.description || ann.content}
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(true)}
                    className="w-full bg-slate-900 hover:bg-black text-white rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Réserver cette offre</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl p-5 text-center text-slate-950 space-y-1.5">
                <p className="font-bold text-sm">Service de Transport VIP & Excursions</p>
                <p className="text-xs text-slate-900/80">
                  Disponibilité 7j/7 pour vos déplacements urbains, transferts aéroport et trajets inter-wilayas.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Booking Modal Drawer ── */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end justify-center transition-all duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[36px] px-6 pt-6 pb-10 shadow-2xl relative text-left" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              type="button"
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <Car className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Réserver votre chauffeur VTC
              </h3>
            </div>

            <CustomerBookingCard
              onBooked={() => {
                setIsBookingModalOpen(false);
                refetchBookings();
              }}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
