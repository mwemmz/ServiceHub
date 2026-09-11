import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ServiceMap } from '@/components/ServiceMap';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAppLocation } from '@/context/LocationContext';
import { reverseGeocode } from '@/services/locationService';
import { AppConfig } from '@/constants/config';

export default function LocationScreen() {
  const router = useRouter();
  const { location, isLocating, error, useCurrentLocation, setManualLocation } = useAppLocation();
  const [address, setAddress] = useState(location?.address ?? '');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  async function useDevice() {
    try {
      const next = await useCurrentLocation();
      setAddress(next.address);
    } catch {
      // error is shown from context
    }
  }

  async function saveManual() {
    setSaving(true);
    setLocalError('');
    try {
      const next = await reverseGeocode(
        location?.latitude ?? AppConfig.defaultMapRegion.latitude,
        location?.longitude ?? AppConfig.defaultMapRegion.longitude,
      );
      await setManualLocation({
        ...next,
        address: address.trim() || next.address,
      });
      router.back();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not save location.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <ScreenHeader
        title="Your location"
        subtitle="Used for nearby providers, distance and arrival estimates."
        fallbackHref="/(customer)/(tabs)/profile"
      />
      <ServiceMap customer={location} height={220} />
      <Text style={styles.hint}>
        This is not a fake GPS location. Until you allow location access or type an address, ServiceHub will not pretend to know where you are.
      </Text>
      <PrimaryButton label={isLocating ? 'Getting location...' : 'Use my current location'} onPress={useDevice} loading={isLocating} />
      <InputField label="Address" value={address} onChangeText={setAddress} autoCapitalize="words" />
      {error || localError ? <Text style={styles.error}>{error || localError}</Text> : null}
      <SecondaryButton label="Save address" onPress={saveManual} disabled={!address.trim() || saving} />
      {location ? (
        <View style={styles.card}>
          <Text style={styles.label}>Saved location</Text>
          <Text style={styles.value}>{location.address}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { color: Colors.textMuted, marginVertical: 12, lineHeight: 20, fontSize: FontSize.sm },
  error: { color: Colors.error, marginBottom: 8 },
  card: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: 14, marginTop: 12 },
  label: { color: Colors.textMuted, fontSize: FontSize.sm },
  value: { color: Colors.charcoal, fontWeight: '700', marginTop: 4 },
});
