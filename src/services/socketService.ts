/**
 * Socket.IO wrapper for real-time booking/location updates.
 * Connect after login using the JWT access token (docs/API.md).
 *
 * Install later when enabling live tracking:
 *   npx expo install socket.io-client
 *
 * This module is intentionally lightweight so the app runs without the package
 * until you are ready for Phase 6 realtime features.
 */
import { AppConfig } from '@/constants/config';
import { getAccessToken } from '@/services/apiClient';

type Handler = (payload: unknown) => void;

class SocketService {
  private connected = false;

  async connect(): Promise<void> {
    const token = await getAccessToken();
    if (!token) return;
    // Real socket.io-client wiring goes here when the dependency is added.
    // Endpoint: AppConfig.socketUrl with auth: { token }
    this.connected = Boolean(AppConfig.socketUrl && token);
  }

  disconnect(): void {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  joinBooking(_bookingId: string): void {}
  leaveBooking(_bookingId: string): void {}
  emitLocationUpdate(_payload: {
    bookingId: string;
    latitude: number;
    longitude: number;
  }): void {}
  emitBookingAction(_payload: { bookingId: string; action: string }): void {}
  on(_event: string, _handler: Handler): void {}
  off(_event: string, _handler?: Handler): void {}
}

export const socketService = new SocketService();
