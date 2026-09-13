import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ErrorState } from '@/components/ErrorState';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Pills, formatDateTime } from '@/components/admin/AdminBits';
import { Colors, FontSize } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import {
  RAW_STATUSES,
  getBookings,
  mapRawStatus,
  rawStatusLabel,
  type AdminBooking,
} from '@/services/adminService';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { key: string; label: string; value: string | undefined }[] = [
  { key: 'all', label: 'All', value: undefined },
  ...RAW_STATUSES.map((s) => ({ key: s, label: rawStatusLabel(s), value: s })),
];

export default function BookingsScreen() {
  const [items, setItems] = useState<AdminBooking[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const { columns } = useResponsive();
  const cols = columns([1, 2, 2, 3]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getBookings({ status, page, limit: PAGE_SIZE })
      .then((res) => {
        if (!mounted) return;
        setItems((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
        setHasMore(res.items.length >= PAGE_SIZE);
        setError('');
      })
      .catch((e) => {
        if (mounted) setError(e?.message ?? 'Failed to load bookings.');
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
  }, [page, status]);

  function reset() {
    setPage(1);
    setItems([]);
  }

  function onStatus(v?: string) {
    setStatus(v);
    reset();
  }

  function onRefresh() {
    setRefreshing(true);
    reset();
  }

  function onEndReached() {
    if (hasMore && !loading) setPage((p) => p + 1);
  }

  const header = (
    <View style={styles.header}>
      <Pills options={STATUS_OPTIONS} value={status} onChange={onStatus} />
    </View>
  );

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Bookings" subtitle="All booking requests" showBack={false} />
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(b) => b.id}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? { gap: 12 } : undefined}
        renderItem={({ item }) => <BookingRow booking={item} />}
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
            <Text style={styles.empty}>No bookings found.</Text>
          )
        }
        contentContainerStyle={styles.content}
      />
    </Screen>
  );
}

function BookingRow({ booking }: { booking: AdminBooking }) {
  const amount = booking.payment?.amount;
  return (
    <GlassPanel borderRadius={14} contentStyle={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {booking.service?.name ?? 'Service'}
        </Text>
        <StatusBadge status={mapRawStatus(booking.status)} />
      </View>
      <Text style={styles.muted} numberOfLines={1}>
        {booking.customer?.name ?? 'Customer'} to {booking.provider?.user?.name ?? 'Provider'}
      </Text>
      <Text style={styles.mutedSmall}>
        {formatDateTime(booking.created_at ?? booking.scheduled_at)}
      </Text>
      {typeof amount === 'number' ? (
        <Text style={styles.amount}>ZMW {amount.toFixed(2)}</Text>
      ) : null}
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
  amount: { color: Colors.accentDark, fontSize: FontSize.md, fontWeight: '800' },
  empty: { color: Colors.textMuted, textAlign: 'center', paddingTop: 24 },
});