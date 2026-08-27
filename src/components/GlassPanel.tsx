import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { RegColors } from '@/constants/registrationTheme';

interface GlassPanelProps extends ViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Applied to the inner content wrapper (use for flexDirection, padding, gap). */
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: 'light' | 'medium' | 'strong';
  borderRadius?: number;
}

/**
 * Frosted glass surface matching the Get Started reference:
 * low white opacity + blur so the photo shows through (not solid white cards).
 */
export function GlassPanel({
  children,
  style,
  contentStyle,
  intensity = 'medium',
  borderRadius = 22,
  ...rest
}: GlassPanelProps) {
  const tint =
    intensity === 'light'
      ? RegColors.glassFillLight
      : intensity === 'strong'
        ? RegColors.glassFillStrong
        : RegColors.glassFill;

  const blurIntensity =
    Platform.select({
      web: 0,
      ios: intensity === 'light' ? 36 : 52,
      android: intensity === 'light' ? 40 : 58,
      default: 50,
    }) ?? 50;

  const shell: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 12,
  };

  const webGlass: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backgroundColor: tint,
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        } as ViewStyle)
      : {};

  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return (
      <GlassView
        {...rest}
        glassEffectStyle="regular"
        tintColor="rgba(255, 255, 255, 0.04)"
        style={[shell, style]}>
        <View style={[styles.overlay, { backgroundColor: tint }]} pointerEvents="none" />
        <View style={styles.highlight} pointerEvents="none" />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </GlassView>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View {...rest} style={[shell, webGlass, style]}>
        <View style={styles.highlight} pointerEvents="none" />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View {...rest} style={[shell, style]}>
      <BlurView
        intensity={blurIntensity}
        tint="light"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.overlay, { backgroundColor: tint }]} pointerEvents="none" />
      <View style={styles.highlight} pointerEvents="none" />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  content: { position: 'relative', zIndex: 1 },
});
