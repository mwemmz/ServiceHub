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
          onChangeText={(fullName) => setDraft((prev) => ({ ...prev, fullName }))}
          autoCapitalize="words"
        />
        <InputField
          label="Phone"
          value={draft.phone}
          onChangeText={(phone) => setDraft((prev) => ({ ...prev, phone }))}
          keyboardType="phone-pad"
        />
        <InputField label="Email" value={user?.email ?? ''} onChangeText={() => undefined} editable={false} />
        <PrimaryButton
          label="Save changes"
          onPress={async () => {
            await updateProfile({ fullName: draft.fullName, phone: draft.phone });
            await clearPersistedState(storageKey);
            setDraft({ fullName: draft.fullName, phone: draft.phone });
            setSaved(true);
          }}
        />
        {saved ? <Text style={styles.ok}>Saved on this device.</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, marginTop: 12 },
  ok: { color: Colors.success, fontSize: FontSize.sm, fontWeight: '700' },
});
