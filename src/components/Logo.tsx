import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '@/constants/theme';

const GOLD = '#E8C89A';

export function Logo({
  size = 'md',
  variant = 'dark',
  align = 'center',
  layout = 'vertical',
}: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  align?: 'center' | 'left';
  layout?: 'vertical' | 'horizontal';
}) {
  const pin = size === 'lg' ? 36 : size === 'sm' ? 22 : 28;
  const titleSize = size === 'lg' ? FontSize.hero : size === 'sm' ? FontSize.xl : 26;
  const light = variant === 'light';
  const horizontal = layout === 'horizontal';

  return (
    <View style={[styles.wrap, align === 'left' && styles.left]}>
      <View style={[horizontal ? styles.brandRow : styles.brandCol]}>
        <View
          style={[
            styles.pin,
            { width: pin + 10, height: pin + 10, borderRadius: (pin + 10) / 3 },
            !horizontal && styles.pinBelow,
          ]}>
          <Ionicons name="location" size={pin - 2} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { fontSize: titleSize }, light && styles.titleLight]}>
          Service<Text style={[styles.hub, light && styles.hubLight]}>Hub</Text>
        </Text>
      </View>
      <Text style={[styles.tag, light && styles.tagLight, horizontal && styles.tagLeft]}>
        — Solutions, Near You —
      </Text>
    </View>
  );
}

const scriptFont = Platform.select({
  ios: 'Snell Roundhand',
  android: 'cursive',
  web: 'Segoe Script, Brush Script MT, cursive',
  default: 'cursive',
});

export function ScriptAccent({
  children,
  style,
}: {
  children: string;
  style?: object;
}) {
  return (
    <Text style={[styles.script, { fontFamily: scriptFont }, style]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  left: { alignItems: 'flex-start' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandCol: { alignItems: 'center' },
  pin: {
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 8,
      },
      default: {},
    }),
  },
  pinBelow: { marginBottom: 10 },
  title: { color: Colors.charcoal, fontWeight: '800' },
  titleLight: { color: '#FFFFFF' },
  hub: { color: Colors.accent },
  hubLight: { color: GOLD, fontStyle: 'italic' },
  tag: { color: Colors.textMuted, marginTop: 6, letterSpacing: 1, fontSize: FontSize.sm },
  tagLight: { color: 'rgba(255,255,255,0.78)' },
  tagLeft: { alignSelf: 'flex-start', marginLeft: 2 },
  script: {
    color: GOLD,
    fontSize: 36,
    fontWeight: '600',
    lineHeight: 42,
  },
});

