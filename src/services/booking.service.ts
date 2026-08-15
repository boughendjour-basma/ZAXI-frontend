import apiClient from '@/api/axios';
import type {
  Booking,
  BookingEstimate,
  BookingEstimateRequest,
  CreateBookingPayload,
  Rating,
  Payment,
} from '@/types/booking.types';
import type { ApiResponse } from '@/types/api.types';

export const BookingService = {
  /** Get price + distance estimate before booking */
  getEstimate: (data: BookingEstimateRequest) =>
    apiClient.post<BookingEstimate>('/bookings/estimate', data),

  /** Create a new booking */
  createBooking: (data: CreateBookingPayload) =>
    apiClient.post<ApiResponse<{ booking: Booking }>>('/bookings', data),

  /** Get all customer bookings */
  getMyBookings: () =>
    apiClient.get<ApiResponse<Booking[]>>('/bookings/my'),

  /** Get booking history with payments */
  getHistory: () =>
    apiClient.get<ApiResponse<Booking[]>>('/bookings/history'),

  /** Get a specific booking by ID */
  getBookingById: (id: string) =>
    apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`),

  /** Cancel a booking */
  cancelBooking: (id: string) =>
    apiClient.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`),

  /** Get driver's current location for a booking */
  getDriverLocation: (id: string) =>
    apiClient.get<ApiResponse<{ latitude: number; longitude: number; heading?: number }>>(`/bookings/${id}/location`),

  /** Submit payment for a completed booking */
  createPayment: (id: string, data: { paymentMethod: string }) =>
    apiClient.post<ApiResponse<Payment>>(`/bookings/${id}/payment`, data),

  /** Get payment details for a booking */
  getPayment: (id: string) =>
    apiClient.get<ApiResponse<Payment>>(`/bookings/${id}/payment`),

  /** Get payment receipt */
  getReceipt: (id: string) =>
    apiClient.get<ApiResponse<Payment>>(`/bookings/${id}/receipt`),

  /** Submit a rating for a completed booking */
  createRating: (id: string, data: { score: number; comment?: string }) =>
    apiClient.post<ApiResponse<Rating>>(`/bookings/${id}/rating`, data),

  /** Get rating for a booking */
  getRating: (id: string) =>
    apiClient.get<ApiResponse<Rating>>(`/bookings/${id}/rating`),
};
