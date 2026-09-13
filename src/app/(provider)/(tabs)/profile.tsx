import { StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { GlassPanel } from '@/components/GlassPanel';
import { ProfileMenuRow } from '@/components/ProfileMenuRow';
import { Colors, FontSize } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSignOut } from '@/hooks/useSignOut';
import { formatKwacha } from '@/utils/format';

export default function ProviderProfile() {
  const router = useRouter();
  const { user, providerProfile } = useAuth();
  const { signOut, signingOut } = useSignOut();

  function open(href: Href) {
    router.push(href);
  }

  return (
    <AppShell edges={['top']} contentStyle={styles.content}>
      <View style={styles.header}>
        <Avatar name={user?.fullName ?? 'You'} size={72} />
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.meta}>{providerProfile?.bio || 'Add a short bio in profile setup.'}</Text>
        <Text style={styles.meta}>
          {formatKwacha(providerProfile?.earningsThisWeek ?? 0)} earned this week ·{' '}
          {providerProfile?.rating.toFixed(1)} rating
        </Text>
      </View>
      <GlassPanel borderRadius={24} contentStyle={styles.panel}>
        <ProfileMenuRow icon="construct-outline" label="Services & prices" onPress={() => open('/(provider)/services')} />
        <ProfileMenuRow icon="time-outline" label="Availability" onPress={() => open('/(provider)/availability')} />
        <ProfileMenuRow icon="location-outline" label="Service area" onPress={() => open('/(provider)/setup')} />
        <ProfileMenuRow icon="star-outline" label="Reviews" onPress={() => open('/(provider)/reviews')} />
        <ProfileMenuRow icon="ribbon-outline" label="Skills passport" onPress={() => open('/(provider)/certifications')} />
        <ProfileMenuRow icon="checkmark-done-outline" label="Work history" onPress={() => open('/(provider)/work-history')} />
        <ProfileMenuRow icon="shield-checkmark-outline" label="Verify jobs" onPress={() => open('/(provider)/endorsements')} />
        <ProfileMenuRow icon="people-outline" label="My crews" onPress={() => open('/(provider)/crews')} />
        <ProfileMenuRow icon="shield-outline" label="Reports & disputes" onPress={() => open('/(provider)/reports')} />
        <ProfileMenuRow icon="analytics-outline" label="Insights" onPress={() => open('/(provider)/insights')} />
        <ProfileMenuRow icon="card-outline" label="National ID" onPress={() => open('/(provider)/national-id')} />
        <ProfileMenuRow icon="settings-outline" label="Settings" onPress={() => open('/(provider)/settings')} />
        <ProfileMenuRow icon="help-circle-outline" label="Help" onPress={() => open('/(provider)/help')} />
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
  header: { alignItems: 'center', paddingVertical: 18, gap: 6 },
  name: { color: Colors.charcoal, fontSize: FontSize.xl, fontWeight: '800' },
  meta: { color: Colors.whiteSoft, textAlign: 'center' },
  panel: { padding: 10, gap: 8 },
});
