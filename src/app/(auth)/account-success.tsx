import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RegPrimaryButton } from '@/components/registration/RegControls';
import { RegShell } from '@/components/registration/RegShell';
import { RegColors } from '@/constants/registrationTheme';
import { useAuth } from '@/context/AuthContext';

/** Shown after successful customer registration — then opens Service Categories. */
export default function AccountSuccessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const first = user?.fullName?.split(' ')[0] ?? 'there';

  return (
    <RegShell
      onBack={() => router.replace('/(customer)/categories' as Href)}
      step={4}
      totalSteps={4}
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
        onPress={() => router.replace('/(customer)/categories' as Href)}
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
