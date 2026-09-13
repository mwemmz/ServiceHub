import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import { ErrorState } from '@/components/ErrorState';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDateTime } from '@/components/admin/AdminBits';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { getAnalytics, mapRawStatus, type AdminAnalytics } from '@/services/adminService';
import { getDemandMap, type DemandCell, type DemandSummary } from '@/services/geoService';
import { formatArea } from '@/utils/format';

const EMPTY_SUMMARY: DemandSummary = {
  totalActiveJobs: 0,
  totalOnlineWorkers: 0,
  underservedCells: 0,
  coveredCells: 0,
};

export default function DashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { isWide, colWidth } = useResponsive();
  const statWidth = isWide ? colWidth(4) : '47%';
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [demand, setDemand] = useState<DemandCell[]>([]);
  const [demandSummary, setDemandSummary] = useState<DemandSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      getAnalytics(),
      getDemandMap().then(({ cells, summary }) => {
        setDemand(cells);
        setDemandSummary(summary);
      }),
    ])
      .then(([d]) => setData(d))
      .catch((e) => setError(e?.message ?? 'Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onLogout() {
    await logout();
    router.replace('/(auth)/welcome');
  }

  if (loading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <ScreenHeader title="Dashboard" showBack={false} />
        <ErrorState message={error || 'Unable to load analytics.'} onRetry={load} />
      </Screen>
    );
  }

  const recent = data.recentBookings ?? [];
  const underserved = demand.filter((cell) => cell.underserved).slice(0, 8);

  return (
    <Screen>
      <ScreenHeader
        title="Dashboard"
        subtitle="Platform overview"
        showBack={false}
        right={
          <Pressable onPress={onLogout} style={styles.logout} accessibilityRole="button" accessibilityLabel="Log out">
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        }
      />

      <View style={styles.grid}>
        <StatCard label="Users" value={String(data.totalUsers)} width={statWidth} />
        <StatCard label="Providers" value={String(data.totalProviders)} width={statWidth} />
        <StatCard label="Bookings" value={String(data.totalBookings)} width={statWidth} />
        <StatCard label="Revenue" value={`ZMW ${(data.totalRevenue ?? 0).toFixed(2)}`} width={statWidth} />
      </View>

      <Text style={styles.section}>Area demand</Text>
      <View style={styles.grid}>
        <StatCard label="Active jobs" value={String(demandSummary.totalActiveJobs)} width={isWide ? colWidth(4) : '47%'} />
        <StatCard label="Online workers" value={String(demandSummary.totalOnlineWorkers)} width={isWide ? colWidth(4) : '47%'} />
        <StatCard label="Underserved areas" value={String(demandSummary.underservedCells)} width={isWide ? colWidth(4) : '47%'} />
      </View>
      {underserved.length === 0 ? (
        <Text style={styles.empty}>No underserved areas right now — demand is being covered.</Text>
      ) : (
        underserved.map((cell, index) => (
          <GlassPanel key={`${cell.lat}-${cell.lng}-${index}`} borderRadius={14} contentStyle={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {formatArea(cell.lat, cell.lng)}
              </Text>
              <Text style={styles.gapBadge}>+{cell.gap} jobs</Text>
            </View>
            <Text style={styles.muted} numberOfLines={1}>
              {cell.activeJobs} active job{cell.activeJobs === 1 ? '' : 's'} · {cell.onlineWorkers} online worker
              {cell.onlineWorkers === 1 ? '' : 's'}
            </Text>
          </GlassPanel>
        ))
      )}

      <Text style={styles.section}>Recent Bookings</Text>
      {recent.length === 0 ? (
        <Text style={styles.empty}>No bookings yet.</Text>
      ) : (
        recent.map((b) => (
          <GlassPanel key={b.id} borderRadius={14} contentStyle={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {b.service?.name ?? 'Service'}
              </Text>
              <StatusBadge status={mapRawStatus(b.status)} />
            </View>
            <Text style={styles.muted} numberOfLines={1}>
              {b.customer?.name ?? 'Customer'} to {b.provider?.user?.name ?? 'Provider'}
            </Text>
            <Text style={styles.mutedSmall}>
              {formatDateTime(b.created_at ?? b.scheduled_at ?? b.updated_at)}
            </Text>
          </GlassPanel>
        ))
      )}
    </Screen>
  );
}

function StatCard({ label, value, width }: { label: string; value: string; width: DimensionValue }) {
  return (
    <GlassPanel borderRadius={14} contentStyle={[styles.stat, { width }]}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  stat: { padding: 14, gap: 4 },
  statValue: { color: Colors.charcoal, fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  section: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '700', marginBottom: 8 },
  empty: { color: Colors.textMuted, fontSize: FontSize.sm },
  card: { padding: 12, gap: 4, marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { color: Colors.charcoal, fontWeight: '700', flexShrink: 1 },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm },
  mutedSmall: { color: Colors.textLight, fontSize: FontSize.xs },
  gapBadge: {
    color: Colors.accentDark ?? Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '800',
    backgroundColor: Colors.accentSoft,
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  logout: {
    backgroundColor: Colors.border,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '700' },
});