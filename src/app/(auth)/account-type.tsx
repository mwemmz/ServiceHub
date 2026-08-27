import { useEffect, type ReactNode } from 'react';
import {
  Alert,
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
import { GlassPanel } from '@/components/GlassPanel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { BrandImages } from '@/constants/assets';
import { RegColors, ScriptFont } from '@/constants/registrationTheme';
import { useAuth } from '@/context/AuthContext';
import { signInWithGoogle } from '@/services/googleSignIn';

const SCRIPT = Platform.select(ScriptFont) ?? 'cursive';

type Feature = { icon: keyof typeof Ionicons.glyphMap; label: string };

/**
 * Get Started — layout matched to the uploaded ServiceHub reference image:
 * top-left brand, Get Started / Your Way script, side-by-side glass cards,
 * gold/blue CTAs with arrow pills, full-width Google, Sign In →
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const { width } = useWindowDimensions();
  const sideBySide = width >= 360;

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
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          {/* Brand — top left, pin + ServiceHub inline (reference) */}
          <View style={styles.brand}>
            <LinearGradient colors={['#E8A86A', RegColors.goldDeep]} style={styles.pin}>
              <Ionicons name="location" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text style={styles.brandTitle}>
                Service<Text style={styles.brandHub}>Hub</Text>
              </Text>
              <Text style={styles.brandTag}>— SOLUTIONS, NEAR YOU —</Text>
            </View>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroMain}>Get Started</Text>
            <Text style={styles.heroScript}>Your Way</Text>
            <Text style={styles.heroSub}>Choose the account that fits what you need today.</Text>
          </View>

          {/* Two glass role cards */}
          <View style={sideBySide ? styles.cardsRow : styles.cardsCol}>
            <AccountGlassCard
              icon={
                <View style={styles.customerBadge}>
                  <Ionicons name="person" size={28} color="#FFFFFF" />
                </View>
              }
              title="Customer"
              body="Find, book and enjoy services near you."
              features={[
                { icon: 'location-outline', label: 'Discover nearby services' },
                { icon: 'calendar-outline', label: 'Book with ease' },
                { icon: 'shield-checkmark-outline', label: 'Safe & reliable' },
              ]}
              buttonLabel="Create Customer Account"
              buttonVariant="gold"
              stretch={sideBySide}
              onPress={() => router.push('/(auth)/register')}
            />
            <AccountGlassCard
              icon={
                <View style={styles.providerBadge}>
                  <Ionicons name="construct" size={26} color="#FFFFFF" />
                </View>
              }
              title="Service Provider"
              body="Offer your skills, get requests and manage bookings."
              features={[
                { icon: 'briefcase-outline', label: 'Show your services' },
                { icon: 'notifications-outline', label: 'Receive customer requests' },
                { icon: 'bar-chart-outline', label: 'Grow your business' },
              ]}
              buttonLabel="Create Provider Account"
              buttonVariant="blue"
              stretch={sideBySide}
              onPress={() => router.push('/(auth)/register-provider' as Href)}
            />
          </View>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            onPress={() => {
              signInWithGoogle().catch(() =>
                Alert.alert('Sign-in failed', 'Please try again.'),
              );
            }}
            style={({ pressed }) => [styles.googleWrap, pressed && styles.pressed]}>
            <GlassPanel intensity="light" borderRadius={999}>
              <View style={styles.googleInner}>
                <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                <Text style={styles.googleText}>Continue with Google</Text>
              </View>
            </GlassPanel>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [styles.signInRow, pressed && styles.pressed]}>
            <Text style={styles.signInMuted}>Already have an account? </Text>
            <Text style={styles.signInGold}>Sign In →</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AccountGlassCard({
  icon,
  title,
  body,
  features,
  buttonLabel,
  buttonVariant,
  stretch,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  features: Feature[];
  buttonLabel: string;
  buttonVariant: 'gold' | 'blue';
  stretch: boolean;
  onPress: () => void;
}) {
  return (
    <View style={{ flex: stretch ? 1 : undefined, width: stretch ? undefined : '100%' }}>
      <GlassPanel
        borderRadius={26}
        intensity="medium"
        style={stretch ? { flex: 1 } : undefined}
        contentStyle={styles.card}>
        <View style={styles.cardIconWrap}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{body}</Text>
        <View style={styles.featList}>
          {features.map((f) => (
            <View key={f.label} style={styles.featRow}>
              <Ionicons name={f.icon} size={14} color="rgba(255,255,255,0.95)" />
              <Text style={styles.featText}>{f.label}</Text>
            </View>
          ))}
        </View>
        <PrimaryButton
          label={buttonLabel}
          onPress={onPress}
          variant={buttonVariant}
          withArrow
          style={styles.cta}
        />
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: RegColors.rootBg },
  bgImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 28,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
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
    fontWeight: '700',
    letterSpacing: 0.2,
  },
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
  hero: { alignItems: 'center', marginBottom: 18, width: '100%' },
  heroMain: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroScript: {
    color: RegColors.gold,
    fontSize: 38,
    fontFamily: SCRIPT,
    marginTop: -6,
    marginBottom: 10,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    alignItems: 'stretch',
  },
  cardsCol: { flexDirection: 'column', gap: 12, width: '100%' },
  card: {
    padding: 14,
    alignItems: 'center',
    minHeight: 300,
    flexGrow: 1,
  },
  cardIconWrap: { marginBottom: 10 },
  /** Tan/gold circle + white person — reference Customer badge */
  customerBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: RegColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  /** Blue circle + white tools — reference Provider badge */
  providerBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: RegColors.providerBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardBody: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 12,
  },
  featList: { width: '100%', marginBottom: 10, flexGrow: 1 },
  featRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featText: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  cta: { width: '100%', marginTop: 4 },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 18,
    marginBottom: 14,
  },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.55)' },
  orText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  googleWrap: { width: '100%' },
  googleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 15,
    paddingHorizontal: 18,
    width: '100%',
  },
  googleText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 10,
  },
  signInMuted: { color: 'rgba(255,255,255,0.78)', fontSize: 14 },
  signInGold: { color: RegColors.gold, fontWeight: '800', fontSize: 14 },
  pressed: { opacity: 0.88 },
});
