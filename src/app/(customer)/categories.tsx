import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '@/components/AppShell';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { Colors, FontSize } from '@/constants/theme';
import { RegColors, ScriptFont } from '@/constants/registrationTheme';
import { useAuth } from '@/context/AuthContext';
import { getCategories } from '@/services/catalogService';
import type { Category } from '@/types';
import { firstName, greetingForNow } from '@/utils/format';

const SCRIPT = Platform.select(ScriptFont) ?? 'cursive';

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
          <Text style={styles.brand}>
            Service<Text style={styles.brandHub}>Hub</Text>
          </Text>
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
      <Text style={styles.sectionSub}>Beauty, cleaning, and repairs — near you.</Text>

      <View style={styles.list}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() =>
              router.push(`/(customer)/request/services?categoryId=${category.id}` as Href)
            }
            style={({ pressed }) => [pressed && { opacity: 0.92 }]}>
            <GlassPanel borderRadius={24} intensity="medium">
              <View style={styles.card}>
                <View style={[styles.iconWrap, { backgroundColor: category.background }]}>
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
                <View style={[styles.chevron, { backgroundColor: category.accent }]}>
                  <Ionicons name="arrow-forward" size={16} color={Colors.onAccent} />
                </View>
              </View>
            </GlassPanel>
          </Pressable>
        ))}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  brand: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  brandHub: {
    color: RegColors.gold,
    fontFamily: SCRIPT,
    fontWeight: '600',
  },
  hello: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800', marginTop: 6 },
  sub: { color: Colors.whiteSoft, marginTop: 4, lineHeight: 20 },
  homeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    color: Colors.charcoal,
    fontWeight: '800',
    fontSize: FontSize.lg,
    marginTop: 12,
  },
  sectionSub: {
    color: Colors.whiteSoft,
    fontSize: FontSize.sm,
    marginTop: 4,
    marginBottom: 14,
  },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    minHeight: 104,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  cardTitle: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.lg },
  cardBody: {
    color: Colors.whiteSoft,
    marginTop: 4,
    lineHeight: 18,
    fontSize: FontSize.sm,
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
