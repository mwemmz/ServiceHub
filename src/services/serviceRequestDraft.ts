import {
  clearFormDraft,
  loadFormDraft,
  mergeFormDraft,
  queueFormDraftSave,
} from '@/services/formDraftPersistence';
import { StorageKeys } from '@/services/storage';
import type { CategoryId, GeoLocation, Service } from '@/types';

/** Draft for the customer service-request flow (categories → location → request). */
export type ServiceRequestDraft = {
  categoryId: CategoryId;
  categoryName: string;
  serviceId: string;
  serviceName: string;
  startingPrice: number;
  location: GeoLocation | null;
};

let draft: ServiceRequestDraft | null = null;
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function persist() {
  if (draft) {
    queueFormDraftSave(StorageKeys.draftServiceRequest, draft);
  }
}

export async function hydrateServiceRequestDraft(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    const saved = await loadFormDraft<ServiceRequestDraft>(StorageKeys.draftServiceRequest);
    draft = saved ?? null;
    hydrated = true;
  })();

  return hydratePromise;
}

export function isServiceRequestDraftHydrated(): boolean {
  return hydrated;
}

export function setServiceRequestDraft(next: ServiceRequestDraft): void {
  draft = next;
  persist();
}

export function patchServiceRequestDraft(partial: Partial<ServiceRequestDraft>): void {
  if (!draft) return;
  draft = mergeFormDraft(draft, partial);
  persist();
}

export function getServiceRequestDraft(): ServiceRequestDraft | null {
  return draft;
}

export async function clearServiceRequestDraft(): Promise<void> {
  draft = null;
  hydrated = true;
  hydratePromise = null;
  await clearFormDraft(StorageKeys.draftServiceRequest);
}

export function startDraftFromService(
  service: Service,
  categoryName: string,
): ServiceRequestDraft {
  const next: ServiceRequestDraft = {
    categoryId: service.categoryId,
    categoryName,
    serviceId: service.id,
    serviceName: service.name,
    startingPrice: service.startingPrice,
    location: null,
  };
  draft = next;
  persist();
  return next;
}
