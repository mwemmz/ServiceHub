import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchBar } from '@/components/SearchBar';
import { ServiceCard } from '@/components/ServiceCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { Colors, FontSize } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useResponsive } from '@/hooks/useResponsive';
import { getCategory, getServicesForCategory } from '@/services/catalogService';
import type { CategoryId } from '@/types';

export default function CategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: CategoryId }>();
  const [query, setQuery] = useState('');
  const { isWide, columns, colWidth } = useResponsive();
  const cols = columns([1, 2, 3, 4]);
  const { data, loading, error, reload } = useAsyncData(async () => {
    const category = await getCategory(id);
    const services = await getServicesForCategory(id);
    return { category, services };
  }, [id]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term || !data) return data?.services ?? [];
    return data.services.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.group.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term),
    );
  }, [data, query]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((service) => {
      const list = map.get(service.group) ?? [];
      list.push(service);
      map.set(service.group, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  if (loading && !data) return <LoadingState />;
  if (error || !data?.category) return <ErrorState message={error ?? 'Category not found.'} onRetry={reload} />;

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHeader title={data.category.name} subtitle={data.category.description} />
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search this category..." />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {groups.length === 0 ? (
          <EmptyState title="No matching services" message="Try a different search term." />
        ) : (
          groups.map(([group, services]) => (
            <View key={group} style={styles.group}>
              <Text style={styles.groupTitle}>{group}</Text>
              <View style={[styles.services, isWide && styles.servicesWrap]}>
                {services.map((service) => (
                  <View key={service.id} style={{ width: colWidth(cols), minWidth: 0 }}>
                    <ServiceCard
                      service={service}
                      onPress={() => router.push(`/(customer)/service/${service.id}`)}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 16, paddingBottom: 40 },
  group: { gap: 10 },
  services: { gap: 10 },
  servicesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  groupTitle: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
});
