import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { requestPasswordReset } from '@/services/authService';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit() {
    setError('');
    setLoading(true);
    try {
      const code = await requestPasswordReset(email);
      router.push({ pathname: '/(auth)/reset-password', params: { email, code } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start reset.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Forgot password" subtitle="We will generate a local reset code until email is connected." />
      <View style={styles.form}>
        <InputField label="Email" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Send reset code" onPress={onSubmit} loading={loading} disabled={!email} />
        <Text style={styles.hint}>A real email will be sent after a backend is connected.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, paddingTop: 12 },
  error: { color: Colors.error },
  hint: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
});
