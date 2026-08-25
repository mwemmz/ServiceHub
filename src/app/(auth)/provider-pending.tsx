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
import { useAuth } from '@/context/AuthContext';

export default function ProviderPendingScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();

  async function onSignOut() {
    await logout();
    router.replace('/(auth)/welcome');
  }

  return (
    <RegShell
      onBack={onSignOut}
      step={9}
      totalSteps={9}
      title="Pending Verification"
      subtitle={
        user?.fullName
          ? `Hi ${user.fullName.split(' ')[0]}, your provider application is under review.`
          : 'Your provider application is under review.'
      }>
      <View style={styles.badge}>
        <Ionicons name="hourglass-outline" size={36} color={RegColors.amber} />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status</Text>
        <Text style={styles.status}>Awaiting review</Text>
        <Text style={styles.cardBody}>
          You are not listed as an active provider yet. Keep an eye on your email or phone for
          updates.
        </Text>
      </View>
      <RegPrimaryButton
        label="Open Provider Dashboard"
        onPress={() => router.replace('/(provider)/(tabs)')}
      />
      <RegSecondaryButton
        label="Refresh status"
        onPress={() => router.replace('/(auth)/provider-pending' as Href)}
      />
      <RegSecondaryButton label="Sign Out" onPress={onSignOut} />
    </RegShell>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(232,168,106,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    gap: 6,
  },
  cardTitle: { color: RegColors.whiteMuted, fontWeight: '700', fontSize: 12 },
  status: { color: RegColors.amber, fontWeight: '800', fontSize: 18 },
  cardBody: { color: RegColors.whiteSoft, lineHeight: 20, fontSize: 13 },
});
