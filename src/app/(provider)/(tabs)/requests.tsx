import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { BookingCard } from '@/components/BookingCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Colors, FontSize } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBookingsForUser } from '@/services/bookingService';
import { getService } from '@/services/catalogService';
import { getUsers } from '@/services/localDb';

export default function ProviderRequests() {
  const router = useRouter();
  const { user } = useAuth();
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
      <Text style={styles.title}>Requests</Text>
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
  list: { gap: 12 },
});
