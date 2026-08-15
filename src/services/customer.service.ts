import apiClient from '@/api/axios';
import type { User } from '@/types/auth.types';
import type { Booking } from '@/types/booking.types';
import type { ApiResponse } from '@/types/api.types';

export interface CustomerProfile extends User {
  phone: string;
}

export const CustomerService = {
  // ─── Profile ───────────────────────────────────────────────────────────────

  getProfile: () =>
    apiClient.get<ApiResponse<{ user: CustomerProfile; customer?: CustomerProfile }>>('/customers/me'),

  updateProfile: (data: { name?: string }) =>
    apiClient.patch<ApiResponse<{ user: CustomerProfile; customer?: CustomerProfile }>>('/customers/me', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.patch<ApiResponse<null>>('/customers/me/password', data),

  // ─── Bookings ──────────────────────────────────────────────────────────────

  getMyBookings: () =>
    apiClient.get<ApiResponse<Booking[]>>('/customers/bookings'),

  getBookingById: (id: string) =>
    apiClient.get<ApiResponse<Booking>>(`/customers/bookings/${id}`),

  cancelBooking: (id: string) =>
    apiClient.patch<ApiResponse<Booking>>(`/customers/bookings/${id}/cancel`),
};
