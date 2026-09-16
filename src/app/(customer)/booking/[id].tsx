import { Linking, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusTimeline } from '@/components/StatusTimeline';
import { PriceBreakdownView } from '@/components/PriceBreakdownView';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { getBookingById, updateBookingStatus } from '@/services/bookingService';
import { getService } from '@/services/catalogService';
import { getProviderById } from '@/services/providerService';
import { formatDateTime } from '@/utils/format';
import { getReviewForBooking } from '@/services/reviewService';
import { useAuth } from '@/context/AuthContext';

export default function BookingStatusScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { data, loading, error, reload } = useAsyncData(async () => {
    const booking = await getBookingById(id);
    if (!booking) return null;
    const [service, provider, review] = await Promise.all([
      getService(booking.serviceId),
      getProviderById(booking.providerId),
      getReviewForBooking(booking.id, user!.id),
    ]);
    return { booking, service, provider, review };
  }, [id, user?.id]);

  // Live: refresh this screen when the provider changes the status.
  useSocketEvents('booking-status-update', reload);

  if (loading && !data) return <LoadingState />;
  if (error || !data?.booking) return <ErrorState message={error ?? 'Booking not found.'} onRetry={reload} />;

  const { booking, service, provider, review } = data;
  const canTrack = ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(booking.status);

  return (
    <Screen scroll>
      <ScreenHeader title={service?.name ?? 'Booking'} subtitle={provider?.user.fullName} />
      <StatusBadge status={booking.status} />
      <View style={styles.card}>
        <StatusTimeline status={booking.status} />
      </View>
      <Text style={styles.meta}>{formatDateTime(booking.scheduledAt)}</Text>
      <Text style={styles.meta}>{booking.location.address}</Text>
      {booking.notes ? <Text style={styles.notes}>Notes: {booking.notes}</Text> : null}
      <View style={styles.card}>
        <PriceBreakdownView price={booking.price} />
      </View>
      {canTrack ? (
        <PrimaryButton label="Track provider" onPress={() => router.push(`/(customer)/tracking/${booking.id}`)} />
      ) : null}
      <SecondaryButton label="Chat" onPress={() => router.push(`/(customer)/chat/${booking.id}`)} />
      {provider?.user.phone ? (
        <SecondaryButton label="Call provider" onPress={() => Linking.openURL(`tel:${provider.user.phone}`)} />
      ) : null}
      {booking.status === 'completed' && !review ? (
        <PrimaryButton label="Leave a review" onPress={() => router.push(`/(customer)/review/${booking.id}`)} />
      ) : null}
      {booking.status === 'completed' ? (
        <SecondaryButton
          label="Pay now"
          onPress={() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.push(`/(customer)/payment/${booking.id}` as any);
          }}
        />
      ) : null}
      {booking.status !== 'cancelled' ? (
        <SecondaryButton
          label="Report a problem"
          onPress={() => router.push(`/(customer)/dispute/${booking.id}`)}
        />
      ) : null}
      {booking.status !== 'completed' && booking.status !== 'cancelled' ? (
        <SecondaryButton label="Cancel booking" onPress={() => setShowCancel(true)} />
      ) : null}
      <ConfirmDialog
        visible={showCancel}
        title="Cancel this request?"
        message="The provider will be notified."
        confirmLabel="Cancel request"
        cancelLabel="Keep booking"
        loading={cancelling}
        onCancel={() => {
          if (!cancelling) setShowCancel(false);
        }}
        onConfirm={async () => {
          setCancelling(true);
          try {
            await updateBookingStatus(booking.id, 'cancelled', 'Cancelled by customer');
            setShowCancel(false);
            reload();
          } catch {
            setShowCancel(false);
          } finally {
            setCancelling(false);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: 16, marginVertical: 14 },
  meta: { color: Colors.textMuted, marginTop: 4 },
  notes: { color: Colors.charcoal, marginTop: 10, fontSize: FontSize.md },
});
