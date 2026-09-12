import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorState } from '@/components/ErrorState';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StarRating } from '@/components/admin/StarRating';
import { Pills, VerifiedPill, formatDate } from '@/components/admin/AdminBits';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { getProviders, verifyProvider, type AdminProvider } from '@/services/adminService';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { key: string; label: string; value: string | undefined }[] = [
  { key: 'all', label: 'All', value: undefined },
  { key: 'verified', label: 'Verified', value: 'true' },
  { key: 'pending', label: 'Pending', value: 'false' },
];

export default function ProvidersScreen() {
  const [items, setItems] = useState<AdminProvider[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getProviders({ is_verified: filter, page, limit: PAGE_SIZE })
      .then((res) => {
        if (!mounted) return;
        setItems((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
        setHasMore(res.items.length >= PAGE_SIZE);
        setError('');
      })
      .catch((e) => {
        if (mounted) setError(e?.message ?? 'Failed to load providers.');
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [page, filter]);

  function reset() {
    setPage(1);
    setItems([]);
  }

  function onFilter(v?: string) {
    setFilter(v);
    reset();
  }

  function onRefresh() {
    setRefreshing(true);
    reset();
  }

  function onEndReached() {
    if (hasMore && !loading) setPage((p) => p + 1);
  }

  async function onVerify(provider: AdminProvider) {
    if (verifyingId) return;
    setVerifyingId(provider.id);
    setError('');
    try {
      await verifyProvider(provider.id);
      setItems((prev) => prev.map((p) => (p.id === provider.id ? { ...p, is_verified: true } : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to verify provider.');
    } finally {
      setVerifyingId(null);
    }
  }

  const header = (
    <View style={styles.header}>
      <Pills options={STATUS_OPTIONS} value={filter} onChange={onFilter} />
    </View>
  );

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Providers" subtitle="Verified and pending businesses" showBack={false} />
      {error && items.length > 0 ? <Text style={styles.errorText}>{error}</Text> : null}
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProviderRow
            provider={item}
            verifying={verifyingId === item.id}
            onVerify={() => onVerify(item)}
          />
        )}
        ListHeaderComponent={header}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : (
            <Text style={styles.empty}>No providers found.</Text>
          )
        }
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

function ProviderRow({
  provider,
  verifying,
  onVerify,
}: {
  provider: AdminProvider;
  verifying: boolean;
  onVerify: () => void;
}) {
  return (
    <GlassPanel borderRadius={14} contentStyle={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {provider.business_name}
        </Text>
        <VerifiedPill verified={provider.is_verified} />
      </View>
      <Text style={styles.muted} numberOfLines={1}>
        {provider.category ?? 'General'} · {provider.user?.name ?? 'Unknown user'}
      </Text>
      <Text style={styles.mutedSmall} numberOfLines={1}>
        {provider.user?.email} · member since {formatDate(provider.created_at)}
      </Text>
      <View style={styles.bottomRow}>
        <StarRating value={provider.rating ?? 0} count={provider.total_reviews ?? 0} />
        {!provider.is_verified ? (
          <Pressable
            onPress={onVerify}
            disabled={verifying}
            style={({ pressed }) => [styles.verifyBtn, (pressed || verifying) && styles.verifyBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Verify provider">
            <Text style={styles.verifyText}>{verifying ? 'Verifying...' : 'Verify'}</Text>
          </Pressable>
        ) : null}
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  header: { gap: 10, paddingBottom: 8 },
  content: { gap: 8, paddingBottom: 24 },
  card: { padding: 12, gap: 6 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { color: Colors.charcoal, fontWeight: '700', flexShrink: 1 },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm },
  mutedSmall: { color: Colors.textLight, fontSize: FontSize.xs },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 2 },
  verifyBtn: {
    backgroundColor: Colors.success,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  verifyBtnPressed: { opacity: 0.7 },
  verifyText: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: '700' },
  empty: { color: Colors.textMuted, textAlign: 'center', paddingTop: 24 },
  errorText: { color: Colors.error, fontSize: FontSize.sm, marginBottom: 8 },
});