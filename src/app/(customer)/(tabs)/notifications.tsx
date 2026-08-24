import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Colors, FontSize, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getNotifications, markAllRead, markNotificationRead } from '@/services/notificationService';
import { formatDateTime } from '@/utils/format';

export default function CustomerNotifications() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsyncData(() => getNotifications(user!.id), [user?.id]);

  if (loading && !data) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={reload} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
      <ScrollView contentContainerStyle={styles.list}>
        {data.length === 0 ? (
          <EmptyState icon="notifications-outline" title="You're all caught up" message="Booking updates will appear here." />
        ) : (
          data.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.card, !item.read && styles.unread]}
              onPress={async () => {
                await markNotificationRead(item.id);
                if (item.bookingId) router.push(`/(customer)/booking/${item.bookingId}`);
                reload();
              }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{formatDateTime(item.createdAt)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  title: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800' },
  link: { color: Colors.accent, fontWeight: '700' },
  list: { gap: 10, paddingBottom: 32 },
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: 14 },
  unread: { borderWidth: 1, borderColor: Colors.accent },
  cardTitle: { color: Colors.charcoal, fontWeight: '800' },
  body: { color: Colors.textMuted, marginTop: 4 },
  time: { color: Colors.textLight, marginTop: 8, fontSize: FontSize.xs },
});
