import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Radii, Shadows } from '@/constants/theme';
import { RegColors } from '@/constants/registrationTheme';
import { useResponsive } from '@/hooks/useResponsive';

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

const CENTER_SLOT = 64;

export function AppTabBar({ items, activeKey, onChange, onCenterPress, centerIcon = 'add' }: Props) {
  const insets = useSafeAreaInsets();
  const { isWide, contentMaxWidth } = useResponsive();
  const left = items.slice(0, 2);
  const right = items.slice(2);

  if (isWide) {
    return (
      <View style={[styles.wideShell, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={[styles.wideRow, { maxWidth: contentMaxWidth }]}>
          {left.map((item) => (
            <TabButton
              key={item.key}
              item={item}
              active={item.key === activeKey}
              onPress={() => onChange(item.key)}
              wide
            />
          ))}
          <Pressable
            onPress={onCenterPress}
            style={styles.wideCenter}
            accessibilityRole="button"
            accessibilityLabel="More">
            <LinearGradient
              colors={['#E8B07A', RegColors.gold, RegColors.goldDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.wideCenterGrad}>
              <Ionicons name={centerIcon} size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
          {right.map((item) => (
            <TabButton
              key={item.key}
              item={item}
              active={item.key === activeKey}
              onPress={() => onChange(item.key)}
              wide
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.row}>
        {left.map((item) => (
          <TabButton
            key={item.key}
            item={item}
            active={item.key === activeKey}
            onPress={() => onChange(item.key)}
          />
        ))}

        <View style={styles.centerSlot}>
          <Pressable onPress={onCenterPress} style={styles.centerOuter} accessibilityLabel="New request">
            <LinearGradient
              colors={['#E8B07A', RegColors.gold, RegColors.goldDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.center}>
              <Ionicons name={centerIcon} size={26} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>

        {right.map((item) => (
          <TabButton
            key={item.key}
            item={item}
            active={item.key === activeKey}
            onPress={() => onChange(item.key)}
          />
        ))}
      </View>
    </View>
  );
}

function TabButton({
  item,
  active,
  onPress,
  wide = false,
}: {
  item: TabItem;
  active: boolean;
  onPress: () => void;
  wide?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[wide ? styles.tabWide : styles.tab, active && wide && styles.tabWideOn]}
      accessibilityRole="button"
      accessibilityLabel={item.label}>
      <Ionicons
        name={active ? item.activeIcon ?? item.icon : item.icon}
        size={wide ? 18 : 22}
        color={active ? Colors.accent : Colors.textLight}
      />
      <Text
        style={[
          styles.label,
          active && styles.activeLabel,
          wide && styles.labelWide,
          wide && active && styles.labelWideOn,
        ]}
        numberOfLines={1}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(10,16,32,0.88)',
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingTop: 8,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    ...Shadows.floating,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    paddingBottom: 6,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeLabel: { color: Colors.accent },
  centerSlot: {
    width: CENTER_SLOT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  centerOuter: {
    marginTop: -20,
    borderRadius: Radii.full,
    ...Shadows.floating,
  },
  center: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideShell: {
    backgroundColor: 'rgba(10,16,32,0.9)',
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  wideRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radii.full,
  },
  tabWideOn: { backgroundColor: Colors.accentSoft },
  labelWide: { fontSize: FontSize.sm },
  labelWideOn: { color: Colors.accent },
  wideCenter: {
    borderRadius: Radii.full,
    marginHorizontal: 4,
    ...Shadows.floating,
  },
  wideCenterGrad: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});