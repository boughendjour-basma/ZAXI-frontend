import { create } from 'zustand';
import type { Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  // Actions
  setSocket: (socket: Socket) => void;
  setConnected: (connected: boolean) => void;
  clearSocket: () => void;
}

// NOT persisted — socket reconnects on page load
export const useSocketStore = create<SocketState>()((set) => ({
  socket: null,
  isConnected: false,

  setSocket: (socket) => set({ socket }),
  setConnected: (isConnected) => set({ isConnected }),
  clearSocket: () => set({ socket: null, isConnected: false }),
}));
