import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { RegColors } from '@/constants/registrationTheme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  /** Gold (customer) or blue (provider) gradient — matches Get Started CTAs */
  variant?: 'gold' | 'blue' | 'solid';
  /** White circle + arrow on the right (reference CTA style) */
  withArrow?: boolean;
}

/** Pill CTA matching the Get Started reference buttons. */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
  variant = 'gold',
  withArrow = false,
}: Props) {
  const colors: [string, string, string] =
    variant === 'blue'
      ? ['#5BA3E8', '#3B7FD4', '#1E5AA8']
      : variant === 'solid'
        ? [RegColors.gold, RegColors.gold, RegColors.goldDeep]
        : ['#E8B07A', '#D4A373', '#B87A4A'];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.outer,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.grad}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={[styles.label, withArrow && styles.labelFlex]} numberOfLines={2}>
              {label}
            </Text>
            {withArrow ? (
              <View style={styles.arrowCircle}>
                <Ionicons name="arrow-forward" size={14} color={Colors.onAccent} />
              </View>
            ) : null}
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: Radii.pill,
    overflow: 'hidden',
    minHeight: 48,
  },
  grad: {
    minHeight: 48,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  label: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelFlex: { flex: 1 },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.9 },
});
