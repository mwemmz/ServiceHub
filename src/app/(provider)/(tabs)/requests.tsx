import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { BookingCard } from '@/components/BookingCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Colors, FontSize } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { getBookingsForUser } from '@/services/bookingService';
import { getService } from '@/services/catalogService';
import { getUsers } from '@/services/localDb';
import { socketService } from '@/services/socketService';

export default function ProviderRequests() {
  const router = useRouter();
  const { user } = useAuth();
  const [live, setLive] = useState(socketService.isConnected());
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [bookings, users] = await Promise.all([getBookingsForUser(user!.id, 'provider'), getUsers()]);
    return Promise.all(
      bookings
        .filter((item) => item.status === 'waiting_for_provider' || item.status === 'request_sent')
        .map(async (booking) => ({
          booking,
          serviceName: (await getService(booking.serviceId))?.name,
          counterpartName: users.find((item) => item.id === booking.customerId)?.fullName,
        })),
    );
  }, [user?.id]);

  // Refresh whenever the tab regains focus (fallback if the socket is down).
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Live delivery: a new request or any status change refetches this list instantly.
  useSocketEvents(['new-booking', 'booking-status-update'], reload);

  useEffect(() => {
    const on = () => setLive(true);
    const off = () => setLive(false);
    setLive(socketService.isConnected());
    socketService.on('connect', on);
    socketService.on('disconnect', off);
    return () => {
      socketService.off('connect', on);
      socketService.off('disconnect', off);
    };
  }, []);

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

  return (
    <AppShell edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Requests</Text>
        {live ? (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.list}>
        {data.length === 0 ? (
          <EmptyState title="No new requests" message="New customer requests will appear here." />
        ) : (
          data.map((item) => (
            <BookingCard
              key={item.booking.id}
              booking={item.booking}
              serviceName={item.serviceName}
              counterpartName={item.counterpartName}
              onPress={() => router.push(`/(provider)/request/${item.booking.id}`)}
            />
          ))
        )}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  title: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800', marginTop: 8, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
    marginBottom: 12,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { color: Colors.success, fontSize: FontSize.xs, fontWeight: '700' },
  list: { gap: 12 },
});
