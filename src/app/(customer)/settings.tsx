import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { clearPersistedState, usePersistedState } from '@/hooks/usePersistedState';
import { StorageKeys } from '@/services/storage';
import { normalizeZambianPhone, getPhoneError } from '@/utils/registrationValidation';

type SettingsDraft = {
  fullName: string;
  phone: string;
};

export default function CustomerSettingsScreen() {
  const { user, updateProfile } = useAuth();
  const storageKey = useMemo(
    () => `${StorageKeys.draftSettings}:${user?.id ?? 'guest'}`,
    [user?.id],
  );
  const [draft, setDraft] = usePersistedState<SettingsDraft>(storageKey, {
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  async function onSave() {
    if (saving) return;
    setSaved(false);
    setError('');
    setNameError('');
    if (!draft.fullName.trim()) {
      setNameError('Full name is required.');
      return;
    }
    const phoneErr = getPhoneError(draft.phone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }
    setPhoneError('');
    setSaving(true);
    try {
      const phone = normalizeZambianPhone(draft.phone);
      await updateProfile({ fullName: draft.fullName, phone });
      await clearPersistedState(storageKey);
      setDraft({ fullName: draft.fullName, phone });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your details. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll>
      <ScreenHeader
        title="Settings"
        subtitle="Update your personal details."
        fallbackHref="/(customer)/(tabs)/profile"
      />
      <View style={styles.form}>
        <InputField
          label="Full name"
          value={draft.fullName}
          onChangeText={(fullName) => {
            setDraft((prev) => ({ ...prev, fullName }));
            setNameError('');
          }}
          autoCapitalize="words"
          error={nameError}
        />
        <InputField
          label="Phone"
          value={draft.phone}
          onChangeText={(phone) => {
            setDraft((prev) => ({ ...prev, phone }));
            setPhoneError('');
          }}
          keyboardType="phone-pad"
          countryCodePrefix="+260"
          error={phoneError}
        />
        <InputField label="Email" value={user?.email ?? ''} onChangeText={() => undefined} editable={false} />
        <PrimaryButton label="Save changes" onPress={onSave} loading={saving} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {saved ? <Text style={styles.ok}>Your details were saved successfully.</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, marginTop: 12 },
  ok: { color: Colors.success, fontSize: FontSize.sm, fontWeight: '700' },
  error: { color: Colors.error, fontSize: FontSize.sm, fontWeight: '600' },
});
