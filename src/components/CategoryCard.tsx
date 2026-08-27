import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '@/components/GlassPanel';
import { Colors, FontSize, Radii } from '@/constants/theme';
import type { Category } from '@/types';

interface Props {
  category: Category;
  onPress: () => void;
  /** `row` = full-width list item (mobile home). `tile` = vertical card (wide grids). */
  layout?: 'row' | 'tile';
}

/** Category card — frosted glass + tinted accent. */
export function CategoryCard({ category, onPress, layout = 'tile' }: Props) {
  if (layout === 'row') {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        <GlassPanel borderRadius={Radii.lg} intensity="medium" contentStyle={styles.rowCard}>
          <View style={[styles.rowIcon, { backgroundColor: category.background }]}>
            <Ionicons
              name={category.icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color={category.accent}
            />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle} numberOfLines={2}>
              {category.name}
            </Text>
            <Text style={styles.rowDesc} numberOfLines={2}>
              {category.description}
            </Text>
          </View>
          <View style={[styles.arrow, { backgroundColor: category.accent }]}>
            <Ionicons name="arrow-forward" size={16} color={Colors.onAccent} />
          </View>
        </GlassPanel>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tilePress, pressed && styles.pressed]}>
      <GlassPanel borderRadius={Radii.lg} intensity="medium" contentStyle={styles.tileCard}>
        <View style={[styles.iconWrap, { backgroundColor: category.background }]}>
          <Ionicons
            name={category.icon as keyof typeof Ionicons.glyphMap}
            size={22}
            color={category.accent}
          />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {category.name}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {category.description}
        </Text>
        <View style={[styles.arrow, { backgroundColor: category.accent }]}>
          <Ionicons name="arrow-forward" size={16} color={Colors.onAccent} />
        </View>
      </GlassPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tilePress: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.92 },
  tileCard: {
    padding: 14,
    minHeight: 190,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    minHeight: 88,
  },
  rowIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    flexShrink: 0,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: {
    color: Colors.charcoal,
    fontSize: FontSize.md,
    fontWeight: '800',
    lineHeight: 20,
  },
  rowDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 16,
    marginTop: 4,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  title: {
    color: Colors.charcoal,
    fontSize: FontSize.md,
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 20,
  },
  description: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 16,
    flexGrow: 1,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
