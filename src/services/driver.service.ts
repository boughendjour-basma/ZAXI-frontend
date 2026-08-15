import apiClient from '@/api/axios';
import type { Booking } from '@/types/booking.types';
import type { ApiResponse } from '@/types/api.types';

export interface DriverProfile {
  id: string;
  name: string | null;
  driverName?: string | null;
  phone: string;
  phoneNumber?: string | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleColor?: string | null;
  vehiclePlate?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  rating?: number | null;
  isOnline?: boolean;
  workingHours?: string | null;
  description?: string | null;
}

export interface DriverPricing {
  cityFlatFare: number;
  outsideRatePerKm: number;
  // Legacy compatibility fields
  baseFare?: number;
  perKmRate?: number;
  perMinuteRate?: number;
  minimumFare?: number;
  currency?: string;
}

export interface DriverEarnings {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  currency: string;
}

export interface Announcement {
  id: string;
  driverId?: string;
  title: string;
  description: string;
  category: 'AIRPORT' | 'BEACH' | 'TOUR' | 'SPECIAL_OFFER' | 'OTHER';
  price?: number | null;
  image?: string | null;
  departureLocation?: string | null;
  destinationLocation?: string | null;
  availableDate?: string | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const DriverService = {
  // ─── Profile ───────────────────────────────────────────────────────────────

  getProfile: () =>
    apiClient.get<ApiResponse<{ driver: DriverProfile }>>('/driver/profile'),

  updateProfile: (data: Partial<DriverProfile>) =>
    apiClient.patch<ApiResponse<{ driver: DriverProfile }>>('/driver/profile', data),

  getPublicProfile: () =>
    apiClient.get<ApiResponse<{ driver: DriverProfile }>>('/public/driver-profile'),

  setAvailability: (isOnline: boolean) =>
    apiClient.patch<ApiResponse<{ isOnline: boolean }>>('/driver/availability', { isOnline }),

  // ─── Pricing ───────────────────────────────────────────────────────────────

  getPricing: () =>
    apiClient.get<ApiResponse<DriverPricing>>('/driver/pricing'),

  updatePricing: (data: { cityFlatFare?: number; outsideRatePerKm?: number }) =>
    apiClient.patch<ApiResponse<DriverPricing>>('/driver/pricing', data),

  // ─── Earnings ──────────────────────────────────────────────────────────────

  getEarnings: () =>
    apiClient.get<ApiResponse<DriverEarnings>>('/driver/earnings'),

  // ─── Bookings (Driver view) ────────────────────────────────────────────────

  getBookings: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Booking[]>>('/driver/bookings', { params }),

  getBookingById: (id: string) =>
    apiClient.get<ApiResponse<Booking>>(`/driver/bookings/${id}`),

  acceptBooking: (id: string) =>
    apiClient.patch<ApiResponse<Booking>>(`/driver/bookings/${id}/accept`),

  rejectBooking: (id: string) =>
    apiClient.patch<ApiResponse<Booking>>(`/driver/bookings/${id}/reject`),

  startRide: (id: string) =>
    apiClient.patch<ApiResponse<Booking>>(`/driver/bookings/${id}/start`),

  completeRide: (id: string) =>
    apiClient.patch<ApiResponse<Booking>>(`/driver/bookings/${id}/complete`),

  updateBookingStatus: (id: string, status: string) =>
    apiClient.patch<ApiResponse<Booking>>(`/driver/bookings/${id}/status`, { status }),

  updateLocation: (id: string, data: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
  }) =>
    apiClient.patch<ApiResponse<null>>(`/driver/bookings/${id}/location`, data),

  // ─── Announcements ─────────────────────────────────────────────────────────

  createAnnouncement: (data: {
    title: string;
    description: string;
    category: 'AIRPORT' | 'BEACH' | 'TOUR' | 'SPECIAL_OFFER' | 'OTHER';
    price?: number;
    departureLocation?: string;
    destinationLocation?: string;
  }) =>
    apiClient.post<ApiResponse<Announcement>>('/driver/announcements', data),

  updateAnnouncement: (id: string, data: {
    title?: string;
    description?: string;
    category?: 'AIRPORT' | 'BEACH' | 'TOUR' | 'SPECIAL_OFFER' | 'OTHER';
    price?: number;
    departureLocation?: string;
    destinationLocation?: string;
  }) =>
    apiClient.patch<ApiResponse<Announcement>>(`/driver/announcements/${id}`, data),

  deleteAnnouncement: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/driver/announcements/${id}`),

  getPublicAnnouncements: (params?: { category?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Announcement[]>>('/public/announcements', { params }),

  // ─── Management ────────────────────────────────────────────────────────────

  getStatistics: () =>
    apiClient.get<ApiResponse<object>>('/driver/statistics'),

  getCustomers: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<object[]>>('/driver/customers', { params }),

  getBookingsManagement: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<ApiResponse<Booking[]>>('/driver/bookings-management', { params }),

  getAuditLogs: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<object[]>>('/driver/audit-logs', { params }),
};
