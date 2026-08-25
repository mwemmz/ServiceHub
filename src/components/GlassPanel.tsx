import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

interface GlassPanelProps extends ViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: 'light' | 'medium';
  borderRadius?: number;
}

const BLUR_INTENSITY = Platform.select({ web: 0, ios: 48, android: 55, default: 50 }) ?? 50;

export function GlassPanel({
  children,
  style,
  intensity = 'medium',
  borderRadius = 20,
  ...rest
}: GlassPanelProps) {
  const tint =
    intensity === 'light' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.18)';

  const shell: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  };

  const webGlass: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backgroundColor: tint,
          backdropFilter: 'blur(22px) saturate(150%)',
          WebkitBackdropFilter: 'blur(22px) saturate(150%)',
        } as ViewStyle)
      : {};

  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return (
      <GlassView
        {...rest}
        glassEffectStyle="regular"
        tintColor="rgba(255, 255, 255, 0.06)"
        style={[shell, style]}>
        <View style={[styles.overlay, { backgroundColor: tint }]} pointerEvents="none" />
        <View style={styles.highlight} pointerEvents="none" />
        <View style={styles.content}>{children}</View>
      </GlassView>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View {...rest} style={[shell, webGlass, style]}>
        <View style={styles.highlight} pointerEvents="none" />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View {...rest} style={[shell, style]}>
      <BlurView
        intensity={BLUR_INTENSITY}
        tint="light"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.overlay, { backgroundColor: tint }]} pointerEvents="none" />
      <View style={styles.highlight} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  content: { position: 'relative', zIndex: 1 },
});
