import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { GlassPanel } from '@/components/GlassPanel';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function CustomerProfile() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <AppShell edges={['top']}>
      <View style={styles.header}>
        <Avatar name={user?.fullName ?? 'You'} uri={user?.avatarUri} size={72} />
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>{user?.phone}</Text>
      </View>
      <GlassPanel borderRadius={24} style={styles.panel}>
        <Row icon="location-outline" label="Saved locations" onPress={() => router.push('/(customer)/location')} />
        <Row icon="calendar-outline" label="Booking history" onPress={() => router.push('/(customer)/(tabs)/bookings')} />
        <Row icon="notifications-outline" label="Notifications" onPress={() => router.push('/(customer)/(tabs)/notifications')} />
        <Row icon="settings-outline" label="Settings" onPress={() => router.push('/(customer)/settings')} />
        <Row icon="help-circle-outline" label="Help" onPress={() => router.push('/(customer)/help')} />
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
  header: { alignItems: 'center', paddingVertical: 18, gap: 4 },
  name: { color: Colors.charcoal, fontSize: FontSize.xl, fontWeight: '800', marginTop: 8 },
  meta: { color: Colors.whiteSoft },
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
