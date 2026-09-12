import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ErrorState } from '@/components/ErrorState';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StarRating } from '@/components/admin/StarRating';
import { RolePill, VerifiedPill } from '@/components/admin/AdminBits';
import { Colors, FontSize } from '@/constants/theme';
import { getReports, type BookingTrend, type ProviderPerf } from '@/services/adminService';

export default function ReportsScreen() {
  const [report, setReport] = useState<{
    bookingTrends: BookingTrend[];
    providerPerformance: ProviderPerf[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getReports()
      .then((r) => setReport(r))
      .catch((e) => setError(e?.message ?? 'Failed to load reports.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error || !report) {
    return (
      <Screen>
        <ScreenHeader title="Reports" showBack={false} />
        <ErrorState message={error || 'Unable to load reports.'} onRetry={load} />
      </Screen>
    );
  }

  const trends = report.bookingTrends ?? [];
  const providers = report.providerPerformance ?? [];
  const maxCount = Math.max(1, ...trends.map((t) => t.count));

  return (
    <Screen>
      <ScreenHeader title="Reports" subtitle="Platform performance" showBack={false} />

      <Text style={styles.section}>Booking Trends (last 30 days)</Text>
      {trends.length === 0 ? (
        <Text style={styles.empty}>No booking data yet.</Text>
      ) : (
        trends.map((t) => <TrendRow key={t.date} trend={t} pct={Math.round((t.count / maxCount) * 100)} />)
      )}

      <Text style={[styles.section, styles.sectionTop]}>Top Providers</Text>
      {providers.length === 0 ? (
        <Text style={styles.empty}>No provider data yet.</Text>
      ) : (
        providers.map((p) => <ProviderPerfRow key={p.id} provider={p} />)
      )}
    </Screen>
  );
}

function TrendRow({ trend, pct }: { trend: BookingTrend; pct: number }) {
  let label = trend.date;
  try {
    label = new Date(trend.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    // keep raw date string
  }
  return (
    <View style={styles.trendRow}>
      <Text style={styles.trendLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.trendTrack}>
        <View style={[styles.trendFill, { width: `${Math.max(pct, 4)}%` }]} />
      </View>
      <Text style={styles.trendCount}>{trend.count}</Text>
    </View>
  );
}

function ProviderPerfRow({ provider }: { provider: ProviderPerf }) {
  return (
    <GlassPanel borderRadius={14} contentStyle={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>
          {provider.business_name}
        </Text>
        <VerifiedPill verified={provider.is_verified} />
      </View>
      <View style={styles.metaRow}>
        <StarRating value={provider.rating ?? 0} count={provider.total_reviews ?? 0} />
      </View>
      <Text style={styles.muted} numberOfLines={1}>
        {provider.user?.name ?? 'Unknown'}
      </Text>
      {provider.user?.role ? (
        <View style={styles.roleWrap}>
          <RolePill role={provider.user.role} />
        </View>
      ) : null}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  section: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '700', marginBottom: 8 },
  sectionTop: { marginTop: 24 },
  empty: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: 16 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  trendLabel: { width: 56, color: Colors.textMuted, fontSize: FontSize.xs },
  trendTrack: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  trendFill: { height: '100%', borderRadius: 8, backgroundColor: Colors.accent },
  trendCount: { width: 28, color: Colors.charcoal, fontSize: FontSize.xs, fontWeight: '700', textAlign: 'right' },
  card: { padding: 12, gap: 6, marginBottom: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { color: Colors.charcoal, fontWeight: '700', flexShrink: 1 },
  metaRow: { marginTop: 2 },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm },
  roleWrap: { alignSelf: 'flex-start' },
});