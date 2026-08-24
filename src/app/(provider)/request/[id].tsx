import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { PriceBreakdownView } from '@/components/PriceBreakdownView';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBookingById, updateBookingStatus } from '@/services/bookingService';
import { getService } from '@/services/catalogService';
import { getUsers } from '@/services/localDb';
import { formatDateTime } from '@/utils/format';

export default function ProviderRequestScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useAsyncData(async () => {
    const booking = await getBookingById(id);
    if (!booking) return null;
    const [service, users] = await Promise.all([getService(booking.serviceId), getUsers()]);
    return { booking, service, customer: users.find((item) => item.id === booking.customerId) };
  }, [id]);

  if (loading && !data) return <LoadingState />;
  if (error || !data?.booking) return <ErrorState message={error ?? 'Request not found.'} onRetry={reload} />;

  const { booking, service, customer } = data;

  return (
    <Screen scroll>
      <ScreenHeader title="Service request" subtitle={service?.name} />
      <View style={styles.card}>
        <Text style={styles.label}>Customer</Text>
        <Text style={styles.value}>{customer?.fullName}</Text>
        <Text style={styles.label}>When</Text>
        <Text style={styles.value}>{formatDateTime(booking.scheduledAt)}</Text>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{booking.location.address}</Text>
        {booking.notes ? <Text style={styles.notes}>{booking.notes}</Text> : null}
      </View>
      <View style={styles.card}>
        <PriceBreakdownView price={booking.price} />
      </View>
      <PrimaryButton
        label="Accept"
        onPress={async () => {
          await updateBookingStatus(booking.id, 'accepted');
          router.replace(`/(provider)/job/${booking.id}`);
        }}
      />
      <SecondaryButton
        label="Reject"
        onPress={async () => {
          await updateBookingStatus(booking.id, 'cancelled', 'Rejected by provider');
          router.replace('/(provider)/(tabs)/requests');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: 16, marginBottom: 14, gap: 4 },
  label: { color: Colors.textMuted, marginTop: 8, fontSize: FontSize.sm },
  value: { color: Colors.charcoal, fontWeight: '700' },
  notes: { color: Colors.charcoal, marginTop: 10 },
});
