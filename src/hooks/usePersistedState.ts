import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearFormDraft,
  loadFormDraft,
  queueFormDraftSave,
} from '@/services/formDraftPersistence';

type SetStateAction<T> = T | ((prev: T) => T);

export type UsePersistedStateOptions = {
  debounceMs?: number;
};

/**
 * Like useState, but automatically saves to AsyncStorage (localStorage on web)
 * and restores on mount. Safe for client-only Expo / React Native Web apps.
 */
export function usePersistedState<T>(
  storageKey: string,
  initialValue: T,
  options: UsePersistedStateOptions = {},
): [T, (value: SetStateAction<T>) => void, boolean] {
  const { debounceMs = 250 } = options;
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await loadFormDraft<T>(storageKey);
      if (!cancelled && saved != null) {
        setValue(saved);
      }
      if (!cancelled) {
        hydratedRef.current = true;
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const setPersisted = useCallback(
    (next: SetStateAction<T>) => {
      setValue((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        if (hydratedRef.current) {
          queueFormDraftSave(storageKey, resolved, debounceMs);
        }
        return resolved;
      });
    },
    [storageKey, debounceMs],
  );

  return [value, setPersisted, hydrated];
}

/** Clear a persisted draft from storage (e.g. after successful submit). */
export async function clearPersistedState(storageKey: string): Promise<void> {
  await clearFormDraft(storageKey);
}
