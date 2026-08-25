import { Redirect, Stack } from 'expo-router';
import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/context/AuthContext';

export default function CustomerLayout() {
  const { isReady, user } = useAuth();

  if (!isReady) return <LoadingState />;
  if (!user) return <Redirect href={'/(auth)/account-type' as import('expo-router').Href} />;
  if (user.role !== 'customer') return <Redirect href="/(provider)/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
