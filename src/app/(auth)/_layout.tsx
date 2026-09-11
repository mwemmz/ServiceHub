import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { hydrateCustomerRegistrationDraft } from '@/services/customerRegistrationDraft';
import { hydrateAllProviderRegistrationDrafts } from '@/services/providerRegistrationDraft';

export default function AuthLayout() {
  useEffect(() => {
    void hydrateCustomerRegistrationDraft();
    void hydrateAllProviderRegistrationDrafts();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    />
  );
}
