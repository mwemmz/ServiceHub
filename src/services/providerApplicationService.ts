import { getJson, setJson, StorageKeys } from '@/services/storage';
import type { ProviderPortfolioItem, ProviderRegistrationType, ProviderPriceType } from '@/types/providerRegistration';
import type { CategoryId, GeoLocation } from '@/types';

export type ProviderApplicationStatus = 'pending' | 'approved' | 'rejected';

export type ProviderServiceDetail = {
  serviceId: string;
  serviceName: string;
  groupTitle: string;
  categoryId: CategoryId;
  description: string;
  yearsExperience: string;
  price: string;
  priceType: ProviderPriceType;
  photos: string[];
  portfolioItems?: ProviderPortfolioItem[];
  days: string[];
  hoursStart: string;
  hoursEnd: string;
  /** @deprecated use price — kept for older stored records */
  startingPrice?: string;
  /** @deprecated use price — kept for older stored records */
  maxPrice?: string;
};

export type ProviderApplicationInfo =
  | {
      providerType: 'individual';
      firstName: string;
      surname: string;
      phone: string;
      email: string;
      dateOfBirth: string;
      gender: string;
    }
  | {
      providerType: 'business';
      businessName: string;
      contactPhone: string;
      contactEmail: string;
      description?: string;
    }
  | {
      providerType: 'registered_business';
      registeredName: string;
      registrationNumber: string;
      contactPhone: string;
      contactEmail: string;
      taxId?: string;
    };

export interface ProviderApplication {
  id: string;
  userId: string;
  status: ProviderApplicationStatus;
  submittedAt: string;
  providerType: ProviderRegistrationType;
  providerInfo: ProviderApplicationInfo;
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

export function serviceDisplayPrice(service: ProviderServiceDetail): string {
  if (service.portfolioItems?.length) {
    const nums = service.portfolioItems
      .map((item) => Number(item.price.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (nums.length > 0) {
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      if (min === max) return `K${min}`;
      return `From K${min}`;
    }
  }
  const amount = service.price || service.startingPrice || '';
  if (!amount) return '—';
  const type = service.priceType ?? 'fixed';
  return type === 'starting_from' ? `From K${amount}` : `K${amount}`;
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
