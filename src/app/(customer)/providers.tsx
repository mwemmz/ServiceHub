import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProviderCard } from '@/components/ProviderCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAppLocation } from '@/context/LocationContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useResponsive } from '@/hooks/useResponsive';
import { getService } from '@/services/catalogService';
import { getProvidersForService } from '@/services/providerService';
import type { ProviderSort } from '@/types';

const SORTS: { key: ProviderSort; label: string }[] = [
  { key: 'rating', label: 'Rating' },
  { key: 'distance', label: 'Distance' },
  { key: 'price', label: 'Price' },
  { key: 'availability', label: 'Availability' },
];

export default function ProvidersScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { location } = useAppLocation();
  const [sort, setSort] = useState<ProviderSort>('rating');
  const { isWide, columns, colWidth } = useResponsive();
  const cols = columns([1, 2, 2, 3]);
  const { data, loading, error, reload } = useAsyncData(async () => {
    const service = await getService(serviceId);
    const providers = await getProvidersForService(serviceId, location, sort);
    return { service, providers };
  }, [serviceId, sort, location?.latitude, location?.longitude]);

  if (loading && !data) return <LoadingState />;
  if (error || !data?.service) return <ErrorState message={error ?? 'Service not found.'} onRetry={reload} />;

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHeader title="Choose a provider" subtitle={data.service.name} />
        <View style={styles.sorts}>
          {SORTS.map((item) => (
            <Pressable key={item.key} onPress={() => setSort(item.key)} style={[styles.chip, sort === item.key && styles.chipOn]}>
              <Text style={[styles.chipText, sort === item.key && styles.chipTextOn]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {data.providers.length === 0 ? (
          <EmptyState title="No providers" message="Nobody is offering this service yet." />
        ) : (
          <View style={[styles.grid, isWide && styles.gridWrap]}>
            {data.providers.map((item) => (
              <View key={item.user.id} style={{ width: colWidth(cols), minWidth: 0 }}>
                <ProviderCard
                  item={item}
                  serviceName={data.service?.name}
                  onPress={() => router.push(`/(customer)/provider/${item.user.id}?serviceId=${serviceId}`)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sorts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { backgroundColor: Colors.surface, borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: Colors.accent },
  chipText: { color: Colors.textMuted, fontWeight: '700', fontSize: FontSize.sm },
  chipTextOn: { color: '#FFFFFF' },
  list: { padding: 16, paddingBottom: 40 },
  grid: { gap: 12 },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
