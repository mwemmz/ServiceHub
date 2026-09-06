import { BUSINESS_REGISTRATION_CATEGORIES } from '@/constants/businessRegistration';
import { PROVIDER_SERVICE_GROUPS } from '@/constants/providerServices';
import type { CategoryId } from '@/types';
import type {
  ProviderPortfolioItem,
  ProviderRegistrationForm,
  ProviderRegistrationService,
  ProviderRegistrationType,
} from '@/types/providerRegistration';

export function findServiceMeta(id: string) {
  for (const group of PROVIDER_SERVICE_GROUPS) {
    const item = group.items.find((s) => s.id === id);
    if (item) return { ...item, groupTitle: group.title };
  }
  return null;
}

export function emptyServiceDetail(
  serviceId: string,
  serviceName: string,
  groupTitle: string,
  categoryId: CategoryId,
): ProviderRegistrationService {
  return {
    serviceId,
    serviceName,
    groupTitle,
    categoryId,
    yearsExperience: '',
    portfolioItems: [],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    hoursStart: '08:00',
    hoursEnd: '17:00',
  };
}

export function getGroupedSelectedServices(selectedIds: string[]) {
  return PROVIDER_SERVICE_GROUPS.map((group) => ({
    title: group.title,
    categoryId: group.categoryId,
    items: group.items.filter((item) => selectedIds.includes(item.id)),
  })).filter((group) => group.items.length > 0);
}

export function syncServiceDetails(
  selectedIds: string[],
  existing: Record<string, ProviderRegistrationService>,
): Record<string, ProviderRegistrationService> {
  const next: Record<string, ProviderRegistrationService> = {};
  for (const id of selectedIds) {
    const meta = findServiceMeta(id);
    if (!meta) continue;
    const prev = existing[id];
    if (prev) {
      next[id] = {
        ...prev,
        serviceName: meta.label,
        groupTitle: meta.groupTitle,
        categoryId: meta.categoryId,
      };
    } else {
      next[id] = emptyServiceDetail(id, meta.label, meta.groupTitle, meta.categoryId);
    }
  }
  return next;
}

export function selectProviderCategory(categoryId: CategoryId) {
  return {
    businessCategoryId: categoryId,
    selectedServiceIds: [] as string[],
    serviceDetails: {},
  };
}

function businessServiceForCategory(categoryId: CategoryId) {
  const categoryLabel =
    BUSINESS_REGISTRATION_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
  const group = PROVIDER_SERVICE_GROUPS.find((g) => g.categoryId === categoryId);
  const firstItem = group?.items[0];
  const serviceId = firstItem?.id ?? `business-${categoryId}`;
  const serviceName = firstItem?.label ?? categoryLabel;
  const groupTitle = group?.title ?? categoryLabel;
  return { serviceId, serviceName, groupTitle, categoryId };
}

/** Prepare a single portfolio service when a business picks a top-level category. */
export function selectBusinessCategory(categoryId: CategoryId) {
  const { serviceId, serviceName, groupTitle } = businessServiceForCategory(categoryId);
  return {
    businessCategoryId: categoryId,
    businessCategoryIds: [categoryId],
    selectedServiceIds: [serviceId],
    serviceDetails: {
      [serviceId]: emptyServiceDetail(serviceId, serviceName, groupTitle, categoryId),
    },
  };
}

/** Toggle a business category on/off (multi-select). */
export function toggleBusinessCategory(
  categoryId: CategoryId,
  selectedCategoryIds: CategoryId[],
  selectedServiceIds: string[],
  serviceDetails: Record<string, ProviderRegistrationService>,
): Pick<
  ProviderRegistrationForm,
  'businessCategoryIds' | 'selectedServiceIds' | 'serviceDetails'
> {
  const { serviceId, serviceName, groupTitle } = businessServiceForCategory(categoryId);
  const isSelected = selectedCategoryIds.includes(categoryId);

  if (isSelected) {
    const nextCategoryIds = selectedCategoryIds.filter((id) => id !== categoryId);
    const nextServiceIds = selectedServiceIds.filter((id) => id !== serviceId);
    const nextDetails = { ...serviceDetails };
    delete nextDetails[serviceId];
    return {
      businessCategoryIds: nextCategoryIds,
      selectedServiceIds: nextServiceIds,
      serviceDetails: nextDetails,
    };
  }

  return {
    businessCategoryIds: [...selectedCategoryIds, categoryId],
    selectedServiceIds: selectedServiceIds.includes(serviceId)
      ? selectedServiceIds
      : [...selectedServiceIds, serviceId],
    serviceDetails: {
      ...serviceDetails,
      [serviceId]:
        serviceDetails[serviceId] ??
        emptyServiceDetail(serviceId, serviceName, groupTitle, categoryId),
    },
  };
}

export function providerDisplayName(
  providerType: ProviderRegistrationType | '',
  individual: { firstName: string; surname: string },
  business: { businessName: string },
  registeredBusiness: { registeredName: string },
): string {
  if (providerType === 'business') return business.businessName.trim();
  if (providerType === 'registered_business') return registeredBusiness.registeredName.trim();
  return `${individual.firstName.trim()} ${individual.surname.trim()}`.trim();
}

export function providerContactEmail(
  providerType: ProviderRegistrationType | '',
  individual: { email: string },
  business: { contactEmail: string },
  registeredBusiness: { contactEmail: string },
): string {
  if (providerType === 'business') return business.contactEmail.trim();
  if (providerType === 'registered_business') return registeredBusiness.contactEmail.trim();
  return individual.email.trim();
}

export function providerContactPhone(
  providerType: ProviderRegistrationType | '',
  individual: { phone: string },
  business: { contactPhone: string },
  registeredBusiness: { contactPhone: string },
): string {
  if (providerType === 'business') return business.contactPhone.trim();
  if (providerType === 'registered_business') return registeredBusiness.contactPhone.trim();
  return individual.phone.trim();
}

export function portfolioPriceSummary(items: ProviderPortfolioItem[]): string {
  const nums = items
    .map((item) => Number(item.price.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
  if (nums.length === 0) return '—';
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) return `K${min}`;
  return `From K${min}`;
}

export function formatServicePrice(service: ProviderRegistrationService): string {
  return portfolioPriceSummary(service.portfolioItems);
}

/** Map to stored application service — keeps legacy fields for older screens. */
export function toApplicationService(service: ProviderRegistrationService) {
  const portfolioItems = service.portfolioItems;
  const photos = portfolioItems.map((item) => item.uri);
  const captions = portfolioItems.map((item) => item.caption.trim()).filter(Boolean);
  const description = captions.join(' · ');
  const prices = portfolioItems
    .map((item) => Number(item.price.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
  const price = prices.length ? String(Math.min(...prices)) : '';

  return {
    serviceId: service.serviceId,
    serviceName: service.serviceName,
    groupTitle: service.groupTitle,
    categoryId: service.categoryId,
    description,
    yearsExperience: service.yearsExperience,
    price,
    priceType: 'fixed' as const,
    photos,
    portfolioItems,
    days: service.days,
    hoursStart: service.hoursStart,
    hoursEnd: service.hoursEnd,
    startingPrice: price,
    maxPrice: prices.length ? String(Math.max(...prices)) : price,
  };
}
