import {
  clearFormDraft,
  loadFormDraft,
  mergeFormDraft,
  queueFormDraftSave,
} from '@/services/formDraftPersistence';
import { StorageKeys } from '@/services/storage';

/** Draft for the customer registration wizard — persisted across refresh. */
export type CustomerRegistrationForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirm: string;
  avatarUri: string;
};

const emptyForm = (): CustomerRegistrationForm => ({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  confirm: '',
  avatarUri: '',
});

let draft: CustomerRegistrationForm = emptyForm();
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function persist() {
  queueFormDraftSave(StorageKeys.draftCustomerRegistration, draft);
}

/** Load saved draft from device storage into memory. */
export async function hydrateCustomerRegistrationDraft(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    const saved = await loadFormDraft<CustomerRegistrationForm>(
      StorageKeys.draftCustomerRegistration,
    );
    if (saved) {
      draft = mergeFormDraft(emptyForm(), saved);
    }
    hydrated = true;
  })();

  return hydratePromise;
}

export function isCustomerRegistrationDraftHydrated(): boolean {
  return hydrated;
}

export function getCustomerRegistrationDraft(): CustomerRegistrationForm {
  return draft;
}

export function patchCustomerRegistrationDraft(partial: Partial<CustomerRegistrationForm>): void {
  draft = { ...draft, ...partial };
  persist();
}

export async function resetCustomerRegistrationDraft(): Promise<void> {
  draft = emptyForm();
  hydrated = true;
  hydratePromise = null;
  await clearFormDraft(StorageKeys.draftCustomerRegistration);
}

export const CUSTOMER_REGISTER_TOTAL_STEPS = 4;

export function parseRegisterStep(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(value ?? '1', 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(CUSTOMER_REGISTER_TOTAL_STEPS, Math.max(1, n));
}
