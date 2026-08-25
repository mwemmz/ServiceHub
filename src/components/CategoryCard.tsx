import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Radii, Shadows } from '@/constants/theme';
import type { Category } from '@/types';

interface Props {
  category: Category;
  onPress: () => void;
}

export function CategoryCard({ category, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: category.background }, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, { backgroundColor: Colors.surface }]}>
        <Ionicons name={category.icon as keyof typeof Ionicons.glyphMap} size={22} color={category.accent} />
      </View>
      <Text style={styles.title}>{category.name}</Text>
      <Text style={styles.description} numberOfLines={3}>
        {category.description}
      </Text>
      <View style={[styles.arrow, { backgroundColor: category.accent }]}>
        <Ionicons name="arrow-forward" size={16} color={Colors.onAccent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderRadius: Radii.lg,
    padding: 14,
    minHeight: 190,
    ...Shadows.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { color: Colors.charcoal, fontSize: FontSize.md, fontWeight: '800', marginBottom: 6 },
  description: { color: Colors.textMuted, fontSize: FontSize.xs, lineHeight: 16, flex: 1 },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginTop: 12,
  },
});
