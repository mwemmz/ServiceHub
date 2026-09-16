/**
 * Socket.IO wrapper for real-time booking/status updates.
 * Connect after login using the JWT access token, then subscribe to events like
 * `new-booking` and `booking-status-update` to keep screens live.
 */
import { io, type Socket } from 'socket.io-client';
import { AppConfig } from '@/constants/config';
import { getAccessToken } from '@/services/apiClient';

type Handler = (payload?: unknown) => void;

class SocketService {
  private socket: Socket | null = null;
  private handlers = new Map<string, Set<Handler>>();
  private connected = false;

  /** Connect (idempotent) using the stored access token. */
  async connect(): Promise<void> {
    if (this.socket) return;
    const token = await getAccessToken();
    if (!token) return;
    this.socket = io(AppConfig.socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      timeout: 15000,
    });
    this.socket.on('connect', () => {
      this.connected = true;
      this.dispatch('connect');
    });
    this.socket.on('disconnect', () => {
      this.connected = false;
      this.dispatch('disconnect');
    });
    this.socket.onAny((event, payload) => this.dispatch(event, payload));
  }

  disconnect(): void {
    this.connected = false;
    this.socket?.disconnect();
    this.socket = null;
    this.handlers.clear();
  }

  isConnected(): boolean {
    return this.connected;
  }

  on(event: string, handler: Handler): void {
    const set = this.handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    this.handlers.set(event, set);
  }

  off(event: string, handler?: Handler): void {
    if (!handler) {
      this.handlers.delete(event);
      return;
    }
    this.handlers.get(event)?.delete(handler);
  }

  joinBooking(bookingId: string): void {
    this.socket?.emit('join-booking', bookingId);
  }

  leaveBooking(bookingId: string): void {
    this.socket?.emit('leave-booking', bookingId);
  }

  emitLocationUpdate(payload: {
    bookingId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    isAccurate?: boolean;
  }): void {
    this.socket?.emit('location-update', payload);
  }

  emitBookingAction(payload: { bookingId: string; action: string }): void {
    this.socket?.emit('booking-action', payload);
  }

  private dispatch(event: string, payload?: unknown): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(payload);
      } catch {
        // A bad handler must never break the socket event loop.
      }
    });
  }
}

export const socketService = new SocketService();