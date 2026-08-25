import { Redirect } from 'expo-router';
import type { Href } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/context/AuthContext';

/** Splash gate — redirects immediately to real app areas. No mockup screens. */
export default function SplashGate() {
  const { isReady, user, hasOnboarded } = useAuth();

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: '#14100C' }} />;
  }

  if (!user || !hasOnboarded) {
    return <Redirect href={'/(auth)/account-type' as Href} />;
  }
  if (user.role === 'provider') return <Redirect href="/(provider)/(tabs)" />;
  return <Redirect href={'/(customer)/categories' as Href} />;
}
