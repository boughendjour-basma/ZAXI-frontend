import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { DriverService } from '@/services/driver.service';
import { BookingService } from '@/services/booking.service';
import { Home as HomeIcon, MapPin, Navigation, Car, X, Shield, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

import car1Url from '@/assets/car_1.jpg';
import car2Url from '@/assets/car_2.jpg';

export default function CustomerHomePage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'current' | 'scheduled'>('current');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Form states for booking
  const [pickup, setPickup] = useState('Bordj Bou Arréridj, Centre-ville');
  const [dropoff, setDropoff] = useState('');

  // Fetch driver profile data
  const { data: driverProfileRes } = useQuery({
    queryKey: ['publicDriverProfile'],
    queryFn: () => DriverService.getPublicProfile(),
  });

  const driver = driverProfileRes?.data?.data?.driver ?? {
    name: 'Zakaria boukejar',
    vehicleModel: 'Golf 7',
    vehiclePlate: '029954-112-34',
    phone: '0555123456',
  };

  // Fetch customer's current bookings
  const { data: bookingsRes } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => BookingService.getMyBookings(),
    refetchInterval: 5000, // Poll every 5s for real-time status updates
  });

  // Fetch driver's announcements for "Reservations programmées"
  const { data: announcementsRes } = useQuery({
    queryKey: ['driverAnnouncements'],
    queryFn: () => DriverService.getPublicAnnouncements(),
  });

  const bookings = bookingsRes?.data?.data ?? [];
  const announcements = announcementsRes?.data?.data ?? [];

  // Filter for an active booking (not completed/cancelled)
  const activeBooking = bookings.find(
    (b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
  );

  // Mutation to create a booking
  const createBookingMutation = useMutation({
    mutationFn: () =>
      BookingService.createBooking({
        pickupAddress: pickup,
        dropoffAddress: dropoff,
        pickupLat: 36.0711,
        pickupLng: 4.7591,
        dropoffLat: 36.0732,
        dropoffLng: 4.7602,
      }),
    onSuccess: () => {
      toast.success('Demande de réservation envoyée !');
      setIsBookingModalOpen(false);
      setDropoff('');
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Erreur lors de la création.';
      toast.error(msg);
    },
  });

  // Mutation to cancel a booking
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

  const handleBookNow = () => {
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropoff.trim()) {
      toast.error('Veuillez entrer une destination.');
      return;
    }
    createBookingMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white max-w-md mx-auto relative shadow-2xl">
      <div className="flex-1 flex flex-col">
        {/* Top Header — Orange bar with welcome message */}
        <div
          style={{
            backgroundColor: '#FF9900',
            padding: '24px 24px 20px 24px',
            textAlign: 'center',
            borderBottomLeftRadius: '30px',
            borderBottomRightRadius: '30px',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#000',
              margin: 0,
              letterSpacing: '0.2px',
            }}
          >
            Bienvenue {user?.name ?? 'Name'}
          </h2>
        </div>

        {/* Tab Row Container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            borderBottom: '1px solid #f1f1f1',
          }}
        >
          {/* Home icon */}
          <div style={{ color: '#FF9900', flexShrink: 0 }}>
            <HomeIcon className="h-6 w-6" style={{ fill: '#FF9900', color: '#FF9900' }} />
          </div>

          {/* Tab buttons */}
          <button
            onClick={() => setActiveTab('current')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              border: activeTab === 'current' ? '1.5px solid #333' : '1.5px solid #ccc',
              backgroundColor: 'transparent',
              color: activeTab === 'current' ? '#222' : '#888',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Reservations finis
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              border: activeTab === 'scheduled' ? '1.5px solid #333' : '1.5px solid #ccc',
              backgroundColor: 'transparent',
              color: activeTab === 'scheduled' ? '#222' : '#888',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Reservations programmes
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div style={{ flex: 1, padding: '16px 20px' }}>
          {activeBooking ? (
            /* ACTIVE RESERVATION VIEW */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-lg text-left space-y-6 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-zaxi-orange animate-ping" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Course active
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    activeBooking.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-700'
                      : activeBooking.status === 'ACCEPTED'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {activeBooking.status === 'PENDING' ? 'En attente' : activeBooking.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center gap-1.5 mt-1 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-zaxi-orange" />
                    <div className="w-[1px] h-8 bg-slate-200 border-dashed" />
                    <div className="w-2 h-2 rounded-full bg-black" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Départ
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {activeBooking.pickupAddress || 'Position Actuelle'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Destination
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {activeBooking.dropoffAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Tarif Estimé
                  </p>
                  <p className="text-lg font-black text-slate-900">
                    {activeBooking.estimatedPrice || 150} DA
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Chauffeur
                  </p>
                  <p className="text-sm font-bold text-slate-800">{driver.name}</p>
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
            /* STANDARD HOME VIEW: Driver Info Card matching the design */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Driver Card with orange border */}
              <div
                style={{
                  border: '2.5px solid #FF9900',
                  borderRadius: '24px',
                  padding: '20px',
                  backgroundColor: '#fff',
                  textAlign: 'left',
                }}
              >
                {/* Driver name */}
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#111',
                    margin: '0 0 12px 0',
                    lineHeight: 1.2,
                  }}
                >
                  {driver.name}
                </h3>

                {/* Description text */}
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
                  <ul
                    style={{
                      margin: '0 0 10px 0',
                      paddingLeft: '20px',
                      listStyleType: 'disc',
                    }}
                  >
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
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '14px',
                  }}
                >
                  <img
                    src={car2Url}
                    alt="Voiture vue arrière"
                    style={{
                      width: '50%',
                      height: '110px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                    }}
                  />
                  <img
                    src={car1Url}
                    alt="Voiture vue avant"
                    style={{
                      width: '50%',
                      height: '110px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                    }}
                  />
                </div>
              </div>

              {/* Reserver maintenant button */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={handleBookNow}
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

              {/* Nos offres pill button */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '8px' }}>
                <button
                  style={{
                    backgroundColor: '#fff',
                    color: '#222',
                    border: '2px solid #333',
                    borderRadius: '30px',
                    padding: '10px 28px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.3px',
                  }}
                >
                  Nos offres
                </button>
              </div>
            </div>
          ) : (
            /* RESERVATIONS PROGRAMMEES VIEW (Driver announcements) */
            <div className="space-y-4 py-4">
              {announcements.length > 0 ? (
                announcements.map((ann: any) => (
                  <div
                    key={ann.id}
                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-left space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-slate-900">{ann.title}</h4>
                      <span className="text-[10px] font-bold uppercase text-zaxi-orange bg-zaxi-orange/10 px-2 py-0.5 rounded">
                        {ann.category || 'OFFRE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center space-y-2 mt-8">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto stroke-1" />
                  <h4 className="text-sm font-bold text-slate-800">
                    Aucune offre programmée disponible
                  </h4>
                  <p className="text-xs text-slate-500">
                    Les trajets spéciaux (aéroports, plages) s'afficheront ici.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Decorative Bottom Footer — Orange bar */}
      <div
        style={{
          height: '64px',
          backgroundColor: '#FF9900',
          borderTopLeftRadius: '30px',
          borderTopRightRadius: '30px',
          flexShrink: 0,
        }}
      />

      {/* BOOKING MODAL DRAWER */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center transition-all duration-300">
          {/* Modal content */}
          <div className="bg-white w-full max-w-md rounded-t-[40px] px-8 pt-8 pb-10 shadow-2xl relative animate-slide-up text-left">
            <button
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Car className="h-5 w-5 text-zaxi-orange" />
              Réserver votre chauffeur
            </h3>

            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Pickup field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Lieu de départ
                </label>
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4">
                  <MapPin className="h-4 w-4 text-zaxi-orange" />
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Adresse de départ"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Destination field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Lieu de destination
                </label>
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus-within:ring-2 focus-within:ring-zaxi-orange">
                  <Navigation className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    placeholder="Où allez-vous ?"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none font-semibold"
                    autoFocus
                  />
                </div>
              </div>

              {/* Flat fare display */}
              <div className="bg-zaxi-orange/5 rounded-2xl p-4 border border-zaxi-orange/10 flex items-center justify-between mt-6">
                <div className="flex items-center gap-2.5">
                  <Shield className="h-5 w-5 text-zaxi-orange stroke-1.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Forfait Centre-ville</p>
                    <p className="text-[10px] text-slate-500">Tarif fixe garanti</p>
                  </div>
                </div>
                <span className="text-lg font-black text-slate-900">150 DA</span>
              </div>

              <button
                type="submit"
                disabled={createBookingMutation.isPending}
                className="w-full bg-black text-white hover:bg-neutral-900 rounded-full py-4 font-bold text-sm tracking-wider transition-all mt-6 cursor-pointer disabled:opacity-50"
              >
                {createBookingMutation.isPending ? 'Confirmation...' : 'Confirmer la réservation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
