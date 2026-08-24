import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingCard } from '@/components/BookingCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Colors, FontSize, Radii, Spacing } from '@/constants/theme';
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

  if (loading && !data) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={reload} />;

  const filtered = data.filter((item) => {
    if (tab === 'active') return isActiveStatus(item.booking.status);
    return item.booking.status === tab;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Bookings</Text>
      <View style={styles.tabs}>
        {(['active', 'completed', 'cancelled'] as Tab[]).map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabOn]}>
            <Text style={[styles.tabText, tab === item && styles.tabTextOn]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg },
  title: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800', marginTop: 8 },
  tabs: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  tab: { flex: 1, borderRadius: Radii.full, paddingVertical: 10, backgroundColor: Colors.surface, alignItems: 'center' },
  tabOn: { backgroundColor: Colors.accent },
  tabText: { color: Colors.textMuted, fontWeight: '700', textTransform: 'capitalize' },
  tabTextOn: { color: '#FFFFFF' },
  list: { gap: 12, paddingBottom: 32 },
});
