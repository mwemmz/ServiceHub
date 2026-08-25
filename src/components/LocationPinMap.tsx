import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { AppConfig } from '@/constants/config';
import { Colors, FontSize, Radii } from '@/constants/theme';
import type { GeoLocation } from '@/types';

/**
 * Web map preview using Google Maps embed (key via EXPO_PUBLIC_GOOGLE_MAPS_API_KEY when available).
 * Pin position is driven by `location` props from GPS / search / confirm — not a static image.
 */
export function LocationPinMap({
  location,
  height = 260,
  onRegionChange,
}: {
  location: GeoLocation | null;
  height?: number;
  /** Called when user adjusts via native map; web uses buttons/search instead */
  onRegionChange?: (next: { latitude: number; longitude: number }) => void;
}) {
  const lat = location?.latitude ?? AppConfig.defaultMapRegion.latitude;
  const lng = location?.longitude ?? AppConfig.defaultMapRegion.longitude;
  const [src, setSrc] = useState('');

  useEffect(() => {
    const key = AppConfig.mapsApiKey;
    if (key) {
      setSrc(
        `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${lat},${lng}&zoom=15`,
      );
    } else {
      setSrc(`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`);
    }
  }, [lat, lng]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.frame, { height }]}>
        <Text style={styles.fallback}>Map loads on device builds.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.frame, { height }]}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <iframe
        title="Service location map"
        src={src}
        style={{ border: 0, width: '100%', height: '100%' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <Text style={styles.note}>
        {location?.address
          ? `Pin: ${location.address}`
          : 'Select GPS or search to place the pin'}
      </Text>
      {onRegionChange ? (
        <View style={styles.nudgeRow}>
          <Text
            style={styles.nudge}
            onPress={() => onRegionChange({ latitude: lat + 0.001, longitude: lng })}>
            N
          </Text>
          <Text
            style={styles.nudge}
            onPress={() => onRegionChange({ latitude: lat, longitude: lng - 0.001 })}>
            W
          </Text>
          <Text
            style={styles.nudge}
            onPress={() => onRegionChange({ latitude: lat, longitude: lng + 0.001 })}>
            E
          </Text>
          <Text
            style={styles.nudge}
            onPress={() => onRegionChange({ latitude: lat - 0.001, longitude: lng })}>
            S
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    backgroundColor: Colors.repair.background,
    position: 'relative',
  },
  fallback: { color: Colors.textMuted, padding: 16 },
  note: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    color: '#2C2420',
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 6,
    borderRadius: 8,
    fontSize: FontSize.xs,
  },
  nudgeRow: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  nudge: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: '800',
    color: '#2C2420',
    overflow: 'hidden',
  },
});
