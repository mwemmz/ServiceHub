import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize, Radii, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const detailsReady = fullName && email && phone && password.length >= 8 && password === confirm;

  async function onSubmit() {
    setError('');
    setLoading(true);
    try {
      const { user, verifyCode } = await register({ fullName, email, phone, password, role });
      // Live API logs the user in immediately (no OTP). Keep verify only if a code is returned.
      if (verifyCode) {
        router.replace({
          pathname: '/(auth)/verify',
          params: { email: user.email, code: verifyCode, role },
        });
        return;
      }
      if (user.role === 'provider') router.replace('/(provider)/setup');
      else router.replace('/(customer)/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenHeader
          title={step === 1 ? 'Create account' : 'How will you use the app?'}
          subtitle={step === 1 ? 'Join ServiceHub in a minute.' : 'You can only choose one role for this account.'}
          onBack={step === 2 ? () => setStep(1) : undefined}
        />

        {step === 1 ? (
          <View style={styles.form}>
            <InputField label="Full name" icon="person-outline" value={fullName} onChangeText={setFullName} placeholder="Your name" autoCapitalize="words" />
            <InputField label="Email" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" />
            <InputField label="Phone number" icon="call-outline" value={phone} onChangeText={setPhone} placeholder="+260 ..." keyboardType="phone-pad" />
            <InputField label="Password" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />
            <InputField label="Confirm password" icon="lock-closed-outline" value={confirm} onChangeText={setConfirm} placeholder="Repeat password" secureTextEntry error={confirm && password !== confirm ? 'Passwords do not match' : undefined} />
            <PrimaryButton label="Continue" onPress={() => setStep(2)} disabled={!detailsReady} />
          </View>
        ) : (
          <View style={styles.form}>
            <RoleOption
              title="Customer"
              body="I want to find and book services."
              selected={role === 'customer'}
              onPress={() => setRole('customer')}
            />
            <RoleOption
              title="Service Provider"
              body="I provide services and want customers to find and book me."
              selected={role === 'provider'}
              onPress={() => setRole('provider')}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Create account" onPress={onSubmit} loading={loading} />
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

function RoleOption({
  title,
  body,
  selected,
  onPress,
}: {
  title: string;
  body: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.role, selected && styles.roleOn]}>
      <Text style={styles.roleTitle}>{title}</Text>
      <Text style={styles.roleBody}>{body}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, paddingTop: 12, paddingBottom: 24 },
  error: { color: Colors.error },
  role: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  roleOn: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft },
  roleTitle: { color: Colors.charcoal, fontSize: FontSize.lg, fontWeight: '800' },
  roleBody: { color: Colors.textMuted, marginTop: 6, lineHeight: 20 },
});
