import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { requestDeviceLocation } from '@/services/locationService';
import type { GeoLocation } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface LocationContextValue {
  location: GeoLocation | null;
  isLocating: boolean;
  error: string | null;
  useCurrentLocation: () => Promise<GeoLocation>;
  setManualLocation: (next: GeoLocation) => Promise<void>;
  clearError: () => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user, updateProfile } = useAuth();
  const [override, setOverride] = useState<GeoLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const location = override ?? user?.location ?? null;

  const useCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    setError(null);
    try {
      const next = await requestDeviceLocation();
      setOverride(next);
      if (user) await updateProfile({ location: next });
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not get your location.';
      setError(message);
      throw err;
    } finally {
      setIsLocating(false);
    }
  }, [updateProfile, user]);

  const setManualLocation = useCallback(
    async (next: GeoLocation) => {
      setOverride(next);
      setError(null);
      if (user) await updateProfile({ location: next });
    },
    [updateProfile, user],
  );

  const value = useMemo(
    () => ({
      location,
      isLocating,
      error,
      useCurrentLocation,
      setManualLocation,
      clearError: () => setError(null),
    }),
    [location, isLocating, error, useCurrentLocation, setManualLocation],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useAppLocation(): LocationContextValue {
  const value = useContext(LocationContext);
  if (!value) throw new Error('useAppLocation must be used inside LocationProvider');
  return value;
}
