import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { Colors, FontSize } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getMyDisputes } from '@/services/disputeService';
import type { Dispute, DisputeStatus, DisputeType } from '@/types';
import { formatDateTime } from '@/utils/format';

const STATUS_LABELS: Record<DisputeStatus, string> = {
  open: 'Open',
  resolved: 'Resolved',
  closed: 'Closed',
};

function typeIcon(type: DisputeType) {
  return type === 'safety' ? ('shield-outline' as const) : ('alert-circle-outline' as const);
}

function typeLabel(type: DisputeType) {
  return type === 'safety' ? 'Safety report' : 'Dispute';
}

/** Feature 4 — Dispute / Safety reporting: shows reports the signed-in user has filed. */
export function DisputeListView() {
  const { data, loading, error, reload } = useAsyncData(() => getMyDisputes());

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;

  const disputes = data ?? [];

  if (disputes.length === 0) {
    return (
      <EmptyState
        icon="shield-outline"
        title="No reports yet"
        message="If a booking goes wrong, you can file a dispute or a safety report from the booking screen."
      />
    );
  }

  return (
    <View style={styles.list}>
      {disputes.map((dispute: Dispute) => (
        <GlassPanel key={dispute.id} borderRadius={18} contentStyle={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name={typeIcon(dispute.type)}
              size={22}
              color={dispute.type === 'safety' ? Colors.warning : Colors.accent}
            />
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{typeLabel(dispute.type)}</Text>
                <Text style={[styles.status, statusStyle(dispute.status)]}>
                  {STATUS_LABELS[dispute.status]}
                </Text>
              </View>
              <Text style={styles.reason}>{dispute.reason}</Text>
              {dispute.description ? (
                <Text style={styles.description} numberOfLines={3}>
                  {dispute.description}
                </Text>
              ) : null}
              <Text style={styles.meta}>{formatDateTime(dispute.reportedAt)}</Text>
              {dispute.resolutionNote ? (
                <Text style={styles.resolution}>Resolution: {dispute.resolutionNote}</Text>
              ) : null}
            </View>
          </View>
        </GlassPanel>
      ))}
    </View>
  );
}

function statusStyle(status: DisputeStatus) {
  switch (status) {
    case 'resolved':
      return { color: Colors.success } as const;
    case 'closed':
      return { color: Colors.textMuted } as const;
    default:
      return { color: Colors.warning } as const;
  }
}

const styles = StyleSheet.create({
  list: { gap: 10, marginVertical: 14 },
  card: { padding: 14 },
  row: { flexDirection: 'row', gap: 12 },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '800' },
  status: { fontSize: FontSize.xs, fontWeight: '700' },
  reason: { color: Colors.textMuted, fontSize: FontSize.sm },
  description: { color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 18 },
  meta: { color: Colors.textLight, fontSize: FontSize.xs, marginTop: 2 },
  resolution: { color: Colors.success, fontSize: FontSize.sm },
});