import {
  clearFormDraft,
  loadFormDraft,
  mergeNestedFormDraft,
  queueFormDraftSave,
} from '@/services/formDraftPersistence';
import { StorageKeys } from '@/services/storage';
import type { ProviderRegistrationForm } from '@/types/providerRegistration';

export type ProviderRegistrationDraft = {
  form: ProviderRegistrationForm;
  step: number;
  businessUserId: string | null;
};

export const emptyProviderRegistrationForm = (): ProviderRegistrationForm => ({
  providerType: '',
  individual: {
    firstName: '',
    surname: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
  },
  business: {
    businessName: '',
    contactPhone: '',
    contactEmail: '',
    description: '',
  },
  registeredBusiness: {
    registeredName: '',
    registrationNumber: '',
    contactPhone: '',
    contactEmail: '',
    taxId: '',
  },
  selectedServiceIds: [],
  serviceDetails: {},
  businessCategoryId: '',
  businessCategoryIds: [],
  faceUri: '',
  nrcNumber: '',
  locationText: '',
  geo: null,
  radiusKm: '10',
  nrcDocUri: '',
  businessUri: '',
  certificateUri: '',
  otherDocUri: '',
  password: '',
  confirm: '',
});

const emptyDraft = (): ProviderRegistrationDraft => ({
  form: emptyProviderRegistrationForm(),
  step: 1,
  businessUserId: null,
});

let cache: ProviderRegistrationDraft = emptyDraft();
let hydrated = false;
let hydratePromise: Promise<ProviderRegistrationDraft> | null = null;

const NESTED_FORM_KEYS: (keyof ProviderRegistrationForm)[] = [
  'individual',
  'business',
  'registeredBusiness',
];

function persist() {
  queueFormDraftSave(StorageKeys.draftProviderRegistration, cache);
}

export async function hydrateProviderRegistrationDraft(): Promise<ProviderRegistrationDraft> {
  if (hydrated) return cache;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    const saved = await loadFormDraft<ProviderRegistrationDraft>(
      StorageKeys.draftProviderRegistration,
    );
    if (saved) {
      const base = emptyDraft();
      cache = {
        step: typeof saved.step === 'number' ? saved.step : base.step,
        businessUserId: saved.businessUserId ?? base.businessUserId,
        form: mergeNestedFormDraft(base.form, saved.form, NESTED_FORM_KEYS),
      };
      if (saved.form?.selectedServiceIds) {
        cache.form.selectedServiceIds = saved.form.selectedServiceIds;
      }
      if (saved.form?.serviceDetails) {
        cache.form.serviceDetails = saved.form.serviceDetails;
      }
      if (Array.isArray(saved.form?.businessCategoryIds)) {
        cache.form.businessCategoryIds = saved.form.businessCategoryIds;
      } else if (saved.form?.businessCategoryId) {
        cache.form.businessCategoryIds = [saved.form.businessCategoryId];
      }
    } else {
      cache = emptyDraft();
    }
    hydrated = true;
    return cache;
  })();

  return hydratePromise;
}

export function isProviderRegistrationDraftHydrated(): boolean {
  return hydrated;
}

export function getProviderRegistrationDraft(): ProviderRegistrationDraft {
  return cache;
}

export function setProviderRegistrationDraft(next: ProviderRegistrationDraft): void {
  cache = next;
  persist();
}

export function patchProviderRegistrationDraft(
  partial: Partial<ProviderRegistrationDraft> & { form?: Partial<ProviderRegistrationForm> },
): void {
  cache = {
    ...cache,
    ...partial,
    form: partial.form ? { ...cache.form, ...partial.form } : cache.form,
  };
  persist();
}

export async function resetProviderRegistrationDraft(): Promise<void> {
  cache = emptyDraft();
  hydrated = true;
  hydratePromise = null;
  await clearFormDraft(StorageKeys.draftProviderRegistration);
}
