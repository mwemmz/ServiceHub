import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';
import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/context/AuthContext';
import { hydrateServiceRequestDraft } from '@/services/serviceRequestDraft';

export default function CustomerLayout() {
  const { isReady, user } = useAuth();

  useEffect(() => {
    void hydrateServiceRequestDraft();
  }, []);

  if (!isReady) return <LoadingState />;
  if (!user) return <Redirect href={'/(auth)/login' as import('expo-router').Href} />;
  if (user.role !== 'customer') return <Redirect href="/(provider)/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
