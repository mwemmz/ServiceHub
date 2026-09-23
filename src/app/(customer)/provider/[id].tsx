import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { RatingStars } from '@/components/RatingStars';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getProviderById } from '@/services/providerService';
import { getReviewsForUser } from '@/services/reviewService';
import { getService } from '@/services/catalogService';
import { addFavourite, isFavourited, removeFavourite } from '@/services/favouriteService';
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

  const { data: saved, reload: reloadSaved } = useAsyncData(() => isFavourited(id), [id]);
  const [saving, setSaving] = useState(false);

  async function toggleSave() {
    if (saving) return;
    setSaving(true);
    try {
      if (saved) await removeFavourite(id);
      else await addFavourite(id);
      await reloadSaved();
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) return <LoadingState />;
  if (error || !data?.provider) return <ErrorState message={error ?? 'Provider not found.'} onRetry={reload} />;

  const { provider, reviews, services } = data;
  const selected = serviceId ?? provider.profile.services[0]?.serviceId;
  const primaryService = services.find((s) => s.serviceId === selected) ?? services[0];

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <BackButton fallbackHref={'/(customer)/(tabs)' as Href} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Avatar
            name={provider.user.fullName}
            size={100}
          />
          <Text style={styles.name}>{provider.user.fullName}</Text>
          <Text style={styles.subtitle}>{provider.profile.serviceArea ?? 'Professional Provider'}</Text>
          {provider.user.isVerified ? <Text style={styles.verified}>Verified professional</Text> : null}

          {/* Stats Row of Three Pills */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>⭐ {provider.profile.rating ? provider.profile.rating.toFixed(1) : '4.8'}/5</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>⏱️ {provider.profile.yearsOfExperience ?? 10}+ yrs</Text>
              <Text style={styles.statLabel}>Experience</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>✅ {provider.profile.completedJobs ?? 420}+</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
          </View>
        </View>

        {/* Specific Service / Skill being offered, price, description */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Service & Pricing</Text>
          {primaryService ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{primaryService.name}</Text>
              <Text style={styles.rowValue}>{formatKwacha(primaryService.price)}</Text>
            </View>
          ) : null}
          <Text style={styles.section}>About</Text>
          <Text style={styles.body}>{provider.profile.bio || 'Experienced and dedicated professional ready to deliver top-quality service.'}</Text>
        </View>

        {/* Availability Section with horizontal day chips and View Calendar link */}
        <View style={styles.card}>
          <View style={styles.availHeader}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <Pressable onPress={() => Alert.alert('Availability', 'Provider is available according to the weekly schedule below.')}>
              <Text style={styles.viewCalendar}>View Calendar</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChipsRow}>
            {provider.profile.availability.map((slot) => (
              <View
                key={slot.day}
                style={[styles.dayChip, slot.enabled ? styles.dayChipActive : styles.dayChipInactive]}>
                <Text style={[styles.dayChipText, slot.enabled && styles.dayChipTextActive]}>
                  {slot.label.slice(0, 3)}
                </Text>
                <Text style={[styles.dayChipSub, slot.enabled && styles.dayChipTextActive]}>
                  {slot.enabled ? 'Open' : 'Off'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Reviews */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
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
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <SecondaryButton
          label={saved ? 'Saved' : 'Save provider'}
          onPress={() => void toggleSave()}
          disabled={saving}
        />
        <PrimaryButton
          label="Book Service"
          onPress={() => router.push(`/(customer)/book?providerId=${provider.user.id}&serviceId=${selected}`)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 120, gap: 14 },
  hero: { alignItems: 'center', gap: 6, marginBottom: 4 },
  largeAvatar: { borderRadius: Radii.xl },
  name: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800', marginTop: 4 },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.md, fontWeight: '600' },
  verified: { color: Colors.success, fontWeight: '700', fontSize: FontSize.sm },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    width: '100%',
    justifyContent: 'center',
  },
  statPill: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 96,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    color: Colors.charcoal,
    fontWeight: '800',
    fontSize: FontSize.md,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.lg },
  section: { marginTop: 8, color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.md },
  body: { color: Colors.textMuted, lineHeight: 21 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.6)', padding: 12, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border },
  rowLabel: { color: Colors.charcoal, fontWeight: '700' },
  rowValue: { color: Colors.accent, fontWeight: '800' },
  availHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewCalendar: { color: Colors.accent, fontWeight: '700', fontSize: FontSize.sm },
  dayChipsRow: { gap: 8, paddingVertical: 4 },
  dayChip: {
    width: 64,
    paddingVertical: 10,
    borderRadius: Radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  dayChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  dayChipInactive: {
    backgroundColor: Colors.surface,
  },
  dayChipText: {
    color: Colors.charcoal,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  dayChipSub: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  dayChipTextActive: {
    color: Colors.onAccent,
  },
  review: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: Radii.md, padding: 12, gap: 6, borderWidth: 1, borderColor: Colors.border },
  footer: { padding: 16, backgroundColor: Colors.background, gap: 10 },
});
