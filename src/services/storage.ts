import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();

export async function getJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeJson(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function getSecure(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memoryStore.get(key) ?? (await AsyncStorage.getItem(`secure:${key}`));
  }
  return SecureStore.getItemAsync(key);
}

export async function setSecure(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore.set(key, value);
    await AsyncStorage.setItem(`secure:${key}`, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecure(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStore.delete(key);
    await AsyncStorage.removeItem(`secure:${key}`);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const StorageKeys = {
  users: 'servicehub.users',
  providers: 'servicehub.providers',
  bookings: 'servicehub.bookings',
  reviews: 'servicehub.reviews',
  notifications: 'servicehub.notifications',
  messages: 'servicehub.messages',
  favourites: 'servicehub.favourites',
  conversations: 'servicehub.conversations',
  payments: 'servicehub.payments',
  session: 'servicehub.session',
  accessToken: 'servicehub.accessToken',
  refreshToken: 'servicehub.refreshToken',
  cachedUser: 'servicehub.cachedUser',
  onboarded: 'servicehub.onboarded',
  resetCodes: 'servicehub.resetCodes',
  verifyCodes: 'servicehub.verifyCodes',
  seeded: 'servicehub.seeded',
  providerApplications: 'servicehub.providerApplications',
  draftCustomerRegistration: 'servicehub.draft.customerRegistration',
  /** @deprecated migrated into individual/business keys */
  draftProviderRegistration: 'servicehub.draft.providerRegistration',
  draftProviderRegistrationIndividual: 'servicehub.draft.providerRegistration.individual',
  draftProviderRegistrationBusiness: 'servicehub.draft.providerRegistration.business',
  draftServiceRequest: 'servicehub.draft.serviceRequest',
  draftLogin: 'servicehub.draft.login',
  draftBooking: 'servicehub.draft.booking',
  draftProviderSetup: 'servicehub.draft.providerSetup',
  draftProviderAvailability: 'servicehub.draft.providerAvailability',
  draftSettings: 'servicehub.draft.settings',
} as const;
