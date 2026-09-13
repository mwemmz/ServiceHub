import { StyleSheet, Text, View } from 'react-native';
import { ErrorState } from '@/components/ErrorState';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, FontSize } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getOpportunities, type Opportunity } from '@/services/geoService';
import { getCoverageInsights, getFinancialSummary } from '@/services/insightsService';
import type { CoverageInsights, FinancialSummary } from '@/types';
import { formatArea, formatKwacha } from '@/utils/format';

/** Features 6, 7 & 9 — financial inclusion, coverage insights and area demand. */
export default function InsightsScreen() {
  const { data, loading, error, reload } = useAsyncData(async () => {
    const [financial, coverage, opportunities] = await Promise.all([
      getFinancialSummary(),
      getCoverageInsights(),
      getOpportunities(),
    ]);
    return { financial, coverage, opportunities };
  });

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const financial: FinancialSummary = data?.financial ?? {
    totalEarned: 0,
    totalJobs: 0,
    averagePerJob: '0.00',
    thisWeekJobs: 0,
    thisMonthJobs: 0,
    repeatCustomers: 0,
    paymentMethods: [],
  };
  const coverage: CoverageInsights = data?.coverage ?? {
    locationsCount: 0,
    uniqueAreas: 0,
    avgRating: 0,
    activeCrews: 0,
  };
  const opportunities: Opportunity[] = data?.opportunities ?? [];

  return (
    <Screen>
      <ScreenHeader
        title="My insights"
        subtitle="Your financial inclusion picture and where you are reaching customers."
      />
      <Text style={styles.sectionTitle}>Financial summary</Text>
      <View style={styles.stats}>
        <GlassPanel borderRadius={18} contentStyle={styles.stat}>
          <Text style={styles.statValue}>{formatKwacha(financial.totalEarned)}</Text>
          <Text style={styles.statLabel}>Total earned</Text>
        </GlassPanel>
        <GlassPanel borderRadius={18} contentStyle={styles.stat}>
          <Text style={styles.statValue}>{financial.totalJobs}</Text>
          <Text style={styles.statLabel}>Confirmed jobs</Text>
        </GlassPanel>
        <GlassPanel borderRadius={18} contentStyle={styles.stat}>
          <Text style={styles.statValue}>{financial.repeatCustomers}</Text>
          <Text style={styles.statLabel}>Unique customers</Text>
        </GlassPanel>
      </View>
      <GlassPanel borderRadius={22} contentStyle={styles.panel}>
        <StatRow label="This week" value={`${financial.thisWeekJobs} jobs`} />
        <StatRow label="This month" value={`${financial.thisMonthJobs} jobs`} />
        <StatRow label="Average per job" value={formatKwacha(Number(financial.averagePerJob))} />
        <StatRow
          label="Payments accepted"
          value={financial.paymentMethods.length ? financial.paymentMethods.join(', ') : 'Not recorded'}
        />
      </GlassPanel>

      <Text style={styles.sectionTitle}>Coverage insights</Text>
      <View style={styles.stats}>
        <GlassPanel borderRadius={18} contentStyle={styles.stat}>
          <Text style={styles.statValue}>{coverage.locationsCount}</Text>
          <Text style={styles.statLabel}>Job locations</Text>
        </GlassPanel>
        <GlassPanel borderRadius={18} contentStyle={styles.stat}>
          <Text style={styles.statValue}>{coverage.uniqueAreas}</Text>
          <Text style={styles.statLabel}>Unique areas</Text>
        </GlassPanel>
        <GlassPanel borderRadius={18} contentStyle={styles.stat}>
          <Text style={styles.statValue}>{coverage.activeCrews}</Text>
          <Text style={styles.statLabel}>Active crews</Text>
        </GlassPanel>
      </View>
      <GlassPanel borderRadius={22} contentStyle={styles.panel}>
        <StatRow label="Average rating" value={coverage.avgRating.toFixed(1)} />
      </GlassPanel>

      <Text style={styles.sectionTitle}>Where demand is highest</Text>
      {opportunities.length === 0 ? (
        <Text style={styles.empty}>No shortage areas found yet.</Text>
      ) : (
        <View style={styles.list}>
          {opportunities.slice(0, 10).map((cell, index) => (
            <GlassPanel key={`${cell.lat}-${cell.lng}-${index}`} borderRadius={18} contentStyle={styles.oppCard}>
              <View style={styles.oppHead}>
                <Text style={styles.oppTitle}>{formatArea(cell.lat, cell.lng)}</Text>
                <Text style={styles.oppGap}>+{cell.gap} jobs</Text>
              </View>
              <Text style={styles.oppMeta}>
                {cell.activeJobs} active {cell.activeJobs === 1 ? 'job' : 'jobs'} · {cell.onlineWorkers} online{' '}
                {cell.onlineWorkers === 1 ? 'worker' : 'workers'}
              </Text>
            </GlassPanel>
          ))}
        </View>
      )}
    </Screen>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800', marginTop: 16 },
  stats: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  stat: { flex: 1, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' },
  panel: { padding: 16, gap: 12, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { color: Colors.textMuted, fontSize: FontSize.md },
  rowValue: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '700' },
  empty: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 6 },
  list: { gap: 10, marginTop: 10 },
  oppCard: { padding: 14, gap: 6 },
  oppHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  oppTitle: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '800' },
  oppGap: {
    color: Colors.accentDark ?? Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '800',
    backgroundColor: Colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  oppMeta: { color: Colors.textMuted, fontSize: FontSize.sm },
});