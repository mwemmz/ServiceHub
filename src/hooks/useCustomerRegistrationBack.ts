import { useCallback, useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { resetCustomerRegistrationDraft } from '@/services/customerRegistrationDraft';

/** Android hardware back + shared back logic for customer registration steps. */
export function useCustomerRegistrationBack(step: number) {
  const router = useRouter();

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (step > 1) {
      router.replace({
        pathname: '/(auth)/register',
        params: { step: String(step - 1) },
      } as Href);
      return;
    }

    void resetCustomerRegistrationDraft();
    router.replace('/(auth)/account-type' as Href);
  }, [router, step]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [goBack]);

  return goBack;
}

/** Back from account-success → review step (step 4) via navigation history. */
export function useCustomerRegistrationSuccessBack() {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace({
      pathname: '/(auth)/register',
      params: { step: '4' },
    } as Href);
  }, [router]);
}
