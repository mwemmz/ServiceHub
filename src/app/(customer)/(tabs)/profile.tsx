import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { Colors, FontSize, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function CustomerProfile() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar name={user?.fullName ?? 'You'} uri={user?.avatarUri} size={72} />
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.meta}>{user?.email}</Text>
          <Text style={styles.meta}>{user?.phone}</Text>
        </View>
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
      </ScrollView>
    </SafeAreaView>
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
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 40, gap: 10 },
  header: { alignItems: 'center', paddingVertical: 18, gap: 4 },
  name: { color: Colors.charcoal, fontSize: FontSize.xl, fontWeight: '800', marginTop: 8 },
  meta: { color: Colors.textMuted },
  row: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: { flex: 1, color: Colors.charcoal, fontWeight: '700' },
});
