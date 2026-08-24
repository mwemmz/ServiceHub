import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getCategories, getServicesForCategory } from '@/services/catalogService';
import { emptyProviderProfile, saveProviderProfile } from '@/services/providerService';
import { updateUser } from '@/services/authService';
import type { CategoryId, ProviderService } from '@/types';

export default function ProviderSetupScreen() {
  const router = useRouter();
  const { user, providerProfile, refresh } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [bio, setBio] = useState(providerProfile?.bio ?? '');
  const [area, setArea] = useState(providerProfile?.serviceArea ?? '');
  const [years, setYears] = useState(String(providerProfile?.yearsOfExperience ?? 1));
  const [categoryId, setCategoryId] = useState<CategoryId>(providerProfile?.categoryId ?? 'beauty');
  const [selected, setSelected] = useState<Record<string, string>>(
    Object.fromEntries((providerProfile?.services ?? []).map((item) => [item.serviceId, String(item.price)])),
  );
  const [saving, setSaving] = useState(false);
  const { data: categories } = useAsyncData(getCategories, []);
  const { data: services } = useAsyncData(() => getServicesForCategory(categoryId), [categoryId]);

  function toggle(id: string, startingPrice: number) {
    setSelected((current) => {
      const next = { ...current };
      if (next[id] != null) delete next[id];
      else next[id] = String(startingPrice);
      return next;
    });
  }

  async function save() {
    if (!user) return;
    setSaving(true);
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
    setSaving(false);
    router.replace('/(provider)/(tabs)');
  }

  return (
    <Screen scroll>
      <ScreenHeader title="Provider profile" subtitle="Choose your category, services and prices." />
      <View style={styles.form}>
        <InputField label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        <InputField label="Bio" value={bio} onChangeText={setBio} placeholder="Tell customers about your work" multiline />
        <InputField label="Service area" value={area} onChangeText={setArea} placeholder="e.g. Woodlands and Kabulonga" autoCapitalize="words" />
        <InputField label="Years of experience" value={years} onChangeText={setYears} keyboardType="number-pad" />
        <Text style={styles.label}>Category</Text>
        <View style={styles.row}>
          {(categories ?? []).map((category) => (
            <Pressable
              key={category.id}
              onPress={() => {
                setCategoryId(category.id);
                setSelected({});
              }}
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
                <InputField value={selected[service.id]} onChangeText={(text) => setSelected((current) => ({ ...current, [service.id]: text }))} keyboardType="number-pad" />
              ) : null}
            </View>
          );
        })}
        <PrimaryButton label="Save profile" onPress={save} loading={saving} />
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
});
