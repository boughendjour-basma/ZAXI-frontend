import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { connectSocket, disconnectSocket, joinBookingRoom } from '@/lib/socket';
import type { SocketEvents } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

type EventCallback<K extends keyof SocketEvents> = (data: SocketEvents[K]) => void;

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { socket, isConnected } = useSocketStore();

  // Connect when authenticated, disconnect on logout
  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  /** Subscribe to a socket event, auto-cleanup on unmount */
  function useSocketEvent<K extends keyof SocketEvents>(
    event: K,
    callback: EventCallback<K>,
  ) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
      if (!socket) return;

      const handler = (data: SocketEvents[K]) => callbackRef.current(data);
      (socket as Socket).on(event as string, handler as (...args: unknown[]) => void);
      return () => {
        (socket as Socket).off(event as string, handler as (...args: unknown[]) => void);
      };
    }, [socket, event]);
  }

  return {
    socket,
    isConnected,
    joinBookingRoom,
    useSocketEvent,
  };
}
