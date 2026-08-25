import { Redirect, Stack } from 'expo-router';
import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/context/AuthContext';

export default function ProviderLayout() {
  const { isReady, user } = useAuth();

  if (!isReady) return <LoadingState />;
  if (!user) return <Redirect href={'/(auth)/account-type' as import('expo-router').Href} />;
  if (user.role !== 'provider') return <Redirect href="/(customer)/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
