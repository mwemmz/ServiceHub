import {
  DEMO_PASSWORD,
  SEED_BOOKINGS,
  SEED_MESSAGES,
  SEED_NOTIFICATIONS,
  SEED_PROVIDERS,
  SEED_REVIEWS,
  SEED_USERS,
} from '@/data/seed';
import { getJson, setJson, StorageKeys } from '@/services/storage';
import { hashPassword } from '@/services/crypto';
import type { AppNotification, Booking, ChatMessage, ProviderProfile, Review, User } from '@/types';

let readyPromise: Promise<void> | null = null;

export function ensureLocalData(): Promise<void> {
  if (!readyPromise) {
    readyPromise = seedIfNeeded();
  }
  return readyPromise;
}

async function seedIfNeeded(): Promise<void> {
  const alreadySeeded = await getJson<boolean>(StorageKeys.seeded);
  if (alreadySeeded) return;

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const users: User[] = SEED_USERS.map((user) => ({ ...user, passwordHash }));

  await setJson(StorageKeys.users, users);
  await setJson(StorageKeys.providers, SEED_PROVIDERS);
  await setJson(StorageKeys.bookings, SEED_BOOKINGS);
  await setJson(StorageKeys.reviews, SEED_REVIEWS);
  await setJson(StorageKeys.notifications, SEED_NOTIFICATIONS);
  await setJson(StorageKeys.messages, SEED_MESSAGES);
  await setJson(StorageKeys.payments, []);
  await setJson(StorageKeys.seeded, true);
}

export async function getUsers(): Promise<User[]> {
  await ensureLocalData();
  return (await getJson<User[]>(StorageKeys.users)) ?? [];
}

export async function saveUsers(users: User[]): Promise<void> {
  await setJson(StorageKeys.users, users);
}

export async function getProviderProfiles(): Promise<ProviderProfile[]> {
  await ensureLocalData();
  return (await getJson<ProviderProfile[]>(StorageKeys.providers)) ?? [];
}

export async function saveProviderProfiles(profiles: ProviderProfile[]): Promise<void> {
  await setJson(StorageKeys.providers, profiles);
}

export async function getStoredBookings(): Promise<Booking[]> {
  await ensureLocalData();
  return (await getJson<Booking[]>(StorageKeys.bookings)) ?? [];
}

export async function saveBookings(bookings: Booking[]): Promise<void> {
  await setJson(StorageKeys.bookings, bookings);
}

export async function getStoredReviews(): Promise<Review[]> {
  await ensureLocalData();
  return (await getJson<Review[]>(StorageKeys.reviews)) ?? [];
}

export async function saveReviews(reviews: Review[]): Promise<void> {
  await setJson(StorageKeys.reviews, reviews);
}

export async function getStoredNotifications(): Promise<AppNotification[]> {
  await ensureLocalData();
  return (await getJson<AppNotification[]>(StorageKeys.notifications)) ?? [];
}

export async function saveNotifications(items: AppNotification[]): Promise<void> {
  await setJson(StorageKeys.notifications, items);
}

export async function getStoredMessages(): Promise<ChatMessage[]> {
  await ensureLocalData();
  return (await getJson<ChatMessage[]>(StorageKeys.messages)) ?? [];
}

export async function saveMessages(items: ChatMessage[]): Promise<void> {
  await setJson(StorageKeys.messages, items);
}
