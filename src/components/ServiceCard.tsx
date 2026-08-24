import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radii, Shadows } from '@/constants/theme';
import { formatKwacha } from '@/utils/format';
import type { CategoryId, Service } from '@/types';

const ICONS: Record<CategoryId, keyof typeof Ionicons.glyphMap> = {
  beauty: 'sparkles-outline',
  cleaning: 'leaf-outline',
  repair: 'construct-outline',
};

interface Props {
  service: Service;
  onPress: () => void;
}

export function ServiceCard({ service, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.icon}>
        <Ionicons name={ICONS[service.categoryId]} size={20} color={Colors.accent} />
      </View>
      <View style={styles.body}>
        <Text style={styles.group}>{service.group}</Text>
        <Text style={styles.name}>{service.name}</Text>
        <Text style={styles.meta}>
          From {formatKwacha(service.startingPrice)} · {service.durationMinutes} mins
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.card,
  },
  pressed: { opacity: 0.92 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  group: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  name: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '700', marginTop: 2 },
  meta: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
});
