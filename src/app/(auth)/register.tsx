import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { PasswordPairFields } from '@/components/registration/PasswordPairFields';
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
  CUSTOMER_REGISTER_FLOW_VERSION,
  CUSTOMER_REGISTER_TOTAL_STEPS,
  getCustomerRegistrationDraft,
  hydrateCustomerRegistrationDraft,
  parseRegisterStep,
  patchCustomerRegistrationDraft,
  resetCustomerRegistrationDraft,
} from '@/services/customerRegistrationDraft';
import {
  friendlyAuthError,
  getConfirmPasswordError,
  getEmailError,
  getPasswordError,
  getPhoneError,
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
    2: {
      title: 'Add a Profile Photo',
      subtitle: 'Optional — you can skip and add one later.',
    },
    3: { title: 'Almost There!', subtitle: 'Review your details, then create your account.' },
  };
  const meta = titles[step] ?? titles[1];

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
    hydrateCustomerRegistrationDraft().then(() => {
      patchCustomerRegistrationDraft({ flowVersion: CUSTOMER_REGISTER_FLOW_VERSION });
      setHydrated(true);
    });
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
      order = ['firstName', 'lastName', 'phone', 'email', 'password', 'confirm'];
      if (!form.firstName.trim()) next.firstName = 'First name is required.';
      else if (form.firstName.trim().length < 2) next.firstName = 'Enter your first name.';
      if (!form.lastName.trim()) next.lastName = 'Last name is required.';
      else if (form.lastName.trim().length < 2) next.lastName = 'Enter your last name.';
      const phoneError = getPhoneError(form.phone);
      if (phoneError) next.phone = phoneError;
      const emailError = getEmailError(form.email);
      if (emailError) next.email = emailError;
      const passwordError = getPasswordError(form.password);
      if (passwordError) next.password = passwordError;
      const confirmError = getConfirmPasswordError(form.password, form.confirm);
      if (confirmError) next.confirm = confirmError;
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
    if (step === 1) {
      patch({
        phone: normalizeZambianPhone(form.phone),
        flowVersion: CUSTOMER_REGISTER_FLOW_VERSION,
      });
    }
    pushStep(Math.min(TOTAL, step + 1));
  }

  async function onCreateAccount() {
    if (loading) return;
    const result = validateStep(1);
    if (!result.ok) {
      setBanner('Please fix the highlighted fields before creating your account.');
      setErrors(result.errors);
      pushStep(1);
      requestAnimationFrame(() => {
        const key = firstErrorKey(result.errors, result.order);
        if (key) scrollToField(key);
      });
      return;
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
        <RegField fieldKey="firstName" nextFieldKey="lastName" label="First Name" value={form.firstName} onChangeText={(firstName) => patch({ firstName })} autoCapitalize="words" error={errors.firstName} />
        <RegField fieldKey="lastName" nextFieldKey="phone" label="Last Name" value={form.lastName} onChangeText={(lastName) => patch({ lastName })} autoCapitalize="words" error={errors.lastName} />
        <RegField fieldKey="phone" nextFieldKey="email" label="Phone Number" value={form.phone} onChangeText={(phone) => patch({ phone })} keyboardType="phone-pad" countryCodePrefix="+260" error={errors.phone} />
        <RegField fieldKey="email" nextFieldKey="password" label="Email Address" value={form.email} onChangeText={(email) => patch({ email })} keyboardType="email-address" error={errors.email} />
        <PasswordPairFields
          password={form.password}
          confirm={form.confirm}
          errors={errors}
          onChangePassword={(password) => patch({ password })}
          onChangeConfirm={(confirm) => patch({ confirm })}
          onConfirmSubmit={goNext}
        />
        <RegError message={banner} />
        <RegPrimaryButton label="Continue" onPress={goNext} />
        <AuthSignInLink />
      </>
    );
  }

  if (step === 2) {
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
          <Pressable onPress={() => pushStep(2)}>
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
