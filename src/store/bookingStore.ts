import { create } from 'zustand';
import type { Booking, BookingStatus } from '@/types/booking.types';

interface BookingState {
  currentBooking: Booking | null;
  status: BookingStatus | null;
  // Actions
  setCurrentBooking: (booking: Booking | null) => void;
  updateStatus: (status: BookingStatus) => void;
  clearBooking: () => void;
}

// NOT persisted — reloads from backend on session restore
export const useBookingStore = create<BookingState>()((set) => ({
  currentBooking: null,
  status: null,

  setCurrentBooking: (booking) =>
    set({ currentBooking: booking, status: booking?.status ?? null }),

  updateStatus: (status) =>
    set((state) => ({
      status,
      currentBooking: state.currentBooking
        ? { ...state.currentBooking, status }
        : null,
    })),

  clearBooking: () => set({ currentBooking: null, status: null }),
}));
