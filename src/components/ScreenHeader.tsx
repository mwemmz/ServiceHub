import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Href } from 'expo-router';
import { BackButton } from '@/components/BackButton';
import { Colors, FontSize } from '@/constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  fallbackHref?: Href;
  right?: ReactNode;
  /** When false, hide the back control (e.g. tab roots). */
  showBack?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  fallbackHref,
  right,
  showBack = true,
}: Props) {
  return (
    <View style={styles.wrap}>
      {showBack ? (
        <BackButton onPress={onBack} fallbackHref={fallbackHref} />
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, paddingVertical: 8 },
  spacer: { height: 8 },
  center: { gap: 4 },
  title: { color: Colors.charcoal, fontSize: 26, fontWeight: '800' },
  subtitle: { color: Colors.whiteSoft, fontSize: FontSize.sm, lineHeight: 20 },
  right: { position: 'absolute', right: 0, top: 8 },
});
