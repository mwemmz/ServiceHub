import { Alert, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Avatar } from '@/components/Avatar';
import { ServiceMap } from '@/components/ServiceMap';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { BrandImages } from '@/constants/assets';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBookingById, updateBookingStatus } from '@/services/bookingService';
import { getProviderById } from '@/services/providerService';
import { getService } from '@/services/catalogService';
import { estimateArrivalMinutes } from '@/utils/format';
import { distanceKm } from '@/utils/geo';

export default function TrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useAsyncData(async () => {
    const booking = await getBookingById(id);
    if (!booking) return null;
    const [provider, service] = await Promise.all([
      getProviderById(booking.providerId),
      getService(booking.serviceId),
    ]);
    return { booking, provider, service };
  }, [id]);

  if (loading && !data) return <LoadingState />;
  if (error || !data?.booking || !data.provider) {
    return <ErrorState message={error ?? 'Tracking is unavailable for this booking.'} onRetry={reload} />;
  }

  const { booking, provider, service } = data;
  const km = distanceKm(provider.profile.location, booking.location);
  const eta = estimateArrivalMinutes(km);

  return (
    <Screen scroll>
      <ScreenHeader title={service?.name ?? 'Tracking'} subtitle="Provider location updates will be live once a backend is connected." />
      <Image source={BrandImages.tracking} style={styles.banner} resizeMode="cover" />
      <View style={styles.bannerCard}>
        <Text style={styles.bannerText}>Your professional is on the way</Text>
        <Text style={styles.eta}>{eta} min away</Text>
      </View>
      <ServiceMap customer={booking.location} provider={provider.profile.location} height={240} />
      <View style={styles.card}>
        <Avatar name={provider.user.fullName} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{provider.user.fullName}</Text>
          <Text style={styles.meta}>{provider.profile.rating.toFixed(1)} · Verified professional</Text>
        </View>
      </View>
      <PrimaryButton label="Chat" onPress={() => router.push(`/(customer)/chat/${booking.id}`)} />
      <SecondaryButton label="Call" onPress={() => Linking.openURL(`tel:${provider.user.phone}`)} />
      <SecondaryButton
        label="Cancel booking"
        onPress={() =>
          Alert.alert('Cancel this visit?', 'The provider will be notified.', [
            { text: 'Keep', style: 'cancel' },
            {
              text: 'Cancel',
              style: 'destructive',
              onPress: async () => {
                await updateBookingStatus(booking.id, 'cancelled', 'Cancelled while tracking');
                router.replace(`/(customer)/booking/${booking.id}`);
              },
            },
          ])
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { height: 140, borderRadius: Radii.lg, width: '100%', marginBottom: 12 },
  bannerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 12,
  },
  bannerText: { color: Colors.charcoal, fontWeight: '800' },
  eta: { color: Colors.accent, fontWeight: '700', marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 14,
    marginVertical: 14,
  },
  name: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.md },
  meta: { color: Colors.textMuted },
});
