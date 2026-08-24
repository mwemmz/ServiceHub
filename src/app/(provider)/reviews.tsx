import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { RatingStars } from '@/components/RatingStars';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { Colors, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getReviewsForUser } from '@/services/reviewService';

export default function ProviderReviewsScreen() {
  const { user } = useAuth();
  const { data, loading } = useAsyncData(() => getReviewsForUser(user!.id), [user?.id]);

  if (loading && !data) return <LoadingState />;

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHeader title="Reviews" subtitle="What customers have said about your work." />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {(data ?? []).length === 0 ? (
          <EmptyState icon="star-outline" title="No reviews yet" message="Reviews appear here after completed jobs." />
        ) : (
          (data ?? []).map((review) => (
            <View key={review.id} style={styles.card}>
              <RatingStars rating={review.rating} />
              <Text style={styles.comment}>{review.comment}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: 14, gap: 8 },
  comment: { color: Colors.charcoal, lineHeight: 20 },
});
