import {
  clearFormDraft,
  loadFormDraft,
  mergeNestedFormDraft,
  queueFormDraftSave,
} from '@/services/formDraftPersistence';
import { StorageKeys } from '@/services/storage';
import type {
  ProviderRegistrationForm,
  ProviderRegistrationType,
} from '@/types/providerRegistration';

export type ProviderDraftKind = 'individual' | 'business';

export type ProviderRegistrationDraft = {
  form: ProviderRegistrationForm;
  step: number;
  businessUserId: string | null;
  flowVersion?: number;
};

const PROVIDER_FLOW_VERSION = 4;

function storageKeyFor(kind: ProviderDraftKind): string {
  return kind === 'individual'
    ? StorageKeys.draftProviderRegistrationIndividual
    : StorageKeys.draftProviderRegistrationBusiness;
}

function remapLegacyStep(saved: ProviderRegistrationDraft): number {
  const step = saved.step ?? 1;
  if ((saved.flowVersion ?? 0) >= PROVIDER_FLOW_VERSION) return step;
  if (saved.flowVersion === 3) return step;
  const type = saved.form?.providerType;
  if (type === 'individual') {
    const fromV2: Record<number, number> = { 6: 2, 7: 6, 8: 7, 9: 8, 10: 9 };
    return fromV2[step] ?? step;
  }
  if (type === 'business') {
    const fromV2: Record<number, number> = { 5: 2, 6: 5, 7: 6 };
    return fromV2[step] ?? step;
  }
  return step;
}

export const emptyProviderRegistrationForm = (
  providerType: ProviderRegistrationType | '' = '',
): ProviderRegistrationForm => ({
  providerType,
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
  nrcDocFileName: '',
  businessUri: '',
  businessLicenceFileName: '',
  certificateUri: '',
  certifications: [],
  otherDocUri: '',
  supportingDocuments: [],
  password: '',
  confirm: '',
});

function emptyDraft(kind?: ProviderDraftKind): ProviderRegistrationDraft {
  return {
    form: emptyProviderRegistrationForm(kind ?? ''),
    step: kind ? 2 : 1,
    businessUserId: null,
    flowVersion: PROVIDER_FLOW_VERSION,
  };
}

function normalizeForm(form: ProviderRegistrationForm): ProviderRegistrationForm {
  const next = { ...form };
  if (!Array.isArray(next.certifications)) {
    next.certifications = next.certificateUri
      ? [
          {
            id: 'legacy-cert',
            uri: next.certificateUri,
            fileName: 'Professional certificate',
          },
        ]
      : [];
  }
  if (!Array.isArray(next.supportingDocuments)) {
    next.supportingDocuments = next.otherDocUri
      ? [
          {
            id: 'legacy-support',
            uri: next.otherDocUri,
            fileName: 'Supporting document',
          },
        ]
      : [];
  }
  next.nrcDocFileName = next.nrcDocFileName ?? '';
  next.businessLicenceFileName = next.businessLicenceFileName ?? '';
  if (!Array.isArray(next.businessCategoryIds)) {
    next.businessCategoryIds = next.businessCategoryId ? [next.businessCategoryId] : [];
  }
  return next;
}

const NESTED_FORM_KEYS: (keyof ProviderRegistrationForm)[] = [
  'individual',
  'business',
  'registeredBusiness',
];

const caches: Record<ProviderDraftKind, ProviderRegistrationDraft> = {
  individual: emptyDraft('individual'),
  business: emptyDraft('business'),
};

const hydrated: Record<ProviderDraftKind, boolean> = {
  individual: false,
  business: false,
};

const hydratePromises: Record<ProviderDraftKind, Promise<ProviderRegistrationDraft> | null> = {
  individual: null,
  business: null,
};

/** Active kind used by the open register-provider screen. */
let activeKind: ProviderDraftKind = 'individual';

function persist(kind: ProviderDraftKind) {
  queueFormDraftSave(storageKeyFor(kind), caches[kind]);
}

async function loadKind(kind: ProviderDraftKind): Promise<ProviderRegistrationDraft> {
  const saved = await loadFormDraft<ProviderRegistrationDraft>(storageKeyFor(kind));
  if (saved) {
    const base = emptyDraft(kind);
    const form = normalizeForm(mergeNestedFormDraft(base.form, saved.form, NESTED_FORM_KEYS));
    form.providerType = kind;
    if (saved.form?.selectedServiceIds) form.selectedServiceIds = saved.form.selectedServiceIds;
    if (saved.form?.serviceDetails) form.serviceDetails = saved.form.serviceDetails;
    if (Array.isArray(saved.form?.businessCategoryIds)) {
      form.businessCategoryIds = saved.form.businessCategoryIds;
    }
    let step = remapLegacyStep(saved);
    // Type is chosen on a separate screen — never land on the old type-picker step.
    if (step < 2) step = 2;
    return {
      step,
      businessUserId: saved.businessUserId ?? null,
      flowVersion: PROVIDER_FLOW_VERSION,
      form,
    };
  }
  return emptyDraft(kind);
}

async function migrateLegacySharedDraft(): Promise<void> {
  const legacy = await loadFormDraft<ProviderRegistrationDraft>(
    StorageKeys.draftProviderRegistration,
  );
  if (!legacy?.form?.providerType) return;
  const kind: ProviderDraftKind =
    legacy.form.providerType === 'business' ? 'business' : 'individual';
  const existing = await loadFormDraft(storageKeyFor(kind));
  if (!existing) {
    const { setJson } = await import('@/services/storage');
    await setJson(storageKeyFor(kind), {
      ...legacy,
      form: { ...legacy.form, providerType: kind },
      flowVersion: PROVIDER_FLOW_VERSION,
      step: Math.max(2, remapLegacyStep(legacy)),
    });
  }
  await clearFormDraft(StorageKeys.draftProviderRegistration);
}

export async function hydrateProviderRegistrationDraft(
  kind: ProviderDraftKind = activeKind,
): Promise<ProviderRegistrationDraft> {
  activeKind = kind;
  if (hydrated[kind]) return caches[kind];
  if (hydratePromises[kind]) return hydratePromises[kind]!;

  hydratePromises[kind] = (async () => {
    await migrateLegacySharedDraft();
    caches[kind] = await loadKind(kind);
    hydrated[kind] = true;
    return caches[kind];
  })();

  return hydratePromises[kind]!;
}

export async function hydrateAllProviderRegistrationDrafts(): Promise<void> {
  await Promise.all([
    hydrateProviderRegistrationDraft('individual'),
    hydrateProviderRegistrationDraft('business'),
  ]);
}

export function isProviderRegistrationDraftHydrated(
  kind: ProviderDraftKind = activeKind,
): boolean {
  return hydrated[kind];
}

export function getProviderRegistrationDraft(
  kind: ProviderDraftKind = activeKind,
): ProviderRegistrationDraft {
  return caches[kind];
}

export function setProviderRegistrationDraft(
  next: ProviderRegistrationDraft,
  kind: ProviderDraftKind = activeKind,
): void {
  activeKind = kind;
  const form = normalizeForm({ ...next.form, providerType: kind });
  caches[kind] = {
    ...next,
    form,
    flowVersion: PROVIDER_FLOW_VERSION,
    step: Math.max(2, next.step),
  };
  persist(kind);
}

export function patchProviderRegistrationDraft(
  partial: Partial<ProviderRegistrationDraft> & { form?: Partial<ProviderRegistrationForm> },
  kind: ProviderDraftKind = activeKind,
): void {
  activeKind = kind;
  const mergedForm = partial.form
    ? normalizeForm({ ...caches[kind].form, ...partial.form, providerType: kind })
    : { ...caches[kind].form, providerType: kind };
  caches[kind] = {
    ...caches[kind],
    ...partial,
    form: mergedForm,
    flowVersion: PROVIDER_FLOW_VERSION,
  };
  persist(kind);
}

export async function resetProviderRegistrationDraft(
  kind: ProviderDraftKind = activeKind,
): Promise<void> {
  activeKind = kind;
  caches[kind] = emptyDraft(kind);
  hydrated[kind] = true;
  hydratePromises[kind] = null;
  await clearFormDraft(storageKeyFor(kind));
}

export function getActiveProviderDraftKind(): ProviderDraftKind {
  return activeKind;
}

export function setActiveProviderDraftKind(kind: ProviderDraftKind): void {
  activeKind = kind;
}
