import { type ReactNode } from 'react';
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
import { GlassPanel } from '@/components/GlassPanel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { BrandImages } from '@/constants/assets';
import { RegColors, ScriptFont } from '@/constants/registrationTheme';
import { resetProviderRegistrationDraft } from '@/services/providerRegistrationDraft';

const SCRIPT = Platform.select(ScriptFont) ?? 'cursive';
const SIDE_BY_SIDE_MIN_WIDTH = 700;

/** Choose Individual Provider or Registered Business before registration forms. */
export default function ProviderTypeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const sideBySide = width >= SIDE_BY_SIDE_MIN_WIDTH;
  const compact = width < 400;

  async function startIndividual() {
    await resetProviderRegistrationDraft('individual');
    router.push({
      pathname: '/(auth)/register-provider',
      params: { type: 'individual' },
    } as Href);
  }

  async function startBusiness() {
    await resetProviderRegistrationDraft('business');
    router.push({
      pathname: '/(auth)/register-provider',
      params: { type: 'business' },
    } as Href);
  }

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
          <Pressable
            onPress={() => router.replace('/(auth)/account-type' as Href)}
            style={styles.backRow}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={20} color={RegColors.gold} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>

          <View style={styles.brand}>
            <LinearGradient colors={['#E8A86A', RegColors.goldDeep]} style={styles.pin}>
              <Ionicons name="location" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.brandTitle, compact && styles.brandTitleCompact]}>
              Service<Text style={styles.brandHub}>Hub</Text>
            </Text>
          </View>

          <View style={styles.hero}>
            <Text style={[styles.heroMain, compact && styles.heroMainCompact]}>
              What type of service provider are you?
            </Text>
            <Text style={styles.heroSub}>
              Individual and business accounts use separate registration forms.
            </Text>
          </View>

          <View style={sideBySide ? styles.cardsRow : styles.cardsCol}>
            <ChoiceCard
              icon={
                <View style={styles.individualBadge}>
                  <Ionicons name="person-outline" size={28} color="#FFFFFF" />
                </View>
              }
              title="Individual Provider"
              body="Offer services independently as an individual professional."
              buttonLabel="Continue as Individual"
              buttonVariant="gold"
              stretch={sideBySide}
              onPress={() => void startIndividual()}
            />
            <ChoiceCard
              icon={
                <View style={styles.businessBadge}>
                  <Ionicons name="business-outline" size={26} color="#FFFFFF" />
                </View>
              }
              title="Registered Business"
              body="Represent a salon, barbershop, repair shop, cleaning business, or other registered business."
              buttonLabel="Continue as Business"
              buttonVariant="blue"
              stretch={sideBySide}
              onPress={() => void startBusiness()}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ChoiceCard({
  icon,
  title,
  body,
  buttonLabel,
  buttonVariant,
  stretch,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  buttonLabel: string;
  buttonVariant: 'gold' | 'blue';
  stretch: boolean;
  onPress: () => void;
}) {
  return (
    <View style={{ flex: stretch ? 1 : undefined, width: stretch ? undefined : '100%' }}>
      <GlassPanel borderRadius={26} intensity="medium" contentStyle={styles.card}>
        <View style={styles.cardIconWrap}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{body}</Text>
        <PrimaryButton
          label={buttonLabel}
          onPress={onPress}
          variant={buttonVariant}
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
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  scrollCompact: { paddingHorizontal: 14, paddingBottom: 36 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4,
  },
  backLabel: { color: RegColors.gold, fontWeight: '700', fontSize: 15 },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  brandTitleCompact: { fontSize: 20 },
  brandHub: { color: RegColors.gold, fontFamily: SCRIPT, fontWeight: '600' },
  hero: { alignItems: 'center', marginBottom: 18, width: '100%' },
  heroMain: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroMainCompact: { fontSize: 22, lineHeight: 28 },
  heroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  cardsRow: { flexDirection: 'row', gap: 10, width: '100%' },
  cardsCol: { flexDirection: 'column', gap: 12, width: '100%' },
  card: { padding: 18, alignItems: 'center', minHeight: 240 },
  cardIconWrap: { marginBottom: 12 },
  individualBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: RegColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  businessBadge: {
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
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardBody: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  cta: { width: '100%' },
});
