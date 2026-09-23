import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GlassPanel } from '@/components/GlassPanel';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { requestVerificationCode } from '@/services/authService';

export default function VerifyScreen() {
  const router = useRouter();
  const { verify } = useAuth();
  const params = useLocalSearchParams<{ email?: string; code?: string; role?: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [prefillCode, setPrefillCode] = useState(
    typeof params.code === 'string' && params.code.length >= 6 ? params.code : '',
  );

  async function resend() {
    if (!params.email || sending) return;
    setSending(true);
    setError('');
    try {
      const result = await requestVerificationCode();
      if (result?.code) setPrefillCode(result.code);
      else setError(result?.message ?? 'Verification email sent. Check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code.');
    } finally {
      setSending(false);
    }
  }

  async function onSubmit() {
    if (!params.email || loading) return;
    setError('');
    if (!code.trim()) {
      setError('Verification code is required.');
      return;
    }
    if (code.trim().length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const user = await verify(params.email, code);
      if (user.role === 'provider') router.replace('/(provider)/setup');
      else router.replace('/(customer)/(tabs)');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Verification failed. Please check the code and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboard>
      <ScreenHeader
        title="Verify your account"
        subtitle="Enter the 6-digit code we emailed you."
        fallbackHref={'/(auth)/login' as import('expo-router').Href}
      />
      <GlassPanel borderRadius={24} contentStyle={styles.form}>
        {prefillCode ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Demo code</Text>
            <Text style={styles.noticeBody}>
              Use this code for {params.email}: {prefillCode}
            </Text>
          </View>
        ) : null}
        <InputField
          label="Verification code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Verify" onPress={onSubmit} loading={loading} disabled={code.length < 6} />
        <SecondaryButton label={sending ? 'Sending…' : 'Resend code'} onPress={resend} disabled={sending} />
      </GlassPanel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, padding: 16 },
  notice: {
    backgroundColor: Colors.accentSoft,
    padding: 14,
    borderRadius: Radii.md,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noticeTitle: { fontWeight: '800', color: Colors.charcoal },
  noticeBody: { color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 20 },
  error: { color: Colors.error },
});
