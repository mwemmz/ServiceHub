import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '@/components/AppShell';
import { GlassPanel } from '@/components/GlassPanel';
import { LocationPinMap } from '@/components/LocationPinMap';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { AppConfig } from '@/constants/config';
import {
  getServiceRequestDraft,
  patchServiceRequestDraft,
} from '@/services/serviceRequestDraft';
import {
  requestDeviceLocation,
  reverseGeocode,
  searchPlaces,
} from '@/services/locationService';
import type { GeoLocation } from '@/types';

/** Step 3 — exact service location: GPS, map pin, or address search. */
export default function RequestLocationScreen() {
  const router = useRouter();
  const draft = getServiceRequestDraft();
  const [location, setLocation] = useState<GeoLocation | null>(draft?.location ?? null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!draft) {
      router.replace('/(customer)/categories' as Href);
    }
  }, [draft, router]);

  async function applyCoords(latitude: number, longitude: number, label?: string) {
    setError('');
    try {
      const geo = await reverseGeocode(latitude, longitude);
      const next = {
        ...geo,
        address: label ? `${label} — ${geo.address}` : geo.address,
      };
      setLocation(next);
      patchServiceRequestDraft({ location: next });
    } catch {
      const next = {
        latitude,
        longitude,
        address: label || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      };
      setLocation(next);
      patchServiceRequestDraft({ location: next });
    }
  }

  async function onGps() {
    setLocating(true);
    setError('');
    try {
      const geo = await requestDeviceLocation();
      setLocation(geo);
      patchServiceRequestDraft({ location: geo });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Location permission denied. Search or move the map pin instead.',
      );
    } finally {
      setLocating(false);
    }
  }

  async function onSearch() {
    setSearching(true);
    setError('');
    try {
      const found = await searchPlaces(query);
      setResults(found);
      if (found.length === 0) {
        setError('No places found. Try a more specific address in Zambia.');
      }
    } catch {
      setError('Could not search places right now. Try GPS or try again.');
    } finally {
      setSearching(false);
    }
  }

  function onContinue() {
    if (!location) {
      setError('Select your exact service location to continue.');
      return;
    }
    patchServiceRequestDraft({ location });
    router.push('/(customer)/request/confirm' as Href);
  }

  return (
    <AppShell keyboard>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>Service location</Text>
      <Text style={styles.sub}>
        Where should the provider come for{' '}
        <Text style={{ fontWeight: '800' }}>{draft?.serviceName ?? 'your service'}</Text>?
      </Text>

      <GlassPanel borderRadius={24} contentStyle={styles.panel}>
        <LocationPinMap
          location={location}
          height={240}
          onRegionChange={({ latitude, longitude }) => {
            applyCoords(latitude, longitude).catch(() => undefined);
          }}
        />

        <SecondaryButton
          label={locating ? 'Getting GPS…' : 'Use My Current Location'}
          onPress={onGps}
          disabled={locating}
        />

        <Text style={styles.or}>or search for a place</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="e.g. Ibex Hill, Lusaka"
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="words"
            autoFocus={false}
          />
          <Pressable style={styles.searchBtn} onPress={onSearch} disabled={searching}>
            {searching ? (
              <ActivityIndicator color={Colors.onAccent} />
            ) : (
              <Ionicons name="search" size={18} color={Colors.onAccent} />
            )}
          </Pressable>
        </View>

        {results.map((item) => (
          <Pressable
            key={`${item.latitude}-${item.longitude}-${item.address}`}
            style={styles.result}
            onPress={() => {
              setLocation(item);
              patchServiceRequestDraft({ location: item });
              setResults([]);
            }}>
            <Ionicons name="location-outline" size={18} color={Colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.resultTitle}>{item.address}</Text>
              <Text style={styles.resultMeta}>
                {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
              </Text>
            </View>
          </Pressable>
        ))}

        {location ? (
          <View style={styles.selected}>
            <Text style={styles.selectedLabel}>Selected pin</Text>
            <Text style={styles.selectedValue}>{location.address}</Text>
            {!AppConfig.mapsApiKey ? (
              <Text style={styles.keyHint}>
                Tip: add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for richer Google Maps embeds on web.
              </Text>
            ) : null}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton label="Confirm on map" onPress={onContinue} disabled={!location} />
      </GlassPanel>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  back: { paddingVertical: 6, alignSelf: 'flex-start' },
  backText: { color: Colors.accent, fontWeight: '700', fontSize: 15 },
  title: { color: Colors.charcoal, fontSize: FontSize.xxl, fontWeight: '800' },
  sub: { color: Colors.whiteSoft, lineHeight: 20, marginBottom: 12 },
  panel: { padding: 14, gap: 12 },
  or: { color: Colors.whiteSoft, textAlign: 'center', fontWeight: '700', fontSize: FontSize.sm },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    color: Colors.charcoal,
  },
  searchBtn: {
    width: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  result: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  resultTitle: { color: Colors.charcoal, fontWeight: '700' },
  resultMeta: { color: Colors.whiteSoft, fontSize: FontSize.xs, marginTop: 2 },
  selected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.lg,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedLabel: { color: Colors.whiteSoft, fontSize: FontSize.sm, fontWeight: '700' },
  selectedValue: { color: Colors.charcoal, fontWeight: '700', lineHeight: 20 },
  keyHint: { color: Colors.textLight, fontSize: FontSize.xs, marginTop: 6 },
  error: { color: Colors.error, fontWeight: '600' },
});
