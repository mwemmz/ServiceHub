import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  RegPrimaryButton,
  RegSecondaryButton,
} from '@/components/registration/RegControls';
import { RegShell } from '@/components/registration/RegShell';
import { RegColors } from '@/constants/registrationTheme';

export default function ProviderSubmittedScreen() {
  const router = useRouter();

  return (
    <RegShell
      onBack={() => router.replace('/(auth)/provider-pending' as Href)}
      step={9}
      totalSteps={9}
      title="Account Created"
      subtitle="Your provider profile is being reviewed.">
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={64} color={RegColors.success} />
      </View>
      <Text style={styles.body}>
        Thank you for registering as a ServiceHub service provider. Your application has been
        submitted for verification. You will be notified once your account has been reviewed.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What happens next?</Text>
        <Text style={styles.cardBody}>
          Your account stays pending until verification is complete. You will not appear as an
          active provider until approved.
        </Text>
      </View>
      <RegPrimaryButton
        label="Go to Provider Dashboard"
        onPress={() => router.replace('/(provider)/(tabs)')}
      />
      <RegSecondaryButton
        label="View verification status"
        onPress={() => router.replace('/(auth)/provider-pending' as Href)}
      />
    </RegShell>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', marginBottom: 4 },
  body: { color: RegColors.whiteSoft, textAlign: 'center', lineHeight: 22, fontSize: 14 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    gap: 6,
  },
  cardTitle: { color: RegColors.white, fontWeight: '800' },
  cardBody: { color: RegColors.whiteMuted, lineHeight: 20, fontSize: 13 },
});
