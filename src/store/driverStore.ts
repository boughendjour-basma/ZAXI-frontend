import { create } from 'zustand';

interface DriverState {
  isOnline: boolean;
  currentRideId: string | null;
  // Actions
  setOnline: (online: boolean) => void;
  setCurrentRide: (rideId: string | null) => void;
  clear: () => void;
}

// NOT persisted — reloads from backend
export const useDriverStore = create<DriverState>()((set) => ({
  isOnline: false,
  currentRideId: null,

  setOnline: (isOnline) => set({ isOnline }),
  setCurrentRide: (currentRideId) => set({ currentRideId }),
  clear: () => set({ isOnline: false, currentRideId: null }),
}));
