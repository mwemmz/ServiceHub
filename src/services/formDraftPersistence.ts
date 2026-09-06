import { getJson, removeJson, setJson } from '@/services/storage';

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Load a persisted form draft. Returns null if missing or malformed. */
export async function loadFormDraft<T>(key: string): Promise<T | null> {
  try {
    return await getJson<T>(key);
  } catch {
    return null;
  }
}

/** Save a form draft immediately. */
export async function saveFormDraft<T>(key: string, value: T): Promise<void> {
  try {
    await setJson(key, value);
  } catch {
    // Storage failures must not crash the app.
  }
}

/** Remove a persisted draft and cancel any queued save. */
export async function clearFormDraft(key: string): Promise<void> {
  const timer = saveTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    saveTimers.delete(key);
  }
  try {
    await removeJson(key);
  } catch {
    // ignore
  }
}

/** Debounced save — call whenever form state changes. */
export function queueFormDraftSave<T>(key: string, value: T, debounceMs = 250): void {
  const existing = saveTimers.get(key);
  if (existing) clearTimeout(existing);
  saveTimers.set(
    key,
    setTimeout(() => {
      saveTimers.delete(key);
      void saveFormDraft(key, value);
    }, debounceMs),
  );
}

/** Merge saved partial data onto defaults without overwriting with undefined. */
export function mergeFormDraft<T extends object>(defaults: T, saved: Partial<T> | null | undefined): T {
  if (!saved || typeof saved !== 'object') return defaults;
  const next = { ...defaults };
  for (const key of Object.keys(saved) as (keyof T)[]) {
    const value = saved[key];
    if (value !== undefined && value !== null) {
      next[key] = value as T[keyof T];
    }
  }
  return next;
}

/** Deep-merge one level of nested objects (e.g. form.individual). */
export function mergeNestedFormDraft<T extends object>(
  defaults: T,
  saved: Partial<T> | null | undefined,
  nestedKeys: (keyof T)[],
): T {
  const merged = mergeFormDraft(defaults, saved);
  if (!saved) return merged;
  for (const key of nestedKeys) {
    const nestedDefault = defaults[key];
    const nestedSaved = saved[key];
    if (
      nestedDefault &&
      nestedSaved &&
      typeof nestedDefault === 'object' &&
      typeof nestedSaved === 'object' &&
      !Array.isArray(nestedDefault)
    ) {
      merged[key] = mergeFormDraft(
        nestedDefault as object,
        nestedSaved as object,
      ) as T[keyof T];
    }
  }
  return merged;
}
