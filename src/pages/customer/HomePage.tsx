import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DriverService } from '@/services/driver.service';
import { BookingService } from '@/services/booking.service';
import { CustomerBookingCard } from '@/components/customer/CustomerBookingCard';
import { RideTrackingScreen } from '@/components/customer/RideTrackingScreen';
import { Home as HomeIcon, Calendar, X, Car } from 'lucide-react';
import toast from 'react-hot-toast';

import car1Url from '@/assets/car_1.jpg';
import car2Url from '@/assets/car_2.jpg';

export default function CustomerHomePage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'current' | 'scheduled' | 'offers'>('current');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const [showTrackingMap, setShowTrackingMap] = useState(true);

  // ── Driver public profile ──────────────────────────────────────────────────
  const { data: driverProfileRes } = useQuery({
    queryKey: ['publicDriverProfile'],
    queryFn: () => DriverService.getPublicProfile(),
    refetchInterval: 30_000, // refresh availability every 30s
  });

  const rawDriver = driverProfileRes?.data?.data?.driver ?? (driverProfileRes?.data as any);
  const driver = rawDriver ?? {
    driverName: 'Zakaria boukejar',
    vehicleModel: 'Golf 7',
    vehiclePlate: '029954-112-34',
    phoneNumber: '0555123456',
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

  // ── Cancel mutation (used only in the "PENDING" state card, not tracking screen) ──
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

  // ── When driver has accepted or ride is in progress: show tracking map ────
  if (
    activeBooking &&
    (activeBooking.status === 'ACCEPTED' || activeBooking.status === 'IN_PROGRESS') &&
    showTrackingMap
  ) {
    return (
      <RideTrackingScreen
        booking={activeBooking}
        driverName={driver.driverName ?? driver.name ?? 'Chauffeur'}
        driverVehicle={driver.vehicleModel ?? 'Véhicule'}
        driverPlate={driver.vehiclePlate ?? '—'}
        driverPhone={driver.phoneNumber ?? driver.phone ?? ''}
        onBackToHome={() => setShowTrackingMap(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      <div className="flex-1 flex flex-col">

        {/* Active Booking Floating Banner when tracking is minimized */}
        {activeBooking && (activeBooking.status === 'ACCEPTED' || activeBooking.status === 'IN_PROGRESS') && (
          <div
            onClick={() => setShowTrackingMap(true)}
            className="mx-5 mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center justify-between cursor-pointer shadow-lg animate-pulse"
          >
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              <span>Course en cours — Voir la carte de suivi</span>
            </div>
            <span>Afficher ➔</span>
          </div>
        )}

        {/* ── Tab Row ───────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderBottom: '1px solid #f1f1f1',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setShowTrackingMap(false);
              setActiveTab('current');
            }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
            title="Retour à l'accueil"
          >
            <HomeIcon className="h-6 w-6" style={{ fill: '#FF9900', color: '#FF9900' }} />
          </button>
          <button
            onClick={() => setActiveTab('current')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              border: activeTab === 'current' ? '1.5px solid #333' : '1.5px solid #ccc',
              backgroundColor: activeTab === 'current' ? '#1A1A1A' : 'transparent',
              color: activeTab === 'current' ? '#fff' : '#888',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            Réservations
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              border: activeTab === 'scheduled' ? '1.5px solid #333' : '1.5px solid #ccc',
              backgroundColor: activeTab === 'scheduled' ? '#1A1A1A' : 'transparent',
              color: activeTab === 'scheduled' ? '#fff' : '#888',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            Programmées
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              border: activeTab === 'offers' ? '1.5px solid #FF9900' : '1.5px solid #ccc',
              backgroundColor: activeTab === 'offers' ? '#FF9900' : 'transparent',
              color: activeTab === 'offers' ? '#000' : '#888',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            🎯 Nos offres
          </button>
        </div>

        {/* ── Main Content Area ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '16px 20px' }}>

          {/* PENDING booking: show a waiting card (not the full map yet) */}
          {activeBooking && activeBooking.status === 'PENDING' ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-lg text-left space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-zaxi-orange animate-ping" />
                  <span className="text-xs font-bold text-[#888] uppercase tracking-wider">
                    En attente de confirmation…
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFF3D6] text-amber-700">
                  En attente
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1.5 mt-1 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-zaxi-orange" />
                    <div className="w-[1px] h-8 bg-[#F5F5F5] border-dashed" />
                    <div className="w-2 h-2 rounded-full bg-black" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-[#888] uppercase tracking-widest">Départ</p>
                      <p className="text-sm font-semibold text-[#1A1A1A]">
                        {activeBooking.pickupAddress || 'Position Actuelle'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-[#888] uppercase tracking-widest">Destination</p>
                      <p className="text-sm font-semibold text-[#1A1A1A]">
                        {activeBooking.dropoffAddress || activeBooking.destinationAddress || 'Destination non spécifiée'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#FFE0A0] flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-[#888] uppercase tracking-wider">Tarif Estimé</p>
                  <p className="text-lg font-black text-[#1A1A1A]">
                    {activeBooking.estimatedPrice || 150} DA
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-[#888] uppercase tracking-wider">Chauffeur</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{driver.driverName ?? driver.name}</p>
                </div>
              </div>

              <button
                onClick={() => cancelBookingMutation.mutate(activeBooking.id)}
                disabled={cancelBookingMutation.isPending}
                className="w-full bg-neutral-900 text-white hover:bg-black py-3 rounded-full font-bold text-xs tracking-wider transition-all mt-4 cursor-pointer disabled:opacity-50"
              >
                Annuler la réservation
              </button>
            </div>

          ) : activeTab === 'current' ? (
            /* ── Standard Home View ─── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Driver Info Card */}
              <div
                style={{
                  border: '2.5px solid #FF9900',
                  borderRadius: '24px',
                  padding: '20px',
                  backgroundColor: '#fff',
                  textAlign: 'left',
                }}
              >
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#111',
                    margin: '0 0 12px 0',
                    lineHeight: 1.2,
                  }}
                >
                  {driver.driverName ?? driver.name}
                </h3>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#444',
                    lineHeight: 1.7,
                    fontWeight: 500,
                  }}
                >
                  <p style={{ margin: '0 0 8px 0' }}>
                    Votre chauffeur privé à Bordj Bou Arréridj
                    <br />
                    pour tous vos déplacements :
                  </p>
                  <ul style={{ margin: '0 0 10px 0', paddingLeft: '20px', listStyleType: 'disc' }}>
                    <li>courses en ville</li>
                    <li>transferts aéroport</li>
                    <li>trajets inter-wilayas</li>
                    <li>excursions vers les plages</li>
                    <li>les sites touristiques.</li>
                  </ul>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '11px',
                      color: '#666',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      lineHeight: 1.6,
                    }}
                  >
                    Profitez d'un service personnalisé avec mise à
                    <br />
                    disposition à la journée
                    <br />
                    pour vous accompagner et assurer votre retour
                    <br />
                    en toute sérénité
                  </p>
                </div>

                {/* Car images */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <img
                    src={car2Url}
                    alt="Voiture vue arrière"
                    style={{ width: '50%', height: '110px', objectFit: 'cover', borderRadius: '12px' }}
                  />
                  <img
                    src={car1Url}
                    alt="Voiture vue avant"
                    style={{ width: '50%', height: '110px', objectFit: 'cover', borderRadius: '12px' }}
                  />
                </div>
              </div>

              {/* Réserver maintenant button → opens booking modal */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  style={{
                    backgroundColor: '#FF9900',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '30px',
                    padding: '14px 40px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.5px',
                    minWidth: '240px',
                  }}
                >
                  Reserver maintenant
                </button>
              </div>
            </div>

          ) : activeTab === 'scheduled' ? (
            /* ── Reservations Programmees ─── */
            <div className="space-y-4 py-4">
              <div className="bg-white rounded-2xl border border-[#FFE0A0] p-8 shadow-sm text-center space-y-2 mt-4">
                <Calendar className="h-10 w-10 text-[#AAA] mx-auto stroke-1" />
                <h4 className="text-sm font-bold text-[#1A1A1A]">Aucune réservation programmée</h4>
                <p className="text-xs text-[#888]">Vos courses à venir apparaîtront ici.</p>
              </div>
            </div>

          ) : (
            /* ── Nos Offres — Driver Announcements ─── */
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base font-extrabold text-[#1A1A1A]">Offres du chauffeur</span>
                <span className="text-[10px] font-bold text-[#FF9900] bg-[#FFF3D6] px-2 py-0.5 rounded-full border border-[#FFE0A0]">
                  {announcements.length} offre{announcements.length !== 1 ? 's' : ''}
                </span>
              </div>

              {announcements.length > 0 ? (
                announcements.map((ann: any) => {
                  const categoryLabels: Record<string, { label: string; emoji: string }> = {
                    AIRPORT: { label: 'Aéroport', emoji: '✈️' },
                    BEACH: { label: 'Plage', emoji: '🏖️' },
                    TOUR: { label: 'Circuit', emoji: '🗺️' },
                    SPECIAL_OFFER: { label: 'Offre Spéciale', emoji: '🎁' },
                    OTHER: { label: 'Autre', emoji: '📌' },
                  };
                  const cat = categoryLabels[ann.category] ?? { label: ann.category || 'Offre', emoji: '📌' };

                  return (
                    <div
                      key={ann.id}
                      className="bg-white rounded-3xl border border-[#FFE0A0] shadow-sm text-left overflow-hidden"
                      style={{ borderLeft: '4px solid #FF9900' }}
                    >
                      {/* Card header */}
                      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-base">{cat.emoji}</span>
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                              style={{ backgroundColor: '#FFF3D6', color: '#CC7A00', border: '1px solid #FFE0A0' }}
                            >
                              {cat.label}
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-[#1A1A1A] leading-tight">
                            {ann.title}
                          </h4>
                        </div>
                        {ann.price != null && (
                          <div className="shrink-0 text-right">
                            <p className="text-xl font-black text-[#FF9900] leading-tight">
                              {ann.price.toLocaleString('fr-DZ')}
                            </p>
                            <p className="text-[10px] text-[#888] font-semibold">DA</p>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="px-5 pb-4">
                        <p className="text-xs text-[#555] leading-relaxed">
                          {ann.description || ann.content}
                        </p>
                      </div>

                      {/* Route info if available */}
                      {(ann.departureLocation || ann.destinationLocation) && (
                        <div
                          className="mx-5 mb-4 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-medium text-[#444]"
                          style={{ backgroundColor: '#FFFBF0', border: '1px solid #FFE0A0' }}
                        >
                          {ann.departureLocation && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#FF9900] inline-block" />
                              {ann.departureLocation}
                            </span>
                          )}
                          {ann.departureLocation && ann.destinationLocation && (
                            <span className="text-[#ccc]">→</span>
                          )}
                          {ann.destinationLocation && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#1A1A1A] inline-block" />
                              {ann.destinationLocation}
                            </span>
                          )}
                        </div>
                      )}

                      {/* CTA */}
                      <div
                        className="px-5 pb-5"
                      >
                        <button
                          onClick={() => setIsBookingModalOpen(true)}
                          className="w-full py-3 rounded-2xl text-xs font-bold tracking-wider transition-all"
                          style={{
                            backgroundColor: '#1A1A1A',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Réserver maintenant
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-2xl border border-[#FFE0A0] p-10 shadow-sm text-center space-y-3 mt-4">
                  <span className="text-4xl">🎯</span>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">Aucune offre disponible</h4>
                  <p className="text-xs text-[#888]">
                    Le chauffeur publiera bientôt des offres spéciales : aéroport, plage, circuits…
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Decorative Bottom Footer ──────────────────────────────────────────── */}
      <div
        style={{
          height: '32px',
          flexShrink: 0,
        }}
      />

      {/* ── Booking Modal Drawer ──────────────────────────────────────────────── */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center transition-all duration-300">
          <div className="bg-white w-full max-w-md rounded-t-[40px] px-6 pt-6 pb-10 shadow-2xl relative text-left" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Close button */}
            <button
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full bg-white text-[#888] hover:text-[#1A1A1A] transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-[#1A1A1A] mb-5 flex items-center gap-2">
              <Car className="h-5 w-5 text-zaxi-orange" />
              Réserver votre chauffeur
            </h3>

            {/* CustomerBookingCard handles everything: GPS, autocomplete, booking submit */}
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
  );
}
