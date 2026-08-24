import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MapFallback } from '@/components/MapFallback';
import { Colors, FontSize, Radii } from '@/constants/theme';
import type { GeoLocation } from '@/types';

interface Props {
  customer?: GeoLocation | null;
  provider?: GeoLocation | null;
  height?: number;
}

export function ServiceMap({ customer, provider, height = 220 }: Props) {
  const regionSource = customer ?? provider;
  if (!regionSource) {
    return <MapFallback customer={customer} provider={provider} height={height} />;
  }

  const region = {
    latitude: regionSource.latitude,
    longitude: regionSource.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={[styles.frame, { height }]}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region}>
        {customer ? (
          <Marker coordinate={customer} title="Your location" pinColor="#C67C4E" />
        ) : null}
        {provider ? (
          <Marker coordinate={provider} title="Provider" pinColor="#5B8FB8" />
        ) : null}
        {customer && provider ? (
          <Polyline coordinates={[provider, customer]} strokeColor="#C67C4E" strokeWidth={4} />
        ) : null}
      </MapView>
      <Text style={styles.note}>Straight-line preview. Live routing needs a maps API key.</Text>
    </View>
  );
}

export default ServiceMap;

const styles = StyleSheet.create({
  frame: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    backgroundColor: Colors.repair.background,
  },
  note: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    color: Colors.charcoal,
    backgroundColor: 'rgba(255,255,255,0.86)',
    padding: 6,
    borderRadius: 8,
    fontSize: FontSize.xs,
    overflow: 'hidden',
  },
});
