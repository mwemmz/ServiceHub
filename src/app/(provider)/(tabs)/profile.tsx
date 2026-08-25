import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { GlassPanel } from '@/components/GlassPanel';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { formatKwacha } from '@/utils/format';

export default function ProviderProfile() {
  const router = useRouter();
  const { user, providerProfile, logout } = useAuth();

  return (
    <AppShell edges={['top']}>
      <View style={styles.header}>
        <Avatar name={user?.fullName ?? 'You'} size={72} />
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.meta}>{providerProfile?.bio || 'Add a short bio in profile setup.'}</Text>
        <Text style={styles.meta}>
          {formatKwacha(providerProfile?.earningsThisWeek ?? 0)} earned this week ·{' '}
          {providerProfile?.rating.toFixed(1)} rating
        </Text>
      </View>
      <GlassPanel borderRadius={24} style={styles.panel}>
        <Row icon="construct-outline" label="Services & prices" onPress={() => router.push('/(provider)/services')} />
        <Row icon="time-outline" label="Availability" onPress={() => router.push('/(provider)/availability')} />
        <Row icon="location-outline" label="Service area" onPress={() => router.push('/(provider)/setup')} />
        <Row icon="star-outline" label="Reviews" onPress={() => router.push('/(provider)/reviews')} />
        <Row icon="settings-outline" label="Settings" onPress={() => router.push('/(provider)/settings')} />
        <Row icon="help-circle-outline" label="Help" onPress={() => router.push('/(provider)/help')} />
        <Row
          icon="log-out-outline"
          label="Log out"
          danger
          onPress={() =>
            Alert.alert('Log out?', 'You can sign back in at any time.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Log out',
                style: 'destructive',
                onPress: async () => {
                  await logout();
                  router.replace('/(auth)/welcome');
                },
              },
            ])
          }
        />
      </GlassPanel>
    </AppShell>
  );
}

function Row({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Ionicons name={icon} size={20} color={danger ? Colors.error : Colors.accent} />
      <Text style={[styles.rowLabel, danger && { color: Colors.error }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 18, gap: 6 },
  name: { color: Colors.charcoal, fontSize: FontSize.xl, fontWeight: '800' },
  meta: { color: Colors.whiteSoft, textAlign: 'center' },
  panel: { padding: 10, gap: 8 },
  row: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  rowLabel: { flex: 1, color: Colors.charcoal, fontWeight: '700' },
});
