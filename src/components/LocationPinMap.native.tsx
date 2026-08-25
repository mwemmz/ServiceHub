import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { AppConfig } from '@/constants/config';
import type { GeoLocation } from '@/types';

/** Native interactive map with draggable service-location pin. */
export function LocationPinMap({
  location,
  height = 260,
  onRegionChange,
}: {
  location: GeoLocation | null;
  height?: number;
  onRegionChange?: (next: { latitude: number; longitude: number }) => void;
}) {
  const mapRef = useRef<MapView>(null);
  const lat = location?.latitude ?? AppConfig.defaultMapRegion.latitude;
  const lng = location?.longitude ?? AppConfig.defaultMapRegion.longitude;

  const region: Region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <View style={[styles.frame, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        region={region}
        onRegionChangeComplete={(next) => {
          onRegionChange?.({ latitude: next.latitude, longitude: next.longitude });
        }}>
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          draggable
          pinColor="#C67C4E"
          title="Service location"
          onDragEnd={(e) => {
            onRegionChange?.({
              latitude: e.nativeEvent.coordinate.latitude,
              longitude: e.nativeEvent.coordinate.longitude,
            });
          }}
        />
      </MapView>
      <Text style={styles.note}>Drag the pin or move the map to set your exact location.</Text>
    </View>
  );
}

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
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 6,
    borderRadius: 8,
    fontSize: FontSize.xs,
  },
});
