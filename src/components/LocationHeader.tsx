import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '@/constants/theme';
import type { GeoLocation } from '@/types';

interface Props {
  location: GeoLocation | null;
  onPress: () => void;
}

export function LocationHeader({ location, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.wrap} accessibilityRole="button">
      <Ionicons name="location" size={18} color={Colors.accent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>Current location</Text>
        <Text style={styles.value} numberOfLines={1}>
          {location?.address ?? 'Set your location'}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={16} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  label: { color: Colors.textMuted, fontSize: FontSize.xs },
  value: { color: Colors.charcoal, fontSize: FontSize.sm, fontWeight: '700' },
});
