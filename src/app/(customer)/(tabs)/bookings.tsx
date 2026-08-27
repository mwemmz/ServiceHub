import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { BookingCard } from '@/components/BookingCard';
import { GlassPanel } from '@/components/GlassPanel';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBookingsForUser, isActiveStatus } from '@/services/bookingService';
import { getService } from '@/services/catalogService';
import { getUsers } from '@/services/localDb';

type Tab = 'active' | 'completed' | 'cancelled';

export default function CustomerBookings() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('active');
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [bookings, users] = await Promise.all([getBookingsForUser(user!.id, 'customer'), getUsers()]);
    return Promise.all(
      bookings.map(async (booking) => ({
        booking,
        serviceName: (await getService(booking.serviceId))?.name,
        counterpartName: users.find((item) => item.id === booking.providerId)?.fullName,
      })),
    );
  }, [user?.id]);

  if (loading && !data) {
    return (
      <AppShell scroll={false} edges={['top']}>
        <LoadingState />
      </AppShell>
    );
  }
  if (error || !data) {
    return (
      <AppShell scroll={false} edges={['top']}>
        <ErrorState message={error ?? undefined} onRetry={reload} />
      </AppShell>
    );
  }

  const filtered = data.filter((item) => {
    if (tab === 'active') return isActiveStatus(item.booking.status);
    return item.booking.status === tab;
  });

  return (
    <AppShell edges={['top']}>
      <Text style={styles.title}>Bookings</Text>
      <GlassPanel borderRadius={Radii.full} contentStyle={styles.tabs}>
        {(['active', 'completed', 'cancelled'] as Tab[]).map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabOn]}>
            <Text style={[styles.tabText, tab === item && styles.tabTextOn]}>{item}</Text>
          </Pressable>
        ))}
      </GlassPanel>
      <View style={styles.list}>
        {filtered.length === 0 ? (
          <EmptyState title="Nothing here yet" message="Your bookings will appear in this list." />
        ) : (
          filtered.map((item) => (
            <BookingCard
              key={item.booking.id}
              booking={item.booking}
              serviceName={item.serviceName}
              counterpartName={item.counterpartName}
              onPress={() => router.push(`/(customer)/booking/${item.booking.id}`)}
            />
          ))
        )}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  title: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800', marginTop: 8, marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 8, padding: 6, marginBottom: 16 },
  tab: {
    flex: 1,
    borderRadius: Radii.full,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  tabOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabText: { color: Colors.whiteSoft, fontWeight: '700', textTransform: 'capitalize' },
  tabTextOn: { color: Colors.onAccent },
  list: { gap: 12, paddingBottom: 8 },
});
