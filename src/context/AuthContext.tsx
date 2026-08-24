import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getCurrentUser,
  getOnboardingComplete,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  setOnboardingComplete,
  updateUser as updateUserRequest,
  verifyAccount,
} from '@/services/authService';
import { ensureLocalData } from '@/services/localDb';
import { getProviderById } from '@/services/providerService';
import type { ProviderProfile, User, UserRole } from '@/types';

interface AuthContextValue {
  user: User | null;
  providerProfile: ProviderProfile | null;
  isReady: boolean;
  hasOnboarded: boolean;
  login: (emailOrPhone: string, password: string) => Promise<User>;
  register: (input: Parameters<typeof registerRequest>[0]) => ReturnType<typeof registerRequest>;
  verify: (email: string, code: string) => Promise<User>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const refresh = useCallback(async () => {
    // Local seed still used when live API catalog/providers are empty.
    await ensureLocalData().catch(() => undefined);
    const [current, onboarded] = await Promise.all([getCurrentUser(), getOnboardingComplete()]);
    setUser(current);
    setHasOnboarded(onboarded);
    if (current?.role === 'provider') {
      try {
        const item = await getProviderById(current.id);
        setProviderProfile(item?.profile ?? null);
      } catch {
        setProviderProfile(null);
      }
    } else {
      setProviderProfile(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsReady(true));
  }, [refresh]);

  const login = useCallback(
    async (emailOrPhone: string, password: string) => {
      const next = await loginRequest(emailOrPhone, password);
      await refresh();
      return next;
    },
    [refresh],
  );

  const register = useCallback(
    async (input: Parameters<typeof registerRequest>[0]) => {
      const result = await registerRequest(input);
      await refresh();
      return result;
    },
    [refresh],
  );

  const verify = useCallback(
    async (email: string, code: string) => {
      const next = await verifyAccount(email, code);
      await refresh();
      return next;
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setProviderProfile(null);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await setOnboardingComplete();
    setHasOnboarded(true);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<User>) => {
      if (!user) return;
      const next = await updateUserRequest(user.id, patch);
      setUser(next);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      providerProfile,
      isReady,
      hasOnboarded,
      login,
      register,
      verify,
      logout,
      completeOnboarding,
      refresh,
      updateProfile,
    }),
    [
      user,
      providerProfile,
      isReady,
      hasOnboarded,
      login,
      register,
      verify,
      logout,
      completeOnboarding,
      refresh,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export function useRole(): UserRole | null {
  return useAuth().user?.role ?? null;
}
