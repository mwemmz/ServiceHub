import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, Radii } from '@/constants/theme';
import type { GeoLocation } from '@/types';

interface Props {
  customer?: GeoLocation | null;
  provider?: GeoLocation | null;
  height?: number;
}

export function MapFallback({ customer, provider, height = 220 }: Props) {
  return (
    <View style={[styles.fallback, { height }]}>
      <Text style={styles.fallbackTitle}>Map preview</Text>
      <Text style={styles.fallbackText}>
        {customer?.address ?? 'Customer location not set yet.'}
      </Text>
      {provider ? <Text style={styles.fallbackText}>Provider: {provider.address}</Text> : null}
      <Text style={styles.note}>Connect a Google Maps API key to show a live map and route.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderRadius: Radii.lg,
    backgroundColor: Colors.repair.background,
    padding: 16,
    justifyContent: 'center',
    gap: 6,
  },
  fallbackTitle: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.md },
  fallbackText: { color: Colors.textMuted },
  note: {
    marginTop: 8,
    color: Colors.charcoal,
    backgroundColor: 'rgba(255,255,255,0.86)',
    padding: 6,
    borderRadius: 8,
    fontSize: FontSize.xs,
    overflow: 'hidden',
  },
});
