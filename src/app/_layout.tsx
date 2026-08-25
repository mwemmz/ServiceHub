import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { installWebAutofillFix } from '@/utils/webAutofillFix';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    installWebAutofillFix();
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <LocationProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
      </LocationProvider>
    </AuthProvider>
  );
}
