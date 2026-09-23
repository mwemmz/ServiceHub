import { api } from '@/services/apiClient';
import { getJson, removeJson, setJson, StorageKeys } from '@/services/storage';

interface ApiFavourite {
  id?: string;
  provider_id?: string;
  provider_user_id?: string;
  created_at?: string;
  provider?: unknown;
}

export interface FavouriteItem {
  providerId: string;
  savedAt: string;
}

async function loadFallback(): Promise<FavouriteItem[]> {
  return (await getJson<FavouriteItem[]>(StorageKeys.favourites)) ?? [];
}

async function saveFallback(items: FavouriteItem[]): Promise<void> {
  await setJson(StorageKeys.favourites, items);
}

export async function listFavourites(): Promise<FavouriteItem[]> {
  try {
    const data = await api.get<{ favourites?: ApiFavourite[] }>('/favourites');
    const list = (data.favourites ?? [])
      .map((item) => ({
        providerId: item.provider_user_id ?? item.provider_id ?? '',
        savedAt: item.created_at ?? new Date().toISOString(),
      }))
      .filter((item) => Boolean(item.providerId));
    await setJson(StorageKeys.favourites, list);
    return list;
  } catch {
    return loadFallback();
  }
}

export async function isFavourited(providerId: string): Promise<boolean> {
  if (!providerId) return false;
  try {
    const data = await api.get<{ is_favourite?: boolean }>(`/favourites/${providerId}/status`);
    return Boolean(data?.is_favourite);
  } catch {
    const list = await loadFallback();
    return list.some((item) => item.providerId === providerId);
  }
}

export async function addFavourite(providerId: string): Promise<void> {
  if (!providerId) return;
  try {
    await api.post('/favourites', { provider_id: providerId });
  } catch {
    // offline mirror below
  }
  const list = await loadFallback();
  if (!list.some((item) => item.providerId === providerId)) {
    await saveFallback([{ providerId, savedAt: new Date().toISOString() }, ...list]);
  }
}

export async function removeFavourite(providerId: string): Promise<void> {
  if (!providerId) return;
  try {
    await api.del(`/favourites/${providerId}`);
  } catch {
    // offline mirror below
  }
  const list = await loadFallback();
  await saveFallback(list.filter((item) => item.providerId !== providerId));
}

export async function clearFavourites(): Promise<void> {
  await removeJson(StorageKeys.favourites);
}