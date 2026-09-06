import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface Props {
  label?: string;
  onPress?: () => void;
  /** Used when there is no navigation history (common after router.replace on web). */
  fallbackHref?: Href;
  style?: StyleProp<ViewStyle>;
}

/** Back control — uses history when available, otherwise navigates to fallbackHref. */
export function BackButton({ label = 'Back', onPress, fallbackHref, style }: Props) {
  const router = useRouter();

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (fallbackHref) {
      router.replace(fallbackHref);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.back, pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Ionicons name="chevron-back" size={20} color={Colors.accent} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: 6,
    paddingRight: 8,
    marginBottom: 4,
  },
  label: { color: Colors.accent, fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.85 },
});
