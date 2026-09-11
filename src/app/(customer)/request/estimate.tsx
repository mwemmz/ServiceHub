import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { BackButton } from '@/components/BackButton';
import { GlassPanel } from '@/components/GlassPanel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { createBooking } from '@/services/bookingService';
import { getNearbyProviders, getProvidersForService } from '@/services/providerService';
import { getServiceRequestDraft } from '@/services/serviceRequestDraft';
import { useServiceRequestDraftReady } from '@/hooks/useServiceRequestDraftReady';
import { calculatePrice, formatKwacha } from '@/utils/format';
import { distanceKm } from '@/services/locationService';

/** Step 5 — estimate + request service. */
export default function EstimateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const draftReady = useServiceRequestDraftReady();
  const draft = getServiceRequestDraft();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nearestKm, setNearestKm] = useState<number | null>(null);

  const price = useMemo(
    () => calculatePrice(draft?.startingPrice ?? 0),
    [draft?.startingPrice],
  );

  useEffect(() => {
    if (!draftReady) return;
    const current = getServiceRequestDraft();
    if (!current?.location) {
      router.replace('/(customer)/categories' as Href);
      return;
    }
    getNearbyProviders(current.location, current.categoryId)
      .then((list) => {
        const first = list[0];
        if (first?.profile.location && current.location) {
          setNearestKm(distanceKm(current.location, first.profile.location));
        }
      })
      .catch(() => setNearestKm(null));
  }, [draftReady, router]);

  async function onRequest() {
    if (!user || !draft?.location || loading) return;
    setLoading(true);
    setError('');
    try {
      const providers = await getProvidersForService(draft.serviceId, draft.location);
      const nearby = providers[0] ?? (await getNearbyProviders(draft.location, draft.categoryId))[0];
      const providerId = nearby?.user.id ?? 'pending_match';

      const booking = await createBooking({
        customerId: user.id,
        providerId,
        serviceId: draft.serviceId,
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        notes: `Service request: ${draft.serviceName}`,
        location: draft.location,
      });

      router.replace(`/(customer)/request/finding?bookingId=${booking.id}` as Href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the service request.');
    } finally {
      setLoading(false);
    }
  }

  if (!draftReady || !draft?.location) return null;

  return (
    <AppShell>
      <BackButton fallbackHref={'/(customer)/request/confirm' as Href} />
      <Text style={styles.title}>Service request</Text>
      <Text style={styles.sub}>Review the estimate, then request a provider.</Text>

      <GlassPanel borderRadius={24} contentStyle={styles.panel}>
        <Row label="Service requested" value={draft.serviceName} />
        <Row label="Service category" value={draft.categoryName} />
        <Row label="Service location" value={draft.location.address} />
        <Row
          label="Distance"
          value={
            nearestKm != null
              ? `About ${nearestKm.toFixed(1)} km to a nearby provider`
              : 'Matching nearby providers…'
          }
        />
        <View style={styles.priceCard}>
          <Text style={styles.label}>Estimated service price</Text>
          <Text style={styles.price}>{formatKwacha(price.total)}</Text>
          <Text style={styles.meta}>
            Starting from {formatKwacha(draft.startingPrice)} + service fees
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Request Service" loading={loading} onPress={onRequest} />
      </GlassPanel>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800' },
  sub: { color: Colors.whiteSoft, lineHeight: 20, marginBottom: 12 },
  panel: { padding: 14, gap: 10 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  label: { color: Colors.whiteSoft, fontSize: FontSize.sm, fontWeight: '700' },
  value: { color: Colors.charcoal, fontWeight: '700', lineHeight: 20 },
  priceCard: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  price: { color: Colors.charcoal, fontSize: 28, fontWeight: '800' },
  meta: { color: Colors.whiteSoft, fontSize: FontSize.sm },
  error: { color: Colors.error, fontWeight: '600' },
});
