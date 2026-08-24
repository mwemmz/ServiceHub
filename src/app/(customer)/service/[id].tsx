import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProviderCard } from '@/components/ProviderCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAppLocation } from '@/context/LocationContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getService } from '@/services/catalogService';
import { getProvidersForService } from '@/services/providerService';
import { formatKwacha } from '@/utils/format';

export default function ServiceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { location } = useAppLocation();
  const { data, loading, error, reload } = useAsyncData(async () => {
    const service = await getService(id);
    const providers = await getProvidersForService(id, location);
    return { service, providers };
  }, [id, location?.latitude, location?.longitude]);

  if (loading && !data) return <LoadingState />;
  if (error || !data?.service) return <ErrorState message={error ?? 'Service not found.'} onRetry={reload} />;

  const { service, providers } = data;

  return (
    <Screen scroll>
      <ScreenHeader title={service.name} subtitle={service.group} />
      <Text style={styles.body}>{service.description}</Text>
      <View style={styles.meta}>
        <Text style={styles.price}>From {formatKwacha(service.startingPrice)}</Text>
        <Text style={styles.muted}>{service.durationMinutes} mins typical</Text>
        <Text style={styles.muted}>{location ? location.address : 'Set a location to see distance and arrival estimates.'}</Text>
      </View>
      <Text style={styles.section}>Available providers</Text>
      <View style={styles.stack}>
        {providers.length === 0 ? (
          <EmptyState title="No providers yet" message="No one is offering this service in the current mock data." />
        ) : (
          providers.slice(0, 3).map((item) => (
            <ProviderCard
              key={item.user.id}
              item={item}
              serviceName={service.name}
              onPress={() => router.push(`/(customer)/provider/${item.user.id}?serviceId=${service.id}`)}
            />
          ))
        )}
      </View>
      <PrimaryButton
        label="See all providers"
        onPress={() => router.push(`/(customer)/providers?serviceId=${service.id}`)}
        style={{ marginTop: 16 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { color: Colors.textMuted, lineHeight: 22, marginTop: 8 },
  meta: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: 16, marginTop: 16, gap: 6 },
  price: { color: Colors.accent, fontSize: FontSize.lg, fontWeight: '800' },
  muted: { color: Colors.textMuted },
  section: { marginTop: 22, marginBottom: 10, color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
  stack: { gap: 12 },
});
