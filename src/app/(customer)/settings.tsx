import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function CustomerSettingsScreen() {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saved, setSaved] = useState(false);

  return (
    <Screen scroll>
      <ScreenHeader title="Settings" subtitle="Update your personal details." />
      <View style={styles.form}>
        <InputField label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        <InputField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <InputField label="Email" value={user?.email ?? ''} onChangeText={() => undefined} editable={false} />
        <PrimaryButton
          label="Save changes"
          onPress={async () => {
            await updateProfile({ fullName, phone });
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
