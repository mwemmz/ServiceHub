import { api } from '@/services/apiClient';

interface BackendProvider {
  id?: string;
  user_id?: string;
  business_name?: string;
  user?: { id?: string; name?: string } | null;
}

interface BackendProviderPayload {
  provider?: BackendProvider;
  providers?: BackendProvider[];
}

export interface BackendProviderEntry {
  providerId: string;
  userId: string;
  name: string;
}

/**
 * Resolve the backend provider profile id for a logged-in user id.
 * Several advanced endpoints (certifications, crews, insights) key off the
 * provider profile id rather than the user id.
 */
export async function getBackendProviderId(userId: string): Promise<string | null> {
  try {
    const data = await api.get<BackendProviderPayload | BackendProvider>(
      `/providers/${userId}`,
      undefined,
      false,
    );
    const item =
      data && typeof data === 'object' && 'provider' in data && data.provider
        ? data.provider
        : (data as BackendProvider);
    if (item?.id) return item.id;
  } catch {
    // fall through to directory scan
  }
  try {
    const directory = await getBackendProviderDirectory();
    return directory.find((entry) => entry.userId === userId)?.providerId ?? null;
  } catch {
    return null;
  }
}

/** All backend providers with their profile ids — used to pick crew members. */
export async function getBackendProviderDirectory(): Promise<BackendProviderEntry[]> {
  const data = await api.get<BackendProviderPayload | BackendProvider[]>(
    '/providers',
    undefined,
    false,
  );
  const list = Array.isArray(data)
    ? data
    : (data as { providers?: BackendProvider[] }).providers ?? [];
  return list
    .filter((item): item is BackendProvider & { id: string } => Boolean(item?.id))
    .map((item) => ({
      providerId: item.id,
      userId: item.user_id ?? item.user?.id ?? item.id,
      name: item.user?.name ?? item.business_name ?? 'Provider',
    }));
}