import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { AppConfig } from '@/constants/config';
import type { GeoLocation } from '@/types';

export type LocationPermission = 'undetermined' | 'granted' | 'denied';

const GPS_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

/** Browser Geolocation API — reliable on web/mobile browsers with HTTPS or localhost. */
function getBrowserPosition(): Promise<{ latitude: number; longitude: number }> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('GPS is not supported in this browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(
            new Error(
              'Location permission denied. Allow GPS access in your browser, then tap “Use My Current Location”.',
            ),
          );
          return;
        }
        if (err.code === err.TIMEOUT) {
          reject(new Error('GPS timed out. Try again or enter your address manually.'));
          return;
        }
        reject(new Error('Could not get GPS location. Try again or enter your address manually.'));
      },
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: 30000 },
    );
  });
}

export async function getPermissionStatus(): Promise<LocationPermission> {
  const result = await Location.getForegroundPermissionsAsync();
  if (result.status === 'granted') return 'granted';
  if (result.status === 'denied') return 'denied';
  return 'undetermined';
}

export async function requestDeviceLocation(): Promise<GeoLocation> {
  if (Platform.OS === 'web') {
    const coords = await getBrowserPosition();
    return reverseGeocode(coords.latitude, coords.longitude);
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error(
      'Location permission was not granted. Allow location access, then tap “Use My Current Location”.',
    );
  }

  const position = await withTimeout(
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    GPS_TIMEOUT_MS,
    'Could not get GPS location in time. Try again or enter your address manually.',
  );

  return reverseGeocode(position.coords.latitude, position.coords.longitude);
}

async function googleReverseGeocode(latitude: number, longitude: number): Promise<GeoLocation | null> {
  const key = AppConfig.mapsApiKey;
  if (!key) return null;
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}` +
      `&key=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      results?: Array<{
        formatted_address?: string;
        address_components?: Array<{ long_name: string; types: string[] }>;
      }>;
    };
    const first = data.results?.[0];
    if (!first?.formatted_address) return null;
    const city = first.address_components?.find((c) => c.types.includes('locality'))?.long_name;
    const area = first.address_components?.find(
      (c) => c.types.includes('sublocality') || c.types.includes('neighborhood'),
    )?.long_name;
    return {
      latitude,
      longitude,
      address: first.formatted_address,
      city,
      area,
    };
  } catch {
    return null;
  }
}

async function googleSearchPlaces(term: string): Promise<GeoLocation[]> {
  const key = AppConfig.mapsApiKey;
  if (!key) return [];
  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(term)}` +
      `&components=country:ZM&key=${encodeURIComponent(key)}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      results?: Array<{
        formatted_address?: string;
        geometry?: { location?: { lat: number; lng: number } };
      }>;
    };
    return (data.results ?? []).slice(0, 8).flatMap((item) => {
      const lat = item.geometry?.location?.lat;
      const lng = item.geometry?.location?.lng;
      if (lat == null || lng == null) return [];
      return [
        {
          latitude: lat,
          longitude: lng,
          address: item.formatted_address || term,
        },
      ];
    });
  } catch {
    return [];
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoLocation> {
  const fromGoogle = await googleReverseGeocode(latitude, longitude);
  if (fromGoogle) return fromGoogle;

  try {
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
  } catch {
    return {
      latitude,
      longitude,
      address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    };
  }
}

/** Search places by text → coordinates (Google Geocoding when keyed; else device geocoder). */
export async function searchPlaces(query: string): Promise<GeoLocation[]> {
  const term = query.trim();
  if (term.length < 3) return [];

  const fromGoogle = await googleSearchPlaces(term);
  if (fromGoogle.length > 0) return fromGoogle;

  try {
    const results = await Location.geocodeAsync(term);
    const mapped: GeoLocation[] = [];
    for (const item of results.slice(0, 8)) {
      const geo = await reverseGeocode(item.latitude, item.longitude).catch(() => ({
        latitude: item.latitude,
        longitude: item.longitude,
        address: term,
      }));
      mapped.push({
        ...geo,
        address: geo.address.includes(term) ? geo.address : `${term} — ${geo.address}`,
      });
    }
    return mapped;
  } catch {
    return [];
  }
}

/** Haversine distance in km */
export function distanceKm(a: GeoLocation, b: GeoLocation): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
