import type { BookingStatus, CategoryId, GeoLocation, User, UserRole } from '@/types';

/** Raw shapes from the live Render API (docs/API.md). */
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole | 'admin';
  profile_image?: string | null;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function mapApiUser(api: ApiUser): User {
  return {
    id: api.id,
    fullName: api.name,
    email: api.email,
    phone: api.phone ?? '',
    passwordHash: '',
    role: api.role,
    avatarUri: api.profile_image ?? undefined,
    isVerified: true,
    createdAt: api.createdAt ?? new Date().toISOString(),
  };
}

export function mapApiBookingStatus(status: string): BookingStatus {
  const key = status.toLowerCase().replace(/_/g, '-');
  switch (key) {
    case 'pending':
      return 'waiting_for_provider';
    case 'accepted':
      return 'accepted';
    case 'in-progress':
    case 'in_progress':
      return 'in_progress';
    case 'completed':
    case 'paid':
      return 'completed';
    case 'rejected':
    case 'expired':
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'on-the-way':
    case 'on_the_way':
      return 'on_the_way';
    case 'arrived':
      return 'arrived';
    default:
      return 'waiting_for_provider';
  }
}

export function toApiBookingStatus(status: BookingStatus): string {
  switch (status) {
    case 'request_sent':
    case 'waiting_for_provider':
      return 'pending';
    case 'accepted':
      return 'accepted';
    case 'on_the_way':
    case 'arrived':
    case 'in_progress':
      return 'in-progress';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

export function guessCategoryId(name?: string | null): CategoryId {
  const n = (name ?? '').toLowerCase();
  if (/(beauty|hair|nail|makeup|cosmetic|braid)/.test(n)) return 'beauty';
  if (/(clean|maid|garden|laundry|carpet)/.test(n)) return 'cleaning';
  if (/(repair|plumb|electric|phone|laptop|ac |fridge|appliance)/.test(n)) return 'repair';
  return 'repair';
}

export function geoFromLatLng(
  lat?: number | null,
  lng?: number | null,
  address?: string | null,
): GeoLocation {
  return {
    latitude: lat ?? -15.4167,
    longitude: lng ?? 28.2833,
    address: address?.trim() || 'Location not set',
  };
}
