import { Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '@/constants/theme';
import { RegColors, ScriptFont } from '@/constants/registrationTheme';

const SCRIPT = Platform.select(ScriptFont) ?? 'cursive';

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
  const titleSize = size === 'lg' ? FontSize.hero : size === 'sm' ? FontSize.xl : 28;
  const light = variant === 'light';
  const horizontal = layout === 'horizontal';

  return (
    <View style={[styles.wrap, align === 'left' && styles.left]}>
      <View style={[horizontal ? styles.brandRow : styles.brandCol]}>
        <LinearGradient
          colors={['#E8A86A', RegColors.goldDeep]}
          style={[
            styles.pin,
            { width: pin + 12, height: pin + 12, borderRadius: (pin + 12) / 3 },
            !horizontal && styles.pinBelow,
          ]}>
          <Ionicons name="location" size={pin - 2} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.title, { fontSize: titleSize }, light && styles.titleLight]}>
          Service<Text style={styles.hub}>Hub</Text>
        </Text>
      </View>
      <Text style={[styles.tag, light && styles.tagLight, horizontal && styles.tagLeft]}>
        — SOLUTIONS, NEAR YOU —
      </Text>
    </View>
  );
}

export function ScriptAccent({
  children,
  style,
}: {
  children: string;
  style?: object;
}) {
  return <Text style={[styles.script, { fontFamily: SCRIPT }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  left: { alignItems: 'flex-start' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandCol: { alignItems: 'center' },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBelow: { marginBottom: 10 },
  title: { color: Colors.charcoal, fontWeight: '700' },
  titleLight: { color: '#FFFFFF' },
  hub: {
    color: RegColors.gold,
    fontFamily: SCRIPT,
    fontWeight: '600',
  },
  tag: {
    color: Colors.textMuted,
    marginTop: 6,
    letterSpacing: 1.8,
    fontSize: 10,
    fontWeight: '600',
  },
  tagLight: { color: 'rgba(255,255,255,0.8)' },
  tagLeft: { alignSelf: 'flex-start', marginLeft: 2 },
  script: {
    color: RegColors.gold,
    fontSize: 36,
    fontWeight: '600',
    lineHeight: 42,
  },
});
