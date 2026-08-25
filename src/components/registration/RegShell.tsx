import { useEffect, useRef, type ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassPanel } from '@/components/GlassPanel';
import { RegScrollProvider } from '@/components/registration/RegScrollContext';
import { BrandImages } from '@/constants/assets';
import { RegColors } from '@/constants/registrationTheme';

export function RegShell({
  children,
  onBack,
  step,
  totalSteps,
  title,
  subtitle,
}: {
  children: ReactNode;
  onBack: () => void;
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
}) {
  const progress = Math.max(0, Math.min(1, step / totalSteps));
  const scrollRef = useRef<ScrollView>(null);

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

      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.topBar}>
          <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button">
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={styles.stepLabel}>
            Step {step} of {totalSteps}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}>
          <RegScrollProvider scrollRef={scrollRef}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

              <GlassPanel borderRadius={24} style={styles.card}>
                {children}
              </GlassPanel>
            </ScrollView>
          </RegScrollProvider>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: RegColors.rootBg },
  bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 8 },
  backLabel: { color: RegColors.gold, fontWeight: '700', fontSize: 15 },
  stepLabel: { color: RegColors.whiteMuted, fontSize: 13, fontWeight: '600' },
  progressTrack: {
    height: 4,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: RegColors.gold,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 36 },
  title: {
    color: RegColors.white,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: RegColors.whiteSoft,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  card: { padding: 16, gap: 12 },
});
