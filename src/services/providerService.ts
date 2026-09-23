import { WEEKLY_AVAILABILITY } from '@/data/seed';
import { AppConfig } from '@/constants/config';
import { api } from '@/services/apiClient';
import { geoFromLatLng, guessCategoryId } from '@/services/apiMappers';
import { getService, isBackendUuid } from '@/services/catalogService';
import { distanceKm } from '@/utils/geo';
import type { AvailabilitySlot, CategoryId, GeoLocation, ProviderProfile, ProviderSort, User } from '@/types';

/** Backend working_hours format: { "monday": [{ "start": "08:00", "end": "17:00" }], ... } */
type WorkingHours = Record<string, Array<{ start: string; end: string }>>;

const DAY_TO_BACKEND: Record<AvailabilitySlot['day'], string> = {
  mon: 'monday',
  tue: 'tuesday',
  wed: 'wednesday',
  thu: 'thursday',
  fri: 'friday',
  sat: 'saturday',
  sun: 'sunday',
};

/** Convert the mobile availability list into the backend working_hours JSONB shape. */
function toWorkingHours(availability: AvailabilitySlot[]): WorkingHours {
  const out: WorkingHours = {};
  for (const slot of availability) {
    if (!slot.enabled || !slot.start || !slot.end) continue;
    out[DAY_TO_BACKEND[slot.day]] = [{ start: slot.start, end: slot.end }];
  }
  return out;
}

/** Read backend working_hours back into the mobile availability list. */
function fromWorkingHours(workingHours?: WorkingHours | null): AvailabilitySlot[] {
  return WEEKLY_AVAILABILITY.map((slot) => {
    const ranges = workingHours?.[DAY_TO_BACKEND[slot.day]];
    if (!Array.isArray(ranges) || ranges.length === 0) {
      return { ...slot, enabled: false };
    }
    return {
      ...slot,
      enabled: true,
      start: ranges[0]?.start || slot.start,
      end: ranges[0]?.end || slot.end,
    };
  });
}

export interface ProviderListItem {
  user: User;
  profile: ProviderProfile;
  distanceKm?: number;
  price?: number;
  etaMinutes?: number;
}

interface ApiProvider {
  id: string;
  user_id?: string;
  business_name?: string;
  description?: string;
  category?: string;
  is_verified?: boolean;
  is_online?: boolean;
  rating?: number;
  location_lat?: number;
  location_lng?: number;
  service_radius?: number;
  working_hours?: WorkingHours | null;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    profile_image?: string | null;
  };
  services?: Array<{
    id: string;
    name?: string;
    price?: number;
    duration?: number;
  }>;
}

function mapProvider(item: ApiProvider): ProviderListItem {
  const userId = item.user_id || item.user?.id || item.id;
  const name = item.user?.name || item.business_name || 'Provider';
  const user: User = {
    id: userId,
    fullName: name,
    email: item.user?.email ?? '',
    phone: item.user?.phone ?? '',
    passwordHash: '',
    role: 'provider',
    avatarUri: item.user?.profile_image ?? undefined,
    isVerified: Boolean(item.is_verified),
    createdAt: new Date().toISOString(),
    location: geoFromLatLng(item.location_lat, item.location_lng, item.business_name),
  };

  const profile: ProviderProfile = {
    userId,
    bio: item.description || '',
    categoryId: guessCategoryId(item.category),
    yearsOfExperience: 1,
    isOnline: Boolean(item.is_online),
    isSetupComplete: true,
    services: (item.services ?? []).map((svc) => ({
      serviceId: svc.id,
      price: Number(svc.price ?? 0),
      durationMinutes: Number(svc.duration ?? 60),
    })),
    serviceArea: item.category || 'Service area',
    location: geoFromLatLng(item.location_lat, item.location_lng),
    availability: fromWorkingHours(item.working_hours),
    rating: Number(item.rating ?? 0),
    reviewCount: 0,
    completedJobs: 0,
    portfolioUris: [],
    earningsThisWeek: 0,
  };

  return { user, profile };
}

async function loadRemoteProviders(query?: Record<string, string | number | boolean | undefined>): Promise<ProviderListItem[]> {
  const data = await api.get<{ providers?: ApiProvider[] } | ApiProvider[]>('/providers', query, false);
  const list = Array.isArray(data) ? data : data.providers ?? [];
  return list.map(mapProvider);
}

export async function getProviders(): Promise<ProviderListItem[]> {
  try {
    const remote = await loadRemoteProviders();
    if (remote.length > 0) return remote;
  } catch {
    // fall through
  }
  if (!AppConfig.useLocalCatalogFallback) return [];
  // Local seed fallback for empty Render DB
  const { getProviderProfiles, getUsers } = await import('@/services/localDb');
  await import('@/services/localDb').then((m) => m.ensureLocalData());
  const [users, profiles] = await Promise.all([getUsers(), getProviderProfiles()]);
  return profiles
    .map((profile) => ({
      user: users.find((user) => user.id === profile.userId)!,
      profile,
    }))
    .filter((item) => item.user);
}

export async function getProviderById(userId: string): Promise<ProviderListItem | undefined> {
  if (isBackendUuid(userId)) {
    try {
      const data = await api.get<{ provider?: ApiProvider } | ApiProvider>(`/providers/${userId}`, undefined, false);
      const item =
        data && typeof data === 'object' && 'provider' in data
          ? (data as { provider?: ApiProvider }).provider
          : (data as ApiProvider);
      if (item?.id || item?.user_id) return mapProvider(item);
    } catch {
      // Skip listing every provider — that extra remote call left registration stuck on Loading.
    }
  }
  if (!AppConfig.useLocalCatalogFallback) return undefined;
  const { getProviderProfiles, getUsers, ensureLocalData } = await import('@/services/localDb');
  await ensureLocalData();
  const [users, profiles] = await Promise.all([getUsers(), getProviderProfiles()]);
  const profile = profiles.find((item) => item.userId === userId);
  const user = users.find((item) => item.id === userId);
  if (profile && user) return { user, profile };
  return undefined;
}

export async function getProvidersForService(
  serviceId: string,
  origin?: GeoLocation | null,
  sort: ProviderSort = 'rating',
): Promise<ProviderListItem[]> {
  const providers = await getProviders();
  const matched = providers
    .filter(
      (item) =>
        item.profile.services.some((service) => service.serviceId === serviceId) ||
        item.profile.services.length === 0,
    )
    .map((item) => {
      const offer = item.profile.services.find((service) => service.serviceId === serviceId);
      const distance = origin ? distanceKm(origin, item.profile.location) : undefined;
      return {
        ...item,
        price: offer?.price,
        distanceKm: distance,
        etaMinutes: distance != null ? Math.max(5, Math.round((distance / 25) * 60)) : undefined,
      };
    });
  return sortProviders(matched, sort);
}

export async function searchProviders(query: string, origin?: GeoLocation | null): Promise<ProviderListItem[]> {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  const providers = await getProviders();
  const results: ProviderListItem[] = [];

  for (const item of providers) {
    const nameMatch = item.user.fullName.toLowerCase().includes(term);
    let serviceMatch = false;
    for (const offer of item.profile.services) {
      const service = await getService(offer.serviceId);
      if (service?.name.toLowerCase().includes(term)) serviceMatch = true;
    }
    if (nameMatch || serviceMatch || item.profile.bio.toLowerCase().includes(term)) {
      const distance = origin ? distanceKm(origin, item.profile.location) : undefined;
      results.push({
        ...item,
        distanceKm: distance,
        price: item.profile.services[0]?.price,
      });
    }
  }
  return results;
}

export async function getNearbyProviders(origin?: GeoLocation | null, categoryId?: CategoryId) {
  if (origin) {
    try {
      const data = await api.get<{ providers?: ApiProvider[] } | ApiProvider[]>('/providers/nearby', {
        lat: origin.latitude,
        lng: origin.longitude,
        radius: 20,
      });
      const list = Array.isArray(data) ? data : data.providers ?? [];
      if (list.length > 0) {
        return list
          .map(mapProvider)
          .filter((item) => (categoryId ? item.profile.categoryId === categoryId : true))
          .map((item) => {
            const distance = distanceKm(origin, item.profile.location);
            return {
              ...item,
              distanceKm: distance,
              price: item.profile.services[0]?.price,
              etaMinutes: Math.max(5, Math.round((distance / 25) * 60)),
            };
          });
      }
    } catch {
      // fall through
    }
  }

  const providers = await getProviders();
  return providers
    .filter((item) => (categoryId ? item.profile.categoryId === categoryId : true))
    .map((item) => {
      const distance = origin ? distanceKm(origin, item.profile.location) : undefined;
      return {
        ...item,
        distanceKm: distance,
        price: item.profile.services[0]?.price,
        etaMinutes: distance != null ? Math.max(5, Math.round((distance / 25) * 60)) : undefined,
      };
    })
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
}

export function emptyProviderProfile(userId: string): ProviderProfile {
  return {
    userId,
    bio: '',
    categoryId: 'beauty',
    yearsOfExperience: 1,
    isOnline: false,
    isSetupComplete: false,
    services: [],
    serviceArea: '',
    location: { latitude: -15.4167, longitude: 28.2833, address: '', city: 'Lusaka' },
    availability: WEEKLY_AVAILABILITY,
    rating: 0,
    reviewCount: 0,
    completedJobs: 0,
    portfolioUris: [],
    earningsThisWeek: 0,
  };
}

export async function saveProviderProfile(profile: ProviderProfile): Promise<void> {
  try {
    await api.put(`/providers/${profile.userId}`, {
      business_name: profile.serviceArea || 'My business',
      description: profile.bio,
      category: profile.categoryId,
      location_lat: profile.location.latitude,
      location_lng: profile.location.longitude,
      service_radius: 15,
      working_hours: toWorkingHours(profile.availability),
    });
  } catch {
    const { getProviderProfiles, saveProviderProfiles } = await import('@/services/localDb');
    const profiles = await getProviderProfiles();
    const index = profiles.findIndex((item) => item.userId === profile.userId);
    if (index >= 0) profiles[index] = profile;
    else profiles.push(profile);
    await saveProviderProfiles(profiles);
  }

  // Sync services in the background so profile save is not stuck on Loading.
  void (async () => {
    for (const offer of profile.services) {
      const service = await getService(offer.serviceId);
      if (!service) continue;
      try {
        await api.post('/services', {
          name: service.name,
          price: offer.price,
          duration: offer.durationMinutes,
          category: service.group,
          description: service.description,
        });
      } catch {
        // ignore per-service failures
      }
    }
  })();
}

export async function setProviderOnline(userId: string, isOnline: boolean): Promise<ProviderProfile> {
  try {
    await api.put(`/providers/${userId}/status`, { is_online: isOnline });
  } catch {
    // local fallback handled below
  }
  const item = await getProviderById(userId);
  if (!item) throw new Error('Provider profile not found.');
  const next = { ...item.profile, isOnline };
  await saveProviderProfile(next);
  return next;
}

function sortProviders(items: ProviderListItem[], sort: ProviderSort): ProviderListItem[] {
  const copy = [...items];
  if (sort === 'rating') copy.sort((a, b) => b.profile.rating - a.profile.rating);
  if (sort === 'distance') copy.sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
  if (sort === 'price') copy.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  if (sort === 'availability') copy.sort((a, b) => Number(b.profile.isOnline) - Number(a.profile.isOnline));
  return copy;
}
