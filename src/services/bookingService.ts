import { api } from '@/services/apiClient';
import { geoFromLatLng, mapApiBookingStatus, toApiBookingStatus } from '@/services/apiMappers';
import { getService } from '@/services/catalogService';
import { calculatePrice } from '@/utils/format';
import type { Booking, BookingStatus, GeoLocation } from '@/types';

export interface CreateBookingInput {
  customerId: string;
  providerId: string;
  serviceId: string;
  scheduledAt: string;
  notes: string;
  location: GeoLocation;
}

interface ApiBooking {
  id: string;
  customer_id?: string;
  provider_id?: string;
  service_id?: string;
  status?: string;
  booking_time?: string;
  notes?: string;
  total_amount?: number;
  address?: string;
  location_lat?: number;
  location_lng?: number;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

const ACTIVE_STATUSES: BookingStatus[] = [
  'request_sent',
  'waiting_for_provider',
  'accepted',
  'on_the_way',
  'arrived',
  'in_progress',
];

function mapBooking(item: ApiBooking): Booking {
  const base = Number(item.total_amount ?? 0);
  const price = base > 0 ? calculatePrice(Math.round(base / 1.25) || base) : calculatePrice(0);
  if (base > 0) price.total = base;

  return {
    id: item.id,
    customerId: item.customer_id ?? '',
    providerId: item.provider_id ?? '',
    serviceId: item.service_id ?? '',
    status: mapApiBookingStatus(item.status ?? 'pending'),
    scheduledAt: item.booking_time ?? item.createdAt ?? new Date().toISOString(),
    notes: item.notes ?? '',
    price,
    location: geoFromLatLng(item.location_lat, item.location_lng, item.address),
    createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.updated_at ?? new Date().toISOString(),
  };
}

function unwrapList(data: unknown): ApiBooking[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.bookings)) return obj.bookings as ApiBooking[];
    if (Array.isArray(obj.data)) return obj.data as ApiBooking[];
  }
  return [];
}

export async function getBookings(): Promise<Booking[]> {
  try {
    const data = await api.get<unknown>('/bookings');
    return unwrapList(data)
      .map(mapBooking)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  } catch {
    const { getStoredBookings } = await import('@/services/localDb');
    const bookings = await getStoredBookings();
    return bookings.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
  try {
    const data = await api.get<{ booking?: ApiBooking } | ApiBooking>(`/bookings/${id}`);
    const item =
      data && typeof data === 'object' && 'booking' in data
        ? (data as { booking?: ApiBooking }).booking
        : (data as ApiBooking);
    if (item?.id) return mapBooking(item);
  } catch {
    // fall through
  }
  const all = await getBookings();
  return all.find((item) => item.id === id);
}

export async function getBookingsForUser(userId: string, role: 'customer' | 'provider'): Promise<Booking[]> {
  try {
    const path =
      role === 'customer' ? `/bookings/customer/${userId}` : `/bookings/provider/${userId}`;
    const data = await api.get<unknown>(path);
    const list = unwrapList(data).map(mapBooking);
    if (list.length > 0) return list;
  } catch {
    // fall through to /bookings
  }
  const bookings = await getBookings();
  return bookings.filter((item) =>
    role === 'customer' ? item.customerId === userId : item.providerId === userId,
  );
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const service = await getService(input.serviceId);
  try {
    const data = await api.post<{ booking?: ApiBooking } | ApiBooking>('/bookings', {
      provider_id: input.providerId,
      service_id: input.serviceId,
      booking_time: input.scheduledAt,
      address: input.location.address,
      notes: input.notes,
      location_lat: input.location.latitude,
      location_lng: input.location.longitude,
    });
    const item =
      data && typeof data === 'object' && 'booking' in data
        ? (data as { booking?: ApiBooking }).booking
        : (data as ApiBooking);
    if (item?.id) return mapBooking(item);
  } catch (err) {
    // If provider/service IDs are local mock IDs, API will fail — keep local booking so UI flow works.
    const message = err instanceof Error ? err.message : '';
    if (!/not found|invalid|foreign|uuid/i.test(message) && service) {
      // still try local below
    }
  }

  const { getStoredBookings, saveBookings } = await import('@/services/localDb');
  const { createId } = await import('@/utils/id');
  const base = service?.startingPrice ?? 100;
  const booking: Booking = {
    id: createId('booking'),
    customerId: input.customerId,
    providerId: input.providerId,
    serviceId: input.serviceId,
    status: 'waiting_for_provider',
    scheduledAt: input.scheduledAt,
    notes: input.notes,
    price: calculatePrice(base),
    location: input.location,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const bookings = await getStoredBookings();
  await saveBookings([booking, ...bookings]);
  return booking;
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  cancelReason?: string,
): Promise<Booking> {
  if (status === 'cancelled') {
    try {
      await api.put(`/bookings/${bookingId}/cancel`, { reason: cancelReason });
      const updated = await getBookingById(bookingId);
      if (updated) return updated;
    } catch {
      // fall through
    }
  } else {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: toApiBookingStatus(status) });
      const updated = await getBookingById(bookingId);
      if (updated) return { ...updated, status };
    } catch {
      // fall through
    }
  }

  const { getStoredBookings, saveBookings } = await import('@/services/localDb');
  const bookings = await getStoredBookings();
  const index = bookings.findIndex((item) => item.id === bookingId);
  if (index < 0) throw new Error('Booking not found.');
  bookings[index] = {
    ...bookings[index],
    status,
    cancelReason,
    updatedAt: new Date().toISOString(),
  };
  await saveBookings(bookings);
  return bookings[index];
}

export function isActiveStatus(status: BookingStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}
