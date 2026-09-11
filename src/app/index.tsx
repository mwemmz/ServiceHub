import { Redirect } from 'expo-router';
import type { Href } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/context/AuthContext';

/** Splash gate — session-aware entry into ServiceHub. */
export default function SplashGate() {
  const { isReady, user } = useAuth();

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: '#14100C' }} />;
  }

  if (!user) {
    return <Redirect href={'/(auth)/welcome' as Href} />;
  }
  if (user.role === 'provider') {
    return <Redirect href="/(provider)/(tabs)" />;
  }
  return <Redirect href={'/(customer)/categories' as Href} />;
}
