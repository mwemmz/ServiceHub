import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { BackButton } from '@/components/BackButton';
import { GlassPanel } from '@/components/GlassPanel';
import { InputField, type InputFieldHandle } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { AppConfig } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import { usePersistedState, clearPersistedState } from '@/hooks/usePersistedState';
import { StorageKeys } from '@/services/storage';
import { friendlyAuthError } from '@/utils/registrationValidation';

type LoginDraft = {
  email: string;
  password: string;
  remember: boolean;
};

const emptyLoginDraft = (): LoginDraft => ({
  email: '',
  password: '',
  remember: true,
});

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [draft, setDraft, hydrated] = usePersistedState<LoginDraft>(
    StorageKeys.draftLogin,
    emptyLoginDraft(),
  );
  const { email, password, remember } = draft;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const emailRef = useRef<InputFieldHandle>(null);
  const passwordRef = useRef<InputFieldHandle>(null);

  function validate(): boolean {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Phone number or email is required.';
    if (!password) next.password = 'Password is required.';
    setFieldErrors(next);
    if (next.email) emailRef.current?.focus();
    else if (next.password) passwordRef.current?.focus();
    return Object.keys(next).length === 0;
  }

  function goAfterLogin(role: string) {
    if (role === 'provider') {
      router.replace('/(provider)/(tabs)');
      return;
    }
    router.replace('/(customer)/categories' as Href);
  }

  async function onSubmit() {
    if (loading) return;
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      await clearPersistedState(StorageKeys.draftLogin);
      goAfterLogin(user.role);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell keyboard>
      <BackButton label="Back" fallbackHref={'/(auth)/welcome' as Href} />
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.sub}>Sign in with your phone number or email to continue.</Text>

      <GlassPanel borderRadius={24} contentStyle={styles.panel}>
        <InputField
          ref={emailRef}
          label="Phone number or Email"
          icon="mail-outline"
          value={email}
          onChangeText={(v) => {
            setDraft((prev) => ({ ...prev, email: v }));
            setFieldErrors((e) => ({ ...e, email: undefined }));
            setError('');
          }}
          keyboardType="email-address"
          error={fieldErrors.email}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <InputField
          ref={passwordRef}
          label="Password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={(v) => {
            setDraft((prev) => ({ ...prev, password: v }));
            setFieldErrors((e) => ({ ...e, password: undefined }));
            setError('');
          }}
          secureTextEntry
          error={fieldErrors.password}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
        <View style={styles.row}>
          <Pressable
            onPress={() => setDraft((prev) => ({ ...prev, remember: !prev.remember }))}
            style={styles.remember}>
            <View style={[styles.box, remember && styles.boxOn]} />
            <Text style={styles.muted}>Remember me</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Sign In" onPress={onSubmit} loading={loading} />
        <Pressable onPress={() => router.push('/(auth)/account-type' as Href)}>
          <Text style={styles.footer}>
            Don't have an account? <Text style={styles.link}>Get Started</Text>
          </Text>
        </Pressable>
        <View style={styles.demo}>
          <Text style={styles.demoTitle}>Live API demo accounts</Text>
          <Text style={styles.muted}>
            Customer: {AppConfig.demoCustomer.email} / {AppConfig.demoCustomer.password}
          </Text>
          <Text style={styles.muted}>
            Also: {AppConfig.demoProvider.email} / {AppConfig.demoProvider.password}
          </Text>
        </View>
      </GlassPanel>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  title: { color: Colors.charcoal, fontSize: 26, fontWeight: '800' },
  sub: { color: Colors.whiteSoft, marginBottom: 14, lineHeight: 20 },
  panel: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  boxOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm },
  link: { color: Colors.accent, fontWeight: '700' },
  error: { color: Colors.error },
  footer: { textAlign: 'center', color: Colors.whiteSoft, marginTop: 4 },
  demo: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 16,
    padding: 14,
    gap: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoTitle: { color: Colors.charcoal, fontWeight: '800' },
});
