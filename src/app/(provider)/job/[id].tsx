import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusTimeline } from '@/components/StatusTimeline';
import { ServiceMap } from '@/components/ServiceMap';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { InputField } from '@/components/InputField';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBookingById, updateBookingStatus } from '@/services/bookingService';
import { getEndorsementForBooking, requestEndorsement } from '@/services/endorsementService';
import { getService } from '@/services/catalogService';
import { getProviderById } from '@/services/providerService';
import { getUsers } from '@/services/localDb';
import { formatDateTime, formatKwacha } from '@/utils/format';
import type { BookingStatus } from '@/types';

const NEXT: Partial<Record<BookingStatus, { label: string; status: BookingStatus }>> = {
  accepted: { label: 'On the Way', status: 'on_the_way' },
  on_the_way: { label: 'Arrived', status: 'arrived' },
  arrived: { label: 'Start Service', status: 'in_progress' },
  in_progress: { label: 'Complete Service', status: 'completed' },
};

export default function ProviderJobScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [peerEmail, setPeerEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const { data, loading, error, reload } = useAsyncData(async () => {
    const booking = await getBookingById(id);
    if (!booking) return null;
    const [service, users, provider, verification] = await Promise.all([
      getService(booking.serviceId),
      getUsers(),
      getProviderById(booking.providerId),
      getEndorsementForBooking(id),
    ]);
    return {
      booking,
      service,
      customer: users.find((item) => item.id === booking.customerId),
      provider,
      verification,
    };
  }, [id]);

  if (loading && !data) return <LoadingState />;
  if (error || !data?.booking) return <ErrorState message={error ?? 'Job not found.'} onRetry={reload} />;

  const { booking, service, customer, provider, verification } = data;
  const next = NEXT[booking.status];

  async function onRequestVerification() {
    if (!peerEmail.trim() || verifying) return;
    setVerifying(true);
    setVerifyError('');
    try {
      await requestEndorsement(booking.id, peerEmail.trim());
      setPeerEmail('');
      await reload();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Could not send the verification request.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Screen scroll>
      <ScreenHeader title={service?.name ?? 'Job'} subtitle={customer?.fullName} />
      <StatusTimeline status={booking.status} />
      <ServiceMap customer={booking.location} provider={provider?.profile.location} height={200} />
      <View style={styles.card}>
        <Text style={styles.label}>When</Text>
        <Text style={styles.value}>{formatDateTime(booking.scheduledAt)}</Text>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{booking.location.address}</Text>
        <Text style={styles.label}>Pay</Text>
        <Text style={styles.value}>{formatKwacha(booking.price.total)}</Text>
      </View>
      {next ? (
        <PrimaryButton
          label={next.label}
          onPress={async () => {
            await updateBookingStatus(booking.id, next.status);
            reload();
          }}
        />
      ) : null}

      {booking.status === 'completed' ? (
        <View style={[styles.card, styles.verifyCard]}>
          <Text style={styles.verifyTitle}>Verify this job</Text>
          {verification?.verified ? (
            <View style={styles.verifyRow}>
              <Text style={[styles.verifyStatus, { color: Colors.success }]}>
                Verified — {verification.customerReviewed ? 'customer review + peer confirmation done.' : 'peer confirmation done.'}
              </Text>
              {verification.note ? <Text style={styles.value}>{verification.note}</Text> : null}
            </View>
          ) : verification?.status === 'pending' && verification.peerEmail ? (
            <Text style={styles.verifyStatus}>
              Waiting for {verification.peerEmail} to confirm. This job counts as verified work history once they do.
            </Text>
          ) : (
            <>
              <Text style={styles.verifyHint}>
                Have another worker confirm this job so it counts as verified experience. Enter their account email.
              </Text>
              <InputField
                label="Fellow worker email"
                value={peerEmail}
                onChangeText={setPeerEmail}
                placeholder="worker@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {verification?.status === 'declined' ? (
                <Text style={styles.verifyHint}>The previous request was declined — you can ask someone else.</Text>
              ) : null}
              {verifyError ? <Text style={styles.error}>{verifyError}</Text> : null}
              <PrimaryButton
                label="Ask a worker to verify"
                onPress={onRequestVerification}
                loading={verifying}
                disabled={verifying}
              />
            </>
          )}
        </View>
      ) : null}

      <SecondaryButton label="Chat with customer" onPress={() => router.push(`/(provider)/chat/${booking.id}`)} />
      {customer?.phone ? (
        <SecondaryButton label="Call customer" onPress={() => Linking.openURL(`tel:${customer.phone}`)} />
      ) : null}
      <SecondaryButton
        label="Open in maps"
        onPress={() =>
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${booking.location.latitude},${booking.location.longitude}`,
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: 16, marginVertical: 14, gap: 4 },
  label: { color: Colors.textMuted, marginTop: 8, fontSize: FontSize.sm },
  value: { color: Colors.charcoal, fontWeight: '700' },
  verifyCard: { gap: 10 },
  verifyTitle: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '800' },
  verifyRow: { gap: 6 },
  verifyStatus: { color: Colors.charcoal, fontWeight: '700', fontSize: FontSize.sm },
  verifyHint: { color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 19 },
  error: { color: Colors.error, fontSize: FontSize.sm },
});
