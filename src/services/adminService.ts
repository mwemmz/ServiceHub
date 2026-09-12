import { api } from '@/services/apiClient';
import { mapApiBookingStatus } from '@/services/apiMappers';
import type { BookingStatus } from '@/types';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  profile_image?: string;
  is_active?: boolean;
  createdAt?: string;
}

export interface AdminProvider {
  id: string;
  userId: string;
  business_name: string;
  category: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  is_online?: boolean;
  created_at?: string;
  user: AdminUser;
}

export interface AdminBooking {
  id: string;
  status: string;
  scheduled_at?: string;
  created_at?: string;
  updated_at?: string;
  customer?: AdminUser;
  provider?: { user?: AdminUser };
  service?: { name: string; category?: string };
  payment?: { amount: number };
}

export interface AdminAnalytics {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  totalProviders: number;
  recentBookings: AdminBooking[];
}

export interface BookingTrend {
  date: string;
  count: number;
}

export interface ProviderPerf {
  id: string;
  business_name: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  user: AdminUser;
}

export interface AdminReport {
  bookingTrends: BookingTrend[];
  providerPerformance: ProviderPerf[];
}

interface Paged<T> {
  pagination: { total: number; currentPage: number; totalPages: number; limit: number };
  items: T[];
}

function qs(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v));
  }
  return q.toString();
}

export async function getUsers(params: {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<Paged<AdminUser>> {
  const data = await api.get<{ users?: AdminUser[]; pagination: any }>(
    `/admin/users?${qs(params)}`,
  );
  return { items: data.users ?? [], pagination: data.pagination };
}

export async function getProviders(params: {
  is_verified?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<Paged<AdminProvider>> {
  const data = await api.get<{ providers?: AdminProvider[]; pagination: any }>(
    `/admin/providers?${qs(params)}`,
  );
  return { items: data.providers ?? [], pagination: data.pagination };
}

export async function verifyProvider(providerId: string): Promise<void> {
  await api.put(`/admin/providers/${providerId}/verify`, {});
}

export async function getBookings(params: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<Paged<AdminBooking>> {
  const data = await api.get<{ bookings?: AdminBooking[]; pagination: any }>(
    `/admin/bookings?${qs(params)}`,
  );
  return { items: data.bookings ?? [], pagination: data.pagination };
}

export async function getAnalytics(): Promise<AdminAnalytics> {
  return api.get<AdminAnalytics>('/admin/analytics');
}

export async function getReports(): Promise<AdminReport> {
  return api.get<AdminReport>('/admin/reports');
}

export function mapRawStatus(status: string): BookingStatus {
  return mapApiBookingStatus(status);
}

export function rawStatusLabel(status: string) {
  return status
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const RAW_STATUSES = [
  'pending',
  'accepted',
  'in-progress',
  'completed',
  'cancelled',
] as const;
