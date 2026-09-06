import { useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { BackButton } from '@/components/BackButton';
import { GlassPanel } from '@/components/GlassPanel';
import { InputField, type InputFieldHandle } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { AppConfig } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';
import { usePersistedState, clearPersistedState } from '@/hooks/usePersistedState';
import { signInWithGoogle } from '@/services/googleSignIn';
import { StorageKeys } from '@/services/storage';

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
  const passwordRef = useRef<InputFieldHandle>(null);

  function validate(): boolean {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'This field is required.';
    if (!password) next.password = 'This field is required.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit() {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      await clearPersistedState(StorageKeys.draftLogin);
      if (user.role === 'provider') {
        router.replace('/(provider)/(tabs)');
        return;
      }
      router.replace('/(customer)/categories' as Href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell keyboard>
      <BackButton label="Back to Get Started" fallbackHref={'/(auth)/account-type' as Href} />
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.sub}>Sign in to continue to your ServiceHub account.</Text>

      <GlassPanel borderRadius={24} contentStyle={styles.panel}>
        <InputField
          label="Email or phone"
          icon="mail-outline"
          value={email}
          onChangeText={(v) => {
            setDraft((prev) => ({ ...prev, email: v }));
            setFieldErrors((e) => ({ ...e, email: undefined }));
            setError('');
          }}
          placeholder="Email or phone number"
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
          placeholder="Password"
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
        <Text style={styles.or}>or</Text>
        <SecondaryButton
          label="Continue with Google"
          onPress={() => {
            signInWithGoogle().catch(() =>
              Alert.alert('Sign-in failed', 'Please try again.'),
            );
          }}
        />
        {Platform.OS === 'ios' ? (
          <SecondaryButton
            label="Continue with Apple"
            onPress={() =>
              Alert.alert('Coming later', 'Apple sign-in will be available when a backend is connected.')
            }
          />
        ) : null}
        <Pressable onPress={() => router.push('/(auth)/account-type' as Href)}>
          <Text style={styles.footer}>
            Don't have an account? <Text style={styles.link}>Sign Up</Text>
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
  or: { textAlign: 'center', color: Colors.textLight },
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
