import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '@/components/AppShell';
import { BackButton } from '@/components/BackButton';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { getCategory, getService } from '@/services/catalogService';
import { startDraftFromService } from '@/services/serviceRequestDraft';
import type { Category, Service } from '@/types';
import { formatKwacha } from '@/utils/format';

/** Service details before choosing an exact location. */
export default function RequestServiceDetailScreen() {
  const router = useRouter();
  const { serviceId, categoryId } = useLocalSearchParams<{
    serviceId: string;
    categoryId?: string;
  }>();
  const [service, setService] = useState<Service | null>(null);
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (!serviceId) return;
    getService(serviceId).then(async (svc) => {
      setService(svc ?? null);
      if (svc) {
        const cat = await getCategory(svc.categoryId);
        setCategory(cat ?? null);
      } else if (categoryId) {
        const cat = await getCategory(categoryId as Category['id']);
        setCategory(cat ?? null);
      }
    });
  }, [serviceId, categoryId]);

  if (!service) {
    return (
      <AppShell scroll={false}>
        <LoadingState />
      </AppShell>
    );
  }

  function onSelectLocation() {
    startDraftFromService(service!, category?.name ?? 'Service');
    router.push('/(customer)/request/location' as Href);
  }

  return (
    <AppShell>
      <BackButton
        fallbackHref={
          `/(customer)/request/services?categoryId=${categoryId ?? service.categoryId}` as Href
        }
      />

      <Text style={styles.eyebrow}>{category?.name ?? 'Service'}</Text>
      <Text style={styles.title}>{service.name}</Text>
      <Text style={styles.group}>{service.group}</Text>

      <GlassPanel borderRadius={24} contentStyle={styles.panel}>
        <Text style={styles.label}>About this service</Text>
        <Text style={styles.body}>{service.description}</Text>

        <View style={styles.priceBox}>
          <Text style={styles.label}>Estimated starting price</Text>
          <Text style={styles.price}>{formatKwacha(service.startingPrice)}</Text>
          <Text style={styles.meta}>Typical duration · about {service.durationMinutes} mins</Text>
          <Text style={styles.meta}>Final price may vary after the provider assesses the job.</Text>
        </View>

        <View style={styles.hint}>
          <Ionicons name="location-outline" size={20} color={Colors.accent} />
          <Text style={styles.hintText}>
            Next, choose the exact address where this service should be done.
          </Text>
        </View>

        <PrimaryButton label="Select Location" onPress={onSelectLocation} />
      </GlassPanel>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: Colors.accent,
    fontWeight: '800',
    fontSize: FontSize.sm,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800', marginTop: 4 },
  group: { color: Colors.whiteSoft, marginBottom: 14 },
  panel: { padding: 16, gap: 12 },
  label: { color: Colors.whiteSoft, fontWeight: '700', fontSize: FontSize.sm },
  body: { color: Colors.charcoal, lineHeight: 22, fontSize: FontSize.md },
  priceBox: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  price: { color: Colors.charcoal, fontSize: 28, fontWeight: '800' },
  meta: { color: Colors.whiteSoft, fontSize: FontSize.sm, lineHeight: 18 },
  hint: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4 },
  hintText: { flex: 1, color: Colors.whiteSoft, lineHeight: 20 },
});
