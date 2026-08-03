// ─── Booking Status ───────────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
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
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  pickupAddress?: string;
  dropoffAddress?: string;
}

export interface BookingEstimate {
  distanceKm: number;
  durationMinutes: number;
  estimatedPrice: number;
  currency: string;
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  customerId: string;
  driverId?: string | null;
  status: BookingStatus;
  pickupLat: number;
  pickupLng: number;
  pickupAddress?: string | null;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress?: string | null;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  estimatedPrice?: number | null;
  finalPrice?: number | null;
  createdAt: string;
  updatedAt: string;
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
