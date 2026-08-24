import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Colors, FontSize } from '@/constants/theme';
import { AppConfig } from '@/constants/config';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit() {
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'provider') router.replace('/(provider)/(tabs)');
      else router.replace('/(customer)/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScreenHeader title="Welcome back 👋" subtitle="Sign in to continue to your account." />
        <View style={styles.form}>
          <InputField
            label="Email or phone"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="Email or phone number"
            keyboardType="email-address"
          />
          <InputField
            label="Password"
            icon="lock-closed-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />
          <View style={styles.row}>
            <Pressable onPress={() => setRemember((value) => !value)} style={styles.remember}>
              <View style={[styles.box, remember && styles.boxOn]} />
              <Text style={styles.muted}>Remember me</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label="Sign In" onPress={onSubmit} loading={loading} disabled={!email || !password} />
          <Text style={styles.or}>or</Text>
          <SecondaryButton
            label="Continue with Google"
            onPress={() =>
              Alert.alert('Coming later', 'Google sign-in will be available when a backend is connected.')
            }
          />
          {Platform.OS === 'ios' ? (
            <SecondaryButton
              label="Continue with Apple"
              onPress={() =>
                Alert.alert('Coming later', 'Apple sign-in will be available when a backend is connected.')
              }
            />
          ) : null}
          <Pressable onPress={() => router.push('/(auth)/register')}>
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
            <Text style={styles.muted}>Connected to services-booking-backend on Render.</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, paddingTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  box: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: Colors.border },
  boxOn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm },
  link: { color: Colors.accent, fontWeight: '700' },
  error: { color: Colors.error },
  or: { textAlign: 'center', color: Colors.textLight },
  footer: { textAlign: 'center', color: Colors.charcoal, marginTop: 4 },
  demo: { backgroundColor: Colors.accentSoft, borderRadius: 16, padding: 14, gap: 4, marginTop: 8 },
  demoTitle: { color: Colors.charcoal, fontWeight: '800' },
});
