import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, FontSize } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, right }: Props) {
  const router = useRouter();
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <Ionicons name="chevron-back" size={22} color={Colors.charcoal} />
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1 },
  title: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 1 },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
