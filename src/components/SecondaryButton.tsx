import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { Colors, FontSize, Radii } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

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
    backgroundColor: Colors.surface,
    minHeight: 54,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    color: Colors.charcoal,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.88 },
});
