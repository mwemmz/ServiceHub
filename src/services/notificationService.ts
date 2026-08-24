import { api } from '@/services/apiClient';
import type { AppNotification } from '@/types';

interface ApiNotification {
  id: string;
  user_id?: string;
  title?: string;
  body?: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
  created_at?: string;
  booking_id?: string;
}

function mapNotification(item: ApiNotification, userId: string): AppNotification {
  return {
    id: item.id,
    userId: item.user_id ?? userId,
    title: item.title ?? 'Notification',
    body: item.body ?? '',
    type: 'general',
    read: Boolean(item.read),
    createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
    bookingId: item.booking_id,
  };
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const data = await api.get<{ notifications?: ApiNotification[] } | ApiNotification[]>('/notifications');
    const list = Array.isArray(data) ? data : data.notifications ?? [];
    return list
      .map((item) => mapNotification(item, userId))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  } catch {
    const { getStoredNotifications } = await import('@/services/localDb');
    const items = await getStoredNotifications();
    return items
      .filter((item) => item.userId === userId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
}

export async function addNotification(
  input: Omit<AppNotification, 'id' | 'read' | 'createdAt'> & { read?: boolean },
): Promise<void> {
  // Notifications are created by the backend; keep local helper for offline demos.
  const { getStoredNotifications, saveNotifications } = await import('@/services/localDb');
  const { createId } = await import('@/utils/id');
  const items = await getStoredNotifications();
  await saveNotifications([
    {
      ...input,
      id: createId('notif'),
      read: input.read ?? false,
      createdAt: new Date().toISOString(),
    },
    ...items,
  ]);
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await api.put(`/notifications/${id}/read`, {});
  } catch {
    const { getStoredNotifications, saveNotifications } = await import('@/services/localDb');
    const items = await getStoredNotifications();
    await saveNotifications(items.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }
}

export async function markAllRead(userId: string): Promise<void> {
  try {
    await api.put('/notifications/read-all', {});
  } catch {
    const { getStoredNotifications, saveNotifications } = await import('@/services/localDb');
    const items = await getStoredNotifications();
    await saveNotifications(
      items.map((item) => (item.userId === userId ? { ...item, read: true } : item)),
    );
  }
}
