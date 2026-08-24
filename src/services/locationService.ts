import * as Location from 'expo-location';
import type { GeoLocation } from '@/types';

export type LocationPermission = 'undetermined' | 'granted' | 'denied';

export async function getPermissionStatus(): Promise<LocationPermission> {
  const result = await Location.getForegroundPermissionsAsync();
  if (result.status === 'granted') return 'granted';
  if (result.status === 'denied') return 'denied';
  return 'undetermined';
}

export async function requestDeviceLocation(): Promise<GeoLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Location permission was not granted. You can still choose a location on the map.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const places = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });
  const place = places[0];
  const addressParts = [place?.name, place?.street, place?.subregion, place?.city, place?.country].filter(
    Boolean,
  );

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    address: addressParts.join(', ') || 'Current location',
    city: place?.city ?? undefined,
    area: place?.subregion ?? place?.district ?? undefined,
  };
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoLocation> {
  const places = await Location.reverseGeocodeAsync({ latitude, longitude });
  const place = places[0];
  const addressParts = [place?.name, place?.street, place?.subregion, place?.city].filter(Boolean);
  return {
    latitude,
    longitude,
    address: addressParts.join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    city: place?.city ?? undefined,
    area: place?.subregion ?? undefined,
  };
}
