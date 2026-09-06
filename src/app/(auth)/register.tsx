import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { PasswordStrength } from '@/components/registration/PasswordStrength';
import {
  RegError,
  RegField,
  RegPrimaryButton,
  RegSecondaryButton,
} from '@/components/registration/RegControls';
import { ProfilePhotoPicker } from '@/components/registration/ProfilePhotoPicker';
import { AuthSignInLink } from '@/components/registration/AuthSignInLink';
import { useRegScroll } from '@/components/registration/RegScrollContext';
import { RegShell } from '@/components/registration/RegShell';
import { RegColors } from '@/constants/registrationTheme';
import { useCustomerRegistrationBack } from '@/hooks/useCustomerRegistrationBack';
import { useAuth } from '@/context/AuthContext';
import { updateUser } from '@/services/authService';
import {
  CUSTOMER_REGISTER_TOTAL_STEPS,
  getCustomerRegistrationDraft,
  hydrateCustomerRegistrationDraft,
  parseRegisterStep,
  patchCustomerRegistrationDraft,
  resetCustomerRegistrationDraft,
} from '@/services/customerRegistrationDraft';
import {
  friendlyAuthError,
  isStrongPassword,
  isValidEmail,
  isValidZambianPhone,
  normalizeZambianPhone,
} from '@/utils/registrationValidation';

const TOTAL = CUSTOMER_REGISTER_TOTAL_STEPS;

function firstErrorKey(errors: Record<string, string>, order: string[]): string | null {
  for (const key of order) {
    if (errors[key]) return key;
  }
  return Object.keys(errors)[0] ?? null;
}

export default function CustomerRegisterScreen() {
  const { step: stepParam } = useLocalSearchParams<{ step?: string }>();
  const step = parseRegisterStep(stepParam);
  const goBack = useCustomerRegistrationBack(step);

  const titles: Record<number, { title: string; subtitle?: string }> = {
    1: { title: 'Create Your Account', subtitle: "Let's get to know you." },
    2: { title: 'Secure Your Account', subtitle: 'Choose a strong password.' },
    3: {
      title: 'Add a Profile Photo',
      subtitle: 'Optional — you can skip and add one later.',
    },
    4: { title: 'Almost There!', subtitle: 'Review your details, then create your account.' },
  };
  const meta = titles[step];

  return (
    <RegShell
      onBack={goBack}
      backLabel="Back"
      showBackIcon
      step={step}
      totalSteps={TOTAL}
      title={meta.title}
      subtitle={meta.subtitle}>
      <CustomerSteps step={step} />
    </RegShell>
  );
}

function CustomerSteps({ step }: { step: number }) {
  const router = useRouter();
  const { register, refresh } = useAuth();
  const { scrollToField } = useRegScroll();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setRevision] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateCustomerRegistrationDraft().then(() => setHydrated(true));
  }, []);

  const form = getCustomerRegistrationDraft();

  function patch(partial: Partial<ReturnType<typeof getCustomerRegistrationDraft>>) {
    patchCustomerRegistrationDraft(partial);
    setRevision((n) => n + 1);
    const keys = Object.keys(partial);
    if (keys.length) {
      setErrors((prev) => {
        const next = { ...prev };
        for (const key of keys) delete next[key];
        return next;
      });
    }
  }

  const fullName = useMemo(
    () => `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
    [form.firstName, form.lastName],
  );

  function pushStep(nextStep: number) {
    router.push({
      pathname: '/(auth)/register',
      params: { step: String(nextStep) },
    } as Href);
  }

  function validateStep(s: number): { ok: boolean; errors: Record<string, string>; order: string[] } {
    const next: Record<string, string> = {};
    let order: string[] = [];

    if (s === 1) {
      order = ['firstName', 'lastName', 'phone', 'email'];
      if (!form.firstName.trim()) next.firstName = 'This field is required.';
      else if (form.firstName.trim().length < 2) next.firstName = 'Enter your first name.';
      if (!form.lastName.trim()) next.lastName = 'This field is required.';
      else if (form.lastName.trim().length < 2) next.lastName = 'Enter your last name.';
      if (!form.phone.trim()) next.phone = 'This field is required.';
      else if (!isValidZambianPhone(form.phone)) {
        next.phone = 'Use a valid Zambian number, e.g. +260 97 XXX XXXX.';
      }
      if (!form.email.trim()) next.email = 'This field is required.';
      else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';
    }

    if (s === 2) {
      order = ['password', 'confirm'];
      if (!form.password) next.password = 'This field is required.';
      else if (!isStrongPassword(form.password)) {
        next.password = 'Password does not meet the requirements.';
      }
      if (!form.confirm) next.confirm = 'This field is required.';
      else if (form.password !== form.confirm) next.confirm = 'Passwords do not match.';
    }

    return { ok: Object.keys(next).length === 0, errors: next, order };
  }

  function applyValidation(s: number): boolean {
    const result = validateStep(s);
    setErrors(result.errors);
    if (!result.ok) {
      const key = firstErrorKey(result.errors, result.order);
      if (key) requestAnimationFrame(() => scrollToField(key));
      return false;
    }
    return true;
  }

  function goNext() {
    setBanner('');
    if (!applyValidation(step)) return;
    if (step === 1) patch({ phone: normalizeZambianPhone(form.phone) });
    pushStep(Math.min(TOTAL, step + 1));
  }

  async function onCreateAccount() {
    for (const s of [1, 2] as const) {
      const result = validateStep(s);
      if (!result.ok) {
        setBanner('Please complete all required steps before creating your account.');
        setErrors(result.errors);
        pushStep(s);
        requestAnimationFrame(() => {
          const key = firstErrorKey(result.errors, result.order);
          if (key) scrollToField(key);
        });
        return;
      }
    }

    setLoading(true);
    setBanner('');
    try {
      const phone = normalizeZambianPhone(form.phone);
      const { user } = await register({
        fullName,
        email: form.email.trim(),
        phone,
        password: form.password,
        role: 'customer',
      });

      try {
        if (form.avatarUri) {
          await updateUser(user.id, { avatarUri: form.avatarUri });
          await refresh();
        }
      } catch {
        // best-effort
      }

      router.push('/(auth)/account-success' as Href);
      await resetCustomerRegistrationDraft();
    } catch (err) {
      setBanner(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={RegColors.gold} />
      </View>
    );
  }

  if (step === 1) {
    return (
      <>
        <RegField fieldKey="firstName" nextFieldKey="lastName" label="First Name" value={form.firstName} onChangeText={(firstName) => patch({ firstName })} placeholder="e.g. Chanda" autoCapitalize="words" error={errors.firstName} />
        <RegField fieldKey="lastName" nextFieldKey="phone" label="Last Name" value={form.lastName} onChangeText={(lastName) => patch({ lastName })} placeholder="e.g. Banda" autoCapitalize="words" error={errors.lastName} />
        <RegField fieldKey="phone" nextFieldKey="email" label="Phone Number" value={form.phone} onChangeText={(phone) => patch({ phone })} placeholder="+260 97 XXX XXXX" keyboardType="phone-pad" error={errors.phone} />
        <RegField fieldKey="email" label="Email Address" value={form.email} onChangeText={(email) => patch({ email })} placeholder="you@email.com" keyboardType="email-address" error={errors.email} returnKeyType="done" onSubmitEditing={goNext} />
        <RegError message={banner} />
        <RegPrimaryButton label="Continue" onPress={goNext} />
        <AuthSignInLink />
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <RegField fieldKey="password" nextFieldKey="confirm" label="Password" value={form.password} onChangeText={(password) => patch({ password })} placeholder="Create a password" secureTextEntry error={errors.password} />
        <PasswordStrength password={form.password} />
        <RegField fieldKey="confirm" label="Confirm Password" value={form.confirm} onChangeText={(confirm) => patch({ confirm })} placeholder="Repeat your password" secureTextEntry error={errors.confirm} returnKeyType="done" onSubmitEditing={goNext} />
        <RegError message={banner} />
        <RegPrimaryButton label="Continue" onPress={goNext} />
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        <ProfilePhotoPicker uri={form.avatarUri} onChange={(avatarUri) => patch({ avatarUri })} />
        <RegPrimaryButton label="Continue" onPress={goNext} />
        <RegSecondaryButton label="Skip for now" onPress={goNext} />
      </>
    );
  }

  return (
    <>
      <View style={styles.summaryCard}>
        <View style={styles.summaryHead}>
          <Text style={styles.summaryTitle}>Personal Information</Text>
          <Pressable onPress={() => pushStep(1)}>
            <Text style={styles.edit}>Edit</Text>
          </Pressable>
        </View>
        <Text style={styles.summaryLine}>{fullName}</Text>
        <Text style={styles.summaryLine}>{form.phone}</Text>
        <Text style={styles.summaryLine}>{form.email}</Text>
      </View>
      <View style={styles.summaryCard}>
        <View style={styles.summaryHead}>
          <Text style={styles.summaryTitle}>Profile Photo</Text>
          <Pressable onPress={() => pushStep(3)}>
            <Text style={styles.edit}>Edit</Text>
          </Pressable>
        </View>
        {form.avatarUri ? (
          <Image source={{ uri: form.avatarUri }} style={styles.avatarPreview} />
        ) : (
          <Text style={styles.summaryLine}>Skipped</Text>
        )}
      </View>
      <RegError message={banner} />
      <RegPrimaryButton label="Create My Account" loading={loading} loadingLabel="Creating account…" onPress={onCreateAccount} />
    </>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    gap: 4,
  },
  summaryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryTitle: { color: RegColors.white, fontWeight: '800', fontSize: 14 },
  edit: { color: RegColors.gold, fontWeight: '700', fontSize: 13 },
  summaryLine: { color: RegColors.whiteSoft, fontSize: 13, lineHeight: 18 },
  avatarPreview: { width: 64, height: 64, borderRadius: 32, marginTop: 6 },
  loading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
});
