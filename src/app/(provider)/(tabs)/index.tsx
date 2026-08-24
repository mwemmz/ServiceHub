import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { BookingCard } from '@/components/BookingCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Colors, FontSize, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBookingsForUser, isActiveStatus } from '@/services/bookingService';
import { setProviderOnline } from '@/services/providerService';
import { getService } from '@/services/catalogService';
import { getUsers } from '@/services/localDb';
import { firstName, formatKwacha, greetingForNow } from '@/utils/format';

export default function ProviderDashboard() {
  const router = useRouter();
  const { user, providerProfile, refresh } = useAuth();
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [bookings, users] = await Promise.all([getBookingsForUser(user!.id, 'provider'), getUsers()]);
    const decorated = await Promise.all(
      bookings.map(async (booking) => ({
        booking,
        serviceName: (await getService(booking.serviceId))?.name,
        counterpartName: users.find((item) => item.id === booking.customerId)?.fullName,
      })),
    );
    return decorated;
  }, [user?.id]);

  if (loading && !data) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={reload} />;

  const requests = data.filter((item) => item.booking.status === 'waiting_for_provider');
  const active = data.filter((item) => isActiveStatus(item.booking.status) && item.booking.status !== 'waiting_for_provider');
  const today = new Date().toDateString();
  const todaysJobs = data.filter((item) => new Date(item.booking.scheduledAt).toDateString() === today);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>
              {greetingForNow()}, {firstName(user?.fullName ?? '')}
            </Text>
            <Text style={styles.sub}>{providerProfile?.serviceArea || 'Complete your provider profile'}</Text>
          </View>
          <Avatar name={user?.fullName ?? 'You'} size={48} />
        </View>

        <Pressable
          style={[styles.online, providerProfile?.isOnline && styles.onlineOn]}
          onPress={async () => {
            if (!user) return;
            await setProviderOnline(user.id, !providerProfile?.isOnline);
            await refresh();
          }}>
          <Text style={[styles.onlineText, providerProfile?.isOnline && styles.onlineTextOn]}>
            {providerProfile?.isOnline ? 'Online — receiving requests' : 'Go Online'}
          </Text>
        </Pressable>

        <View style={styles.stats}>
          <Stat label="Requests" value={String(requests.length)} onPress={() => router.push('/(provider)/(tabs)/requests')} />
          <Stat label="Active jobs" value={String(active.length)} onPress={() => router.push('/(provider)/(tabs)/jobs')} />
          <Stat label="This week" value={formatKwacha(providerProfile?.earningsThisWeek ?? 0)} />
        </View>
        <Text style={styles.rating}>Rating {providerProfile?.rating.toFixed(1) ?? '—'} · {providerProfile?.completedJobs ?? 0} jobs</Text>

        <Pressable style={styles.linkCard} onPress={() => router.push('/(provider)/services')}>
          <Text style={styles.linkTitle}>Manage services & prices</Text>
        </Pressable>
        <Pressable style={styles.linkCard} onPress={() => router.push('/(provider)/availability')}>
          <Text style={styles.linkTitle}>Manage availability</Text>
        </Pressable>

        <Text style={styles.section}>Today's jobs</Text>
        {todaysJobs.length === 0 ? (
          <Text style={styles.sub}>No jobs scheduled for today.</Text>
        ) : (
          todaysJobs.map((item) => (
            <BookingCard
              key={item.booking.id}
              booking={item.booking}
              serviceName={item.serviceName}
              counterpartName={item.counterpartName}
              onPress={() => router.push(`/(provider)/job/${item.booking.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 40, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hello: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800' },
  sub: { color: Colors.textMuted },
  online: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: 16, alignItems: 'center' },
  onlineOn: { backgroundColor: '#E4F3EA' },
  onlineText: { color: Colors.charcoal, fontWeight: '800' },
  onlineTextOn: { color: Colors.success },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radii.md, padding: 12 },
  statValue: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.lg },
  statLabel: { color: Colors.textMuted, marginTop: 4, fontSize: FontSize.xs },
  rating: { color: Colors.charcoal, fontWeight: '700' },
  linkCard: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: 16 },
  linkTitle: { color: Colors.accent, fontWeight: '800' },
  section: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800', marginTop: 8 },
});
