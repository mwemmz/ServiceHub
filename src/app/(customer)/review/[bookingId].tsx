import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBookingById } from '@/services/bookingService';
import { createReview } from '@/services/reviewService';

export default function ReviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { data } = useAsyncData(() => getBookingById(bookingId), [bookingId]);

  async function submit() {
    if (!data || !user) return;
    setLoading(true);
    setError('');
    try {
      await createReview({
        bookingId: data.id,
        fromUserId: user.id,
        toUserId: data.providerId,
        rating,
        comment,
      });
      router.replace(`/(customer)/booking/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save review.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Rate your service" subtitle="Your review helps other customers choose well." />
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable key={value} onPress={() => setRating(value)}>
            <Ionicons name={value <= rating ? 'star' : 'star-outline'} size={36} color={Colors.star} />
          </Pressable>
        ))}
      </View>
      <InputField label="Written review" value={comment} onChangeText={setComment} placeholder="How did it go?" multiline />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Submit review" onPress={submit} loading={loading} disabled={!comment.trim()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 18 },
  error: { color: Colors.error, marginBottom: 8, fontSize: FontSize.sm },
});
