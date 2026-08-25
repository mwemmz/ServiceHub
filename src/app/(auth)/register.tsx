import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { PasswordStrength } from '@/components/registration/PasswordStrength';
import {
  RegError,
  RegField,
  RegPrimaryButton,
  RegSecondaryButton,
} from '@/components/registration/RegControls';
import { ProfilePhotoPicker } from '@/components/registration/ProfilePhotoPicker';
import { useRegScroll } from '@/components/registration/RegScrollContext';
import { RegShell } from '@/components/registration/RegShell';
import { RegColors } from '@/constants/registrationTheme';
import { useAuth } from '@/context/AuthContext';
import { updateUser } from '@/services/authService';
import {
  friendlyAuthError,
  isStrongPassword,
  isValidEmail,
  isValidZambianPhone,
  normalizeZambianPhone,
} from '@/utils/registrationValidation';

/** Location is collected AFTER account creation in the service-request flow. */
const TOTAL = 4;

type Form = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirm: string;
  avatarUri: string;
};

const initial: Form = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  confirm: '',
  avatarUri: '',
};

function firstErrorKey(errors: Record<string, string>, order: string[]): string | null {
  for (const key of order) {
    if (errors[key]) return key;
  }
  return Object.keys(errors)[0] ?? null;
}

export default function CustomerRegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(initial);

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

  function goBack() {
    if (step <= 1) {
      router.replace('/(auth)/account-type' as Href);
      return;
    }
    setStep((s) => s - 1);
  }

  return (
    <RegShell
      onBack={goBack}
      step={step}
      totalSteps={TOTAL}
      title={meta.title}
      subtitle={meta.subtitle}>
      <CustomerSteps step={step} setStep={setStep} form={form} setForm={setForm} />
    </RegShell>
  );
}

function CustomerSteps({
  step,
  setStep,
  form,
  setForm,
}: {
  step: number;
  setStep: (n: number | ((s: number) => number)) => void;
  form: Form;
  setForm: (f: Form | ((prev: Form) => Form)) => void;
}) {
  const router = useRouter();
  const { register, refresh } = useAuth();
  const { scrollToField } = useRegScroll();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);

  function patch(partial: Partial<Form>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  const fullName = useMemo(
    () => `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
    [form.firstName, form.lastName],
  );

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
    setStep((s) => Math.min(TOTAL, s + 1));
  }

  async function onCreateAccount() {
    for (const s of [1, 2] as const) {
      const result = validateStep(s);
      if (!result.ok) {
        setBanner('Please complete all required steps before creating your account.');
        setErrors(result.errors);
        setStep(s);
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

      router.replace('/(auth)/account-success' as Href);
    } catch (err) {
      setBanner(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  if (step === 1) {
    return (
      <>
        <RegField fieldKey="firstName" label="First Name" value={form.firstName} onChangeText={(firstName) => patch({ firstName })} placeholder="e.g. Chanda" autoCapitalize="words" error={errors.firstName} />
        <RegField fieldKey="lastName" label="Last Name" value={form.lastName} onChangeText={(lastName) => patch({ lastName })} placeholder="e.g. Banda" autoCapitalize="words" error={errors.lastName} />
        <RegField fieldKey="phone" label="Phone Number" value={form.phone} onChangeText={(phone) => patch({ phone })} placeholder="+260 97 XXX XXXX" keyboardType="phone-pad" error={errors.phone} />
        <RegField fieldKey="email" label="Email Address" value={form.email} onChangeText={(email) => patch({ email })} placeholder="you@email.com" keyboardType="email-address" error={errors.email} />
        <RegError message={banner} />
        <RegPrimaryButton label="Continue" onPress={goNext} />
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <RegField fieldKey="password" label="Password" value={form.password} onChangeText={(password) => patch({ password })} placeholder="Create a password" secureTextEntry error={errors.password} />
        <PasswordStrength password={form.password} />
        <RegField fieldKey="confirm" label="Confirm Password" value={form.confirm} onChangeText={(confirm) => patch({ confirm })} placeholder="Repeat your password" secureTextEntry error={errors.confirm} />
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
          <Pressable onPress={() => setStep(1)}>
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
          <Pressable onPress={() => setStep(3)}>
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
});
