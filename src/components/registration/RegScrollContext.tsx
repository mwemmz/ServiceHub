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
import { Platform, ScrollView, TextInput, View } from 'react-native';

type FieldMap = Record<string, View | null>;
type InputMap = Record<string, TextInput | null>;

type RegScrollContextValue = {
  scrollRef: RefObject<ScrollView | null>;
  registerField: (key: string, node: View | null) => void;
  registerInput: (key: string, input: TextInput | null) => void;
  scrollToField: (key: string) => void;
  focusField: (key: string) => void;
  blurActiveInput: () => void;
};

const RegScrollContext = createContext<RegScrollContextValue | null>(null);

/** Active shell API — allows scrollToField from form logic outside the React tree order. */
let activeScrollApi: RegScrollContextValue | null = null;

export function scrollToRegField(key: string): void {
  activeScrollApi?.scrollToField(key);
}

export function focusRegField(key: string): void {
  activeScrollApi?.focusField(key);
}

function findScrollableParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function resolveFieldElement(target: View, fieldKey: string): HTMLElement | null {
  if (typeof document !== 'undefined' && fieldKey) {
    const byId = document.getElementById(`reg-field-${fieldKey}`);
    if (byId) return byId;
  }

  const anyTarget = target as unknown as {
    _nativeNode?: HTMLElement;
    getNode?: () => HTMLElement | null;
  };
  return (
    anyTarget._nativeNode ??
    (typeof anyTarget.getNode === 'function' ? anyTarget.getNode() : null) ??
    (target as unknown as HTMLElement | null)
  );
}

function scrollFieldIntoViewWeb(target: View, fieldKey: string) {
  try {
    if (typeof window === 'undefined') return;

    const el = resolveFieldElement(target, fieldKey);
    if (!el) return;

    const vv = window.visualViewport;
    const viewportTop = vv?.offsetTop ?? 0;
    const viewportHeight = vv?.height ?? window.innerHeight;
    const keyboardPadding = 24;
    const headerPadding = 72;
    const visibleBottom = viewportTop + viewportHeight - keyboardPadding;

    const rect = el.getBoundingClientRect();

    if (rect.bottom > visibleBottom) {
      const delta = rect.bottom - visibleBottom + 12;
      const scrollParent = findScrollableParent(el);
      if (scrollParent) {
        scrollParent.scrollTop += delta;
      } else {
        window.scrollBy({ top: delta, behavior: 'smooth' });
      }
      return;
    }

    if (rect.top < viewportTop + headerPadding) {
      const delta = rect.top - (viewportTop + headerPadding);
      const scrollParent = findScrollableParent(el);
      if (scrollParent) {
        scrollParent.scrollTop += delta;
      } else {
        window.scrollBy({ top: delta, behavior: 'smooth' });
      }
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch {
    // ignore
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
  const inputs = useRef<InputMap>({});

  const registerField = useCallback((key: string, node: View | null) => {
    fields.current[key] = node;
  }, []);

  const registerInput = useCallback((key: string, input: TextInput | null) => {
    inputs.current[key] = input;
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
        if (Platform.OS === 'web') {
          scrollFieldIntoViewWeb(target, key);
          // Mobile browsers animate the keyboard in — re-scroll after it opens.
          setTimeout(() => scrollFieldIntoViewWeb(target, key), 120);
          setTimeout(() => scrollFieldIntoViewWeb(target, key), 320);
          return;
        }
        target.measureInWindow((_fx, fy, _fw, fh) => {
          scroll.scrollTo({ y: Math.max(0, fy + fh - 280), animated: true });
        });
      } catch {
        // never crash the form
      }
    },
    [scrollRef],
  );

  const focusField = useCallback(
    (key: string) => {
      const input = inputs.current[key];
      if (!input) return;
      // Keep keyboard open: focus next without an intermediate blur
      requestAnimationFrame(() => {
        input.focus();
        scrollToField(key);
      });
    },
    [scrollToField],
  );

  const value = useMemo(
    () => ({
      scrollRef,
      registerField,
      registerInput,
      scrollToField,
      focusField,
      blurActiveInput,
    }),
    [scrollRef, registerField, registerInput, scrollToField, focusField, blurActiveInput],
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
      registerInput: () => undefined,
      scrollToField: () => undefined,
      focusField: () => undefined,
      blurActiveInput: () => undefined,
    };
  }
  return ctx;
}
