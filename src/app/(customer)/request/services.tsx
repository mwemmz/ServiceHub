import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '@/components/AppShell';
import { BackButton } from '@/components/BackButton';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { Colors, FontSize, Radii, Spacing } from '@/constants/theme';
import { SERVICE_GROUP_ORDER } from '@/data/catalog';
import { getCategory, getServicesForCategory } from '@/services/catalogService';
import type { Category, CategoryId, Service } from '@/types';
import { formatKwacha } from '@/utils/format';

const SALON_GROUP = 'Salon & Beauty Services';
const BARBER_GROUP = "Barbershop & Men's Grooming";

type BeautyBranch = 'salon' | 'barbershop' | null;

const SECTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  [SALON_GROUP]: 'sparkles-outline',
  [BARBER_GROUP]: 'cut-outline',
  'Home & Office Cleaning': 'home-outline',
  'Outdoor Services': 'leaf-outline',
  'Electronics & Devices': 'phone-portrait-outline',
  'Home Appliances': 'snow-outline',
  'Home & Property': 'construct-outline',
};

/** Step 2 — pick one service inside a category (grouped sections). */
export default function RequestServicesScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const id = (categoryId ?? 'repair') as CategoryId;
  const [category, setCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<Service[] | null>(null);
  const [beautyBranch, setBeautyBranch] = useState<BeautyBranch>(null);

  useEffect(() => {
    setBeautyBranch(null);
    Promise.all([getCategory(id), getServicesForCategory(id)])
      .then(([cat, list]) => {
        setCategory(cat ?? null);
        setServices(list);
      })
      .catch(() => {
        setCategory(null);
        setServices([]);
      });
  }, [id]);

  const orderedGroups = useMemo(() => {
    if (!services) return [];
    const byGroup = services.reduce<Record<string, Service[]>>((acc, item) => {
      (acc[item.group] ??= []).push(item);
      return acc;
    }, {});
    const preferred = SERVICE_GROUP_ORDER[id] ?? Object.keys(byGroup);
    const ordered = preferred
      .filter((g) => byGroup[g]?.length)
      .map((g) => ({ group: g, list: byGroup[g] }));
    for (const g of Object.keys(byGroup)) {
      if (!preferred.includes(g)) ordered.push({ group: g, list: byGroup[g] });
    }
    return ordered;
  }, [services, id]);

  const visibleGroups = useMemo(() => {
    if (id !== 'beauty' || !beautyBranch) return orderedGroups;
    const target = beautyBranch === 'salon' ? SALON_GROUP : BARBER_GROUP;
    return orderedGroups.filter((g) => g.group === target);
  }, [orderedGroups, id, beautyBranch]);

  if (!services) {
    return (
      <AppShell scroll={false}>
        <LoadingState />
      </AppShell>
    );
  }

  const isBeautyPicker = id === 'beauty' && !beautyBranch;

  return (
    <AppShell>
      <BackButton
        onPress={
          id === 'beauty' && beautyBranch ? () => setBeautyBranch(null) : undefined
        }
        fallbackHref={'/(customer)/categories' as Href}
      />
      <Text style={styles.title}>{category?.name ?? 'Services'}</Text>
      <Text style={styles.sub}>
        {isBeautyPicker
          ? 'Choose salon services or barbershop services.'
          : beautyBranch === 'salon'
            ? 'Select a salon & beauty service'
            : beautyBranch === 'barbershop'
              ? 'Select a barbershop & grooming service'
              : 'Select one service to continue'}
      </Text>

      {isBeautyPicker ? (
        <GlassPanel borderRadius={24} contentStyle={styles.panel}>
          <Pressable
            style={({ pressed }) => [styles.choiceCard, pressed && { opacity: 0.92 }]}
            onPress={() => setBeautyBranch('salon')}>
            <View style={[styles.choiceIcon, { backgroundColor: Colors.beauty.background }]}>
              <Ionicons name="sparkles-outline" size={28} color={Colors.beauty.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.choiceTitle}>Salon Service</Text>
              <Text style={styles.choiceBody}>
                Braids, colouring, wigs, nails, makeup, facials and more.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.beauty.accent} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.choiceCard, pressed && { opacity: 0.92 }]}
            onPress={() => setBeautyBranch('barbershop')}>
            <View style={[styles.choiceIcon, { backgroundColor: Colors.accentSoft }]}>
              <Ionicons name="cut-outline" size={28} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.choiceTitle}>Barbershop Service</Text>
              <Text style={styles.choiceBody}>
                Haircuts, fades, shaves, beard grooming and mens cuts.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent} />
          </Pressable>
        </GlassPanel>
      ) : (
        visibleGroups.map(({ group, list }) => (
          <View key={group} style={styles.group}>
            {id !== 'beauty' ? (
              <View style={styles.groupHeader}>
                <View
                  style={[
                    styles.groupIcon,
                    { backgroundColor: category?.background ?? Colors.accentSoft },
                  ]}>
                  <Ionicons
                    name={SECTION_ICONS[group] ?? 'ellipse-outline'}
                    size={18}
                    color={category?.accent ?? Colors.accent}
                  />
                </View>
                <Text style={styles.groupTitle}>{group}</Text>
              </View>
            ) : null}
            <GlassPanel borderRadius={22} contentStyle={styles.panel}>
              {list.map((service) => (
                <Pressable
                  key={service.id}
                  style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
                  onPress={() =>
                    router.push(
                      `/(customer)/request/detail?serviceId=${service.id}&categoryId=${id}` as Href,
                    )
                  }>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDesc} numberOfLines={2}>
                      {service.description}
                    </Text>
                    <Text style={styles.price}>From {formatKwacha(service.startingPrice)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.accent} />
                </Pressable>
              ))}
            </GlassPanel>
          </View>
        ))
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  title: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800' },
  sub: { color: Colors.whiteSoft, marginTop: 4, marginBottom: 14, lineHeight: 20 },
  panel: { padding: 12, gap: 10 },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radii.lg,
    padding: 14,
    minHeight: 92,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTitle: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.lg },
  choiceBody: { color: Colors.whiteSoft, marginTop: 4, lineHeight: 18, fontSize: FontSize.sm },
  group: { gap: 8, marginBottom: 8 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  groupIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    color: Colors.charcoal,
    fontWeight: '800',
    fontSize: FontSize.md,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radii.md,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  serviceName: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.md },
  serviceDesc: { color: Colors.whiteSoft, marginTop: 4, fontSize: FontSize.sm, lineHeight: 18 },
  price: { color: Colors.accent, fontWeight: '700', marginTop: 6, fontSize: FontSize.sm },
});
