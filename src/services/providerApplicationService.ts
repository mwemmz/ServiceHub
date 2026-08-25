import { getJson, setJson, StorageKeys } from '@/services/storage';
import type { CategoryId, GeoLocation } from '@/types';

export type ProviderApplicationStatus = 'pending' | 'approved' | 'rejected';

export type ProviderServiceDetail = {
  serviceName: string;
  categoryId: CategoryId;
  description: string;
  yearsExperience: string;
  startingPrice: string;
  maxPrice: string;
  days: string[];
  hoursStart: string;
  hoursEnd: string;
};

export interface ProviderApplication {
  id: string;
  userId: string;
  status: ProviderApplicationStatus;
  submittedAt: string;
  personal: {
    firstName: string;
    surname: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    gender: string;
  };
  identity: {
    nrcNumber: string;
    legalName: string;
    dateOfBirth: string;
    gender: string;
    /** Kept private — never shown on public profile */
    nrcFrontUri: string;
    nrcBackUri: string;
    faceUri: string;
  };
  services: ProviderServiceDetail[];
  location: {
    text: string;
    geo?: GeoLocation;
    radiusKm: string;
  };
  documents: {
    nrcUri: string;
    businessUri?: string;
    certificateUri?: string;
    otherUri?: string;
  };
  /** @deprecated legacy shape — kept for older stored apps */
  service?: {
    categoryId: CategoryId;
    serviceOffered: string;
    description: string;
    yearsExperience: string;
    startingPrice: string;
    location: string;
    radiusKm: string;
  };
}

export async function listProviderApplications(): Promise<ProviderApplication[]> {
  return (await getJson<ProviderApplication[]>(StorageKeys.providerApplications)) ?? [];
}

export async function saveProviderApplication(app: ProviderApplication): Promise<void> {
  const all = await listProviderApplications();
  const next = [app, ...all.filter((item) => item.userId !== app.userId)];
  await setJson(StorageKeys.providerApplications, next);
}

export async function getProviderApplicationForUser(
  userId: string,
): Promise<ProviderApplication | null> {
  const all = await listProviderApplications();
  return all.find((item) => item.userId === userId) ?? null;
}

export async function isProviderPending(userId: string): Promise<boolean> {
  const app = await getProviderApplicationForUser(userId);
  return app?.status === 'pending';
}
