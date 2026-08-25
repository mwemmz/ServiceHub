import type { ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandImages } from '@/constants/assets';
import { RegColors } from '@/constants/registrationTheme';
import { Spacing } from '@/constants/theme';

type Edges = ('top' | 'bottom' | 'left' | 'right')[];

/**
 * Shared ServiceHub shell — same photo + glass overlay language as Create Account.
 * Wrap any customer/provider screen for visual consistency (no flow changes).
 */
export function AppShell({
  children,
  scroll = true,
  padded = true,
  edges = ['top', 'bottom', 'left', 'right'],
  contentStyle,
  keyboard = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edges;
  contentStyle?: StyleProp<ViewStyle>;
  keyboard?: boolean;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, padded && styles.padded, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Image source={BrandImages.welcomeBackground} style={styles.bg} resizeMode="cover" />
      <LinearGradient
        colors={[RegColors.overlayTop, RegColors.overlayMid, RegColors.overlayBot]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.safe} edges={edges}>
        {keyboard ? (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={8}>
            {body}
          </KeyboardAvoidingView>
        ) : (
          body
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: RegColors.rootBg },
  bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  safe: { flex: 1 },
  fill: { flex: 1 },
  scroll: { paddingBottom: 40, flexGrow: 1 },
  padded: { paddingHorizontal: Spacing.lg },
});
