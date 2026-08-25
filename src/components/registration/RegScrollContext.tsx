import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { Platform, ScrollView, View } from 'react-native';

type FieldMap = Record<string, View | null>;

type RegScrollContextValue = {
  scrollRef: RefObject<ScrollView | null>;
  registerField: (key: string, node: View | null) => void;
  scrollToField: (key: string) => void;
  blurActiveInput: () => void;
};

const RegScrollContext = createContext<RegScrollContextValue | null>(null);

/** Active shell API — allows scrollToField from form logic outside the React tree order. */
let activeScrollApi: RegScrollContextValue | null = null;

export function scrollToRegField(key: string): void {
  activeScrollApi?.scrollToField(key);
}

function scrollFieldIntoViewWeb(target: View, fieldKey: string) {
  try {
    if (typeof document !== 'undefined' && fieldKey) {
      const byId = document.getElementById(`reg-field-${fieldKey}`);
      if (byId && typeof byId.scrollIntoView === 'function') {
        byId.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    const anyTarget = target as unknown as {
      _nativeNode?: HTMLElement;
      getNode?: () => HTMLElement | null;
    };
    const host =
      anyTarget._nativeNode ??
      (typeof anyTarget.getNode === 'function' ? anyTarget.getNode() : null) ??
      (target as unknown as HTMLElement | null);

    if (host && typeof host.scrollIntoView === 'function') {
      host.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } catch {
    // ignore — error message under the field is enough
  }
}

export function RegScrollProvider({
  children,
  scrollRef,
}: {
  children: ReactNode;
  scrollRef: RefObject<ScrollView | null>;
}) {
  const fields = useRef<FieldMap>({});

  const registerField = useCallback((key: string, node: View | null) => {
    fields.current[key] = node;
  }, []);

  const blurActiveInput = useCallback(() => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  const scrollToField = useCallback(
    (key: string) => {
      const target = fields.current[key];
      const scroll = scrollRef.current;
      if (!target || !scroll) return;

      try {
        // findNodeHandle is NOT supported on web — never call it
        if (Platform.OS === 'web') {
          scrollFieldIntoViewWeb(target, key);
          return;
        }

        target.measureInWindow((_fx, fy) => {
          scroll.scrollTo({ y: Math.max(0, fy - 120), animated: true });
        });
      } catch {
        // Validation errors still show — never crash the form
      }
    },
    [scrollRef],
  );

  const value = useMemo(
    () => ({ scrollRef, registerField, scrollToField, blurActiveInput }),
    [scrollRef, registerField, scrollToField, blurActiveInput],
  );

  useEffect(() => {
    activeScrollApi = value;
    return () => {
      if (activeScrollApi === value) activeScrollApi = null;
    };
  }, [value]);

  return <RegScrollContext.Provider value={value}>{children}</RegScrollContext.Provider>;
}

export function useRegScroll(): RegScrollContextValue {
  const ctx = useContext(RegScrollContext);
  if (!ctx) {
    return {
      scrollRef: { current: null },
      registerField: () => undefined,
      scrollToField: () => undefined,
      blurActiveInput: () => undefined,
    };
  }
  return ctx;
}
