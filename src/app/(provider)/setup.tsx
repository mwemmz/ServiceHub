import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { clearPersistedState, usePersistedState } from '@/hooks/usePersistedState';
import { getCategories, getServicesForCategory } from '@/services/catalogService';
import { emptyProviderProfile, saveProviderProfile } from '@/services/providerService';
import { updateUser } from '@/services/authService';
import { StorageKeys } from '@/services/storage';
import type { CategoryId, ProviderService } from '@/types';

type ProviderSetupDraft = {
  fullName: string;
  bio: string;
  area: string;
  years: string;
  categoryId: CategoryId;
  selected: Record<string, string>;
};

export default function ProviderSetupScreen() {
  const router = useRouter();
  const { user, providerProfile, refresh } = useAuth();
  const [draft, setDraft] = usePersistedState<ProviderSetupDraft>(StorageKeys.draftProviderSetup, {
    fullName: user?.fullName ?? '',
    bio: providerProfile?.bio ?? '',
    area: providerProfile?.serviceArea ?? '',
    years: String(providerProfile?.yearsOfExperience ?? 1),
    categoryId: providerProfile?.categoryId ?? 'beauty',
    selected: Object.fromEntries(
      (providerProfile?.services ?? []).map((item) => [item.serviceId, String(item.price)]),
    ),
  });
  const { fullName, bio, area, years, categoryId, selected } = draft;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const { data: categories } = useAsyncData(getCategories, []);
  const { data: services } = useAsyncData(() => getServicesForCategory(categoryId), [categoryId]);

  useEffect(() => {
    if (!user?.fullName && !providerProfile) return;
    setDraft((prev) => ({
      fullName: prev.fullName || user?.fullName || '',
      bio: prev.bio || providerProfile?.bio || '',
      area: prev.area || providerProfile?.serviceArea || '',
      years: prev.years || String(providerProfile?.yearsOfExperience ?? 1),
      categoryId: prev.categoryId || providerProfile?.categoryId || 'beauty',
      selected:
        Object.keys(prev.selected).length > 0
          ? prev.selected
          : Object.fromEntries(
              (providerProfile?.services ?? []).map((item) => [item.serviceId, String(item.price)]),
            ),
    }));
  }, [user?.fullName, providerProfile, setDraft]);

  function toggle(id: string, startingPrice: number) {
    setDraft((current) => {
      const nextSelected = { ...current.selected };
      if (nextSelected[id] != null) delete nextSelected[id];
      else nextSelected[id] = String(startingPrice);
      return { ...current, selected: nextSelected };
    });
  }

  async function save() {
    if (!user || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const offers: ProviderService[] = Object.entries(selected).map(([serviceId, price]) => ({
        serviceId,
        price: Number(price) || 0,
        durationMinutes: services?.find((item) => item.id === serviceId)?.durationMinutes ?? 60,
      }));
      await updateUser(user.id, { fullName });
      await saveProviderProfile({
        ...(providerProfile ?? emptyProviderProfile(user.id)),
        bio,
        serviceArea: area,
        yearsOfExperience: Number(years) || 1,
        categoryId,
        services: offers,
        isSetupComplete: offers.length > 0 && bio.trim().length > 0 && area.trim().length > 0,
      });
      await refresh();
      await clearPersistedState(StorageKeys.draftProviderSetup);
      router.replace('/(provider)/(tabs)');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <ScreenHeader title="Provider profile" subtitle="Choose your category, services and prices." />
      <View style={styles.form}>
        <InputField
          label="Full name"
          value={fullName}
          onChangeText={(value) => setDraft((prev) => ({ ...prev, fullName: value }))}
          autoCapitalize="words"
        />
        <InputField
          label="Bio"
          value={bio}
          onChangeText={(value) => setDraft((prev) => ({ ...prev, bio: value }))}
          multiline
        />
        <InputField
          label="Service area"
          value={area}
          onChangeText={(value) => setDraft((prev) => ({ ...prev, area: value }))}
          autoCapitalize="words"
        />
        <InputField
          label="Years of experience"
          value={years}
          onChangeText={(value) => setDraft((prev) => ({ ...prev, years: value }))}
          keyboardType="number-pad"
        />
        <Text style={styles.label}>Category</Text>
        <View style={styles.row}>
          {(categories ?? []).map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setDraft((prev) => ({ ...prev, categoryId: category.id, selected: {} }))}
              style={[styles.chip, categoryId === category.id && styles.chipOn]}>
              <Text style={[styles.chipText, categoryId === category.id && styles.chipTextOn]}>{category.shortName}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Services you offer</Text>
        {(services ?? []).map((service) => {
          const on = selected[service.id] != null;
          return (
            <View key={service.id} style={styles.service}>
              <Pressable onPress={() => toggle(service.id, service.startingPrice)} style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{on ? '✓ ' : ''}{service.name}</Text>
              </Pressable>
              {on ? (
                <InputField
                  value={selected[service.id]}
                  onChangeText={(text) =>
                    setDraft((prev) => ({
                      ...prev,
                      selected: { ...prev.selected, [service.id]: text },
                    }))
                  }
                  keyboardType="number-pad"
                />
              ) : null}
            </View>
          );
        })}
        <PrimaryButton label="Save profile" onPress={save} loading={saving} />
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, paddingBottom: 40 },
  label: { color: Colors.charcoal, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: Colors.surface, borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: Colors.accent },
  chipText: { color: Colors.textMuted, fontWeight: '700' },
  chipTextOn: { color: '#FFFFFF' },
  service: { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: 12, gap: 8 },
  serviceName: { color: Colors.charcoal, fontWeight: '700', fontSize: FontSize.md },
  error: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '600' },
});
