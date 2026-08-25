import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '@/components/AppShell';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { Colors, FontSize, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getCategories } from '@/services/catalogService';
import type { Category } from '@/types';
import { firstName, greetingForNow } from '@/utils/format';

/** First screen after customer signup/login — three main service categories. */
export default function ServiceCategoriesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  if (!categories) {
    return (
      <AppShell scroll={false}>
        <LoadingState message="Loading services..." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>ServiceHub</Text>
          <Text style={styles.hello}>
            {greetingForNow()}, {firstName(user?.fullName ?? 'there')}
          </Text>
          <Text style={styles.sub}>What do you need help with today?</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(customer)/(tabs)' as Href)}
          style={styles.homeBtn}
          accessibilityLabel="Open home">
          <Ionicons name="home-outline" size={22} color={Colors.accent} />
        </Pressable>
      </View>

      <Text style={styles.section}>Service categories</Text>

      <GlassPanel borderRadius={24} style={styles.panel}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: category.background },
              pressed && { opacity: 0.92 },
            ]}
            onPress={() =>
              router.push(`/(customer)/request/services?categoryId=${category.id}` as Href)
            }>
            <View style={styles.iconWrap}>
              <Ionicons
                name={category.icon as keyof typeof Ionicons.glyphMap}
                size={28}
                color={category.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{category.name}</Text>
              <Text style={styles.cardBody}>{category.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={category.accent} />
          </Pressable>
        ))}
      </GlassPanel>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  brand: { color: Colors.accent, fontWeight: '800', fontSize: FontSize.sm, letterSpacing: 1 },
  hello: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800', marginTop: 4 },
  sub: { color: Colors.whiteSoft, marginTop: 4 },
  homeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    color: Colors.charcoal,
    fontWeight: '800',
    fontSize: FontSize.lg,
    marginTop: 8,
    marginBottom: 12,
  },
  panel: { padding: 14, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radii.lg,
    padding: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.lg },
  cardBody: { color: Colors.whiteSoft, marginTop: 4, lineHeight: 18, fontSize: FontSize.sm },
});
