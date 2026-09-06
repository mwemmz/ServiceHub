import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { BackButton } from '@/components/BackButton';
import { GlassPanel } from '@/components/GlassPanel';
import { LocationPinMap } from '@/components/LocationPinMap';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { getServiceRequestDraft } from '@/services/serviceRequestDraft';
import { useServiceRequestDraftReady } from '@/hooks/useServiceRequestDraftReady';
import type { GeoLocation } from '@/types';

/** Step 4 — confirm the exact service location before pricing. */
export default function ConfirmLocationScreen() {
  const router = useRouter();
  const draftReady = useServiceRequestDraftReady();
  const draft = getServiceRequestDraft();
  const [location, setLocation] = useState<GeoLocation | null>(draft?.location ?? null);

  useEffect(() => {
    if (!draftReady) return;
    const current = getServiceRequestDraft();
    if (!current?.location) {
      router.replace('/(customer)/request/location' as Href);
    } else {
      setLocation(current.location);
    }
  }, [draftReady, router]);

  if (!draftReady || !location || !draft) return null;

  return (
    <AppShell>
      <BackButton fallbackHref={'/(customer)/request/location' as Href} />
      <Text style={styles.title}>Confirm location</Text>
      <Text style={styles.sub}>Make sure this is where the service should happen.</Text>

      <GlassPanel borderRadius={24} contentStyle={styles.panel}>
        <LocationPinMap location={location} height={220} />

        <View style={styles.card}>
          <Text style={styles.label}>Service location</Text>
          <Text style={styles.value}>{location.address}</Text>
          <Text style={styles.meta}>
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Service</Text>
          <Text style={styles.value}>{draft.serviceName}</Text>
          <Text style={styles.meta}>{draft.categoryName}</Text>
        </View>

        <PrimaryButton
          label="Confirm Location"
          onPress={() => router.push('/(customer)/request/estimate' as Href)}
        />
        <SecondaryButton
          label="Change Location"
          onPress={() => router.replace('/(customer)/request/location' as Href)}
        />
      </GlassPanel>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  title: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800' },
  sub: { color: Colors.whiteSoft, lineHeight: 20, marginBottom: 12 },
  panel: { padding: 14, gap: 12 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  label: { color: Colors.whiteSoft, fontSize: FontSize.sm, fontWeight: '700' },
  value: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.md, lineHeight: 22 },
  meta: { color: Colors.whiteSoft, fontSize: FontSize.sm },
});
