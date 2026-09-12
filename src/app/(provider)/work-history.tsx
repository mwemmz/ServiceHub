import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors, FontSize } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getWorkHistory } from '@/services/bookingService';
import { bookingStatusLabel, formatDateTime, formatKwacha } from '@/utils/format';

/** Feature 2 — Confirmed Work History: only completed (is_confirmed) bookings count. */
export default function WorkHistoryScreen() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsyncData(
    () => getWorkHistory(user!.id),
    [user?.id],
  );

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const summary = data?.summary ?? { confirmedJobs: 0, totalEarned: 0, totalJobs: 0 };
  const bookings = data?.bookings ?? [];

  return (
    <Screen>
      <ScreenHeader title="Work history" subtitle="Confirmed jobs you have completed — proof of verified experience." />
      <View style={styles.stats}>
        <GlassPanel borderRadius={18} contentStyle={styles.stat}>
          <Text style={styles.statValue}>{summary.confirmedJobs}</Text>
          <Text style={styles.statLabel}>Confirmed jobs</Text>
        </GlassPanel>
        <GlassPanel borderRadius={18} contentStyle={styles.stat}>
          <Text style={styles.statValue}>{formatKwacha(summary.totalEarned)}</Text>
          <Text style={styles.statLabel}>Total earned</Text>
        </GlassPanel>
        <GlassPanel borderRadius={18} contentStyle={styles.stat}>
          <Text style={styles.statValue}>{summary.totalJobs}</Text>
          <Text style={styles.statLabel}>All-time jobs</Text>
        </GlassPanel>
      </View>

      {bookings.length === 0 ? (
        <EmptyState
          icon="checkmark-done-outline"
          title="No completed jobs yet"
          message="Once you finish jobs, they appear here as confirmed, verified work history."
        />
      ) : (
        <View style={styles.list}>
          {bookings.map((booking) => (
            <GlassPanel key={booking.id} borderRadius={18} contentStyle={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{bookingStatusLabel(booking.status)}</Text>
                  <Text style={styles.cardMeta}>{formatDateTime(booking.scheduledAt)}</Text>
                  {booking.notes ? (
                    <Text style={styles.cardMeta} numberOfLines={2}>
                      {booking.notes}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardAmount}>{formatKwacha(booking.price.total)}</Text>
                  <Text style={styles.confirmed}>Confirmed</Text>
                </View>
              </View>
            </GlassPanel>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8, marginVertical: 14 },
  stat: { flex: 1, padding: 12, alignItems: 'center', gap: 4 },
  statValue: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' },
  list: { gap: 10, marginVertical: 6 },
  card: { padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '800' },
  cardMeta: { color: Colors.textMuted, fontSize: FontSize.sm },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardAmount: { color: Colors.accent, fontSize: FontSize.md, fontWeight: '800' },
  confirmed: { color: Colors.success, fontSize: FontSize.xs, fontWeight: '700' },
});