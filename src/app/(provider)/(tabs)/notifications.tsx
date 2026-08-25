import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getNotifications, markAllRead, markNotificationRead } from '@/services/notificationService';
import { formatDateTime } from '@/utils/format';

export default function ProviderNotifications() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsyncData(() => getNotifications(user!.id), [user?.id]);

  if (loading && !data) {
    return (
      <AppShell scroll={false} edges={['top']}>
        <LoadingState />
      </AppShell>
    );
  }
  if (error || !data) {
    return (
      <AppShell scroll={false} edges={['top']}>
        <ErrorState message={error ?? undefined} onRetry={reload} />
      </AppShell>
    );
  }

  return (
    <AppShell edges={['top']}>
      <View style={styles.head}>
        <Text style={styles.title}>Notifications</Text>
        <Pressable
          onPress={async () => {
            await markAllRead(user!.id);
            reload();
          }}>
          <Text style={styles.link}>Mark all read</Text>
        </Pressable>
      </View>
      <View style={styles.list}>
        {data.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="No alerts"
            message="New requests and reviews will appear here."
          />
        ) : (
          data.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.card, !item.read && styles.unread]}
              onPress={async () => {
                await markNotificationRead(item.id);
                if (item.bookingId) router.push(`/(provider)/job/${item.bookingId}`);
                reload();
              }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
            </Pressable>
          ))
        )}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  title: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800' },
  link: { color: Colors.accent, fontWeight: '700' },
  list: { gap: 10 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unread: { borderColor: Colors.accent },
  cardTitle: { color: Colors.charcoal, fontWeight: '800' },
  body: { color: Colors.whiteSoft, marginTop: 4 },
  time: { color: Colors.textLight, marginTop: 8, fontSize: FontSize.xs },
});
