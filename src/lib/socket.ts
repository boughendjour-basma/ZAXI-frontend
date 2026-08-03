import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000';

let socketInstance: Socket | null = null;

// ─── Socket Events ───────────────────────────────────────────────────────────

export type SocketEvents = {
  // Booking lifecycle
  'booking:accepted': { bookingId: string; status: string };
  'booking:cancelled': { bookingId: string; status: string };
  'booking:started': { bookingId: string; status: string };
  'booking:completed': { bookingId: string; status: string };
  // Driver location
  'driver:location:update': {
    bookingId: string;
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
    accuracy?: number | null;
    updatedAt: string;
    lastSeen: string;
  };
  // Payments
  'payment:completed': {
    bookingId: string;
    paymentId: string;
    amount: number;
    paymentMethod: string;
    status: string;
    paidAt: string | null;
  };
  // Announcements
  'announcement:new': object;
  'announcement:updated': object;
  'announcement:removed': { id: string };
  // Driver info
  'driver:phone_available': { bookingId: string; phone: string };
};

// ─── Connect / Disconnect ────────────────────────────────────────────────────

export function connectSocket(): Socket {
  if (socketInstance?.connected) return socketInstance;

  const token = useAuthStore.getState().token;

  socketInstance = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ['websocket', 'polling'],
  });

  const { setSocket, setConnected } = useSocketStore.getState();

  socketInstance.on('connect', () => {
    console.log('[Socket] Connected:', socketInstance?.id);
    setConnected(true);
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    setConnected(false);
  });

  socketInstance.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
    setConnected(false);
  });

  setSocket(socketInstance);
  return socketInstance;
}

export function disconnectSocket(): void {
  socketInstance?.disconnect();
  socketInstance = null;
  useSocketStore.getState().clearSocket();
}

export function joinBookingRoom(bookingId: string): void {
  socketInstance?.emit('join:booking', bookingId);
}

export function getSocket(): Socket | null {
  return socketInstance;
}
