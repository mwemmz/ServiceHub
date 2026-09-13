import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { BrandImages } from '@/constants/assets';
import { RegColors, ScriptFont } from '@/constants/registrationTheme';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

const SCRIPT = Platform.select(ScriptFont) ?? 'cursive';

/** First-time / logged-out landing — Get Started or Sign In only. */
export default function WelcomeScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const { width } = useWindowDimensions();
  const compact = width < 400;

  useEffect(() => {
    completeOnboarding().catch(() => undefined);
  }, [completeOnboarding]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Image
        source={BrandImages.welcomeBackground}
        style={styles.bgImage}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={[RegColors.overlayTop, RegColors.overlayMid, RegColors.overlayBot]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, compact && styles.scrollCompact]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          <View style={styles.brand}>
            <LinearGradient colors={['#E8A86A', RegColors.goldDeep]} style={styles.pin}>
              <Ionicons name="location" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.brandTextCol}>
              <Text style={[styles.brandTitle, compact && styles.brandTitleCompact]}>
                Service<Text style={styles.brandHub}>Hub</Text>
              </Text>
              <Text style={styles.brandTag}>— SOLUTIONS, NEAR YOU —</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={[styles.heroMain, compact && styles.heroMainCompact]}>ServiceHub</Text>
            <Text style={styles.heroSub}>
              Find services. Book professionals. Get things done.
            </Text>
          </View>

          <PrimaryButton
            label="Get Started"
            onPress={() => router.push('/(auth)/account-type' as Href)}
            style={styles.primary}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            onPress={() => router.push('/(auth)/login' as Href)}
            style={({ pressed }) => [styles.signInRow, pressed && styles.pressed]}>
            <Text style={styles.signInMuted}>Already have an account? </Text>
            <Text style={styles.signInGold}>Sign In</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: RegColors.rootBg },
  bgImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  scrollCompact: { paddingHorizontal: 16 },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    marginBottom: 36,
  },
  brandTextCol: { flexShrink: 1, minWidth: 0 },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
  },
  brandTitleCompact: { fontSize: 22, lineHeight: 28 },
  brandHub: {
    color: RegColors.gold,
    fontFamily: SCRIPT,
    fontWeight: '600',
  },
  brandTag: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 9,
    letterSpacing: 1.6,
    marginTop: 2,
    fontWeight: '600',
  },
  hero: { alignItems: 'center', marginBottom: 36, width: '100%' },
  heroMain: {
    color: '#FFFFFF',
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroMainCompact: { fontSize: 34, lineHeight: 40 },
  heroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  primary: { width: '100%' },
  signInRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    paddingVertical: 10,
  },
  signInMuted: { color: 'rgba(255,255,255,0.78)', fontSize: 14 },
  signInGold: { color: RegColors.gold, fontWeight: '800', fontSize: 14 },
  pressed: { opacity: 0.88 },
});
