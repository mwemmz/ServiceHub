import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { Colors, FontSize, Radii } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

/** Frosted outline pill — matches Google / secondary actions in the reference. */
export function SecondaryButton({ label, onPress, disabled, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed, style]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    minHeight: 48,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    color: Colors.whiteSoft,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
