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
import { BrandImages } from '@/constants/assets';
import { useAuth } from '@/context/AuthContext';
import { signInWithGoogle } from '@/services/googleSignIn';

/** Warm gold / beige from the new design target */
const GOLD = '#E2B07E';
const GOLD_DEEP = '#C4894A';

const SCRIPT = Platform.select({
  ios: 'Snell Roundhand',
  android: 'cursive',
  web: '"Segoe Script", "Brush Script MT", cursive',
  default: 'cursive',
});

type Feature = { icon: keyof typeof Ionicons.glyphMap; label: string };

/**
 * BRAND-NEW Welcome / Account-Type screen.
 * Built from scratch with real React Native widgets.
 * Background = photo only. UI = Text / Pressable / GlassPanel / Icons.
 *
 * Routes (existing):
 *   Customer  → /(auth)/register
 *   Provider  → /(auth)/register-provider
 *   Sign In   → /(auth)/login
 *   Google    → signInWithGoogle()
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

      {/* NEW photographic background — NOT the old orange mockup */}
      <Image
        source={BrandImages.welcomeBackground}
        style={styles.bgImage}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={['rgba(6,10,24,0.28)', 'rgba(8,14,32,0.45)', 'rgba(4,6,16,0.78)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          {/* Header */}
          <View style={styles.brand}>
            <LinearGradient colors={['#F0A060', '#C67C4E']} style={styles.pin}>
              <Ionicons name="location" size={22} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.brandTitle}>
              Service<Text style={styles.brandHub}>Hub</Text>
            </Text>
            <Text style={styles.brandTag}>— Solutions, Near You —</Text>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroMain}>Get Started</Text>
            <Text style={styles.heroScript}>Your Way</Text>
            <View style={styles.heroUnderline} />
            <Text style={styles.heroSub}>
              Choose the account that fits{'\n'}what you need today.
            </Text>
          </View>

          {/* Glass account cards */}
          <View style={sideBySide ? styles.cardsRow : styles.cardsCol}>
            <View style={sideBySide ? styles.customerCol : styles.customerColFull}>
              <AccountGlassCard
                wide={false}
                icon={
                  <View style={styles.customerBadge}>
                    <Ionicons name="person" size={24} color="#FFFFFF" />
                  </View>
                }
                title="Customer"
                body={"Find, book and enjoy\nservices near you."}
                features={[
                  { icon: 'location-outline', label: 'Discover nearby services' },
                  { icon: 'calendar-outline', label: 'Book with ease' },
                  { icon: 'shield-checkmark-outline', label: 'Safe & reliable' },
                ]}
                buttonLabel="Create Customer Account"
                buttonColors={['#E8945A', '#C67C4E', '#8B4A28']}
                onPress={() => router.push('/(auth)/register')}
              />

              {/* Google is for customers only — directly under Create Customer Account */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
                onPress={() => {
                  signInWithGoogle().catch(() =>
                    Alert.alert('Sign-in failed', 'Please try again.'),
                  );
                }}
                style={({ pressed }) => [styles.googleUnderCustomer, pressed && styles.pressed]}>
                <GlassPanel intensity="light" borderRadius={999} style={styles.googleInner}>
                  <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </GlassPanel>
              </Pressable>
            </View>

            <View style={sideBySide ? styles.customerCol : styles.customerColFull}>
              <AccountGlassCard
                wide={false}
                icon={
                  <View style={styles.providerBadge}>
                    <Ionicons name="hammer" size={15} color="#FFFFFF" style={styles.toolHammer} />
                    <Ionicons name="build" size={15} color="#FFFFFF" style={styles.toolWrench} />
                  </View>
                }
                title="Service Provider"
                body={"Offer your skills, get\nrequests and manage bookings."}
                features={[
                  { icon: 'briefcase-outline', label: 'Show your services' },
                  { icon: 'notifications-outline', label: 'Receive customer requests' },
                  { icon: 'trending-up-outline', label: 'Grow your business' },
                ]}
                buttonLabel="Create Provider Account"
                buttonColors={['#5BA3E8', '#3B7FD4', '#1E5AA8']}
                onPress={() => router.push('/(auth)/register-provider' as Href)}
              />
            </View>
          </View>

          {/* Sign In — real Pressable */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [styles.signInRow, pressed && styles.pressed]}>
            <Text style={styles.signInMuted}>Already have an account? </Text>
            <Text style={styles.signInGold}>Sign In</Text>
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
  buttonColors,
  onPress,
  wide,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  features: Feature[];
  buttonLabel: string;
  buttonColors: [string, string, string];
  onPress: () => void;
  wide: boolean;
}) {
  return (
    <GlassPanel borderRadius={26} style={[styles.card, wide ? styles.cardWide : styles.cardFull]}>
      <View style={styles.cardIconWrap}>{icon}</View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>

      <View style={styles.featList}>
        {features.map((f) => (
          <View key={f.label} style={styles.featRow}>
            <Ionicons name={f.icon} size={13} color="rgba(255,255,255,0.95)" />
            <Text style={styles.featText}>{f.label}</Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        onPress={onPress}
        style={({ pressed }) => [styles.ctaOuter, pressed && styles.pressed]}>
        <LinearGradient
          colors={buttonColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.cta}>
          <Text style={styles.ctaLabel} numberOfLines={2}>
            {buttonLabel}
          </Text>
        </LinearGradient>
      </Pressable>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A1020',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 28,
    alignItems: 'center',
  },

  brand: {
    alignItems: 'center',
    marginBottom: 14,
  },
  pin: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  brandHub: {
    color: GOLD,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  brandTag: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    letterSpacing: 1.4,
    marginTop: 5,
  },

  hero: {
    alignItems: 'center',
    marginBottom: 18,
    width: '100%',
  },
  heroMain: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroScript: {
    color: GOLD,
    fontSize: 36,
    fontFamily: SCRIPT,
    marginTop: -2,
  },
  heroUnderline: {
    width: 118,
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD_DEEP,
    opacity: 0.75,
    marginTop: 2,
    marginBottom: 12,
    transform: [{ rotate: '-1.5deg' }],
  },
  heroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },

  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    alignItems: 'flex-start',
  },
  cardsCol: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  customerCol: {
    flex: 1,
    gap: 10,
  },
  customerColFull: {
    width: '100%',
    gap: 10,
  },
  card: {
    padding: 14,
    alignItems: 'center',
  },
  cardWide: {
    width: '100%',
    minHeight: 340,
  },
  cardFull: {
    width: '100%',
    minHeight: 300,
  },
  cardIconWrap: {
    marginBottom: 10,
  },
  customerBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: GOLD_DEEP,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  providerBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3B7FD4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  toolHammer: {
    position: 'absolute',
    left: 12,
    top: 14,
  },
  toolWrench: {
    position: 'absolute',
    right: 12,
    bottom: 14,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardBody: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  featList: {
    width: '100%',
    marginBottom: 4,
  },
  featRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 7,
  },
  featText: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 10,
    flex: 1,
  },

  ctaOuter: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 10,
  },
  cta: {
    minHeight: 44,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ctaLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },

  googleUnderCustomer: {
    width: '100%',
  },
  googleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    width: '100%',
  },
  googleText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 10,
  },
  signInMuted: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
  },
  signInGold: {
    color: GOLD,
    fontWeight: '800',
    fontSize: 14,
  },

  pressed: {
    opacity: 0.88,
  },
});
