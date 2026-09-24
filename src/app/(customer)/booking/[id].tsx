import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { BackButton } from '@/components/BackButton';
import { StatusTimeline } from '@/components/StatusTimeline';
import { PriceBreakdownView } from '@/components/PriceBreakdownView';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { StatusBadge } from '@/components/StatusBadge';
import { ProviderCard } from '@/components/ProviderCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useSocketEvents } from '@/hooks/useSocketEvents';
import { getBookingById, rebookBooking, updateBookingStatus } from '@/services/bookingService';
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
  const [rebooking, setRebooking] = useState(false);
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

  // Fallback when the socket is throttled/offline: refetch on every focus and
  // poll every 15s while the booking is still in a live status so the customer
  // never stays stuck showing a stale "pending" state.
  useFocusEffect(
    useCallback(() => {
      reload();
      const timer = setInterval(() => {
        const status = data?.booking?.status;
        if (status && ['completed', 'cancelled'].includes(status)) return;
        reload();
      }, 15000);
      return () => clearInterval(timer);
    }, [reload, data?.booking?.status]),
  );

  if (loading && !data) return <LoadingState />;
  if (error || !data?.booking) return <ErrorState message={error ?? 'Booking not found.'} onRetry={reload} />;

  const { booking, service, provider, review } = data;
  const canTrack = ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(booking.status);

  return (
    <Screen scroll>
      <View style={styles.topHeader}>
        <BackButton fallbackHref={'/(customer)/(tabs)/bookings' as Href} />
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
        </View>
      </View>

      {/* Prominent booking reference ID */}
      <View style={styles.refCard}>
        <Text style={styles.refLabel}>Booking Reference ID</Text>
        <Text style={styles.refValue} numberOfLines={1}>{booking.id}</Text>
      </View>

      <StatusBadge status={booking.status} />

      <View style={styles.card}>
        <StatusTimeline status={booking.status} />
      </View>

      {/* Provider Summary Card using ProviderCard component */}
      {provider ? (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Assigned Provider</Text>
          <ProviderCard
            item={provider}
            serviceName={service?.name}
            onPress={() => router.push(`/(customer)/provider/${provider.user.id}`)}
          />
        </View>
      ) : null}

      {/* Appointment Details Section */}
      <View style={styles.card}>
        <Text style={styles.sectionHeading}>Appointment Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Service</Text>
          <Text style={styles.detailValue}>{service?.name ?? 'Service'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date & Time</Text>
          <Text style={styles.detailValue}>{formatDateTime(booking.scheduledAt)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailValue} numberOfLines={2}>{booking.location.address}</Text>
        </View>
        {booking.notes ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Notes</Text>
            <Text style={styles.detailValue}>{booking.notes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <PriceBreakdownView price={booking.price} />
      </View>

      <View style={styles.actionsWrap}>
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
              router.push(`/(customer)/payment/${booking.id}`);
            }}
          />
        ) : null}
        {booking.status === 'completed' ? (
          <SecondaryButton
            label="Book again"
            disabled={rebooking}
            onPress={async () => {
              setRebooking(true);
              try {
                const next = await rebookBooking(booking.id);
                router.push(`/(customer)/booking/${next.id}`);
              } catch {
                Alert.alert('Could not re-book', 'Please try again later.');
              } finally {
                setRebooking(false);
              }
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
      </View>

      {/* Floating "Booking Confirmed" card pinned near the bottom */}
      <View style={styles.floatingConfirmedCard}>
        <View style={styles.floatingHeader}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.floatingTitle}>Booking Confirmed</Text>
        </View>
        <Text style={styles.floatingText}>Your appointment is booked and scheduled.</Text>
        <Text style={styles.floatingId} numberOfLines={1}>ID: {booking.id}</Text>
      </View>

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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: Colors.charcoal,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  refCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    gap: 2,
  },
  refLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  refValue: {
    color: Colors.charcoal,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: 16, marginVertical: 8, borderWidth: 1, borderColor: Colors.border },
  sectionWrap: { marginVertical: 8, gap: 6 },
  sectionHeading: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.md, marginBottom: 4 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  detailLabel: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  detailValue: { color: Colors.charcoal, fontSize: FontSize.sm, fontWeight: '700', maxWidth: '65%', textAlign: 'right' },
  actionsWrap: { gap: 10, marginVertical: 14 },
  floatingConfirmedCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 10,
    marginBottom: 40,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingTitle: {
    color: Colors.charcoal,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  floatingText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  floatingId: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginTop: 2,
  },
  notes: { color: Colors.charcoal, marginTop: 10, fontSize: FontSize.md },
});
