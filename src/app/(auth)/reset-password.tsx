import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { resetPassword } from '@/services/authService';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit() {
    if (!params.email) return;
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(params.email, code, password);
      router.replace('/(auth)/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Reset password" subtitle="Enter the code and choose a new password." />
      <View style={styles.form}>
        {params.code ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Local demo code</Text>
            <Text style={styles.noticeBody}>Use this code for {params.email}: {params.code}</Text>
          </View>
        ) : null}
        <InputField label="Reset code" value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" />
        <InputField label="New password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />
        <InputField label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Repeat password" secureTextEntry />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Update password" onPress={onSubmit} loading={loading} disabled={code.length < 6 || password.length < 8} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, paddingTop: 12 },
  notice: { backgroundColor: Colors.accentSoft, padding: 14, borderRadius: Radii.md },
  noticeTitle: { fontWeight: '800', color: Colors.charcoal },
  noticeBody: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4 },
  error: { color: Colors.error },
});
