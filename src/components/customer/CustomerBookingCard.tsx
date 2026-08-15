import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookingService } from '@/services/booking.service';
import { FavoriteService } from '@/services/favorite.service';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { BookingEstimate } from '@/types/booking.types';
import { MapPin, Navigation, Loader2, AlertCircle, Shield, LocateFixed, X, Car, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface PlacePrediction {
  description: string;
  place_id: string;
}

interface PlaceDetails {
  lat: number;
  lng: number;
  address: string;
}

interface CustomerBookingCardProps {
  onBooked: () => void;
}

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

/** Fetch place details (lat/lng) from Google Places Details API */
async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${GOOGLE_MAPS_KEY}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.status === 'OK') {
      return {
        lat: json.result.geometry.location.lat,
        lng: json.result.geometry.location.lng,
        address: json.result.formatted_address,
      };
    }
  } catch (err) {
    console.warn('[fetchPlaceDetails] Error:', err);
  }
  return null;
}

/** Autocomplete predictions via Places Autocomplete API */
async function fetchAutocompletePredictions(
  input: string,
  sessionToken: string,
): Promise<PlacePrediction[]> {
  if (!input.trim() || input.length < 2) return [];
  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_KEY}&sessiontoken=${sessionToken}&language=fr&components=country:dz`;
    const res = await fetch(url);
    const json = await res.json();
    return json.predictions ?? [];
  } catch {
    return [];
  }
}

/** City geocoding dictionary: city name / abbreviation → GPS coordinates
 * Used for BOTH pickup and destination geocoding when GPS is unavailable.
 * The distanceKm/durationMinutes fields are kept for reference but NOT used for pricing.
 */
const ALGERIA_CITIES: Record<string, { lat: number; lng: number; address: string }> = {
  // West
  oran:       { lat: 35.697, lng: -0.633, address: 'Oran, Algérie' },
  sba:        { lat: 35.190, lng: -0.630, address: 'Sidi Bel Abbès, Algérie' },
  'sidi bel': { lat: 35.190, lng: -0.630, address: 'Sidi Bel Abbès, Algérie' },
  'sidi-bel': { lat: 35.190, lng: -0.630, address: 'Sidi Bel Abbès, Algérie' },
  tlemcen:    { lat: 34.878, lng: -1.315, address: 'Tlemcen, Algérie' },
  mostagan:   { lat: 35.930, lng: 0.090,  address: 'Mostaganem, Algérie' },   // mostaganem / mostaganam
  mascara:    { lat: 35.396, lng: 0.140,  address: 'Mascara, Algérie' },
  saida:      { lat: 34.830, lng: 0.150,  address: 'Saïda, Algérie' },
  saïda:     { lat: 34.830, lng: 0.150,  address: 'Saïda, Algérie' },
  tiaret:     { lat: 35.371, lng: 1.321,  address: 'Tiaret, Algérie' },
  relizane:   { lat: 35.738, lng: 0.556,  address: 'Relizane, Algérie' },
  chlef:      { lat: 36.160, lng: 1.330,  address: 'Chlef, Algérie' },
  'ain temou':{ lat: 35.850, lng: 0.600,  address: 'Aïn Témouchent, Algérie' },
  // Center
  alger:      { lat: 36.753, lng: 3.058,  address: 'Alger, Algérie' },
  algiers:    { lat: 36.753, lng: 3.058,  address: 'Alger, Algérie' },
  blida:      { lat: 36.470, lng: 2.830,  address: 'Blida, Algérie' },
  medea:      { lat: 36.268, lng: 2.750,  address: 'Médéa, Algérie' },
  'médé':    { lat: 36.268, lng: 2.750,  address: 'Médéa, Algérie' },
  bouira:     { lat: 36.370, lng: 3.900,  address: 'Bouira, Algérie' },
  tizi:       { lat: 36.710, lng: 4.050,  address: 'Tizi Ouzou, Algérie' },
  boumerd:    { lat: 36.760, lng: 3.477,  address: 'Boumerdès, Algérie' },   // boumerdas/boumerdes/boumerdès
  tipaza:     { lat: 36.589, lng: 2.447,  address: 'Tipaza, Algérie' },
  bba:        { lat: 36.073, lng: 4.761,  address: 'Bordj Bou Arréridj, Algérie' },
  bordj:      { lat: 36.073, lng: 4.761,  address: 'Bordj Bou Arréridj, Algérie' },
  djelfa:     { lat: 34.670, lng: 3.250,  address: 'Djelfa, Algérie' },
  msila:      { lat: 35.700, lng: 4.540,  address: "M'Sila, Algérie" },
  "m'sila":   { lat: 35.700, lng: 4.540,  address: "M'Sila, Algérie" },
  // East
  setif:      { lat: 36.190, lng: 5.410,  address: 'Sétif, Algérie' },
  'sétif':   { lat: 36.190, lng: 5.410,  address: 'Sétif, Algérie' },
  stif:       { lat: 36.190, lng: 5.410,  address: 'Sétif, Algérie' },
  constantine:{ lat: 36.365, lng: 6.615,  address: 'Constantine, Algérie' },
  'csma':     { lat: 36.365, lng: 6.615,  address: 'Constantine, Algérie' },
  bejaia:     { lat: 36.750, lng: 5.060,  address: 'Béjaïa, Algérie' },
  'béja':    { lat: 36.750, lng: 5.060,  address: 'Béjaïa, Algérie' },
  bgayet:     { lat: 36.750, lng: 5.060,  address: 'Béjaïa, Algérie' },     // local name
  annaba:     { lat: 36.900, lng: 7.760,  address: 'Annaba, Algérie' },
  skikda:     { lat: 36.880, lng: 6.900,  address: 'Skikda, Algérie' },
  guelma:     { lat: 36.460, lng: 7.430,  address: 'Guelma, Algérie' },
  'souk ahr': { lat: 36.370, lng: 6.120,  address: 'Souk Ahras, Algérie' },
  batna:      { lat: 35.556, lng: 6.174,  address: 'Batna, Algérie' },
  khenche:    { lat: 35.430, lng: 7.143,  address: 'Khenchela, Algérie' },    // khenchela / khenchla
  'oum el':   { lat: 35.867, lng: 6.567,  address: 'Oum El Bouaghi, Algérie' },
  mila:       { lat: 36.450, lng: 6.260,  address: 'Mila, Algérie' },
  jijel:      { lat: 36.820, lng: 5.767,  address: 'Jijel, Algérie' },
  // South
  biskra:     { lat: 34.850, lng: 5.730,  address: 'Biskra, Algérie' },
  ouargla:    { lat: 31.950, lng: 5.320,  address: 'Ouargla, Algérie' },
  ghardaia:   { lat: 32.490, lng: 3.670,  address: 'Ghardaïa, Algérie' },
  'ghardaï': { lat: 32.490, lng: 3.670,  address: 'Ghardaïa, Algérie' },
  tamanghas:  { lat: 22.785, lng: 5.523,  address: 'Tamanrasset, Algérie' },  // tamanghasset / tamanrasset
  adrar:      { lat: 27.874, lng: -0.294, address: 'Adrar, Algérie' },
  bechar:     { lat: 31.620, lng: -2.216, address: 'Béchar, Algérie' },
  'béchar':  { lat: 31.620, lng: -2.216, address: 'Béchar, Algérie' },
  laghouat:   { lat: 33.800, lng: 2.865,  address: 'Laghouat, Algérie' },
  illizi:     { lat: 26.490, lng: 8.477,  address: 'Illizi, Algérie' },
};


/** Geocode a text string using local city dictionary first, then Nominatim */
async function geocodeCity(text: string): Promise<{ lat: number; lng: number; address: string } | null> {
  const lower = text.toLowerCase().trim();
  const matchedKey = Object.keys(ALGERIA_CITIES).find((k) => lower.includes(k));
  if (matchedKey) return ALGERIA_CITIES[matchedKey];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=dz&limit=1&accept-language=fr`
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), address: data[0].display_name };
    }
  } catch (err) {
    console.warn('[geocodeCity] Error:', err);
  }
  return null;
}

/** Returns straight-line Haversine distance in km between two points */
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const sinA =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(sinA), Math.sqrt(1 - sinA));
}

const BBA_CENTER = { lat: 36.073, lng: 4.761 };
const BBA_RADIUS_KM = 15; // approx BBA commune radius

/** Compute price estimate — standard VTC logic:
 *  - Both pickup AND destination inside BBA → flat 150 DA
 *  - Any other case → real GPS distance (Haversine × 1.06) × 40 DA/km
 */
function computeFallbackEstimate(
  pickup: { lat: number; lng: number },
  dest: { lat: number; lng: number; address?: string }
): BookingEstimate {
  const pickupInBBA = haversineKm(pickup, BBA_CENTER) <= BBA_RADIUS_KM;
  const destInBBA   = haversineKm(dest,   BBA_CENTER) <= BBA_RADIUS_KM;

  // Real road distance between the two actual GPS points
  const straightDistance = haversineKm(pickup, dest);
  const distanceKm = Math.max(0.5, Math.round(straightDistance * 1.06 * 10) / 10);
  const avgSpeed = distanceKm > 30 ? 90 : 50; // 90 km/h highway, 50 km/h urban
  const durationMinutes = Math.max(1, Math.round((distanceKm / avgSpeed) * 60));

  // ── City trip: both points inside BBA ──────────────────────────────────────
  if (pickupInBBA && destInBBA) {
    return {
      pricingType: 'CITY',
      distanceKm,
      durationMinutes,
      ratePerKm: null,
      estimatedPrice: 150,
    };
  }

  // ── Any other case: distance-based ─────────────────────────────────────────
  const ratePerKm = 40;
  return {
    pricingType: 'DISTANCE',
    distanceKm,
    durationMinutes,
    ratePerKm,
    estimatedPrice: Math.round(distanceKm * ratePerKm),
  };
}

/** Geocode an address string — uses ALGERIA_CITIES dictionary then Nominatim fallback */
async function geocodeAddress(addressText: string): Promise<PlaceDetails | null> {
  return geocodeCity(addressText);
}

export function CustomerBookingCard({ onBooked }: CustomerBookingCardProps) {
  const queryClient = useQueryClient();
  const { location: gpsLocation, status: gpsStatus, detect, setAddress: setGpsAddress, reset: resetGps } = useGeolocation();

  // Booking mode option state: 'instant' | 'scheduled'
  const [bookingMode, setBookingMode] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // Query saved favorites for quick destination shortcuts
  const { data: favRes } = useQuery({
    queryKey: ['favoriteLocations'],
    queryFn: () => FavoriteService.list(),
  });

  const rawFavs = favRes?.data?.data;
  const favorites: any[] = Array.isArray(rawFavs)
    ? rawFavs
    : Array.isArray((rawFavs as any)?.favorites)
    ? (rawFavs as any).favorites
    : [];

  // Destination autocomplete state
  const [destInput, setDestInput] = useState('');
  const [destPredictions, setDestPredictions] = useState<PlacePrediction[]>([]);
  const [selectedDest, setSelectedDest] = useState<PlaceDetails | null>(null);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const autocompleteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<string>(crypto.randomUUID());

  // Pickup manual fallback state
  const [pickupManual, setPickupManual] = useState('');
  const showManualPickup = gpsStatus === 'denied' || gpsStatus === 'error';

  // Dynamic price estimate state
  const [estimate, setEstimate] = useState<BookingEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Trigger GPS on mount
  useEffect(() => {
    detect();
  }, [detect]);

  // Geocoded pickup coords (from GPS or manual text geocoding)
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number; address: string } | null>(null);

  // When manual pickup text changes, geocode it
  useEffect(() => {
    if (!showManualPickup || !pickupManual.trim() || pickupManual.trim().length < 2) {
      setPickupCoords(null);
      return;
    }
    const debounce = setTimeout(async () => {
      const result = await geocodeCity(pickupManual.trim());
      if (result) setPickupCoords(result);
    }, 400);
    return () => clearTimeout(debounce);
  }, [pickupManual, showManualPickup]);

  // Helper to retrieve pickup coords — GPS first, then geocoded manual, then null (no fallback to BBA)
  const getPickupCoords = useCallback(() => {
    if (gpsLocation) return gpsLocation;
    if (pickupCoords) return pickupCoords;
    // Default to BBA only if no location info is available at all
    return { lat: 36.073, lng: 4.761, address: 'Bordj Bou Arréridj' };
  }, [gpsLocation, pickupCoords]);

  // Destination autocomplete & instant geocoding debounce
  useEffect(() => {
    if (!destInput.trim() || destInput.trim().length < 2) {
      setDestPredictions([]);
      if (!selectedDest) setEstimate(null);
      return;
    }

    // Immediate city dictionary check (e.g. "oran", "sba", "setif")
    const lowerInput = destInput.toLowerCase().trim();
    const matchedCityKey = Object.keys(ALGERIA_CITIES).find((k) => lowerInput.includes(k));
    if (matchedCityKey) {
      const city = ALGERIA_CITIES[matchedCityKey];
      if (!selectedDest || selectedDest.lat !== city.lat) {
        setSelectedDest(city);
        const pickup = getPickupCoords();
        setEstimate(computeFallbackEstimate(pickup, city));
      }
    }

    if (selectedDest) return;

    if (autocompleteDebounceRef.current) clearTimeout(autocompleteDebounceRef.current);
    autocompleteDebounceRef.current = setTimeout(async () => {
      setIsLoadingPredictions(true);
      const results = await fetchAutocompletePredictions(destInput, sessionTokenRef.current);
      setDestPredictions(results);

      // If Google Autocomplete returned no predictions, attempt geocoding text
      if (results.length === 0) {
        const geoResult = await geocodeAddress(destInput);
        if (geoResult) {
          setSelectedDest(geoResult);
          const pickup = getPickupCoords();
          setEstimate(computeFallbackEstimate(pickup, geoResult));
        }
      }
      setIsLoadingPredictions(false);
    }, 350);
  }, [destInput, selectedDest, getPickupCoords]);

  // Automatically recalculate backend estimate whenever selectedDest or pickup changes
  useEffect(() => {
    if (!selectedDest) return;

    const pickup = getPickupCoords();
    // Set fast local estimate immediately
    setEstimate(computeFallbackEstimate(pickup, selectedDest));
    setIsEstimating(true);

    BookingService.getEstimate({
      pickup: { latitude: pickup.lat, longitude: pickup.lng },
      destination: { latitude: selectedDest.lat, longitude: selectedDest.lng },
    })
      .then((res) => {
        const estData = (res as any).data ?? res;
        if (estData && typeof estData.estimatedPrice === 'number') {
          setEstimate(estData);
        }
      })
      .catch((err) => {
        console.warn('[CustomerBookingCard] Backend estimate error, using local fallback:', err);
      })
      .finally(() => {
        setIsEstimating(false);
      });
  }, [selectedDest, getPickupCoords]);

  const handleSelectDestination = useCallback(async (prediction: PlacePrediction) => {
    setDestInput(prediction.description);
    setDestPredictions([]);
    setIsLoadingPredictions(true);
    const details = await fetchPlaceDetails(prediction.place_id);
    setIsLoadingPredictions(false);
    if (details) {
      setSelectedDest(details);
      const pickup = getPickupCoords();
      setEstimate(computeFallbackEstimate(pickup, details));
      sessionTokenRef.current = crypto.randomUUID();
    }
  }, [getPickupCoords]);

  const handleDestInputChange = (val: string) => {
    setDestInput(val);
    const lowerVal = val.toLowerCase().trim();
    const matchedCityKey = Object.keys(ALGERIA_CITIES).find((k) => lowerVal.includes(k));
    if (matchedCityKey) {
      const city = ALGERIA_CITIES[matchedCityKey];
      setSelectedDest(city);
      const pickup = getPickupCoords();
      setEstimate(computeFallbackEstimate(pickup, city));
    } else if (selectedDest && !selectedDest.address.toLowerCase().includes(lowerVal)) {
      setSelectedDest(null);
      setEstimate(null);
    }
  };

  const clearDestination = () => {
    setDestInput('');
    setSelectedDest(null);
    setDestPredictions([]);
    setEstimate(null);
  };

  // Booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const pickup = getPickupCoords();
      const pickupAddress = gpsLocation?.address || pickupManual.trim() || pickup.address;

      let targetDest = selectedDest;
      if (!targetDest && destInput.trim()) {
        targetDest = await geocodeAddress(destInput.trim());
      }

      if (!targetDest) {
        throw new Error('Veuillez sélectionner une destination valide.');
      }

      if (
        typeof pickup.lat !== 'number' ||
        isNaN(pickup.lat) ||
        typeof pickup.lng !== 'number' ||
        isNaN(pickup.lng)
      ) {
        throw new Error('Position de départ invalide. Veuillez vérifier le lieu de départ.');
      }

      if (
        typeof targetDest.lat !== 'number' ||
        isNaN(targetDest.lat) ||
        typeof targetDest.lng !== 'number' ||
        isNaN(targetDest.lng)
      ) {
        throw new Error('Position de destination invalide. Veuillez sélectionner une ville ou adresse valide.');
      }

      if (bookingMode === 'scheduled') {
        if (!scheduledDateTime) {
          throw new Error('Veuillez choisir la date et l\'heure de réservation.');
        }
        if (new Date(scheduledDateTime).getTime() <= Date.now() - 60000) {
          throw new Error('La date de réservation doit être dans le futur.');
        }
      }

      return BookingService.createBooking({
        pickup: {
          latitude: pickup.lat,
          longitude: pickup.lng,
          address: pickupAddress,
        },
        destination: {
          latitude: targetDest.lat,
          longitude: targetDest.lng,
          address: targetDest.address,
        },
        ...(bookingMode === 'scheduled' && scheduledDateTime
          ? { scheduledAt: new Date(scheduledDateTime).toISOString() }
          : {}),
      });
    },
    onSuccess: () => {
      toast.success(
        bookingMode === 'scheduled'
          ? 'Réservation programmée avec succès !'
          : 'Demande de réservation envoyée !'
      );
      setDestInput('');
      setSelectedDest(null);
      setEstimate(null);
      setScheduledDateTime('');
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      onBooked();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la création.';
      toast.error(msg);
    },
  });

  const handleConfirm = () => {
    if (!gpsLocation && !pickupManual.trim()) {
      toast.error('Veuillez activer votre GPS ou entrer un lieu de départ.');
      return;
    }
    if (!selectedDest && !destInput.trim()) {
      toast.error('Veuillez sélectionner une destination.');
      return;
    }
    createBookingMutation.mutate();
  };

  // Get current local formatted string for datetime min attribute
  const minDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid #FF9900',
        borderRadius: '24px',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Card Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Car style={{ color: '#FF9900', width: 20, height: 20 }} />
        <span style={{ fontWeight: 800, fontSize: '16px', color: '#111' }}>
          Commander une course
        </span>
      </div>

      {/* ── Mode Selection Header (À l'instant vs À une date précise) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Option de réservation
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setBookingMode('instant')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px 10px',
              borderRadius: '16px',
              border: bookingMode === 'instant' ? '2px solid #FF9900' : '1.5px solid #E2E8F0',
              backgroundColor: bookingMode === 'instant' ? '#FFF8EC' : '#F8FAFC',
              color: bookingMode === 'instant' ? '#D97706' : '#64748B',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ⚡ À l'instant
          </button>

          <button
            type="button"
            onClick={() => setBookingMode('scheduled')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '12px 10px',
              borderRadius: '16px',
              border: bookingMode === 'scheduled' ? '2px solid #FF9900' : '1.5px solid #E2E8F0',
              backgroundColor: bookingMode === 'scheduled' ? '#FFF8EC' : '#F8FAFC',
              color: bookingMode === 'scheduled' ? '#D97706' : '#64748B',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📅 À une date précise
          </button>
        </div>
      </div>

      {/* ── Scheduled Date & Time Picker ── */}
      {bookingMode === 'scheduled' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: '16px', padding: '14px 16px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar style={{ width: 14, height: 14, color: '#FF9900' }} />
            Choisir la date et l'heure
          </label>
          <input
            type="datetime-local"
            value={scheduledDateTime}
            min={minDateTime}
            onChange={(e) => setScheduledDateTime(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              fontWeight: 600,
              color: '#0F172A',
              backgroundColor: '#FFFFFF',
              outline: 'none',
            }}
          />
          <p style={{ fontSize: '10px', color: '#64748B', margin: 0, fontStyle: 'italic' }}>
            Le chauffeur sera averti pour effectuer la course au moment indiqué.
          </p>
        </div>
      )}

      {/* ── Pickup ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Lieu de départ
        </label>

        {/* Detecting state */}
        {gpsStatus === 'detecting' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFF8EC', border: '1.5px solid #FFE0A0', borderRadius: '16px', padding: '14px 16px' }}>
            <Loader2 style={{ color: '#FF9900', width: 16, height: 16 }} className="animate-spin" />
            <span style={{ fontSize: '13px', color: '#AA6600', fontWeight: 600 }}>Détection de votre position…</span>
          </div>
        )}

        {/* Success state */}
        {gpsStatus === 'success' && gpsLocation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F0FFF4', border: '1.5px solid #86EFAC', borderRadius: '16px', padding: '12px 16px' }}>
            <LocateFixed style={{ color: '#22C55E', width: 16, height: 16, flexShrink: 0 }} />
            <input
              type="text"
              value={gpsLocation.address}
              onChange={(e) => setGpsAddress(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#166534', fontWeight: 600 }}
            />
            <button
              onClick={() => { resetGps(); detect(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              title="Re-détecter"
            >
              <LocateFixed style={{ color: '#22C55E', width: 14, height: 14 }} />
            </button>
          </div>
        )}

        {/* Denied / Error state → manual input */}
        {showManualPickup && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFF5F5', border: '1.5px solid #FCA5A5', borderRadius: '12px', padding: '8px 12px', marginBottom: '8px' }}>
              <AlertCircle style={{ color: '#EF4444', width: 14, height: 14, flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 500 }}>
                {gpsStatus === 'denied' ? 'GPS refusé — saisissez votre adresse manuellement.' : 'Erreur GPS — saisissez votre adresse manuellement.'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8F8F8', border: '1.5px solid #E5E5E5', borderRadius: '16px', padding: '14px 16px' }}>
              <MapPin style={{ color: '#FF9900', width: 16, height: 16, flexShrink: 0 }} />
              <input
                type="text"
                value={pickupManual}
                onChange={(e) => setPickupManual(e.target.value)}
                placeholder="Ex: Rue des Jardins, BBA"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#111', fontWeight: 600 }}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Idle — initial state before detect completes */}
        {gpsStatus === 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8F8F8', border: '1.5px solid #E5E5E5', borderRadius: '16px', padding: '14px 16px' }}>
            <LocateFixed style={{ color: '#ccc', width: 16, height: 16 }} />
            <span style={{ fontSize: '13px', color: '#999' }}>Détection en cours…</span>
          </div>
        )}
      </div>

      {/* ── Destination — Google Places Autocomplete & Favorites ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
        {/* Quick Favorite Shortcuts */}
        {favorites.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>
              Raccourcis :
            </span>
            {favorites.map((fav: any) => (
              <button
                key={fav.id}
                type="button"
                onClick={() => {
                  setDestInput(fav.address || fav.name);
                  setSelectedDest({ lat: fav.latitude, lng: fav.longitude, address: fav.address || fav.name });
                }}
                style={{
                  padding: '4px 10px',
                  background: '#F0FDFA',
                  border: '1px solid #99F6E4',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0D9488',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {fav.name}
              </button>
            ))}
          </div>
        )}

        <label style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Destination
        </label>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: selectedDest ? '#F0F7FF' : '#F8F8F8',
              border: `1.5px solid ${selectedDest ? '#93C5FD' : '#E5E5E5'}`,
              borderRadius: '16px',
              padding: '14px 16px',
            }}
          >
            {isLoadingPredictions ? (
              <Loader2 style={{ color: '#999', width: 16, height: 16, flexShrink: 0 }} className="animate-spin" />
            ) : (
              <Navigation style={{ color: selectedDest ? '#3B82F6' : '#999', width: 16, height: 16, flexShrink: 0 }} />
            )}
            <input
              type="text"
              value={destInput}
              onChange={(e) => handleDestInputChange(e.target.value)}
              placeholder="Où allez-vous ? (ex: Oran, Alger, BBA...)"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#111', fontWeight: 600 }}
            />
            {destInput && (
              <button onClick={clearDestination} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X style={{ color: '#999', width: 14, height: 14 }} />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {destPredictions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 100,
                background: '#fff',
                border: '1px solid #E5E5E5',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                marginTop: '6px',
                overflow: 'hidden',
              }}
            >
              {destPredictions.map((pred, i) => (
                <button
                  key={pred.place_id}
                  onClick={() => handleSelectDestination(pred)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: i < destPredictions.length - 1 ? '1px solid #F0F0F0' : 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <MapPin style={{ color: '#FF9900', width: 14, height: 14, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: '12px', color: '#222', fontWeight: 500, lineHeight: 1.4 }}>
                    {pred.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Dynamic Fare Estimate Display ── */}
      <div
        style={{
          background: estimate?.pricingType === 'DISTANCE' ? 'rgba(59, 130, 246, 0.06)' : 'rgba(255, 153, 0, 0.06)',
          border: `1.5px solid ${estimate?.pricingType === 'DISTANCE' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 153, 0, 0.25)'}`,
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield style={{ color: estimate?.pricingType === 'DISTANCE' ? '#2563EB' : '#FF9900', width: 18, height: 18 }} />
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#333', margin: 0 }}>
              {isEstimating
                ? 'Calcul du tarif…'
                : estimate?.pricingType === 'DISTANCE'
                ? `Trajet Inter-wilaya (${estimate.distanceKm} km)`
                : 'Forfait Centre-ville (BBA)'}
            </p>
            <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>
              {isEstimating
                ? 'Veuillez patienter'
                : estimate?.pricingType === 'DISTANCE'
                ? `Durée estimée: ~${estimate.durationMinutes} min`
                : 'Tarif fixe garanti pour BBA'}
            </p>
          </div>
        </div>
        <span style={{ fontSize: '18px', fontWeight: 900, color: estimate?.pricingType === 'DISTANCE' ? '#1D4ED8' : '#111' }}>
          {isEstimating ? <Loader2 className="animate-spin w-4 h-4 text-[#888]" /> : `${estimate ? estimate.estimatedPrice : 150} DA`}
        </span>
      </div>

      {/* ── Confirm Button ── */}
      <button
        onClick={handleConfirm}
        disabled={createBookingMutation.isPending || gpsStatus === 'detecting' || isEstimating}
        style={{
          background: createBookingMutation.isPending ? '#ccc' : '#111',
          color: '#fff',
          border: 'none',
          borderRadius: '30px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: 700,
          cursor: createBookingMutation.isPending ? 'not-allowed' : 'pointer',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'background 0.2s',
        }}
      >
        {createBookingMutation.isPending ? (
          <>
            <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
            Confirmation…
          </>
        ) : bookingMode === 'scheduled' ? (
          'Confirmer la réservation programmée'
        ) : (
          'Confirmer la réservation immédiate'
        )}
      </button>
    </div>
  );
}
