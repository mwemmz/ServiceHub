import { useCallback, useEffect } from 'react';
import { BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RegPrimaryButton } from '@/components/registration/RegControls';
import { RegShell } from '@/components/registration/RegShell';
import { RegColors } from '@/constants/registrationTheme';
import { useAuth } from '@/context/AuthContext';
import { CUSTOMER_REGISTER_TOTAL_STEPS } from '@/services/customerRegistrationDraft';

/** Shown after successful customer registration — then opens Service Categories. */
export default function AccountSuccessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const first = user?.fullName?.split(' ')[0] ?? 'there';

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace({
      pathname: '/(auth)/register',
      params: { step: String(CUSTOMER_REGISTER_TOTAL_STEPS) },
    } as Href);
  }, [router]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [goBack]);

  return (
    <RegShell
      onBack={goBack}
      backLabel="Back"
      showBackIcon
      step={CUSTOMER_REGISTER_TOTAL_STEPS}
      totalSteps={CUSTOMER_REGISTER_TOTAL_STEPS}
      title="Account created successfully"
      subtitle={`Welcome, ${first}! You're ready to book trusted services near you.`}>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={72} color={RegColors.success} />
      </View>
      <Text style={styles.body}>
        Your ServiceHub customer account is ready. Next, choose a service category to get started.
      </Text>
      <RegPrimaryButton
        label="Browse Services"
        onPress={() => router.push('/(customer)/categories' as Href)}
      />
    </RegShell>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', marginVertical: 8 },
  body: {
    color: RegColors.whiteSoft,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
    marginBottom: 8,
  },
});
