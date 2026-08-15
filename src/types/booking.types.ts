// ─── Booking Status ───────────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'DRIVER_ARRIVING'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

// ─── Location ─────────────────────────────────────────────────────────────────

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

// ─── Estimate ─────────────────────────────────────────────────────────────────

export interface BookingEstimateRequest {
  pickup: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
}

export interface BookingEstimate {
  pricingType: 'CITY' | 'DISTANCE';
  distanceKm: number;
  durationMinutes: number;
  ratePerKm: number | null;
  estimatedPrice: number;
}

export interface CreateBookingPayload {
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  scheduledAt?: string;
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  customerId: string;
  driverId?: string | null;
  status: BookingStatus;
  pickupLat?: number;
  pickupLng?: number;
  pickupLatitude?: number;
  pickupLongitude?: number;
  pickupAddress?: string | null;
  dropoffLat?: number;
  dropoffLng?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  dropoffAddress?: string | null;
  destinationAddress?: string | null;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  estimatedPrice?: number | null;
  finalPrice?: number | null;
  pricingType?: 'CITY' | 'DISTANCE';
  customer?: {
    id?: string;
    name?: string;
    phone?: string | null;
  } | null;
  driver?: {
    id: string;
    name: string;
    phone?: string | null;
    profilePhoto?: string | null;
  } | null;
  payment?: {
    id: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    paidAt?: string | null;
  } | null;
  rating?: {
    id: string;
    score: number;
    comment?: string | null;
    createdAt?: string;
  } | null;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// ─── Driver Location ─────────────────────────────────────────────────────────

export interface DriverLocation {
  bookingId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  updatedAt: string;
  lastSeen: string;
}

// ─── Rating ──────────────────────────────────────────────────────────────────

export interface Rating {
  id: string;
  bookingId: string;
  score: number;
  comment?: string | null;
  createdAt: string;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string | null;
  createdAt: string;
}
