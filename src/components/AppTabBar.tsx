import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Shadows } from '@/constants/theme';

export interface TabItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
}

interface Props {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  onCenterPress?: () => void;
  centerIcon?: keyof typeof Ionicons.glyphMap;
}

export function AppTabBar({ items, activeKey, onChange, onCenterPress, centerIcon = 'add' }: Props) {
  const insets = useSafeAreaInsets();
  const left = items.slice(0, 2);
  const right = items.slice(2);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {left.map((item) => (
        <TabButton key={item.key} item={item} active={item.key === activeKey} onPress={() => onChange(item.key)} />
      ))}
      <Pressable onPress={onCenterPress} style={styles.center} accessibilityLabel="New request">
        <Ionicons name={centerIcon} size={28} color={Colors.onAccent} />
      </Pressable>
      {right.map((item) => (
        <TabButton key={item.key} item={item} active={item.key === activeKey} onPress={() => onChange(item.key)} />
      ))}
    </View>
  );
}

function TabButton({ item, active, onPress }: { item: TabItem; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tab} accessibilityRole="button" accessibilityLabel={item.label}>
      <Ionicons
        name={active ? item.activeIcon ?? item.icon : item.icon}
        size={22}
        color={active ? Colors.accent : Colors.textLight}
      />
      <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(16,22,42,0.92)',
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingTop: 10,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    ...Shadows.floating,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingBottom: 4 },
  label: { fontSize: FontSize.xs, color: Colors.textLight, fontWeight: '600' },
  activeLabel: { color: Colors.accent },
  center: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    ...Shadows.floating,
  },
});
