import { api } from '@/services/apiClient';
import { geoFromLatLng, mapApiBookingStatus, toApiBookingStatus } from '@/services/apiMappers';
import { getService, isBackendUuid } from '@/services/catalogService';
import { calculatePrice } from '@/utils/format';
import type { Booking, BookingStatus, GeoLocation, WorkHistorySummary } from '@/types';

export interface CreateBookingInput {
  customerId: string;
  providerId: string;
  serviceId: string;
  scheduledAt: string;
  notes: string;
  location: GeoLocation;
  /** Optional crew (must belong to the chosen provider). */
  crewId?: string;
}

export interface WorkHistoryResult {
  summary: WorkHistorySummary;
  bookings: Booking[];
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
  is_confirmed?: boolean;
  crew_id?: string;
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
    isConfirmed: Boolean(item.is_confirmed),
    crewId: item.crew_id ?? undefined,
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
  if (isBackendUuid(id)) {
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

/** Feature 2 — Confirmed Work History: only bookings marked is_confirmed count. */
export async function getWorkHistory(userId: string): Promise<WorkHistoryResult> {
  const data = await api.get<unknown>(`/bookings/provider/${userId}/work-history`);
  const obj = (data && typeof data === 'object' ? data : {}) as {
    summary?: WorkHistorySummary;
    bookings?: ApiBooking[];
  };
  return {
    summary: obj.summary ?? { confirmedJobs: 0, totalEarned: 0, totalJobs: 0 },
    bookings: (obj.bookings ?? []).map(mapBooking),
  };
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const service = await getService(input.serviceId);
  // Only real backend bookings (UUID provider + service) go to the API. Local
  // demo ids like "repair-plumbing"/"pending_match" stay in local storage so we
  // never spray garbage ids at the live backend.
  if (isBackendUuid(input.providerId) && isBackendUuid(input.serviceId)) {
    try {
      const data = await api.post<{ booking?: ApiBooking } | ApiBooking>('/bookings', {
        provider_id: input.providerId,
        service_id: input.serviceId,
        booking_time: input.scheduledAt,
        address: input.location.address,
        notes: input.notes,
        location_lat: input.location.latitude,
        location_lng: input.location.longitude,
        crew_id: input.crewId || undefined,
      });
      const item =
        data && typeof data === 'object' && 'booking' in data
          ? (data as { booking?: ApiBooking }).booking
          : (data as ApiBooking);
      if (item?.id) return mapBooking(item);
    } catch (err) {
      throw new Error(
        err instanceof Error && err.message
          ? err.message
          : 'Could not reach the server. Please check your connection and try again.',
      );
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
  const apiBooking = isBackendUuid(bookingId);
  if (status === 'cancelled' && apiBooking) {
    try {
      await api.put(`/bookings/${bookingId}/cancel`, { reason: cancelReason });
      const updated = await getBookingById(bookingId);
      if (updated) return updated;
    } catch (err) {
      throw new Error(
        err instanceof Error && err.message
          ? err.message
          : 'Could not update the booking. Please check your connection and try again.',
      );
    }
  } else if (apiBooking) {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: toApiBookingStatus(status) });
      const updated = await getBookingById(bookingId);
      if (updated) return { ...updated, status };
    } catch (err) {
      throw new Error(
        err instanceof Error && err.message
          ? err.message
          : 'Could not update the booking. Please check your connection and try again.',
      );
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

/**
 * Re-book a past job: the API clones the provider/service/location into a new
 * pending booking (same customer). Returns the fresh booking.
 */
export async function rebookBooking(bookingId: string, scheduledAt?: string): Promise<Booking> {
  if (!isBackendUuid(bookingId)) {
    throw new Error('This demo booking was created locally and cannot be re-booked through the API.');
  }
  const bookingTime = scheduledAt ?? new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const data = await api.post<{ booking?: ApiBooking } | ApiBooking>(
    `/bookings/${bookingId}/rebook`,
    { booking_time: bookingTime },
  );
  const item =
    data && typeof data === 'object' && 'booking' in data
      ? (data as { booking?: ApiBooking }).booking
      : (data as ApiBooking);
  if (!item?.id) throw new Error('Failed to re-book.');
  return mapBooking(item);
}
