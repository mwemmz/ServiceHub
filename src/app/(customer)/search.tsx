import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchBar } from '@/components/SearchBar';
import { ServiceCard } from '@/components/ServiceCard';
import { ProviderCard } from '@/components/ProviderCard';
import { EmptyState } from '@/components/EmptyState';
import { Colors, FontSize } from '@/constants/theme';
import { useAppLocation } from '@/context/LocationContext';
import { searchCatalog } from '@/services/catalogService';
import { searchProviders } from '@/services/providerService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useResponsive } from '@/hooks/useResponsive';

export default function SearchScreen() {
  const router = useRouter();
  const { location } = useAppLocation();
  const { isWide, columns, colWidth } = useResponsive();
  const serviceCols = columns([1, 2, 3, 4]);
  const providerCols = columns([1, 2, 2, 3]);
  const [query, setQuery] = useState('');
  const { data, loading } = useAsyncData(async () => {
    if (!query.trim()) return { services: [], providers: [] };
    const [services, providers] = await Promise.all([searchCatalog(query), searchProviders(query, location)]);
    return { services, providers };
  }, [query, location?.latitude, location?.longitude]);

  const empty = useMemo(() => query.trim().length > 0 && !loading && data && data.services.length === 0 && data.providers.length === 0, [query, loading, data]);

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHeader title="Search" subtitle="Find a service or a provider." />
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search haircuts, plumbing, gardening..." />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {!query.trim() ? (
          <EmptyState icon="search-outline" title="Search ServiceHub" message="Try haircuts, phone repair, gardening or a provider name." />
        ) : empty ? (
          <EmptyState title="No matches" message="Try another service name. Search looks through all subcategories, not only the three main groups." />
        ) : (
          <>
            {data?.services.length ? <Text style={styles.section}>Services</Text> : null}
            <View style={[styles.grid, isWide && styles.gridWrap]}>
              {data?.services.map((service) => (
                <View key={service.id} style={{ width: colWidth(serviceCols), minWidth: 0 }}>
                  <ServiceCard service={service} onPress={() => router.push(`/(customer)/service/${service.id}`)} />
                </View>
              ))}
            </View>
            {data?.providers.length ? <Text style={styles.section}>Providers</Text> : null}
            <View style={[styles.grid, isWide && styles.gridWrap]}>
              {data?.providers.map((item) => (
                <View key={item.user.id} style={{ width: colWidth(providerCols), minWidth: 0 }}>
                  <ProviderCard item={item} onPress={() => router.push(`/(customer)/provider/${item.user.id}`)} />
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
  grid: { gap: 12 },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  section: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800', marginTop: 8 },
});
