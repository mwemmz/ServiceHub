import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassPanel } from '@/components/GlassPanel';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { requestPasswordReset } from '@/services/authService';
import { friendlyAuthError, getEmailError } from '@/utils/registrationValidation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

  async function onSubmit() {
    if (loading) return;
    setError('');
    const emailError = getEmailError(email);
    if (emailError) {
      setFieldError(emailError);
      return;
    }
    setFieldError('');
    setLoading(true);
    try {
      const code = await requestPasswordReset(email.trim());
      router.push({ pathname: '/(auth)/reset-password', params: { email: email.trim(), code } });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboard>
      <ScreenHeader
        title="Forgot password"
        subtitle="We will email you a reset code."
        fallbackHref={'/(auth)/welcome' as import('expo-router').Href}
      />
      <GlassPanel borderRadius={24} contentStyle={styles.form}>
        <InputField
          label="Email"
          icon="mail-outline"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            setFieldError('');
          }}
          keyboardType="email-address"
          error={fieldError}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Send reset code" onPress={onSubmit} loading={loading} />
        <Text style={styles.hint}>The code arrives by email. In development it is also shown on the next screen.</Text>
      </GlassPanel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, padding: 16 },
  error: { color: Colors.error },
  hint: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
});
