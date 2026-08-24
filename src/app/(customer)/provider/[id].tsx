import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Avatar } from '@/components/Avatar';
import { RatingStars } from '@/components/RatingStars';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getProviderById } from '@/services/providerService';
import { getReviewsForUser } from '@/services/reviewService';
import { getService } from '@/services/catalogService';
import { formatKwacha } from '@/utils/format';

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { id, serviceId } = useLocalSearchParams<{ id: string; serviceId?: string }>();
  const { data, loading, error, reload } = useAsyncData(async () => {
    const provider = await getProviderById(id);
    const reviews = await getReviewsForUser(id);
    const services = await Promise.all(
      (provider?.profile.services ?? []).map(async (offer) => ({
        ...offer,
        name: (await getService(offer.serviceId))?.name ?? offer.serviceId,
      })),
    );
    return { provider, reviews, services };
  }, [id]);

  if (loading && !data) return <LoadingState />;
  if (error || !data?.provider) return <ErrorState message={error ?? 'Provider not found.'} onRetry={reload} />;

  const { provider, reviews, services } = data;
  const selected = serviceId ?? provider.profile.services[0]?.serviceId;

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHeader title={provider.user.fullName} subtitle={provider.profile.serviceArea} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Avatar name={provider.user.fullName} uri={provider.user.avatarUri} size={76} />
          <Text style={styles.name}>{provider.user.fullName}</Text>
          {provider.user.isVerified ? <Text style={styles.verified}>Verified professional</Text> : null}
          <RatingStars rating={provider.profile.rating} count={provider.profile.reviewCount} />
          <Text style={styles.meta}>
            {provider.profile.completedJobs} jobs · {provider.profile.yearsOfExperience} years ·{' '}
            {provider.profile.isOnline ? 'Available now' : 'Currently offline'}
          </Text>
        </View>
        <Text style={styles.section}>About</Text>
        <Text style={styles.body}>{provider.profile.bio}</Text>
        <Text style={styles.section}>Services & prices</Text>
        {services.map((item) => (
          <View key={item.serviceId} style={styles.row}>
            <Text style={styles.rowLabel}>{item.name}</Text>
            <Text style={styles.rowValue}>{formatKwacha(item.price)}</Text>
          </View>
        ))}
        <Text style={styles.section}>Availability</Text>
        {provider.profile.availability
          .filter((slot) => slot.enabled)
          .map((slot) => (
            <Text key={slot.day} style={styles.body}>
              {slot.label}: {slot.start} – {slot.end}
            </Text>
          ))}
        <Text style={styles.section}>Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={styles.body}>No reviews yet.</Text>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.review}>
              <RatingStars rating={review.rating} />
              <Text style={styles.body}>{review.comment}</Text>
            </View>
          ))
        )}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label="Book Service"
          onPress={() => router.push(`/(customer)/book?providerId=${provider.user.id}&serviceId=${selected}`)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 8 },
  hero: { alignItems: 'center', gap: 6, marginBottom: 8 },
  name: { color: Colors.charcoal, fontSize: FontSize.xl, fontWeight: '800' },
  verified: { color: Colors.success, fontWeight: '700' },
  meta: { color: Colors.textMuted, textAlign: 'center' },
  section: { marginTop: 14, color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.lg },
  body: { color: Colors.textMuted, lineHeight: 21 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: 12, borderRadius: Radii.md },
  rowLabel: { color: Colors.charcoal, fontWeight: '700' },
  rowValue: { color: Colors.accent, fontWeight: '800' },
  review: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: 12, gap: 6 },
  footer: { padding: 16, backgroundColor: Colors.background },
});
