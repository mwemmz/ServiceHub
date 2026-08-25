import type { CategoryId, GeoLocation, Service } from '@/types';

/** In-memory draft for the customer service-request flow (categories → location → request). */
export type ServiceRequestDraft = {
  categoryId: CategoryId;
  categoryName: string;
  serviceId: string;
  serviceName: string;
  startingPrice: number;
  location: GeoLocation | null;
};

let draft: ServiceRequestDraft | null = null;

export function setServiceRequestDraft(next: ServiceRequestDraft): void {
  draft = next;
}

export function patchServiceRequestDraft(partial: Partial<ServiceRequestDraft>): void {
  if (!draft) return;
  draft = { ...draft, ...partial };
}

export function getServiceRequestDraft(): ServiceRequestDraft | null {
  return draft;
}

export function clearServiceRequestDraft(): void {
  draft = null;
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
  return next;
}
