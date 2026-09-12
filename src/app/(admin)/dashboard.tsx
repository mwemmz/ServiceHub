import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { getAnalytics, mapRawStatus, type AdminAnalytics } from '@/services/adminService';

export default function DashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getAnalytics()
      .then((d) => setData(d))
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
        <StatCard label="Users" value={String(data.totalUsers)} />
        <StatCard label="Providers" value={String(data.totalProviders)} />
        <StatCard label="Bookings" value={String(data.totalBookings)} />
        <StatCard label="Revenue" value={`ZMW ${(data.totalRevenue ?? 0).toFixed(2)}`} />
      </View>

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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassPanel borderRadius={14} contentStyle={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  stat: { width: '47%', padding: 14, gap: 4 },
  statValue: { color: Colors.charcoal, fontSize: 18, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  section: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '700', marginBottom: 8 },
  empty: { color: Colors.textMuted, fontSize: FontSize.sm },
  card: { padding: 12, gap: 4, marginBottom: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { color: Colors.charcoal, fontWeight: '700', flexShrink: 1 },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm },
  mutedSmall: { color: Colors.textLight, fontSize: FontSize.xs },
  logout: {
    backgroundColor: Colors.border,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '700' },
});