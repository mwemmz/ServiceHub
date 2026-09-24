import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { BackButton } from '@/components/BackButton';
import { GlassPanel } from '@/components/GlassPanel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { clearServiceRequestDraft, getServiceRequestDraft } from '@/services/serviceRequestDraft';

/** Step 6 — finding a provider after the request is created. */
export default function FindingProviderScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const draft = getServiceRequestDraft();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2200);
    return () => clearTimeout(t);
  }, []);

  function finish() {
    void clearServiceRequestDraft();
    if (bookingId) {
      router.replace(`/(customer)/booking/${bookingId}` as Href);
    } else {
      router.replace('/(customer)/(tabs)/bookings' as Href);
    }
  }

  return (
    <AppShell scroll={false} contentStyle={styles.centerContent}>
      <BackButton fallbackHref={'/(customer)/categories' as Href} />
      <ActivityIndicator size="large" color={Colors.accent} />
      <Text style={styles.title}>Finding a Service Provider…</Text>
      <Text style={styles.body}>
        We are matching nearby professionals for{' '}
        <Text style={{ fontWeight: '800' }}>{draft?.serviceName ?? 'your service'}</Text> at{' '}
        {draft?.location?.address ?? 'your selected location'}.
      </Text>

      <GlassPanel borderRadius={24} contentStyle={styles.panel}>
        <Text style={styles.cardTitle}>Request status</Text>
        <Text style={styles.status}>Waiting for a provider</Text>
        <Text style={styles.cardBody}>
          Providers near you can accept this request. You will see booking details next.
        </Text>

        {ready ? (
          <View style={{ gap: 10, marginTop: 8 }}>
            <PrimaryButton label="View booking" onPress={finish} />
            <SecondaryButton
              label="Browse more services"
              onPress={() => {
                void clearServiceRequestDraft();
                router.replace('/(customer)/categories' as Href);
              }}
            />
          </View>
        ) : (
          <Text style={styles.wait}>Please wait a moment…</Text>
        )}

        <Pressable onPress={finish} style={{ marginTop: 4 }}>
          <Text style={styles.link}>Skip wait</Text>
        </Pressable>
      </GlassPanel>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  centerContent: { justifyContent: 'center', gap: 14 },
  title: {
    color: Colors.charcoal,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: { color: Colors.whiteSoft, textAlign: 'center', lineHeight: 22 },
  panel: { padding: 16, gap: 8 },
  cardTitle: { color: Colors.whiteSoft, fontWeight: '700', fontSize: FontSize.sm },
  status: { color: Colors.warning, fontWeight: '800', fontSize: FontSize.lg },
  cardBody: { color: Colors.whiteSoft, lineHeight: 20 },
  wait: { color: Colors.whiteSoft, textAlign: 'center', marginTop: 8 },
  link: { color: Colors.accent, textAlign: 'center', fontWeight: '700' },
});
