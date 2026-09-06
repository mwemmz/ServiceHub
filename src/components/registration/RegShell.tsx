import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '@/components/GlassPanel';
import { RegScrollProvider } from '@/components/registration/RegScrollContext';
import { BrandImages } from '@/constants/assets';
import { REFERENCE_MOCKUP } from '@/constants/referenceCategoryAssets';
import { RegColors } from '@/constants/registrationTheme';

export function RegShell({
  children,
  onBack,
  backLabel = 'Back',
  showBackIcon = false,
  step,
  totalSteps,
  title,
  subtitle,
  embedHeaderInPanel = false,
  referenceCategoryLayout = false,
  categoryPanelLayout = false,
}: {
  children: ReactNode;
  onBack: () => void;
  backLabel?: string;
  showBackIcon?: boolean;
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  /** Renders title/subtitle inside the glass panel (service-category reference layout). */
  embedHeaderInPanel?: boolean;
  /** Uses reference mockup assets instead of built UI — no GlassPanel, no duplicate header. */
  referenceCategoryLayout?: boolean;
  /** Darker frosted panel styling for the service-category step (matches reference mockup). */
  categoryPanelLayout?: boolean;
}) {
  const progress = Math.max(0, Math.min(1, step / totalSteps));
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const premiumChrome = embedHeaderInPanel || referenceCategoryLayout || categoryPanelLayout;
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const compact = screenWidth < 400;
  const shortScreen = screenHeight < 720;
  const categoryPad = referenceCategoryLayout
    ? Math.round((REFERENCE_MOCKUP.panel.left / REFERENCE_MOCKUP.width) * screenWidth)
    : 0;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const vv = window.visualViewport;
    if (!vv) return;

    const updateInset = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(overlap > 40 ? overlap : 0);
    };

    vv.addEventListener('resize', updateInset);
    vv.addEventListener('scroll', updateInset);
    updateInset();

    return () => {
      vv.removeEventListener('resize', updateInset);
      vv.removeEventListener('scroll', updateInset);
    };
  }, []);

  // Never auto-open the keyboard when a registration step mounts
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    }
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {!referenceCategoryLayout ? (
        <>
          <Image
            source={BrandImages.welcomeBackground}
            style={styles.bg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[RegColors.overlayTop, RegColors.overlayMid, RegColors.overlayBot]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </>
      ) : (
        <View style={styles.referenceBg} pointerEvents="none" />
      )}
      {referenceCategoryLayout ? null : premiumChrome ? (
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.15)',
            'rgba(0,0,0,0.35)',
            'rgba(0,0,0,0.55)',
            'rgba(0,0,0,0.7)',
          ]}
          locations={[0, 0.35, 0.7, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}

      <SafeAreaView
        style={styles.safe}
        edges={referenceCategoryLayout ? ['bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}>
        {referenceCategoryLayout ? (
          <View
            style={[
              styles.referenceChrome,
              { paddingTop: insets.top, paddingHorizontal: categoryPad, zIndex: 20 },
            ]}
            pointerEvents="box-none">
            <LinearGradient
              colors={['rgba(10, 6, 5, 0.72)', 'rgba(10, 6, 5, 0)']}
              style={styles.referenceChromeFade}
              pointerEvents="none"
            />
            <View style={[styles.topBar, styles.topBarCategory]}>
              <Pressable
                onPress={onBack}
                style={[styles.backBtn, styles.backBtnPremium]}
                accessibilityRole="button"
                accessibilityLabel={backLabel}>
                {showBackIcon ? (
                  <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.92)" />
                ) : null}
                <Text style={[styles.backLabel, styles.backLabelPremium]}>{backLabel}</Text>
              </Pressable>
              <Text style={[styles.stepLabel, styles.stepLabelPremium]}>
                Step {step} of {totalSteps}
              </Text>
            </View>
            <View style={[styles.progressTrack, styles.progressTrackPremium, styles.progressTrackCategory]}>
              <View style={[styles.progressFill, styles.progressFillPremium, { width: `${progress * 100}%` }]} />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.topBar}>
              <Pressable
                onPress={onBack}
                style={[styles.backBtn, premiumChrome && styles.backBtnPremium]}
                accessibilityRole="button"
                accessibilityLabel={backLabel}>
                {showBackIcon ? (
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={premiumChrome ? 'rgba(255,255,255,0.92)' : RegColors.gold}
                  />
                ) : null}
                <Text style={[styles.backLabel, premiumChrome && styles.backLabelPremium]}>
                  {backLabel}
                </Text>
              </Pressable>
              <Text style={[styles.stepLabel, premiumChrome && styles.stepLabelPremium]}>
                Step {step} of {totalSteps}
              </Text>
            </View>

            <View style={[styles.progressTrack, premiumChrome && styles.progressTrackPremium]}>
              <View style={[styles.progressFill, premiumChrome && styles.progressFillPremium, { width: `${progress * 100}%` }]} />
            </View>
          </>
        )}

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
          <RegScrollProvider scrollRef={scrollRef}>
            {referenceCategoryLayout ? (
              <View style={styles.referenceBody}>{children}</View>
            ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={[
                styles.scroll,
                compact && styles.scrollCompact,
                embedHeaderInPanel && styles.scrollCategory,
                {
                  paddingBottom:
                    (embedHeaderInPanel ? 52 : 36) + keyboardInset + Math.max(insets.bottom, 8),
                },
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets
              bounces>
              {!embedHeaderInPanel ? (
                <View style={styles.headerBlock}>
                  <Text
                    style={[
                      styles.title,
                      compact && styles.titleCompact,
                      shortScreen && styles.titleShort,
                    ]}>
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <GlassPanel
                borderRadius={categoryPanelLayout ? 28 : 32}
                intensity={categoryPanelLayout ? 'medium' : embedHeaderInPanel ? 'light' : 'medium'}
                style={styles.panel}
                contentStyle={[
                  styles.card,
                  compact && styles.cardCompact,
                  embedHeaderInPanel && styles.cardEmbedded,
                  categoryPanelLayout && styles.categoryPanel,
                ]}>
                {embedHeaderInPanel ? (
                  <View style={[styles.embeddedHeader, categoryPanelLayout && styles.categoryHeader]}>
                    <Text
                      style={[
                        styles.titleEmbedded,
                        compact && styles.titleCompact,
                        categoryPanelLayout && styles.categoryTitle,
                      ]}>
                      {title}
                    </Text>
                    {subtitle ? (
                      <Text
                        style={[
                          styles.subtitleEmbedded,
                          compact && styles.subtitleCompact,
                          categoryPanelLayout && styles.categorySubtitle,
                        ]}>
                        {subtitle}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                {children}
              </GlassPanel>
            </ScrollView>
            )}
          </RegScrollProvider>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: RegColors.rootBg },
  flex: { flex: 1, minHeight: 0 },
  bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  safe: { flex: 1, minHeight: 0 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    flexShrink: 0,
  },
  topBarCategory: {
    paddingHorizontal: 0,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 8 },
  backBtnPremium: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  backLabel: { color: RegColors.gold, fontWeight: '700', fontSize: 15 },
  backLabelPremium: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '600',
    fontSize: 16,
  },
  stepLabel: { color: RegColors.whiteMuted, fontSize: 13, fontWeight: '600' },
  stepLabelPremium: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  progressTrack: {
    height: 4,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  progressTrackPremium: {
    height: 3,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  progressTrackCategory: {
    marginHorizontal: 0,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: RegColors.gold,
  },
  progressFillPremium: {
    backgroundColor: RegColors.goldSoft,
    ...Platform.select({
      ios: {
        shadowColor: RegColors.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      web: { boxShadow: `0 0 10px ${RegColors.gold}` } as object,
      default: {},
    }),
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  scrollCompact: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  scrollCategory: { paddingHorizontal: 14 },
  headerBlock: {
    marginBottom: 4,
    overflow: 'visible',
  },
  panel: {
    width: '100%',
    maxWidth: '100%',
  },
  referenceBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#120c09',
  },
  referenceChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  referenceChromeFade: {
    ...StyleSheet.absoluteFillObject,
    height: 120,
  },
  referenceBody: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    color: RegColors.white,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    marginBottom: 6,
    paddingTop: 2,
  },
  titleCompact: {
    fontSize: 22,
    lineHeight: 30,
  },
  titleShort: {
    fontSize: 22,
    lineHeight: 28,
  },
  subtitle: {
    color: RegColors.whiteSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  subtitleCompact: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  card: { padding: 16, gap: 12 },
  cardCompact: { padding: 14, gap: 10 },
  cardEmbedded: { paddingTop: 28, paddingHorizontal: 20, paddingBottom: 22, gap: 0 },
  categoryPanel: {
    paddingTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 0,
  },
  embeddedHeader: { gap: 10, marginBottom: 14 },
  categoryHeader: { gap: 8, marginBottom: 12 },
  titleEmbedded: {
    color: RegColors.white,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.4,
    paddingTop: 2,
  },
  categoryTitle: {
    fontSize: 25,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  subtitleEmbedded: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  categorySubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    lineHeight: 22,
  },
});
