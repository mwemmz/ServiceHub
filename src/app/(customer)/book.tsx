import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { PriceBreakdownView } from '@/components/PriceBreakdownView';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAppLocation } from '@/context/LocationContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { clearPersistedState, usePersistedState } from '@/hooks/usePersistedState';
import { getProviderById } from '@/services/providerService';
import { getService } from '@/services/catalogService';
import { createBooking } from '@/services/bookingService';
import { StorageKeys } from '@/services/storage';
import { calculatePrice } from '@/utils/format';

type BookingDraft = {
  providerId: string;
  serviceId: string;
  notes: string;
  when: string;
};

export default function BookScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useAppLocation();
  const { providerId, serviceId } = useLocalSearchParams<{ providerId: string; serviceId: string }>();
  const draftKey = useMemo(
    () => `${StorageKeys.draftBooking}:${providerId}:${serviceId}`,
    [providerId, serviceId],
  );
  const defaultWhen = new Date(Date.now() + 1000 * 60 * 60).toISOString().slice(0, 16);
  const [draft, setDraft] = usePersistedState<BookingDraft>(draftKey, {
    providerId: providerId ?? '',
    serviceId: serviceId ?? '',
    notes: 'Please call when you arrive.',
    when: defaultWhen,
  });
  const notes = draft.providerId === providerId && draft.serviceId === serviceId ? draft.notes : 'Please call when you arrive.';
  const when = draft.providerId === providerId && draft.serviceId === serviceId ? draft.when : defaultWhen;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submittingRef = useRef(false);

  const { data, loading: pageLoading, error: pageError, reload } = useAsyncData(async () => {
    const [provider, service] = await Promise.all([getProviderById(providerId), getService(serviceId)]);
    const offer = provider?.profile.services.find((item) => item.serviceId === serviceId);
    return { provider, service, offer };
  }, [providerId, serviceId]);

  if (pageLoading && !data) return <LoadingState />;
  if (pageError || !data?.provider || !data.service) {
    return <ErrorState message={pageError ?? 'Could not load booking details.'} onRetry={reload} />;
  }

  const price = calculatePrice(data.offer?.price ?? data.service.startingPrice);

  async function confirm() {
    if (!location) {
      setError('Please set your location before booking.');
      return;
    }
    if (loading || submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError('');
    try {
      const booking = await createBooking({
        customerId: user!.id,
        providerId,
        serviceId,
        scheduledAt: new Date(when).toISOString(),
        notes,
        location,
      });
      await clearPersistedState(draftKey);
      router.replace(`/(customer)/booking/${booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create booking.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <ScreenHeader title="Confirm booking" subtitle="Review the details, then send your request." />
      <View style={styles.card}>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{data.service.name}</Text>
        <Text style={styles.label}>Provider</Text>
        <Text style={styles.value}>{data.provider.user.fullName}</Text>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{location?.address ?? 'Location not set'}</Text>
      </View>
      <InputField
        label="Date and time"
        value={when}
        onChangeText={(value) =>
          setDraft((prev) => ({
            ...prev,
            providerId: providerId ?? '',
            serviceId: serviceId ?? '',
            when: value,
          }))
        }
      />
      <InputField
        label="Notes"
        value={notes}
        onChangeText={(value) =>
          setDraft((prev) => ({
            ...prev,
            providerId: providerId ?? '',
            serviceId: serviceId ?? '',
            notes: value,
          }))
        }
        multiline
      />
      <View style={styles.card}>
        <PriceBreakdownView price={price} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Confirm Booking" onPress={confirm} loading={loading} />
      <SecondaryButton label="Cancel" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: 16, gap: 6, marginVertical: 10 },
  label: { color: Colors.textMuted, marginTop: 6, fontSize: FontSize.sm },
  value: { color: Colors.charcoal, fontWeight: '700' },
  error: { color: Colors.error, marginBottom: 8 },
});
