import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookingService } from '@/services/booking.service';

import { DriverService } from '@/services/driver.service';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useTranslation } from '@/store/languageStore';
import {
  Loader2,
  X,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';


/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */
interface PlacePrediction {
  description: string;
  place_id: string;
}

interface PlaceDetails {
  lat: number;
  lng: number;
  address: string;
}

export interface OfferBookingCardProps {
  offer: {
    id: string;
    title: string;
    description?: string;
    content?: string;
    price?: number;
    destinationLat?: number;
    destinationLng?: number;
    destinationAddress?: string;
    departureLocation?: string;
    destinationLocation?: string;
  };
  onBooked: () => void;
}



/* ────────────────────────────────────────────────────────────
   Lightweight Algeria places dictionary
   ──────────────────────────────────────────────────────────── */
const ALGERIA_PLACES: Record<string, { lat: number; lng: number; address: string }> = {
  bba: { lat: 36.073, lng: 4.761, address: 'Bordj Bou Arréridj, Algérie' },
  bordj: { lat: 36.073, lng: 4.761, address: 'Bordj Bou Arréridj, Algérie' },
  alger: { lat: 36.753, lng: 3.058, address: 'Alger, Algérie' },
  oran: { lat: 35.697, lng: -0.633, address: 'Oran, Algérie' },
  constantine: { lat: 36.365, lng: 6.615, address: 'Constantine, Algérie' },
  setif: { lat: 36.190, lng: 5.410, address: 'Sétif, Algérie' },
  annaba: { lat: 36.900, lng: 7.760, address: 'Annaba, Algérie' },
  blida: { lat: 36.470, lng: 2.830, address: 'Blida, Algérie' },
  batna: { lat: 35.556, lng: 6.174, address: 'Batna, Algérie' },
  tizi: { lat: 36.710, lng: 4.050, address: 'Tizi Ouzou, Algérie' },
  bejaia: { lat: 36.750, lng: 5.060, address: 'Béjaïa, Algérie' },
  msila: { lat: 35.700, lng: 4.540, address: "M'Sila, Algérie" },
  medjana: { lat: 36.134, lng: 4.671, address: 'Medjana, BBA, Algérie' },
  zemmoura: { lat: 36.275, lng: 4.856, address: 'Zemmoura, BBA, Algérie' },
  'ras el oued': { lat: 35.945, lng: 5.031, address: 'Ras El Oued, BBA, Algérie' },
  'el achir': { lat: 36.064, lng: 4.653, address: 'El Achir, BBA, Algérie' },
  hammadia: { lat: 35.978, lng: 4.747, address: 'Hammadia, BBA, Algérie' },
};

function findPlace(text: string): PlaceDetails | null {
  const clean = text.trim().toLowerCase();
  if (ALGERIA_PLACES[clean]) return ALGERIA_PLACES[clean];
  for (const [k, v] of Object.entries(ALGERIA_PLACES)) {
    if (clean.includes(k)) return v;
  }
  return null;
}

async function geocodeFree(text: string): Promise<PlaceDetails | null> {
  const local = findPlace(text);
  if (local) return local;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=dz&limit=1&accept-language=fr`,
      { headers: { 'User-Agent': 'ZaxiApp/1.0' } }
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0)
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), address: data[0].display_name };
  } catch { /* silent */ }
  return null;
}

async function autocompleteFree(input: string): Promise<PlacePrediction[]> {
  const q = input.trim().toLowerCase();
  if (!q || q.length < 2) return [];
  const local: PlacePrediction[] = [];
  for (const [key, place] of Object.entries(ALGERIA_PLACES)) {
    if (key.startsWith(q) || place.address.toLowerCase().includes(q))
      local.push({ description: place.address, place_id: `local_${key}` });
    if (local.length >= 6) break;
  }
  if (local.length > 0) return local;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=dz&limit=5&accept-language=fr`,
      { headers: { 'User-Agent': 'ZaxiApp/1.0' } }
    );
    const data = await res.json();
    if (Array.isArray(data))
      return data.map((item: any) => ({ description: item.display_name, place_id: `osm_${item.place_id}_${item.lat}_${item.lon}` }));
  } catch { /* silent */ }
  return [];
}

/* ────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────── */
export function OfferBookingCard({ offer, onBooked }: OfferBookingCardProps) {
  const queryClient = useQueryClient();
  const { language, isRTL } = useTranslation();

  /* ── Driver public profile (for WhatsApp number) ── */
  const { data: driverProfileRes } = useQuery({
    queryKey: ['publicDriverProfile'],
    queryFn: () => DriverService.getPublicProfile(),
    staleTime: 60_000,
  });
  const rawDriver = driverProfileRes?.data?.data?.driver ?? (driverProfileRes?.data as any);
  const driverPhone: string =
    rawDriver?.phoneNumber || rawDriver?.phone || '+213795598182';

  /* ── Date/time ── */
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const minDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);

  const [isOfferSubmitted, setIsOfferSubmitted] = useState(false);

  /* ── Price (fixed from offer — no surcharges) ── */
  const basePrice = offer.price ?? 0;

  /* ── Pickup / GPS ── */
  const { location: gpsLocation, status: gpsStatus, detect, setAddress: setGpsAddress, reset: resetGps } = useGeolocation();
  const [pickupMode, setPickupMode] = useState<'gps' | 'manual'>('gps');
  const [pickupInput, setPickupInput] = useState('');
  const [pickupPredictions, setPickupPredictions] = useState<PlacePrediction[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<PlaceDetails | null>(null);
  const [isLoadingPickup, setIsLoadingPickup] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { detect(); }, [detect]);
  useEffect(() => {
    if (gpsStatus === 'denied' || gpsStatus === 'error') setPickupMode('manual');
  }, [gpsStatus]);

  useEffect(() => {
    if (pickupMode !== 'manual' || !pickupInput.trim() || pickupInput.trim().length < 2) {
      setPickupPredictions([]); return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoadingPickup(true);
      setPickupPredictions(await autocompleteFree(pickupInput));
      setIsLoadingPickup(false);
    }, 350);
  }, [pickupInput, pickupMode]);

  const handleSelectPickup = useCallback(async (pred: PlacePrediction) => {
    setPickupInput(pred.description);
    setPickupPredictions([]);
    setIsLoadingPickup(true);
    let details: PlaceDetails | null = null;
    if (pred.place_id.startsWith('local_')) {
      details = ALGERIA_PLACES[pred.place_id.replace('local_', '')] || null;
    } else if (pred.place_id.startsWith('osm_')) {
      const parts = pred.place_id.split('_');
      if (parts.length >= 4) {
        const lat = parseFloat(parts[parts.length - 2]);
        const lng = parseFloat(parts[parts.length - 1]);
        if (!isNaN(lat) && !isNaN(lng)) details = { lat, lng, address: pred.description };
      }
      if (!details) details = await geocodeFree(pred.description);
    }
    setIsLoadingPickup(false);
    if (details) { setSelectedPickup(details); setPickupInput(details.address); }
  }, []);

  const getPickup = useCallback((): PlaceDetails => {
    if (pickupMode === 'gps' && gpsLocation)
      return { lat: gpsLocation.lat, lng: gpsLocation.lng, address: gpsLocation.address };
    if (selectedPickup) return selectedPickup;
    return { lat: 36.073, lng: 4.761, address: 'Bordj Bou Arréridj' };
  }, [pickupMode, gpsLocation, selectedPickup]);

  const [offerDest, setOfferDest] = useState<PlaceDetails | null>(
    offer.destinationLat && offer.destinationLng
      ? { lat: offer.destinationLat, lng: offer.destinationLng, address: offer.destinationAddress || offer.title }
      : null
  );
  useEffect(() => {
    if (offerDest) return;
    const text = [offer.destinationAddress, offer.destinationLocation, offer.title, offer.description || offer.content]
      .filter(Boolean).join(' ');
    geocodeFree(text).then((r) => { if (r) setOfferDest(r); });
  }, [offer, offerDest]);

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!scheduledDateTime)
        throw new Error(language === 'ar' ? 'يرجى اختيار وقت الانطلاق.' : "Veuillez choisir l'heure de départ.");
      if (new Date(scheduledDateTime).getTime() <= Date.now() - 60000)
        throw new Error(language === 'ar' ? 'يجب أن يكون وقت الانطلاق في المستقبل.' : 'La date de départ doit être dans le futur.');
      if (pickupMode === 'gps' && !gpsLocation)
        throw new Error(language === 'ar' ? 'يرجى تفعيل GPS أو الإدخال اليدوي.' : 'Veuillez activer le GPS ou saisir manuellement.');
      const pickup = getPickup();
      const dest = offerDest ?? { lat: 36.073, lng: 4.761, address: offer.destinationAddress || offer.title };
      const pickupAddress = pickupMode === 'gps'
        ? gpsLocation?.address || pickup.address
        : selectedPickup?.address || pickupInput.trim() || pickup.address;
      const notes = [`Offre: ${offer.title}`, `Prix offre: ${basePrice} DA (tout inclus)`].join(' | ');
      return BookingService.createBooking({
        pickup: { latitude: pickup.lat, longitude: pickup.lng, address: pickupAddress },
        destination: { latitude: dest.lat, longitude: dest.lng, address: dest.address },
        scheduledAt: new Date(scheduledDateTime).toISOString(),
        offerPrice: basePrice,
        ...(offer.id ? { announcementId: offer.id } : {}),
        notes,
      });
    },
    onSuccess: () => {
      setIsOfferSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || (language === 'ar' ? 'حدث خطأ.' : 'Erreur.'));
    },
  });

  /* ── WhatsApp deep-link ── */
  const waMessage = language === 'ar'
    ? `مرحباً كابتن زكريا، أود حجز العرض: "${offer.title}"
📅 الموعد: ${scheduledDateTime ? new Date(scheduledDateTime).toLocaleString('ar-DZ') : '—'}
💰 السعر: ${basePrice} دج (شامل كل شيء)

أود تحويل العربون إلى حسابك البريدي الجاري CCP لتأكيد حجز هذا العرض نهائياً. يرجى تزويدي برقم حسابك CCP.`
    : `Bonjour Capitaine Zakaria, je souhaite réserver l'offre : "${offer.title}"
📅 Date : ${scheduledDateTime ? new Date(scheduledDateTime).toLocaleString('fr-FR') : '—'}
💰 Prix : ${basePrice} DA (tout inclus)

Je souhaite effectuer le versement de l'acompte sur votre compte CCP afin de confirmer définitivement cette réservation. Merci de me communiquer votre numéro CCP.`;
  const waLink = `https://wa.me/${driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`;

  const inputStyle: React.CSSProperties = {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    fontSize: '13px', color: '#111', fontWeight: 600,
  };

  /* ──────────────────────────────────────────────────────────
     RENDER
     ────────────────────────────────────────────────────────── */
  if (isOfferSubmitted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        textAlign: isRTL ? 'right' : 'left',
        padding: '10px 0',
      }}>
        {/* Success Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
          <div style={{
            width: 54, height: 54, borderRadius: '50%',
            background: '#ECFDF5', border: '2.5px solid #10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#10B981', fontSize: '22px', fontWeight: 900,
          }}>
            ✓
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', margin: 0 }}>
            {language === 'ar' ? 'تم تسجيل طلب حجز العرض بنجاح !' : 'Demande d\'offre envoyée avec succès !'}
          </h3>
          <span style={{
            fontSize: '11px', fontWeight: 800, color: '#FF9900',
            background: 'rgba(255, 153, 0, 0.12)', padding: '4px 12px', borderRadius: '12px',
          }}>
            {language === 'ar' ? '⏳ في انتظار تحويل العربون عبر CCP' : '⏳ En attente de votre versement CCP'}
          </span>
        </div>

        {/* ⚠️ CRITICAL NOTICE FOR CCP PAYMENT */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FFF8EC 100%)',
          border: '2px solid #FF9900',
          borderRadius: '20px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(255, 153, 0, 0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 900, fontSize: '13px', color: '#92400E' }}>
              {language === 'ar' ? '⚠️ تنبيه هام : السائق لن يؤكد العرض قبل استلام CCP' : '⚠️ Important : Le chauffeur ne confirmera qu\'après versement CCP'}
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#78350F', fontWeight: 700, margin: 0, lineHeight: 1.6 }}>
            {language === 'ar'
              ? 'طلبك مسجل الآن بحالة "في انتظار التأكيد". يرجى العلم بأن السائق لن يؤكد حجز العرض حتى تتواصل معه على واتساب وتقوم بتحويل العربون إلى حسابه البريدي الجاري CCP.'
              : 'Votre demande est enregistrée. Veuillez noter que le chauffeur ne validera et ne confirmera définitivement ce voyage qu\'après l\'avoir contacté sur WhatsApp pour lui verser l\'acompte sur son compte CCP.'}
          </p>

          <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '14px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#92400E' }}>
              {language === 'ar' ? '📋 الخطوات المطلوبة لتأكيد حجزك :' : '📋 Étapes pour valider votre réservation :'}
            </p>
            <ol style={{ margin: 0, paddingLeft: isRTL ? 0 : '18px', paddingRight: isRTL ? '18px' : 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#78350F', fontWeight: 600 }}>
              <li>
                {language === 'ar'
                  ? `اضغط على زر واتساب بالأسفل لمراسلة السائق (${driverPhone}).`
                  : `Contactez le chauffeur sur WhatsApp au ${driverPhone}.`}
              </li>
              <li>
                {language === 'ar'
                  ? 'اطلب منه رقم حسابه البريدي CCP أو BaridiMob.'
                  : 'Demandez-lui son numéro de compte CCP / BaridiMob.'}
              </li>
              <li>
                {language === 'ar'
                  ? 'قم بتحويل العربون وأرسل له صورة وصل الدفع (Reçu).'
                  : 'Effectuez le versement de l\'acompte et envoyez-lui la capture du reçu.'}
              </li>
              <li>
                {language === 'ar'
                  ? 'سيقوم السائق فوراً بتأكيد العرض وتثبيت موعدك نهائياً.'
                  : 'Le chauffeur confirmera immédiatement votre réservation dès réception du versement.'}
              </li>
            </ol>
          </div>

          {/* Trip Summary Mini-Box */}
          <div style={{ background: '#FFF', borderRadius: '12px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', border: '1px solid #FFE0A0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>{language === 'ar' ? 'العرض :' : 'Offre :'}</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{offer.title}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>{language === 'ar' ? 'الموعد :' : 'Date :'}</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{scheduledDateTime ? new Date(scheduledDateTime).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR') : '—'}</span>
            </div>
            <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '4px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#0F172A' }}>{language === 'ar' ? 'السعر (شامل) :' : 'Prix (tout inclus) :'}</span>
              <span style={{ fontWeight: 900, fontSize: '14px', color: '#FF9900' }}>{basePrice > 0 ? `${basePrice} DA` : '—'}</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Direct Action Button */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            background: '#25D366', color: '#fff', borderRadius: '18px',
            padding: '14px 20px', fontWeight: 900, fontSize: '13px',
            textDecoration: 'none', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
          }}
        >
          <MessageCircle style={{ width: 18, height: 18, flexShrink: 0, color: '#fff' }} />
          <span>{language === 'ar' ? `مراسلة السائق على واتساب لتحويل CCP (${driverPhone})` : `Contacter sur WhatsApp pour versement CCP (${driverPhone})`}</span>
        </a>

        {/* Finish / See Bookings button */}
        <button
          type="button"
          onClick={() => {
            setIsOfferSubmitted(false);
            onBooked();
          }}
          style={{
            background: '#0F172A', color: '#fff', border: 'none', borderRadius: '18px',
            padding: '14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
          }}
        >
          {language === 'ar' ? 'فهمت، عرض حجوزاتي المبرمجة' : 'J\'ai compris, afficher mes réservations'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: isRTL ? 'right' : 'left' }}>

      {/* ── Offer Banner ── */}
      <div style={{ background: 'linear-gradient(135deg, #FF9900 0%, #FFB740 100%)', borderRadius: '20px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 4px 20px rgba(255,153,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 900, fontSize: '15px', color: '#fff', lineHeight: 1.3 }}>{offer.title}</span>
        </div>
        {(offer.description || offer.content) && (
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.88)', margin: 0, lineHeight: 1.5 }}>
            {offer.description || offer.content}
          </p>
        )}
        {basePrice > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '10px', padding: '3px 10px', fontWeight: 900, fontSize: '14px', color: '#fff' }}>
              {basePrice.toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ')} {language === 'ar' ? 'دج' : 'DA'}
            </span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)' }}>
              {language === 'ar' ? '(السعر الأساسي)' : '(Prix de base)'}
            </span>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          🚨 PAYMENT ALERT — WhatsApp versement required
          ════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF7ED 0%, #FFF8EC 100%)',
        border: '2px solid #FF9900',
        borderRadius: '18px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 900, fontSize: '13px', color: '#92400E' }}>
            {language === 'ar' ? '⚠️ تنبيه هام : السائق لن يؤكد العرض إلا بعد تحويل CCP' : '⚠️ Important : Le chauffeur ne confirmera qu\'après versement CCP'}
          </span>
        </div>

        <p style={{ fontSize: '11px', color: '#78350F', margin: 0, fontWeight: 700, lineHeight: 1.5 }}>
          {language === 'ar'
            ? 'أنت تؤكد طلبك أولاً بالضغط على الزر أدناه. يرجى العلم بأن السائق لن يؤكد الرحلة ولن يحجزها نهائياً إلا بعد أن تتواصل معه عبر واتساب وتحول العربون إلى حسابه البريدي الجاري CCP.'
            : 'Vous confirmez d\'abord votre demande ci-dessous. Veuillez noter que le chauffeur ne confirmera définitivement ce voyage qu\'après l\'avoir contacté sur WhatsApp pour lui verser l\'acompte sur son compte CCP.'}
        </p>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {[
            {
              step: '1',
              fr: 'Cliquez d\'abord sur "Confirmer la réservation" ci-dessous pour envoyer votre demande.',
              ar: 'اضغط أولاً على "تأكيد الحجز" بالأسفل لإرسال طلبك.',
            },
            {
              step: '2',
              fr: `Contactez le chauffeur sur WhatsApp au ${driverPhone} pour demander son compte CCP et envoyer la capture du reçu.`,
              ar: `تواصل مع السائق عبر واتساب على الرقم ${driverPhone} لطلب رقم حسابه CCP وإرسال وصل التحويل.`,
            },
            {
              step: '3',
              fr: 'Dès réception du versement sur son CCP, le chauffeur validera définitivement votre voyage.',
              ar: 'بمجرد استلام العربون على حسابه CCP، سيقوم السائق بتأكيد وتثبيت رحلتك نهائياً.',
            },
          ].map(({ step, fr, ar }) => (
            <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ background: '#FF9900', color: '#fff', fontWeight: 900, fontSize: '10px', borderRadius: '50%', minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                {step}
              </span>
              <p style={{ fontSize: '11px', color: '#78350F', margin: 0, fontWeight: 600, lineHeight: 1.4 }}>
                {language === 'ar' ? ar : fr}
              </p>
            </div>
          ))}
        </div>

        {/* WhatsApp CTA */}
        <a href={waLink} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25D366', color: '#fff', borderRadius: '14px', padding: '11px 16px', fontWeight: 800, fontSize: '12px', textDecoration: 'none', boxShadow: '0 3px 10px rgba(37, 211, 102, 0.25)' }}>
          <MessageCircle style={{ width: 16, height: 16, flexShrink: 0, color: '#fff' }} />
          <span>{language === 'ar' ? `تواصل مع السائق عبر واتساب — ${driverPhone}` : `Contacter le chauffeur sur WhatsApp — ${driverPhone}`}</span>
        </a>
      </div>

      {/* ── Info note ── */}
      <div style={{ background: '#F0F9FF', border: '1.5px solid #BAE6FD', borderRadius: '14px', padding: '10px 14px', display: 'flex', alignItems: 'flex-start' }}>
        <p style={{ fontSize: '11px', color: '#0369A1', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>
          {language === 'ar'
            ? 'حدد مكان انطلاقك وتوقيت الرحلة. الوجهة والسعر محددان مسبقاً من العرض وشاملان لكل شيء.'
            : "Renseignez votre point de départ et l'heure. La destination et le prix sont définis par l'offre et tout est inclus."}
        </p>
      </div>

      {/* ── PICKUP ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {language === 'ar' ? 'نقطة الانطلاق' : 'Lieu de départ'}
            <span style={{ color: '#EF4444', fontSize: '12px' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button type="button" onClick={() => { setPickupMode('gps'); if (gpsStatus === 'idle' || gpsStatus === 'denied') detect(); }}
              style={{ padding: '3px 9px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', border: pickupMode === 'gps' ? '1.5px solid #22C55E' : '1.5px solid #E2E8F0', background: pickupMode === 'gps' ? '#F0FFF4' : '#F8FAFC', color: pickupMode === 'gps' ? '#16A34A' : '#64748B', transition: 'all 0.2s' }}>
              GPS
            </button>
            <button type="button" onClick={() => setPickupMode('manual')}
              style={{ padding: '3px 9px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', border: pickupMode === 'manual' ? '1.5px solid #FF9900' : '1.5px solid #E2E8F0', background: pickupMode === 'manual' ? '#FFF8EC' : '#F8FAFC', color: pickupMode === 'manual' ? '#FF9900' : '#64748B', transition: 'all 0.2s' }}>
              {language === 'ar' ? 'يدوي' : 'Manuel'}
            </button>
          </div>
        </div>

        {pickupMode === 'gps' && (
          <>
            {gpsStatus === 'detecting' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFF8EC', border: '1.5px solid #FFE0A0', borderRadius: '16px', padding: '14px 16px' }}>
                <Loader2 style={{ color: '#FF9900', width: 16, height: 16 }} className="animate-spin" />
                <span style={{ fontSize: '13px', color: '#FF9900', fontWeight: 600 }}>{language === 'ar' ? 'جاري تحديد موقعك...' : 'Localisation en cours...'}</span>
              </div>
            )}
            {gpsStatus === 'success' && gpsLocation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F0FFF4', border: '1.5px solid #86EFAC', borderRadius: '16px', padding: '12px 16px' }}>
                <input type="text" value={gpsLocation.address} onChange={(e) => setGpsAddress(e.target.value)} style={{ ...inputStyle, color: '#166534' }} />
                <button onClick={() => { resetGps(); detect(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '11px', fontWeight: 700, color: '#166534' }}>
                  GPS
                </button>
              </div>
            )}
            {(gpsStatus === 'denied' || gpsStatus === 'error') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFF5F5', border: '1.5px solid #FCA5A5', borderRadius: '12px', padding: '8px 12px' }}>
                <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 500 }}>{language === 'ar' ? 'تعذّر تحديد الموقع. استخدم الإدخال اليدوي.' : 'GPS indisponible. Utilisez la saisie manuelle.'}</span>
              </div>
            )}
            {gpsStatus === 'idle' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F8F8F8', border: '1.5px solid #E5E5E5', borderRadius: '16px', padding: '14px 16px' }}>
                <span style={{ fontSize: '13px', color: '#999' }}>{language === 'ar' ? 'جاري تحديد الموقع...' : 'Localisation...'}</span>
              </div>
            )}
          </>
        )}

        {pickupMode === 'manual' && (
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: selectedPickup ? '#F0FFF4' : '#F8F8F8', border: `1.5px solid ${selectedPickup ? '#86EFAC' : '#E5E5E5'}`, borderRadius: '16px', padding: '14px 16px' }}>
              {isLoadingPickup && <Loader2 style={{ color: '#999', width: 16, height: 16, flexShrink: 0 }} className="animate-spin" />}
              <input type="text" value={pickupInput}
                onChange={(e) => { setPickupInput(e.target.value); const p = findPlace(e.target.value); if (p) setSelectedPickup(p); else if (selectedPickup) setSelectedPickup(null); }}
                placeholder={language === 'ar' ? 'أدخل نقطة انطلاقك...' : 'Entrez votre lieu de départ...'}
                style={inputStyle} autoFocus />
              {pickupInput && <button onClick={() => { setPickupInput(''); setSelectedPickup(null); setPickupPredictions([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X style={{ color: '#999', width: 14, height: 14 }} /></button>}
            </div>
            {pickupPredictions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', marginTop: '6px', overflow: 'hidden' }}>
                {pickupPredictions.map((pred, i) => (
                  <button key={pred.place_id} onClick={() => handleSelectPickup(pred)}
                    style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: 'none', border: 'none', borderBottom: i < pickupPredictions.length - 1 ? '1px solid #F0F0F0' : 'none', cursor: 'pointer', textAlign: isRTL ? 'right' : 'left' }}>
                    <span style={{ fontSize: '12px', color: '#222', fontWeight: 500, lineHeight: 1.4 }}>{pred.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DEPARTURE TIME ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: scheduledDateTime ? '#FEFCE8' : '#F8FAFC', border: `1.5px ${scheduledDateTime ? 'solid' : 'dashed'} ${scheduledDateTime ? '#FDE047' : '#CBD5E1'}`, borderRadius: '18px', padding: '16px 18px', transition: 'all 0.3s' }}>
        <label style={{ fontSize: '10px', fontWeight: 800, color: scheduledDateTime ? '#854D0E' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {language === 'ar' ? 'وقت الانطلاق' : 'Heure de départ'}
          <span style={{ color: '#EF4444', fontSize: '12px' }}>*</span>
        </label>
        <input type="datetime-local" value={scheduledDateTime} min={minDateTime} onChange={(e) => setScheduledDateTime(e.target.value)}
          style={{ width: '100%', padding: '11px 14px', borderRadius: '12px', border: `1.5px solid ${scheduledDateTime ? '#FDE047' : '#CBD5E1'}`, fontSize: '13px', fontWeight: 700, color: scheduledDateTime ? '#713F12' : '#64748B', backgroundColor: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }} />
        {!scheduledDateTime && (
          <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0, fontStyle: 'italic' }}>
            {language === 'ar' ? 'اختر تاريخ ووقت الانطلاق.' : "Choisissez la date et l'heure de départ."}
          </p>
        )}
      </div>

      {/* ── CONFIRM BUTTON ── */}
      <button
        type="button"
        onClick={() => bookingMutation.mutate()}
        disabled={bookingMutation.isPending || !scheduledDateTime}
        style={{
          width: '100%',
          padding: '15px',
          borderRadius: '999px',
          border: 'none',
          background: bookingMutation.isPending || !scheduledDateTime ? '#94A3B8' : '#0F172A',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 800,
          cursor: bookingMutation.isPending || !scheduledDateTime ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s',
          letterSpacing: '0.2px',
        }}
      >
        {bookingMutation.isPending ? (
          <>
            <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
            {language === 'ar' ? 'جاري الحجز...' : 'Réservation en cours...'}
          </>
        ) : (
          <span style={{ color: '#ffffff' }}>
            {language === 'ar' ? 'تأكيد الحجز' : 'Confirmer la réservation'}
          </span>
        )}
      </button>

    </div>
  );
}
