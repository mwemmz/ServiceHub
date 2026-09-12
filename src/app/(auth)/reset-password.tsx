import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GlassPanel } from '@/components/GlassPanel';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InputField, type InputFieldHandle } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, FontSize, Radii } from '@/constants/theme';
import { resetPassword } from '@/services/authService';
import {
  friendlyAuthError,
  getConfirmPasswordError,
  getPasswordError,
} from '@/utils/registrationValidation';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    code?: string;
    password?: string;
    confirm?: string;
  }>({});
  const passwordRef = useRef<InputFieldHandle>(null);
  const confirmRef = useRef<InputFieldHandle>(null);
  const codeRef = useRef<InputFieldHandle>(null);

  function validate(): boolean {
    const next: typeof fieldErrors = {};
    if (!code.trim()) next.code = 'Reset code is required.';
    const passwordError = getPasswordError(password);
    if (passwordError) next.password = passwordError;
    const confirmError = getConfirmPasswordError(password, confirm);
    if (confirmError) next.confirm = confirmError;
    setFieldErrors(next);
    if (next.code) codeRef.current?.focus();
    else if (next.password) passwordRef.current?.focus();
    else if (next.confirm) confirmRef.current?.focus();
    return Object.keys(next).length === 0;
  }

  async function onSubmit() {
    if (!params.email || loading) return;
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword(params.email, code, password);
      router.replace('/(auth)/login');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboard>
      <ScreenHeader
        title="Reset password"
        subtitle="Enter the code and choose a new password."
        fallbackHref={'/(auth)/login' as import('expo-router').Href}
      />
      <GlassPanel borderRadius={24} contentStyle={styles.form}>
        {params.code ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Local demo code</Text>
            <Text style={styles.noticeBody}>
              Use this code for {params.email}: {params.code}
            </Text>
          </View>
        ) : null}
        <InputField
          ref={codeRef}
          label="Reset code"
          value={code}
          onChangeText={(v) => {
            setCode(v);
            setFieldErrors((e) => ({ ...e, code: undefined }));
          }}
          error={fieldErrors.code}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <InputField
          ref={passwordRef}
          label="New password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setFieldErrors((e) => ({ ...e, password: undefined }));
          }}
          secureTextEntry
          error={fieldErrors.password}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <InputField
          ref={confirmRef}
          label="Confirm password"
          value={confirm}
          onChangeText={(v) => {
            setConfirm(v);
            setFieldErrors((e) => ({ ...e, confirm: undefined }));
          }}
          secureTextEntry
          error={fieldErrors.confirm}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Update password" onPress={onSubmit} loading={loading} />
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noticeTitle: { fontWeight: '800', color: Colors.charcoal },
  noticeBody: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4 },
  error: { color: Colors.error },
});
