import { StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { GlassPanel } from '@/components/GlassPanel';
import { ProfileMenuRow } from '@/components/ProfileMenuRow';
import { Colors, FontSize } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSignOut } from '@/hooks/useSignOut';

export default function CustomerProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const { signOut, signingOut } = useSignOut();

  function open(href: Href) {
    router.push(href);
  }

  function openTab(tab: 'bookings' | 'notifications') {
    router.navigate(`/(customer)/(tabs)/${tab}` as Href);
  }

  return (
    <AppShell edges={['top']} contentStyle={styles.content}>
      <View style={styles.header}>
        <Avatar name={user?.fullName ?? 'You'} uri={user?.avatarUri} size={72} />
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>{user?.phone}</Text>
      </View>
      <GlassPanel borderRadius={24} contentStyle={styles.panel}>
        <ProfileMenuRow icon="location-outline" label="Saved locations" onPress={() => open('/(customer)/location')} />
        <ProfileMenuRow icon="calendar-outline" label="Booking history" onPress={() => openTab('bookings')} />
        <ProfileMenuRow icon="notifications-outline" label="Notifications" onPress={() => openTab('notifications')} />
        <ProfileMenuRow icon="card-outline" label="National ID" onPress={() => open('/(customer)/national-id')} />
        <ProfileMenuRow icon="shield-outline" label="My reports" onPress={() => open('/(customer)/reports')} />
        <ProfileMenuRow icon="settings-outline" label="Settings" onPress={() => open('/(customer)/settings')} />
        <ProfileMenuRow icon="help-circle-outline" label="Help" onPress={() => open('/(customer)/help')} />
        <ProfileMenuRow
          icon="log-out-outline"
          label="Log out"
          danger
          disabled={signingOut}
          onPress={() => void signOut()}
        />
      </GlassPanel>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 110 },
  header: { alignItems: 'center', paddingVertical: 18, gap: 4 },
  name: { color: Colors.charcoal, fontSize: FontSize.xl, fontWeight: '800', marginTop: 8 },
  meta: { color: Colors.whiteSoft },
  panel: { padding: 10, gap: 8 },
});
