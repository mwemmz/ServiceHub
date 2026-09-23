import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { BackButton } from '@/components/BackButton';
import { ProviderCard } from '@/components/ProviderCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { Colors, FontSize } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { listFavourites } from '@/services/favouriteService';
import { getProviderById, type ProviderListItem } from '@/services/providerService';

export default function SavedProvidersScreen() {
  const router = useRouter();
  const { data, loading, error, reload } = useAsyncData(async () => {
    const favourites = await listFavourites();
    const providers = await Promise.all(favourites.map((favourite) => getProviderById(favourite.providerId)));
    return providers.filter((provider): provider is ProviderListItem => Boolean(provider));
  }, []);

  if (loading && !data) {
    return (
      <AppShell scroll={false}>
        <LoadingState message="Loading saved providers..." />
      </AppShell>
    );
  }
  if (error) {
    return <AppShell scroll={false}><ErrorState message={error ?? 'Failed to load saved providers.'} onRetry={reload} /></AppShell>;
  }

  const providers = data ?? [];

  return (
    <AppShell scroll>
      <BackButton fallbackHref={'/(customer)/(tabs)/profile' as Href} />
      <Text style={styles.title}>Saved providers</Text>
      <Text style={styles.sub}>Quickly re-book people you trust.</Text>
      {providers.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title="No saved providers yet"
          message="Tap “Save provider” on any profile to keep it here for quick re-booking."
        />
      ) : (
        <View style={styles.list}>
          {providers.map((item) => (
            <ProviderCard
              key={item.user.id}
              item={item}
              onPress={() => router.push(`/(customer)/provider/${item.user.id}` as Href)}
            />
          ))}
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  title: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800', marginTop: 8 },
  sub: { color: Colors.whiteSoft, marginTop: 4, marginBottom: 16 },
  list: { gap: 12 },
});