import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookingService } from '@/services/booking.service';
import { FavoriteService } from '@/services/favorite.service';
import { DriverService } from '@/services/driver.service';
import { useTranslation } from '@/store/languageStore';
import { useSocket } from '@/hooks/useSocket';
import type { BookingEstimate } from '@/types/booking.types';
import {
  Loader2,
  X,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

type ScheduledDuration = 'none' | 'half' | 'full';
const SURCHARGE_HALF_DAY = 1000; // < 6 hours (+1000 DA)
const SURCHARGE_FULL_DAY = 2000; // >= 6 hours (+2000 DA)

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

/** Fetch place details (lat/lng) — uses local dict or Nominatim */
async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (placeId.startsWith('local_')) {
    const key = placeId.replace('local_', '');
    const place = ALGERIA_PLACES[key];
    if (place) return place;
  }

  return null;
}


/** Autocomplete predictions via Local Places + Nominatim (Free) */
async function fetchAutocompletePredictions(
  input: string,
  _sessionToken: string,
): Promise<PlacePrediction[]> {
  const query = input.trim().toLowerCase();
  if (!query || query.length < 2) return [];

  // 1. Search local Algerian places dictionary
  const localMatches: PlacePrediction[] = [];
  const addedAddresses = new Set<string>();

  for (const [key, place] of Object.entries(ALGERIA_PLACES)) {
    if (
      key.toLowerCase().startsWith(query) ||
      place.address.toLowerCase().includes(query)
    ) {
      if (!addedAddresses.has(place.address)) {
        addedAddresses.add(place.address);
        localMatches.push({
          description: place.address,
          place_id: `local_${key}`,
        });
      }
    }
    if (localMatches.length >= 8) break;
  }

  if (localMatches.length > 0) {
    return localMatches;
  }

  // 2. OpenStreetMap Nominatim fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=dz&limit=6&accept-language=fr`,
      { headers: { 'User-Agent': 'ZaxiApp/1.0' } }
    );
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        description: item.display_name,
        place_id: `osm_${item.place_id}_${item.lat}_${item.lon}`,
      }));
    }
  } catch (err) {
    console.warn('[fetchAutocompletePredictions] Nominatim error:', err);
  }

  return [];
}

/**
 * Comprehensive Algerian places dictionary:
 * 58 Wilayas + hundreds of communes, beaches, tourist spots, quartiers, gares
 */
const ALGERIA_PLACES: Record<string, { lat: number; lng: number; address: string }> = {
  // 58 Wilayas
  '01': { lat: 27.874, lng: -0.294, address: 'Adrar, Algérie' },
  adrar: { lat: 27.874, lng: -0.294, address: 'Adrar, Algérie' },
  '02': { lat: 36.160, lng: 1.330, address: 'Chlef, Algérie' },
  chlef: { lat: 36.160, lng: 1.330, address: 'Chlef, Algérie' },
  'tenes': { lat: 36.514, lng: 1.312, address: 'Ténès, Chlef, Algérie' },
  '03': { lat: 33.800, lng: 2.865, address: 'Laghouat, Algérie' },
  laghouat: { lat: 33.800, lng: 2.865, address: 'Laghouat, Algérie' },
  '04': { lat: 35.867, lng: 6.567, address: 'Oum El Bouaghi, Algérie' },
  'oum el bouaghi': { lat: 35.867, lng: 6.567, address: 'Oum El Bouaghi, Algérie' },
  '05': { lat: 35.556, lng: 6.174, address: 'Batna, Algérie' },
  batna: { lat: 35.556, lng: 6.174, address: 'Batna, Algérie' },
  timgad: { lat: 35.485, lng: 6.466, address: 'Timgad, Batna, Algérie' },
  arris: { lat: 35.143, lng: 6.359, address: 'Arris, Batna, Algérie' },
  '06': { lat: 36.750, lng: 5.060, address: 'Béjaïa, Algérie' },
  bejaia: { lat: 36.750, lng: 5.060, address: 'Béjaïa, Algérie' },
  bgayet: { lat: 36.750, lng: 5.060, address: 'Béjaïa, Algérie' },
  aokas: { lat: 36.779, lng: 5.258, address: 'Aokas, Béjaïa, Algérie' },
  amizour: { lat: 36.642, lng: 4.904, address: 'Amizour, Béjaïa, Algérie' },
  akbou: { lat: 36.459, lng: 4.529, address: 'Akbou, Béjaïa, Algérie' },
  '07': { lat: 34.850, lng: 5.730, address: 'Biskra, Algérie' },
  biskra: { lat: 34.850, lng: 5.730, address: 'Biskra, Algérie' },
  '08': { lat: 31.620, lng: -2.216, address: 'Béchar, Algérie' },
  bechar: { lat: 31.620, lng: -2.216, address: 'Béchar, Algérie' },
  '09': { lat: 36.470, lng: 2.830, address: 'Blida, Algérie' },
  blida: { lat: 36.470, lng: 2.830, address: 'Blida, Algérie' },
  boufarik: { lat: 36.574, lng: 2.913, address: 'Boufarik, Blida, Algérie' },
  larbaa: { lat: 36.552, lng: 3.167, address: 'Larbaa, Blida, Algérie' },
  '10': { lat: 36.370, lng: 3.900, address: 'Bouira, Algérie' },
  bouira: { lat: 36.370, lng: 3.900, address: 'Bouira, Algérie' },
  lakhdaria: { lat: 36.560, lng: 3.588, address: 'Lakhdaria, Bouira, Algérie' },
  '11': { lat: 22.785, lng: 5.523, address: 'Tamanrasset, Algérie' },
  tamanrasset: { lat: 22.785, lng: 5.523, address: 'Tamanrasset, Algérie' },
  '12': { lat: 35.404, lng: 8.124, address: 'Tébessa, Algérie' },
  tebessa: { lat: 35.404, lng: 8.124, address: 'Tébessa, Algérie' },
  '13': { lat: 34.878, lng: -1.315, address: 'Tlemcen, Algérie' },
  tlemcen: { lat: 34.878, lng: -1.315, address: 'Tlemcen, Algérie' },
  maghnia: { lat: 34.853, lng: -1.731, address: 'Maghnia, Tlemcen, Algérie' },
  ghazaouet: { lat: 35.104, lng: -1.855, address: 'Ghazaouet, Tlemcen, Algérie' },
  nedroma: { lat: 35.003, lng: -1.756, address: 'Nédroma, Tlemcen, Algérie' },
  '14': { lat: 35.371, lng: 1.321, address: 'Tiaret, Algérie' },
  tiaret: { lat: 35.371, lng: 1.321, address: 'Tiaret, Algérie' },
  '15': { lat: 36.710, lng: 4.050, address: 'Tizi Ouzou, Algérie' },
  tizi: { lat: 36.710, lng: 4.050, address: 'Tizi Ouzou, Algérie' },
  'tizi ouzou': { lat: 36.710, lng: 4.050, address: 'Tizi Ouzou, Algérie' },
  tigzirt: { lat: 36.892, lng: 4.122, address: 'Tigzirt sur Mer, Tizi Ouzou, Algérie' },
  azeffoun: { lat: 36.898, lng: 4.421, address: 'Azeffoun, Tizi Ouzou, Algérie' },
  azazga: { lat: 36.749, lng: 4.366, address: 'Azazga, Tizi Ouzou, Algérie' },
  '16': { lat: 36.753, lng: 3.058, address: 'Alger, Algérie' },
  alger: { lat: 36.753, lng: 3.058, address: 'Alger, Algérie' },
  algiers: { lat: 36.753, lng: 3.058, address: 'Alger, Algérie' },
  'el harrach': { lat: 36.715, lng: 3.133, address: 'El Harrach, Alger, Algérie' },
  kouba: { lat: 36.716, lng: 3.098, address: 'Kouba, Alger, Algérie' },
  hydra: { lat: 36.742, lng: 3.015, address: 'Hydra, Alger, Algérie' },
  cheraga: { lat: 36.768, lng: 2.959, address: 'Chéraga, Alger, Algérie' },
  'bab ezzouar': { lat: 36.730, lng: 3.179, address: 'Bab Ezzouar, Alger, Algérie' },
  'dar el beida': { lat: 36.693, lng: 3.209, address: 'Dar El Beïda, Alger, Algérie' },
  rouiba: { lat: 36.731, lng: 3.285, address: 'Rouïba, Alger, Algérie' },
  draria: { lat: 36.729, lng: 2.997, address: 'Draria, Alger, Algérie' },
  zeralda: { lat: 36.715, lng: 2.853, address: 'Zéralda, Alger, Algérie' },
  '17': { lat: 34.670, lng: 3.250, address: 'Djelfa, Algérie' },
  djelfa: { lat: 34.670, lng: 3.250, address: 'Djelfa, Algérie' },
  '18': { lat: 36.820, lng: 5.767, address: 'Jijel, Algérie' },
  jijel: { lat: 36.820, lng: 5.767, address: 'Jijel, Algérie' },
  'el milia': { lat: 36.745, lng: 6.261, address: 'El Milia, Jijel, Algérie' },
  '19': { lat: 36.190, lng: 5.410, address: 'Sétif, Algérie' },
  setif: { lat: 36.190, lng: 5.410, address: 'Sétif, Algérie' },
  stif: { lat: 36.190, lng: 5.410, address: 'Sétif, Algérie' },
  'el eulma': { lat: 36.155, lng: 5.694, address: 'El Eulma, Sétif, Algérie' },
  bougaa: { lat: 36.342, lng: 5.086, address: 'Bougaâ, Sétif, Algérie' },
  guenzet: { lat: 36.266, lng: 4.833, address: 'Guenzet, Sétif, Algérie' },
  '20': { lat: 34.830, lng: 0.150, address: 'Saïda, Algérie' },
  saida: { lat: 34.830, lng: 0.150, address: 'Saïda, Algérie' },
  '21': { lat: 36.880, lng: 6.900, address: 'Skikda, Algérie' },
  skikda: { lat: 36.880, lng: 6.900, address: 'Skikda, Algérie' },
  collo: { lat: 37.003, lng: 6.557, address: 'Collo, Skikda, Algérie' },
  '22': { lat: 35.190, lng: -0.630, address: 'Sidi Bel Abbès, Algérie' },
  sba: { lat: 35.190, lng: -0.630, address: 'Sidi Bel Abbès, Algérie' },
  'sidi bel': { lat: 35.190, lng: -0.630, address: 'Sidi Bel Abbès, Algérie' },
  '23': { lat: 36.900, lng: 7.760, address: 'Annaba, Algérie' },
  annaba: { lat: 36.900, lng: 7.760, address: 'Annaba, Algérie' },
  '24': { lat: 36.460, lng: 7.430, address: 'Guelma, Algérie' },
  guelma: { lat: 36.460, lng: 7.430, address: 'Guelma, Algérie' },
  '25': { lat: 36.365, lng: 6.615, address: 'Constantine, Algérie' },
  constantine: { lat: 36.365, lng: 6.615, address: 'Constantine, Algérie' },
  csma: { lat: 36.365, lng: 6.615, address: 'Constantine, Algérie' },
  'el khroub': { lat: 36.264, lng: 6.671, address: 'El Khroub, Constantine, Algérie' },
  '26': { lat: 36.268, lng: 2.750, address: 'Médéa, Algérie' },
  medea: { lat: 36.268, lng: 2.750, address: 'Médéa, Algérie' },
  berrouaghia: { lat: 36.135, lng: 2.901, address: 'Berrouaghia, Médéa, Algérie' },
  '27': { lat: 35.930, lng: 0.090, address: 'Mostaganem, Algérie' },
  mostagan: { lat: 35.930, lng: 0.090, address: 'Mostaganem, Algérie' },
  mostaganem: { lat: 35.930, lng: 0.090, address: 'Mostaganem, Algérie' },
  '28': { lat: 35.700, lng: 4.540, address: "M'Sila, Algérie" },
  msila: { lat: 35.700, lng: 4.540, address: "M'Sila, Algérie" },
  bousaada: { lat: 35.213, lng: 4.183, address: "Bou Saâda, M'Sila, Algérie" },
  '29': { lat: 35.396, lng: 0.140, address: 'Mascara, Algérie' },
  mascara: { lat: 35.396, lng: 0.140, address: 'Mascara, Algérie' },
  '30': { lat: 31.950, lng: 5.320, address: 'Ouargla, Algérie' },
  ouargla: { lat: 31.950, lng: 5.320, address: 'Ouargla, Algérie' },
  'hassi messaoud': { lat: 31.652, lng: 6.102, address: 'Hassi Messaoud, Ouargla, Algérie' },
  '31': { lat: 35.697, lng: -0.633, address: 'Oran, Algérie' },
  oran: { lat: 35.697, lng: -0.633, address: 'Oran, Algérie' },
  // Communes d'Oran et plages
  'ain turk': { lat: 35.740, lng: -0.907, address: 'Aïn Turk, Oran, Algérie' },
  'les andalouses': { lat: 35.796, lng: -0.881, address: 'Les Andalouses, Oran, Algérie' },
  andalouses: { lat: 35.796, lng: -0.881, address: 'Les Andalouses, Oran, Algérie' },
  bousfer: { lat: 35.802, lng: -0.832, address: 'Bousfer Plage, Oran, Algérie' },
  arzew: { lat: 35.848, lng: -0.296, address: 'Arzew, Oran, Algérie' },
  bethioua: { lat: 35.817, lng: -0.271, address: 'Bethioua, Oran, Algérie' },
  'mers el kebir': { lat: 35.918, lng: -0.704, address: 'Mers El Kébir, Oran, Algérie' },
  essenia: { lat: 35.645, lng: -0.610, address: 'Es Sénia, Oran, Algérie' },
  'bir el djir': { lat: 35.734, lng: -0.526, address: 'Bir El Djir, Oran, Algérie' },
  gdyel: { lat: 35.783, lng: -0.552, address: 'Gdyel, Oran, Algérie' },
  belgaid: { lat: 35.669, lng: -0.657, address: 'Belgaïd, Oran, Algérie' },
  boutlelis: { lat: 35.573, lng: -0.746, address: 'Boutlelis, Oran, Algérie' },
  'cap falcon': { lat: 35.769, lng: -0.793, address: 'Cap Falcon, Oran, Algérie' },
  '32': { lat: 33.683, lng: 1.019, address: 'El Bayadh, Algérie' },
  bayadh: { lat: 33.683, lng: 1.019, address: 'El Bayadh, Algérie' },
  '33': { lat: 26.490, lng: 8.477, address: 'Illizi, Algérie' },
  illizi: { lat: 26.490, lng: 8.477, address: 'Illizi, Algérie' },
  '34': { lat: 36.073, lng: 4.761, address: 'Bordj Bou Arréridj, Algérie' },
  bba: { lat: 36.073, lng: 4.761, address: 'Bordj Bou Arréridj, Algérie' },
  bordj: { lat: 36.073, lng: 4.761, address: 'Bordj Bou Arréridj, Algérie' },
  'bordj bou arreridj': { lat: 36.073, lng: 4.761, address: 'Bordj Bou Arréridj, Algérie' },
  'برج': { lat: 36.073, lng: 4.761, address: 'برج بوعريريج, Algérie' },
  'برج بوعريريج': { lat: 36.073, lng: 4.761, address: 'برج بوعريريج, Algérie' },

  // 10 Daïras & Communes de Bordj Bou Arréridj (Tarifs Fixes)
  medjana: { lat: 36.134, lng: 4.671, address: 'Medjana, BBA, Algérie' },
  'مجانة': { lat: 36.134, lng: 4.671, address: 'مجانة, برج بوعريريج' },
  zemmoura: { lat: 36.275, lng: 4.856, address: 'Zemmoura, BBA, Algérie' },
  'زمورة': { lat: 36.275, lng: 4.856, address: 'زمورة, برج بوعريريج' },
  'ras el oued': { lat: 35.945, lng: 5.031, address: 'Ras El Oued, BBA, Algérie' },
  'راس الواد': { lat: 35.945, lng: 5.031, address: 'رأس الوادي, برج بوعريريج' },
  'رأس الوادي': { lat: 35.945, lng: 5.031, address: 'رأس الوادي, برج بوعريريج' },
  'el achir': { lat: 36.064, lng: 4.653, address: 'El Achir, BBA, Algérie' },
  yachir: { lat: 36.064, lng: 4.653, address: 'El Achir (Yachir), BBA, Algérie' },
  'ياشير': { lat: 36.064, lng: 4.653, address: 'الياشير, برج بوعريريج' },
  'الياشير': { lat: 36.064, lng: 4.653, address: 'الياشير, برج بوعريريج' },
  'sidi embarek': { lat: 36.104, lng: 4.910, address: 'Sidi Embarek, BBA, Algérie' },
  'سيدي مبارك': { lat: 36.104, lng: 4.910, address: 'سيدي مبارك, برج بوعريريج' },
  'ain taghrout': { lat: 36.126, lng: 5.083, address: 'Ain Taghrout, BBA, Algérie' },
  'عين تاغروت': { lat: 36.126, lng: 5.083, address: 'عين تاغروت, برج بوعريريج' },
  hammadia: { lat: 35.978, lng: 4.747, address: 'Hammadia, BBA, Algérie' },
  'حمادية': { lat: 35.978, lng: 4.747, address: 'حمادية, برج بوعريريج' },
  mansourah: { lat: 36.084, lng: 4.453, address: 'El Mansourah, BBA, Algérie' },
  'el mansourah': { lat: 36.084, lng: 4.453, address: 'El Mansourah, BBA, Algérie' },
  'المنصورة': { lat: 36.084, lng: 4.453, address: 'المنصورة, برج بوعريريج' },
  'منصورة': { lat: 36.084, lng: 4.453, address: 'المنصورة, برج بوعريريج' },
  'el mhir': { lat: 36.128, lng: 4.378, address: "El M'hir, BBA, Algérie" },
  mhir: { lat: 36.128, lng: 4.378, address: "El M'hir, BBA, Algérie" },
  'المهير': { lat: 36.128, lng: 4.378, address: 'المهير, برج بوعريريج' },
  'مهير': { lat: 36.128, lng: 4.378, address: 'المهير, برج بوعريريج' },
  'el anseur': { lat: 36.067, lng: 4.850, address: 'El Anseur, BBA, Algérie' },
  'el anasser': { lat: 36.067, lng: 4.850, address: 'El Anasser, BBA, Algérie' },
  'العناصر': { lat: 36.067, lng: 4.850, address: 'العناصر, برج بوعريريج' },
  'عناصر': { lat: 36.067, lng: 4.850, address: 'العناصر, برج بوعريريج' },
  '35': { lat: 36.760, lng: 3.477, address: 'Boumerdès, Algérie' },
  boumerd: { lat: 36.760, lng: 3.477, address: 'Boumerdès, Algérie' },
  boumerdes: { lat: 36.760, lng: 3.477, address: 'Boumerdès, Algérie' },
  thenia: { lat: 36.721, lng: 3.572, address: 'Thénia, Boumerdès, Algérie' },
  boudouaou: { lat: 36.729, lng: 3.408, address: 'Boudouaou, Boumerdès, Algérie' },
  corso: { lat: 36.792, lng: 3.378, address: 'Corso, Boumerdès, Algérie' },
  isser: { lat: 36.700, lng: 3.707, address: 'Isser, Boumerdès, Algérie' },
  dellys: { lat: 36.915, lng: 3.910, address: 'Dellys, Boumerdès, Algérie' },
  '36': { lat: 36.767, lng: 8.314, address: 'El Tarf, Algérie' },
  tarf: { lat: 36.767, lng: 8.314, address: 'El Tarf, Algérie' },
  '37': { lat: 27.674, lng: -8.147, address: 'Tindouf, Algérie' },
  tindouf: { lat: 27.674, lng: -8.147, address: 'Tindouf, Algérie' },
  '38': { lat: 35.607, lng: 1.810, address: 'Tissemsilt, Algérie' },
  tissemsilt: { lat: 35.607, lng: 1.810, address: 'Tissemsilt, Algérie' },
  '39': { lat: 33.368, lng: 6.867, address: 'El Oued, Algérie' },
  'el oued': { lat: 33.368, lng: 6.867, address: 'El Oued, Algérie' },
  '40': { lat: 35.430, lng: 7.143, address: 'Khenchela, Algérie' },
  khenchela: { lat: 35.430, lng: 7.143, address: 'Khenchela, Algérie' },
  '41': { lat: 36.370, lng: 6.120, address: 'Souk Ahras, Algérie' },
  'souk ahras': { lat: 36.370, lng: 6.120, address: 'Souk Ahras, Algérie' },
  '42': { lat: 36.589, lng: 2.447, address: 'Tipaza, Algérie' },
  tipaza: { lat: 36.589, lng: 2.447, address: 'Tipaza, Algérie' },
  cherchell: { lat: 36.604, lng: 2.199, address: 'Cherchell, Tipaza, Algérie' },
  fouka: { lat: 36.680, lng: 2.568, address: 'Fouka, Tipaza, Algérie' },
  '43': { lat: 36.450, lng: 6.260, address: 'Mila, Algérie' },
  mila: { lat: 36.450, lng: 6.260, address: 'Mila, Algérie' },
  chelghoum: { lat: 36.390, lng: 6.192, address: 'Chelghoum Laïd, Mila, Algérie' },
  ferdjioua: { lat: 36.623, lng: 5.806, address: 'Ferdjioua, Mila, Algérie' },
  '44': { lat: 36.264, lng: 1.968, address: 'Aïn Defla, Algérie' },
  'ain defla': { lat: 36.264, lng: 1.968, address: 'Aïn Defla, Algérie' },
  miliana: { lat: 36.303, lng: 2.235, address: 'Miliana, Aïn Defla, Algérie' },
  khemis: { lat: 36.271, lng: 1.719, address: 'Khemis Miliana, Aïn Defla, Algérie' },
  '45': { lat: 33.266, lng: -0.316, address: 'Naâma, Algérie' },
  naama: { lat: 33.266, lng: -0.316, address: 'Naâma, Algérie' },
  mecheria: { lat: 33.548, lng: -0.283, address: 'Mecheria, Naâma, Algérie' },
  '46': { lat: 35.297, lng: -1.140, address: 'Aïn Témouchent, Algérie' },
  'ain temouchent': { lat: 35.297, lng: -1.140, address: 'Aïn Témouchent, Algérie' },
  '47': { lat: 32.490, lng: 3.670, address: 'Ghardaïa, Algérie' },
  ghardaia: { lat: 32.490, lng: 3.670, address: 'Ghardaïa, Algérie' },
  '48': { lat: 35.738, lng: 0.556, address: 'Relizane, Algérie' },
  relizane: { lat: 35.738, lng: 0.556, address: 'Relizane, Algérie' },
  '49': { lat: 33.950, lng: 5.920, address: "El M'Ghair, Algérie" },
  mghair: { lat: 33.950, lng: 5.920, address: "El M'Ghair, Algérie" },
  '50': { lat: 30.583, lng: 2.883, address: 'El Menia, Algérie' },
  menia: { lat: 30.583, lng: 2.883, address: 'El Menia, Algérie' },
  '51': { lat: 34.433, lng: 5.067, address: 'Ouled Djellal, Algérie' },
  'ouled djellal': { lat: 34.433, lng: 5.067, address: 'Ouled Djellal, Algérie' },
  '52': { lat: 21.328, lng: 0.954, address: 'Bordj Baji Mokhtar, Algérie' },
  mokhtar: { lat: 21.328, lng: 0.954, address: 'Bordj Baji Mokhtar, Algérie' },
  '53': { lat: 30.133, lng: -2.167, address: 'Béni Abbès, Algérie' },
  'beni abbes': { lat: 30.133, lng: -2.167, address: 'Béni Abbès, Algérie' },
  '54': { lat: 29.263, lng: 0.231, address: 'Timimoun, Algérie' },
  timimoun: { lat: 29.263, lng: 0.231, address: 'Timimoun, Algérie' },
  '55': { lat: 33.100, lng: 6.067, address: 'Touggourt, Algérie' },
  touggourt: { lat: 33.100, lng: 6.067, address: 'Touggourt, Algérie' },
  '56': { lat: 24.553, lng: 9.485, address: 'Djanet, Algérie' },
  djanet: { lat: 24.553, lng: 9.485, address: 'Djanet, Algérie' },
  '57': { lat: 27.193, lng: 2.460, address: 'In Salah, Algérie' },
  'in salah': { lat: 27.193, lng: 2.460, address: 'In Salah, Algérie' },
  '58': { lat: 19.569, lng: 5.769, address: 'In Guezzam, Algérie' },
  guezzam: { lat: 19.569, lng: 5.769, address: 'In Guezzam, Algérie' },
  // Plages et lieux touristiques
  'plage madagh': { lat: 35.802, lng: -1.488, address: 'Plage Madagh, Aïn Témouchent, Algérie' },
  taghit: { lat: 30.900, lng: -2.028, address: 'Taghit, Béchar, Algérie' },
  'sidi fredj': { lat: 36.765, lng: 2.855, address: 'Sidi Fredj, Alger, Algérie' },
  // Aéroports
  'aeroport alger': { lat: 36.693, lng: 3.215, address: 'Aéroport Houari Boumédiène, Alger, Algérie' },
  'aeroport oran': { lat: 35.624, lng: -0.621, address: 'Aéroport Ahmed Ben Bella, Oran, Algérie' },
  'aeroport constantine': { lat: 36.277, lng: 6.621, address: 'Aéroport Mohamed Boudiaf, Constantine, Algérie' },
  'aeroport bejaia': { lat: 36.712, lng: 5.069, address: 'Aéroport Soummam, Béjaïa, Algérie' },
  'aeroport setif': { lat: 36.179, lng: 5.325, address: 'Aéroport 8 Mai 1945, Sétif, Algérie' },
  'aeroport annaba': { lat: 36.823, lng: 7.810, address: 'Aéroport Rabah Bitat, Annaba, Algérie' },
};

/**
 * Table of the 10 BBA outer Daïras with fixed official fares.
 */
const BBA_FIXED_ROUTES_TABLE = [
  { id: 'medjana', nameFr: 'Medjana', nameAr: 'مجانة', fare: 500, center: { lat: 36.134, lng: 4.671 }, radius: 6.5, keys: ['medjana', 'مجانة', 'مدجانة'] },
  { id: 'zemmoura', nameFr: 'Zemmoura', nameAr: 'زمورة', fare: 1300, center: { lat: 36.275, lng: 4.856 }, radius: 7.0, keys: ['zemmoura', 'زمورة'] },
  { id: 'ras_el_oued', nameFr: 'Ras El Oued', nameAr: 'رأس الوادي', fare: 1500, center: { lat: 35.945, lng: 5.031 }, radius: 8.0, keys: ['ras el oued', 'rasel oued', 'ras el-oued', 'راس الواد', 'رأس الوادي', 'راس الوادي'] },
  { id: 'el_achir', nameFr: 'El Achir', nameAr: 'الياشير', fare: 800, center: { lat: 36.064, lng: 4.653 }, radius: 6.0, keys: ['el achir', 'achir', 'yachir', 'el yachir', 'ياشير', 'الياشير'] },
  { id: 'sidi_embarek', nameFr: 'Sidi Embarek', nameAr: 'سيدي مبارك', fare: 600, center: { lat: 36.104, lng: 4.910 }, radius: 6.0, keys: ['sidi embarek', "sidi m'barek", 'سيدي مبارك'] },
  { id: 'ain_taghrout', nameFr: 'Ain Taghrout', nameAr: 'عين تاغروت', fare: 1500, center: { lat: 36.126, lng: 5.083 }, radius: 7.0, keys: ['ain taghrout', 'aïn taghrout', 'aintaghrout', 'عين تاغروت', 'عين تاغروث'] },
  { id: 'hammadia', nameFr: 'Hammadia', nameAr: 'حمادية', fare: 800, center: { lat: 35.978, lng: 4.747 }, radius: 6.5, keys: ['hammadia', 'hamadia', 'حمادية'] },
  { id: 'el_mansourah', nameFr: 'El Mansourah', nameAr: 'المنصورة', fare: 1500, center: { lat: 36.084, lng: 4.453 }, radius: 7.0, keys: ['mansourah', 'mansoura', 'el mansourah', 'المنصورة', 'منصورة'] },
  { id: 'el_mhir', nameFr: "El M'hir", nameAr: 'المهير', fare: 2000, center: { lat: 36.128, lng: 4.378 }, radius: 7.0, keys: ['el mhir', "el m'hir", 'mhir', 'mehir', 'المهير', 'مهير'] },
  { id: 'el_anseur', nameFr: 'El Anseur', nameAr: 'العناصر', fare: 500, center: { lat: 36.067, lng: 4.850 }, radius: 6.0, keys: ['el anseur', 'el anasser', 'anasser', 'anseur', 'العناصر', 'عناصر'] },
];

/**
 * Safely finds a matching place from ALGERIA_PLACES.
 * Critical: Checks BBA Daïras FIRST so addresses like 'Medjana, BBA' or 'مجانة, برج بوعريريج'
 * never accidentally match 'bba' or 'برج' (which would redirect to BBA center 200 DA).
 */
function findMatchingPlace(text: string): { lat: number; lng: number; address: string } | null {
  const clean = text.trim().toLowerCase();
  if (!clean || clean.length < 2) return null;

  // 1. Exact key match
  if (ALGERIA_PLACES[clean]) return ALGERIA_PLACES[clean];

  // 2. Check BBA Daïras FIRST (highest priority)
  for (const d of BBA_FIXED_ROUTES_TABLE) {
    if (d.keys.some((k) => clean.includes(k))) {
      return ALGERIA_PLACES[d.id] || ALGERIA_PLACES[d.keys[0]] || { lat: d.center.lat, lng: d.center.lng, address: `${d.nameFr}, Algérie` };
    }
  }

  // 3. Match keys sorted by length descending so longer phrases match first
  const keys = Object.keys(ALGERIA_PLACES).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (k.length <= 4) {
      // Short acronyms ('bba', 'برج', '16') require word boundary or exact match
      if (clean === k || clean.startsWith(k + ' ') || clean.endsWith(' ' + k) || clean.includes(' ' + k + ' ') || clean.includes(k + ',')) {
        return ALGERIA_PLACES[k];
      }
    } else if (clean.includes(k)) {
      return ALGERIA_PLACES[k];
    }
  }

  return null;
}

/** Geocode a text string using local places dictionary first, then Nominatim */
async function geocodePlace(text: string): Promise<{ lat: number; lng: number; address: string } | null> {
  const matched = findMatchingPlace(text);
  if (matched) return matched;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=dz&limit=1&accept-language=fr`,
      { headers: { 'User-Agent': 'ZaxiApp/1.0' } }
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), address: data[0].display_name };
    }
  } catch (err) {
    console.warn('[geocodePlace] Nominatim error:', err);
  }
  return null;
}

/** Returns straight-line Haversine distance in km */
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const sinA =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLon *
      sinLon;
  return R * 2 * Math.atan2(Math.sqrt(sinA), Math.sqrt(1 - sinA));
}

const BBA_CENTER = { lat: 36.073, lng: 4.761 };
const BBA_URBAN_RADIUS_KM = 12.0; // radius to cover BBA city area

/**
 * Returns the fixed fare if either endpoint (pickup or destination)
 * matches one of the 10 BBA daïras — by GPS proximity OR address keyword.
 */
function checkBbaFixedRoute(
  pickup: { lat: number; lng: number; address?: string },
  dest: { lat: number; lng: number; address?: string }
): number | null {
  for (const d of BBA_FIXED_ROUTES_TABLE) {
    // Match by destination coords or address
    const destMatchCoords = haversineKm(dest, d.center) <= d.radius;
    const destMatchAddr = dest.address
      ? d.keys.some((k) => dest.address!.toLowerCase().includes(k))
      : false;
    if (destMatchCoords || destMatchAddr) return d.fare;

    // Match by pickup coords or address (reverse trip: daïra → BBA)
    const pickupMatchCoords = haversineKm(pickup, d.center) <= d.radius;
    const pickupMatchAddr = pickup.address
      ? d.keys.some((k) => pickup.address!.toLowerCase().includes(k))
      : false;
    if (pickupMatchCoords || pickupMatchAddr) return d.fare;
  }
  return null;
}

/** Compute price estimate using live backend rates and BBA fixed routes */
function computeEstimate(
  pickup: { lat: number; lng: number; address?: string },
  dest: { lat: number; lng: number; address?: string },
  cityFlatFare: number,
  outsideRatePerKm: number,
): BookingEstimate {
  const straightDistance = haversineKm(pickup, dest);
  const distanceKm = Math.max(0.5, Math.round(straightDistance * 1.20 * 10) / 10);
  const avgSpeed = distanceKm > 30 ? 90 : 50;
  const durationMinutes = Math.max(1, Math.round((distanceKm / avgSpeed) * 60));

  // 1. Check if it's a fixed route between BBA Center and one of the 10 Daïras
  const fixedFare = checkBbaFixedRoute(pickup, dest);
  if (fixedFare !== null) {
    return {
      pricingType: 'CITY',
      distanceKm,
      durationMinutes,
      ratePerKm: null,
      estimatedPrice: fixedFare,
    };
  }

  // 2. Intra-city BBA ride
  const pickupInBBA = haversineKm(pickup, BBA_CENTER) <= BBA_URBAN_RADIUS_KM;
  const destInBBA = haversineKm(dest, BBA_CENTER) <= BBA_URBAN_RADIUS_KM;
  if (pickupInBBA && destInBBA) {
    return { pricingType: 'CITY', distanceKm, durationMinutes, ratePerKm: null, estimatedPrice: cityFlatFare };
  }

  // 3. Distance-based fare
  return {
    pricingType: 'DISTANCE',
    distanceKm,
    durationMinutes,
    ratePerKm: outsideRatePerKm,
    estimatedPrice: Math.round(distanceKm * outsideRatePerKm),
  };
}

async function geocodeAddress(addressText: string): Promise<PlaceDetails | null> {
  return geocodePlace(addressText);
}

export function CustomerBookingCard({ onBooked }: CustomerBookingCardProps) {
  const queryClient = useQueryClient();
  const { t, language, isRTL } = useTranslation();

  const [bookingMode, setBookingMode] = useState<'instant' | 'scheduled'>('instant');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [scheduledDuration, setScheduledDuration] = useState<ScheduledDuration>('none');
  const [withRetour, setWithRetour] = useState<boolean>(false);
  const [isScheduledSubmitted, setIsScheduledSubmitted] = useState<boolean>(false);

  // Driver public profile for WhatsApp versement contact
  const { data: driverProfileRes } = useQuery({
    queryKey: ['publicDriverProfile'],
    queryFn: () => DriverService.getPublicProfile(),
    staleTime: 60_000,
  });
  const rawDriver = driverProfileRes?.data?.data?.driver ?? (driverProfileRes?.data as any);
  const driverPhone: string =
    rawDriver?.whatsappNumber || rawDriver?.phoneNumber || rawDriver?.phone || '+213795598182';

  const { useSocketEvent } = useSocket();

  // ── Fetch live pricing from backend ────────────────────────────────────────
  const { data: pricingRes } = useQuery({
    queryKey: ['publicPricing'],
    queryFn: () => DriverService.getPublicPricing(),
    staleTime: 30_000,
  });

  // Listen for real-time pricing updates pushed from driver dashboard
  useSocketEvent('pricing:updated', (newPricing) => {
    queryClient.setQueryData(['publicPricing'], { data: { data: newPricing } });
    queryClient.invalidateQueries({ queryKey: ['publicPricing'] });
  });

  const rawPricing = pricingRes?.data?.data ?? (pricingRes?.data as any);
  const cityFlatFare: number = rawPricing?.cityFlatFare ?? 150;
  const outsideRatePerKm: number = rawPricing?.outsideRatePerKm ?? 40;

  // Query saved favorites
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

  // ── Pickup state (Manual address search) ───────────────────────────────────
  const [pickupInput, setPickupInput] = useState('');
  const [pickupPredictions, setPickupPredictions] = useState<PlacePrediction[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<PlaceDetails | null>(null);
  const [isLoadingPickupPredictions, setIsLoadingPickupPredictions] = useState(false);
  const pickupDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickupSessionTokenRef = useRef<string>(crypto.randomUUID());

  // ── Destination autocomplete state ──────────────────────────────────────────
  const [destInput, setDestInput] = useState('');
  const [destPredictions, setDestPredictions] = useState<PlacePrediction[]>([]);
  const [selectedDest, setSelectedDest] = useState<PlaceDetails | null>(null);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const autocompleteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<string>(crypto.randomUUID());

  const [estimate, setEstimate] = useState<BookingEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // ── Surcharges & Total Pricing ──────────────────────────────────────────────
  const basePrice = estimate ? estimate.estimatedPrice : cityFlatFare;
  const durationSurcharge = bookingMode === 'scheduled'
    ? (scheduledDuration === 'half' ? SURCHARGE_HALF_DAY : scheduledDuration === 'full' ? SURCHARGE_FULL_DAY : 0)
    : 0;
  const retourSurcharge = bookingMode === 'scheduled' && withRetour ? basePrice : 0;
  const totalPrice = basePrice + durationSurcharge + retourSurcharge;

  const durationTextFr = scheduledDuration === 'half'
    ? 'Demi-journée (<6h) [+1000 DA]'
    : scheduledDuration === 'full'
    ? 'Journée complète (≥6h) [+2000 DA]'
    : 'Aller simple (Sans attente)';
  const durationTextAr = scheduledDuration === 'half'
    ? 'نصف يوم (< 6 ساعات) [+1000 دج]'
    : scheduledDuration === 'full'
    ? 'يوم كامل (≥ 6 ساعات) [+2000 دج]'
    : 'توصيل مباشر بدون انتظار';

  const scheduledDateFormatted = scheduledDateTime
    ? new Date(scheduledDateTime).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  const waMessage = language === 'ar'
    ? `مرحباً كابتن زكريا، أود تأكيد حجزي المبرمج في ZAXI :
📅 الموعد: ${scheduledDateFormatted || 'غير محدد'}
📍 نقطة الانطلاق: ${selectedPickup?.address || pickupInput || 'غير محدد'}
🏁 الوجهة: ${selectedDest?.address || destInput || 'غير محدد'}
⏱ مدة الحجز: ${durationTextAr}
🔄 رحلة العودة: ${withRetour ? `نعم، مع رحلة عودة (+${basePrice} دج)` : 'بدون رحلة عودة'}
💰 المبلغ الإجمالي المقدر: ${totalPrice} دج
أود تحويل مبلغ تسبيق (عربون) لتأكيد حجزي، يرجى تزويدي بمعلومات الدفع.`
    : `Bonjour Capitaine Zakaria, je souhaite confirmer ma réservation programmée sur ZAXI :
📅 Date et heure : ${scheduledDateFormatted || 'Non précisée'}
📍 Départ : ${selectedPickup?.address || pickupInput || 'Non précisé'}
🏁 Destination : ${selectedDest?.address || destInput || 'Non précisée'}
⏱ Durée avec chauffeur : ${durationTextFr}
🔄 Trajet retour : ${withRetour ? `Oui, avec retour (+${basePrice} DA)` : 'Sans retour'}
💰 Montant total estimé : ${totalPrice} DA
Je souhaite vous verser un acompte pour valider définitivement la réservation. Merci de me transmettre vos coordonnées.`;

  const waLink = `https://wa.me/${driverPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`;

  const getPickupCoords = useCallback(() => {
    if (selectedPickup) return selectedPickup;
    return { lat: 36.073, lng: 4.761, address: pickupInput.trim() || 'Bordj Bou Arréridj' };
  }, [selectedPickup, pickupInput]);

  // Pickup autocomplete (manual entry)
  useEffect(() => {
    if (!pickupInput.trim() || pickupInput.trim().length < 2) {
      setPickupPredictions([]);
      return;
    }
    if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
    pickupDebounceRef.current = setTimeout(async () => {
      setIsLoadingPickupPredictions(true);
      const results = await fetchAutocompletePredictions(pickupInput, pickupSessionTokenRef.current);
      setPickupPredictions(results);
      setIsLoadingPickupPredictions(false);
    }, 350);
  }, [pickupInput]);

  const handleSelectPickup = useCallback(async (prediction: PlacePrediction) => {
    setPickupInput(prediction.description);
    setPickupPredictions([]);
    setIsLoadingPickupPredictions(true);
    let details: PlaceDetails | null = null;
    if (prediction.place_id.startsWith('local_')) {
      const key = prediction.place_id.replace('local_', '');
      details = ALGERIA_PLACES[key] || null;
    } else if (prediction.place_id.startsWith('osm_')) {
      const parts = prediction.place_id.split('_');
      if (parts.length >= 4) {
        const lat = parseFloat(parts[parts.length - 2]);
        const lng = parseFloat(parts[parts.length - 1]);
        if (!isNaN(lat) && !isNaN(lng)) details = { lat, lng, address: prediction.description };
      }
      if (!details) details = await geocodeAddress(prediction.description);
    } else {
      details = await fetchPlaceDetails(prediction.place_id);
    }
    setIsLoadingPickupPredictions(false);
    if (details) { setSelectedPickup(details); setPickupInput(details.address); pickupSessionTokenRef.current = crypto.randomUUID(); }
  }, []);

  // Destination autocomplete
  useEffect(() => {
    if (!destInput.trim() || destInput.trim().length < 2) {
      setDestPredictions([]);
      if (!selectedDest) setEstimate(null);
      return;
    }

    // If destination is already selected and matches the input, don't re-match or geocode
    if (selectedDest && (selectedDest.address === destInput || destInput.includes(selectedDest.address))) {
      return;
    }

    const matchedPlace = findMatchingPlace(destInput);
    if (matchedPlace) {
      if (!selectedDest || selectedDest.lat !== matchedPlace.lat || selectedDest.lng !== matchedPlace.lng) {
        setSelectedDest(matchedPlace);
        const pickup = getPickupCoords();
        setEstimate(computeEstimate(pickup, matchedPlace, cityFlatFare, outsideRatePerKm));
      }
      return;
    }

    if (selectedDest) return;
    if (autocompleteDebounceRef.current) clearTimeout(autocompleteDebounceRef.current);
    autocompleteDebounceRef.current = setTimeout(async () => {
      setIsLoadingPredictions(true);
      const results = await fetchAutocompletePredictions(destInput, sessionTokenRef.current);
      setDestPredictions(results);
      if (results.length === 0) {
        const geoResult = await geocodeAddress(destInput);
        if (geoResult) {
          setSelectedDest(geoResult);
          setEstimate(computeEstimate(getPickupCoords(), geoResult, cityFlatFare, outsideRatePerKm));
        }
      }
      setIsLoadingPredictions(false);
    }, 350);
  }, [destInput, selectedDest, getPickupCoords, cityFlatFare, outsideRatePerKm]);

  // Recalculate estimate when pricing or selection changes
  useEffect(() => {
    if (!selectedDest) return;
    const pickup = getPickupCoords();
    const localEstimate = computeEstimate(pickup, selectedDest, cityFlatFare, outsideRatePerKm);
    setEstimate(localEstimate);

    // If the local estimate is already a fixed BBA daïra route, skip the backend call
    // (the backend would override with generic city fare or distance fare incorrectly)
    const isFixedRoute = checkBbaFixedRoute(pickup, selectedDest) !== null;
    if (isFixedRoute) return;

    setIsEstimating(true);
    BookingService.getEstimate({
      pickup: { latitude: pickup.lat, longitude: pickup.lng, address: pickup.address },
      destination: { latitude: selectedDest.lat, longitude: selectedDest.lng, address: selectedDest.address },
    })
      .then((res) => {
        const estData = (res as any).data ?? res;
        if (estData && typeof estData.estimatedPrice === 'number') setEstimate(estData);
      })
      .catch((err) => console.warn('[CustomerBookingCard] Backend estimate error:', err))
      .finally(() => setIsEstimating(false));
  }, [selectedDest, getPickupCoords, cityFlatFare, outsideRatePerKm]);

  const handleSelectDestination = useCallback(async (prediction: PlacePrediction) => {
    setDestInput(prediction.description);
    setDestPredictions([]);
    setIsLoadingPredictions(true);
    let details: PlaceDetails | null = null;
    if (prediction.place_id.startsWith('local_')) {
      const key = prediction.place_id.replace('local_', '');
      details = ALGERIA_PLACES[key] || findMatchingPlace(prediction.description) || null;
    } else if (prediction.place_id.startsWith('osm_')) {
      const parts = prediction.place_id.split('_');
      if (parts.length >= 4) {
        const lat = parseFloat(parts[parts.length - 2]);
        const lng = parseFloat(parts[parts.length - 1]);
        if (!isNaN(lat) && !isNaN(lng)) details = { lat, lng, address: prediction.description };
      }
      if (!details) details = await geocodeAddress(prediction.description);
    } else {
      details = await fetchPlaceDetails(prediction.place_id);
    }
    setIsLoadingPredictions(false);
    if (details) {
      setSelectedDest(details);
      setEstimate(computeEstimate(getPickupCoords(), details, cityFlatFare, outsideRatePerKm));
      sessionTokenRef.current = crypto.randomUUID();
    }
  }, [getPickupCoords, cityFlatFare, outsideRatePerKm]);

  const handleDestInputChange = (val: string) => {
    setDestInput(val);
    const matched = findMatchingPlace(val);
    if (matched) {
      setSelectedDest(matched);
      setEstimate(computeEstimate(getPickupCoords(), matched, cityFlatFare, outsideRatePerKm));
    } else if (selectedDest && !selectedDest.address.toLowerCase().includes(val.toLowerCase().trim())) {
      setSelectedDest(null);
      setEstimate(null);
    }
  };

  const clearDestination = () => { setDestInput(''); setSelectedDest(null); setDestPredictions([]); setEstimate(null); };

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const pickup = getPickupCoords();
      const pickupAddress = selectedPickup?.address || pickupInput.trim() || pickup.address;

      let targetDest = selectedDest;
      if (!targetDest && destInput.trim()) targetDest = await geocodeAddress(destInput.trim());
      if (!targetDest) throw new Error('Veuillez sélectionner une destination valide.');
      if (typeof pickup.lat !== 'number' || isNaN(pickup.lat) || typeof pickup.lng !== 'number' || isNaN(pickup.lng)) {
        throw new Error('Position de départ invalide.');
      }
      if (typeof targetDest.lat !== 'number' || isNaN(targetDest.lat) || typeof targetDest.lng !== 'number' || isNaN(targetDest.lng)) {
        throw new Error('Position de destination invalide. Veuillez sélectionner une adresse valide.');
      }
      if (bookingMode === 'scheduled') {
        if (!scheduledDateTime) throw new Error(language === 'ar' ? 'يرجى اختيار تاريخ ووقت الحجز.' : "Veuillez choisir la date et l'heure de réservation.");
        if (new Date(scheduledDateTime).getTime() <= Date.now() - 60000) throw new Error(language === 'ar' ? 'يجب أن يكون موعد الحجز في المستقبل.' : 'La date de réservation doit être dans le futur.');
      }

      const notes = bookingMode === 'scheduled'
        ? [
            `Réservation programmée: ${new Date(scheduledDateTime).toLocaleString('fr-FR')}`,
            `Durée: ${durationTextFr}`,
            withRetour ? `Avec retour (+${basePrice} DA)` : 'Sans retour',
            `Total: ${totalPrice} DA`,
          ].join(' | ')
        : undefined;

      return BookingService.createBooking({
        pickup: { latitude: pickup.lat, longitude: pickup.lng, address: pickupAddress },
        destination: { latitude: targetDest.lat, longitude: targetDest.lng, address: targetDest.address },
        ...(bookingMode === 'scheduled' && scheduledDateTime ? { scheduledAt: new Date(scheduledDateTime).toISOString() } : {}),
        ...(bookingMode === 'scheduled' ? { offerPrice: totalPrice } : {}),
        notes,
      });
    },
    onSuccess: () => {
      if (bookingMode === 'scheduled') {
        setIsScheduledSubmitted(true);
        queryClient.invalidateQueries({ queryKey: ['myBookings'] });
      } else {
        toast.success(language === 'ar' ? 'تم إرسال طلب الحجز بنجاح !' : 'Demande de réservation envoyée !');
        setDestInput(''); setSelectedDest(null); setEstimate(null); setScheduledDateTime('');
        queryClient.invalidateQueries({ queryKey: ['myBookings'] });
        onBooked();
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || (language === 'ar' ? 'حدث خطأ أثناء إنشاء الحجز.' : 'Erreur lors de la création.'));
    },
  });

  const handleConfirm = () => {
    if (!selectedPickup && !pickupInput.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال نقطة الانطلاق.' : 'Veuillez entrer un lieu de départ.');
      return;
    }
    if (!selectedDest && !destInput.trim()) {
      toast.error(language === 'ar' ? 'يرجى تحديد الوجهة.' : 'Veuillez sélectionner une destination.');
      return;
    }
    createBookingMutation.mutate();
  };

  const minDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const inputStyle: React.CSSProperties = { flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#111', fontWeight: 600 };

  // ── Post-Confirmation Screen for Scheduled Reservation (CCP Instructions) ──
  if (isScheduledSubmitted) {
    return (
      <div style={{
        background: '#fff',
        border: '2px solid #FF9900',
        borderRadius: '24px',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        textAlign: isRTL ? 'right' : 'left',
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
            {language === 'ar' ? 'تم تسجيل طلب حجزك بنجاح !' : 'Demande de réservation envoyée !'}
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
              {language === 'ar' ? '⚠️ تنبيه هام : السائق لن يؤكد الرحلة قبل استلام CCP' : '⚠️ Important : Le chauffeur ne confirmera qu\'après versement CCP'}
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#78350F', fontWeight: 700, margin: 0, lineHeight: 1.6 }}>
            {language === 'ar'
              ? 'طلبك مسجل الآن في النظام بحالة "في انتظار التأكيد". يرجى العلم بأن السائق لن يؤكد هذا الموعد ولن يقبله حتى تتواصل معه على واتساب وتقوم بتحويل العربون إلى حسابه البريدي الجاري CCP.'
              : 'Votre demande est bien enregistrée en attente. Sachez que le chauffeur ne validera et ne confirmera définitivement votre course qu\'après l\'avoir contacté sur WhatsApp pour lui verser l\'argent sur son compte CCP.'}
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
                  ? 'سيقوم السائق فوراً بتأكيد الرحلة وحجز الموعد نهائياً.'
                  : 'Le chauffeur validera alors immédiatement votre course dans l\'application.'}
              </li>
            </ol>
          </div>

          {/* Trip Summary Mini-Box */}
          <div style={{ background: '#FFF', borderRadius: '12px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', border: '1px solid #FFE0A0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>{language === 'ar' ? 'الموعد :' : 'Date :'}</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{scheduledDateFormatted}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>{language === 'ar' ? 'المدة :' : 'Durée :'}</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{language === 'ar' ? durationTextAr : durationTextFr}</span>
            </div>
            {withRetour && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>{language === 'ar' ? 'العودة :' : 'Retour :'}</span>
                <span style={{ fontWeight: 700, color: '#16A34A' }}>{language === 'ar' ? `مشمولة (+${basePrice} دج)` : `Inclus (+${basePrice} DA)`}</span>
              </div>
            )}
            <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '4px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: '#0F172A' }}>{language === 'ar' ? 'الإجمالي المقدر :' : 'Total estimé :'}</span>
              <span style={{ fontWeight: 900, fontSize: '14px', color: '#FF9900' }}>{totalPrice} DA</span>
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
            setIsScheduledSubmitted(false);
            setDestInput(''); setSelectedDest(null); setEstimate(null); setScheduledDateTime('');
            setScheduledDuration('none'); setWithRetour(false);
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
    <div style={{ background: '#fff', border: '2px solid #FF9900', borderRadius: '24px', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: isRTL ? 'right' : 'left' }}>
      {/* Card Title */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: '16px', color: '#111' }}>{t.booking.modalTitle}</span>
      </div>

      {/* Booking Mode */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {language === 'ar' ? 'نوع الحجز' : 'Option de réservation'}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {(['instant', 'scheduled'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setBookingMode(mode)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '12px 10px', borderRadius: '16px',
                border: bookingMode === mode ? '2px solid #FF9900' : '1.5px solid #E2E8F0',
                backgroundColor: bookingMode === mode ? '#FFF8EC' : '#F8FAFC',
                color: bookingMode === mode ? '#FF9900' : '#64748B',
                fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {mode === 'instant' ? t.booking.instantTab : t.booking.scheduledTab}
            </button>
          ))}
        </div>
      </div>

      {/* ── SCHEDULED OPTIONS SECTION ── */}
      {bookingMode === 'scheduled' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* DateTime Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: '16px', padding: '14px 16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {t.booking.selectDateTime}
              <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledDateTime}
              min={minDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '13px', fontWeight: 600, color: '#0F172A', backgroundColor: '#FFFFFF', outline: 'none' }}
            />
            <p style={{ fontSize: '10px', color: '#64748B', margin: 0, fontStyle: 'italic' }}>{t.booking.scheduleNotice}</p>
          </div>

          {/* ⏱ DURATION WITH DRIVER (Mise à disposition) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {language === 'ar' ? 'كم من الوقت سيبقى السائق معك؟' : 'Durée de mise à disposition du chauffeur'}
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {/* None / Aller simple */}
              <button
                type="button"
                onClick={() => setScheduledDuration('none')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '12px 6px', borderRadius: '16px',
                  border: scheduledDuration === 'none' ? '2px solid #FF9900' : '1.5px solid #E2E8F0',
                  background: scheduledDuration === 'none' ? '#FFF8EC' : '#FFFFFF',
                  cursor: 'pointer', transition: 'all 0.2s', gap: '3px', textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, color: scheduledDuration === 'none' ? '#FF9900' : '#1E293B' }}>
                  {language === 'ar' ? 'بدون انتظار' : 'Aller simple'}
                </span>
                <span style={{ fontSize: '10px', color: '#64748B' }}>
                  {language === 'ar' ? 'توصيل فقط' : 'Sans attente'}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#10B981', background: '#ECFDF5', padding: '2px 6px', borderRadius: '6px', marginTop: '2px' }}>
                  +0 DA
                </span>
              </button>

              {/* Half Day < 6h */}
              <button
                type="button"
                onClick={() => setScheduledDuration('half')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '12px 6px', borderRadius: '16px',
                  border: scheduledDuration === 'half' ? '2px solid #FF9900' : '1.5px solid #E2E8F0',
                  background: scheduledDuration === 'half' ? '#FFF8EC' : '#FFFFFF',
                  cursor: 'pointer', transition: 'all 0.2s', gap: '3px', textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, color: scheduledDuration === 'half' ? '#FF9900' : '#1E293B' }}>
                  {language === 'ar' ? 'نصف يوم' : 'Demi-journée'}
                </span>
                <span style={{ fontSize: '10px', color: '#64748B' }}>
                  {language === 'ar' ? '< 6 ساعات' : '< 6 heures'}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#FF9900', background: 'rgba(255, 153, 0, 0.12)', padding: '2px 6px', borderRadius: '6px', marginTop: '2px' }}>
                  +1 000 DA
                </span>
              </button>

              {/* Full Day >= 6h */}
              <button
                type="button"
                onClick={() => setScheduledDuration('full')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '12px 6px', borderRadius: '16px',
                  border: scheduledDuration === 'full' ? '2px solid #FF9900' : '1.5px solid #E2E8F0',
                  background: scheduledDuration === 'full' ? '#FFF8EC' : '#FFFFFF',
                  cursor: 'pointer', transition: 'all 0.2s', gap: '3px', textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, color: scheduledDuration === 'full' ? '#FF9900' : '#1E293B' }}>
                  {language === 'ar' ? 'يوم كامل' : 'Journée entière'}
                </span>
                <span style={{ fontSize: '10px', color: '#64748B' }}>
                  {language === 'ar' ? '≥ 6 ساعات' : '≥ 6 heures'}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#FF9900', background: 'rgba(255, 153, 0, 0.12)', padding: '2px 6px', borderRadius: '6px', marginTop: '2px' }}>
                  +2 000 DA
                </span>
              </button>
            </div>
          </div>

          {/* 🔄 RETOUR TOGGLE (Return Trip) */}
          <div
            onClick={() => setWithRetour(!withRetour)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: withRetour ? '#FFF8EC' : '#F8FAFC',
              border: withRetour ? '2px solid #FF9900' : '1.5px solid #E2E8F0',
              borderRadius: '16px',
              padding: '12px 14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: withRetour ? '#92400E' : '#1E293B' }}>
                  {language === 'ar' ? 'مع رحلة العودة (من الوجهة إلى نقطة الانطلاق)' : 'Trajet retour inclus (Destination ➔ Départ)'}
                </p>
                <p style={{ margin: 0, fontSize: '10px', color: '#64748B' }}>
                  {language === 'ar' ? 'السائق يضمن عودتك إلى نقطة انطلاقك' : 'Le chauffeur assure votre retour au point de départ initial'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: withRetour ? '#FF9900' : '#64748B',
                background: withRetour ? 'rgba(255, 153, 0, 0.12)' : '#E2E8F0',
                padding: '3px 8px',
                borderRadius: '8px',
              }}>
                +{basePrice.toLocaleString('fr-DZ')} DA
              </span>
              <input
                type="checkbox"
                checked={withRetour}
                onChange={() => {}}
                style={{ accentColor: '#FF9900', width: 16, height: 16, cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* 🚨 PAYMENT VERSEMENT ALERT (WhatsApp confirmation) */}
          <div style={{
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFF8EC 100%)',
            border: '2px solid #FF9900',
            borderRadius: '18px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 2px 10px rgba(255, 153, 0, 0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 900, fontSize: '13px', color: '#92400E' }}>
                {language === 'ar' ? '⚠️ تنبيه هام : السائق لن يؤكد الرحلة إلا بعد تحويل CCP' : '⚠️ Important : Le chauffeur ne confirmera qu\'après versement CCP'}
              </span>
            </div>

            <p style={{ fontSize: '11px', color: '#78350F', margin: 0, fontWeight: 700, lineHeight: 1.5 }}>
              {language === 'ar'
                ? 'أنت تؤكد طلبك أولاً بالضغط على الزر أدناه. يرجى العلم بأن السائق لن يؤكد الرحلة ولن يحجزها نهائياً إلا بعد أن تتواصل معه عبر واتساب وتقوم بتحويل العربون إلى حسابه البريدي الجاري CCP.'
                : 'Vous confirmez d\'abord votre demande ci-dessous. Veuillez noter que le chauffeur ne confirmera définitivement votre course qu\'après l\'avoir contacté sur WhatsApp pour lui verser l\'argent sur son compte CCP.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {[
                {
                  step: '1',
                  fr: 'Cliquez d\'abord sur "Confirmer la réservation" ci-dessous pour enregistrer votre demande.',
                  ar: 'اضغط أولاً على "تأكيد الحجز" بالأسفل لتسجيل وإرسال طلبك.',
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

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: '#25D366', color: '#fff', borderRadius: '14px',
                padding: '11px 16px', fontWeight: 800, fontSize: '12px',
                textDecoration: 'none', boxShadow: '0 3px 10px rgba(37, 211, 102, 0.25)',
              }}
            >
              <MessageCircle style={{ width: 16, height: 16, flexShrink: 0, color: '#fff' }} />
              <span>{language === 'ar' ? `تواصل مع السائق عبر واتساب — ${driverPhone}` : `Contacter le chauffeur sur WhatsApp — ${driverPhone}`}</span>
            </a>
          </div>
        </div>
      )}

      {/* ── PICKUP SECTION (Manual Search) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t.booking.pickupLabel}
          </label>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: selectedPickup ? '#F0FFF4' : '#F8F8F8', border: `1.5px solid ${selectedPickup ? '#86EFAC' : '#E5E5E5'}`, borderRadius: '16px', padding: '14px 16px' }}>
            {isLoadingPickupPredictions && <Loader2 style={{ color: '#999', width: 16, height: 16, flexShrink: 0 }} className="animate-spin" />}
            <input
              type="text"
              value={pickupInput}
              onChange={(e) => {
                setPickupInput(e.target.value);
                const p = findMatchingPlace(e.target.value);
                if (p) setSelectedPickup(p); else if (selectedPickup) setSelectedPickup(null);
              }}
              placeholder={language === 'ar' ? 'أدخل نقطة الانطلاق (مثلاً: وسط المدينة، البرج)...' : 'Entrez votre lieu de départ (ex: Centre-ville, BBA)...'}
              style={inputStyle}
            />
            {pickupInput && (
              <button
                type="button"
                onClick={() => { setPickupInput(''); setSelectedPickup(null); setPickupPredictions([]); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X style={{ color: '#999', width: 14, height: 14 }} />
              </button>
            )}
          </div>
          {pickupPredictions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', marginTop: '6px', overflow: 'hidden' }}>
              {pickupPredictions.map((pred, i) => (
                <button
                  key={pred.place_id}
                  onClick={() => handleSelectPickup(pred)}
                  style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: 'none', border: 'none', borderBottom: i < pickupPredictions.length - 1 ? '1px solid #F0F0F0' : 'none', cursor: 'pointer', textAlign: isRTL ? 'right' : 'left' }}
                >
                  <span style={{ fontSize: '12px', color: '#222', fontWeight: 500, lineHeight: 1.4 }}>{pred.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── DESTINATION SECTION ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
        {/* Favorites shortcuts */}
        {favorites.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>{t.booking.favoritesTitle} :</span>
            {favorites.map((fav: any) => (
              <button key={fav.id} type="button"
                onClick={() => { setDestInput(fav.address || fav.name); setSelectedDest({ lat: fav.latitude, lng: fav.longitude, address: fav.address || fav.name }); }}
                style={{ padding: '4px 10px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '10px', fontSize: '11px', fontWeight: 700, color: '#0D9488', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {fav.name}
              </button>
            ))}
          </div>
        )}

        {/* BBA Dairas Fixed Routes shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {language === 'ar' ? 'خطوط دوائر برج بوعريريج (تعريفة ثابتة)' : 'Daïras de BBA (Tarifs Fixes)'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {[
              { name: language === 'ar' ? 'مجانة (500 دج)' : 'Medjana (500 DA)', key: 'medjana' },
              { name: language === 'ar' ? 'زمورة (1300 دج)' : 'Zemmoura (1300 DA)', key: 'zemmoura' },
              { name: language === 'ar' ? 'رأس الوادي (1500 دج)' : 'Ras El Oued (1500 DA)', key: 'ras el oued' },
              { name: language === 'ar' ? 'الياشير (800 دج)' : 'El Achir (800 DA)', key: 'el achir' },
              { name: language === 'ar' ? 'سيدي مبارك (600 دج)' : 'Sidi Embarek (600 DA)', key: 'sidi embarek' },
              { name: language === 'ar' ? 'عين تاغروت (1500 دج)' : 'Ain Taghrout (1500 DA)', key: 'ain taghrout' },
              { name: language === 'ar' ? 'حمادية (800 دج)' : 'Hammadia (800 DA)', key: 'hammadia' },
              { name: language === 'ar' ? 'المنصورة (1500 دج)' : 'El Mansourah (1500 DA)', key: 'mansourah' },
              { name: language === 'ar' ? 'المهير (2000 دج)' : "El M'hir (2000 DA)", key: 'el mhir' },
              { name: language === 'ar' ? 'العناصر (500 دج)' : 'El Anseur (500 DA)', key: 'el anseur' },
            ].map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  const place = ALGERIA_PLACES[d.key] || findMatchingPlace(d.key);
                  if (place) {
                    setDestInput(place.address);
                    setSelectedDest(place);
                    const pickup = getPickupCoords();
                    setEstimate(computeEstimate(pickup, place, cityFlatFare, outsideRatePerKm));
                  }
                }}
                style={{
                  padding: '5px 10px',
                  background: '#F8FAFC',
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#0F172A',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Wilayas destinations shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#FF9900', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {language === 'ar' ? 'ولايات أخرى :' : 'Autres Wilayas :'}
          </span>
          {[
            { name: language === 'ar' ? 'سطيف' : 'Sétif', key: '19' },
            { name: language === 'ar' ? 'الجزائر' : 'Alger', key: '16' },
            { name: language === 'ar' ? 'المسيلة' : "M'Sila", key: '28' },
            { name: language === 'ar' ? 'بجاية' : 'Béjaïa', key: '06' },
            { name: language === 'ar' ? 'قسنطينة' : 'Constantine', key: '25' },
            { name: language === 'ar' ? 'وهران' : 'Oran', key: '31' },
            { name: 'Aïn Turk', key: 'ain turk' },
            { name: 'Tigzirt', key: 'tigzirt' },
          ].map((w) => (
            <button key={w.key} type="button"
              onClick={() => {
                const place = ALGERIA_PLACES[w.key] || findMatchingPlace(w.key);
                if (place) { setDestInput(place.address); setSelectedDest(place); setEstimate(computeEstimate(getPickupCoords(), place, cityFlatFare, outsideRatePerKm)); }
              }}
              style={{ padding: '4px 10px', background: 'rgba(255, 153, 0, 0.08)', border: '1px solid #FF9900', borderRadius: '10px', fontSize: '11px', fontWeight: 700, color: '#FF9900', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {w.name}
            </button>
          ))}
        </div>

        <label style={{ fontSize: '10px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {t.booking.destinationLabel}
        </label>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: selectedDest ? '#F0F7FF' : '#F8F8F8', border: `1.5px solid ${selectedDest ? '#93C5FD' : '#E5E5E5'}`, borderRadius: '16px', padding: '14px 16px' }}>
            {isLoadingPredictions && <Loader2 style={{ color: '#999', width: 16, height: 16, flexShrink: 0 }} className="animate-spin" />}
            <input type="text" value={destInput} onChange={(e) => handleDestInputChange(e.target.value)} placeholder={t.booking.destinationPlaceholder} style={inputStyle} />
            {destInput && <button onClick={clearDestination} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X style={{ color: '#999', width: 14, height: 14 }} /></button>}
          </div>

          {destPredictions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, background: '#fff', border: '1px solid #E5E5E5', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', marginTop: '6px', overflow: 'hidden' }}>
              {destPredictions.map((pred, i) => (
                <button key={pred.place_id} onClick={() => handleSelectDestination(pred)}
                  style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: 'none', border: 'none', borderBottom: i < destPredictions.length - 1 ? '1px solid #F0F0F0' : 'none', cursor: 'pointer', textAlign: isRTL ? 'right' : 'left' }}>
                  <span style={{ fontSize: '12px', color: '#222', fontWeight: 500, lineHeight: 1.4 }}>{pred.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Fare Estimate ── */}
      {(() => {
        const isBbaFixed = selectedDest ? checkBbaFixedRoute(getPickupCoords(), selectedDest) !== null : false;
        return (
          <div style={{
            background: isBbaFixed
              ? 'rgba(15, 23, 42, 0.04)'
              : estimate?.pricingType === 'DISTANCE'
              ? 'rgba(59, 130, 246, 0.06)'
              : 'rgba(255, 153, 0, 0.06)',
            border: `1.5px solid ${
              isBbaFixed
                ? '#CBD5E1'
                : estimate?.pricingType === 'DISTANCE'
                ? 'rgba(59, 130, 246, 0.25)'
                : 'rgba(255, 153, 0, 0.25)'
            }`,
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#333', margin: 0 }}>
                  {isEstimating ? t.booking.routeCalculation : isBbaFixed
                    ? (language === 'ar' ? 'تعريفة ثابتة لدائرة برج بوعريريج' : 'Tarif Fixe Daïra de BBA')
                    : estimate?.pricingType === 'DISTANCE'
                    ? (language === 'ar' ? `رحلة خارج المدينة (${estimate.distanceKm} كم)` : `Trajet hors-ville (${estimate.distanceKm} km)`)
                    : t.booking.cityFlatFareNotice}
                </p>
                <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>
                  {isEstimating ? (language === 'ar' ? 'يرجى الانتظار...' : 'Veuillez patienter')
                    : isBbaFixed
                    ? (language === 'ar' ? 'سعر رسمي محدد مسبقاً لهذه الوجهة' : 'Prix officiel forfaitaire garanti')
                    : estimate?.pricingType === 'DISTANCE'
                    ? (language === 'ar' ? `الوقت التقديري: ~${estimate.durationMinutes} دقيقة` : `Durée estimée: ~${estimate.durationMinutes} min`)
                    : t.booking.outsideCityFareNotice}
                </p>
              </div>
              <span style={{
                fontSize: '20px',
                fontWeight: 900,
                color: isBbaFixed ? '#0F172A' : estimate?.pricingType === 'DISTANCE' ? '#1D4ED8' : '#FF9900',
              }}>
                {isEstimating ? <Loader2 className="animate-spin w-4 h-4 text-[#888]" /> : `${totalPrice} ${t.common.currency}`}
              </span>
            </div>

            {/* Scheduled breakdown tags */}
            {bookingMode === 'scheduled' && (durationSurcharge > 0 || retourSurcharge > 0) && (
              <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '10px', color: '#64748B' }}>
                <span style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '6px' }}>
                  {language === 'ar' ? `أساس الرحلة: ${basePrice} دج` : `Base: ${basePrice} DA`}
                </span>
                {durationSurcharge > 0 && (
                  <span style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700, padding: '2px 6px', borderRadius: '6px' }}>
                    +{durationSurcharge} DA ({scheduledDuration === 'half' ? (language === 'ar' ? '< 6س' : '< 6h') : (language === 'ar' ? '≥ 6س' : '≥ 6h')})
                  </span>
                )}
                {retourSurcharge > 0 && (
                  <span style={{ background: '#FEF3C7', color: '#92400E', fontWeight: 700, padding: '2px 6px', borderRadius: '6px' }}>
                    +{retourSurcharge} DA ({language === 'ar' ? 'عودة' : 'Retour'})
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Confirm Button ── */}
      <button
        onClick={handleConfirm}
        disabled={createBookingMutation.isPending || isEstimating}
        style={{ background: createBookingMutation.isPending ? '#ccc' : '#111', color: '#fff', border: 'none', borderRadius: '30px', padding: '16px', fontSize: '14px', fontWeight: 700, cursor: createBookingMutation.isPending ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}
      >
        {createBookingMutation.isPending ? (<><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />{t.common.loading}</>) : t.booking.confirmBooking}
      </button>
    </div>
  );
}
