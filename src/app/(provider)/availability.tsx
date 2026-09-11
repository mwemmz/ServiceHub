import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { clearPersistedState, usePersistedState } from '@/hooks/usePersistedState';
import { saveProviderProfile } from '@/services/providerService';
import { StorageKeys } from '@/services/storage';
import type { AvailabilitySlot } from '@/types';

export default function AvailabilityScreen() {
  const router = useRouter();
  const { providerProfile, refresh } = useAuth();
  const [slots, setSlots] = usePersistedState<AvailabilitySlot[]>(
    StorageKeys.draftProviderAvailability,
    providerProfile?.availability ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  function update(day: AvailabilitySlot['day'], patch: Partial<AvailabilitySlot>) {
    setSlots((current) => current.map((slot) => (slot.day === day ? { ...slot, ...patch } : slot)));
  }

  async function save() {
    if (!providerProfile || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveProviderProfile({ ...providerProfile, availability: slots });
      await refresh();
      await clearPersistedState(StorageKeys.draftProviderAvailability);
      router.back();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save hours.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <ScreenHeader title="Availability" subtitle="Customers see these hours on your profile." />
      <View style={styles.list}>
        {slots.map((slot) => (
          <View key={slot.day} style={styles.card}>
            <Pressable onPress={() => update(slot.day, { enabled: !slot.enabled })}>
              <Text style={styles.day}>
                {slot.enabled ? '✓ ' : ''}
                {slot.label}
              </Text>
            </Pressable>
            {slot.enabled ? (
              <View style={styles.times}>
                <View style={{ flex: 1 }}>
                  <InputField label="Start" value={slot.start} onChangeText={(start) => update(slot.day, { start })} />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField label="End" value={slot.end} onChangeText={(end) => update(slot.day, { end })} />
                </View>
              </View>
            ) : (
              <Text style={styles.off}>Unavailable</Text>
            )}
          </View>
        ))}
        <PrimaryButton label="Save hours" onPress={save} loading={saving} />
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, marginTop: 12, paddingBottom: 40 },
  card: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: 14, gap: 10 },
  day: { color: Colors.charcoal, fontWeight: '800', fontSize: FontSize.md },
  times: { flexDirection: 'row', gap: 10 },
  off: { color: Colors.textMuted },
  error: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '600' },
});
