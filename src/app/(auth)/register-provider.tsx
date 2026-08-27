import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import { RegShell } from '@/components/registration/RegShell';
import { scrollToRegField } from '@/components/registration/RegScrollContext';
import { PROVIDER_SERVICE_GROUPS, TRAVEL_RADII, WEEK_DAYS } from '@/constants/providerServices';
import { RegColors } from '@/constants/registrationTheme';
import { useAuth } from '@/context/AuthContext';
import { requestDeviceLocation } from '@/services/locationService';
import { pickDocumentImage } from '@/services/mediaPicker';
import {
  saveProviderApplication,
  type ProviderServiceDetail,
} from '@/services/providerApplicationService';
import type { CategoryId, GeoLocation } from '@/types';
import { createId } from '@/utils/id';
import {
  friendlyAuthError,
  isStrongPassword,
  isValidEmail,
  isValidZambianNrc,
  isValidZambianPhone,
  normalizeZambianPhone,
} from '@/utils/registrationValidation';

const TOTAL = 9;

type Form = {
  firstName: string;
  surname: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  nrcNumber: string;
  legalName: string;
  faceUri: string;
  selectedServiceIds: string[];
  serviceDetails: Record<string, ProviderServiceDetail>;
  locationText: string;
  geo: GeoLocation | null;
  radiusKm: string;
  nrcDocUri: string;
  businessUri: string;
  certificateUri: string;
  otherDocUri: string;
  password: string;
  confirm: string;
  detailIndex: number;
};

function emptyDetail(serviceName: string, categoryId: CategoryId): ProviderServiceDetail {
  return {
    serviceName,
    categoryId,
    description: '',
    yearsExperience: '',
    startingPrice: '',
    maxPrice: '',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    hoursStart: '08:00',
    hoursEnd: '17:00',
  };
}

const initial: Form = {
  firstName: '',
  surname: '',
  phone: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  nrcNumber: '',
  legalName: '',
  faceUri: '',
  selectedServiceIds: [],
  serviceDetails: {},
  locationText: '',
  geo: null,
  radiusKm: '10',
  nrcDocUri: '',
  businessUri: '',
  certificateUri: '',
  otherDocUri: '',
  password: '',
  confirm: '',
  detailIndex: 0,
};

function findServiceMeta(id: string) {
  for (const group of PROVIDER_SERVICE_GROUPS) {
    const item = group.items.find((s) => s.id === id);
    if (item) return item;
  }
  return null;
}

export default function RegisterProviderScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  function patch(partial: Partial<Form>) {
    setForm((prev) => ({ ...prev, ...partial }));
    const keys = Object.keys(partial);
    if (keys.length) {
      setErrors((prev) => {
        const next = { ...prev };
        for (const key of keys) {
          if (key === 'geo') continue;
          delete next[key];
          if (key === 'locationText') delete next.location;
        }
        return next;
      });
    }
  }

  const fullName = useMemo(
    () => `${form.firstName.trim()} ${form.surname.trim()}`.trim(),
    [form.firstName, form.surname],
  );

  const selectedMetas = useMemo(
    () =>
      form.selectedServiceIds
        .map((id) => findServiceMeta(id))
        .filter((x): x is NonNullable<typeof x> => Boolean(x)),
    [form.selectedServiceIds],
  );

  function goBack() {
    setBanner('');
    setErrors({});
    if (step <= 1) {
      router.replace('/(auth)/account-type' as Href);
      return;
    }
    if (step === 5 && form.detailIndex > 0) {
      patch({ detailIndex: form.detailIndex - 1 });
      return;
    }
    setStep((s) => s - 1);
  }

  function toggleService(id: string) {
    const meta = findServiceMeta(id);
    if (!meta) return;
    setForm((prev) => {
      const exists = prev.selectedServiceIds.includes(id);
      const selectedServiceIds = exists
        ? prev.selectedServiceIds.filter((x) => x !== id)
        : [...prev.selectedServiceIds, id];
      const serviceDetails = { ...prev.serviceDetails };
      if (exists) {
        delete serviceDetails[id];
      } else {
        serviceDetails[id] = emptyDetail(meta.label, meta.categoryId);
      }
      return { ...prev, selectedServiceIds, serviceDetails, detailIndex: 0 };
    });
  }

  function updateDetail(id: string, partial: Partial<ProviderServiceDetail>) {
    setForm((prev) => ({
      ...prev,
      serviceDetails: {
        ...prev.serviceDetails,
        [id]: { ...prev.serviceDetails[id], ...partial },
      },
    }));
  }

  function validateStep(s: number): boolean {
    const next: Record<string, string> = {};
    const order: string[] = [];

    if (s === 1) {
      order.push('firstName', 'surname', 'phone', 'email', 'dateOfBirth', 'gender');
      if (!form.firstName.trim()) next.firstName = 'This field is required.';
      else if (form.firstName.trim().length < 2) next.firstName = 'Enter your first name.';
      if (!form.surname.trim()) next.surname = 'This field is required.';
      else if (form.surname.trim().length < 2) next.surname = 'Enter your surname.';
      if (!form.phone.trim()) next.phone = 'This field is required.';
      else if (!isValidZambianPhone(form.phone)) {
        next.phone = 'Use a valid Zambian number, e.g. +260 97 XXX XXXX.';
      }
      if (!form.email.trim()) next.email = 'This field is required.';
      else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';
      if (!form.dateOfBirth.trim()) next.dateOfBirth = 'This field is required.';
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim())) {
        next.dateOfBirth = 'Use date format YYYY-MM-DD.';
      }
      if (!form.gender) next.gender = 'This field is required.';
    }
    if (s === 2) {
      order.push('nrcNumber', 'legalName', 'dateOfBirth', 'gender');
      if (!form.nrcNumber.trim()) next.nrcNumber = 'This field is required.';
      else if (!isValidZambianNrc(form.nrcNumber)) {
        next.nrcNumber = 'Use NRC format 123456/78/1.';
      }
      if (!form.legalName.trim()) next.legalName = 'This field is required.';
      else if (form.legalName.trim().length < 3) {
        next.legalName = 'Enter your full legal name.';
      }
      if (!form.dateOfBirth.trim()) next.dateOfBirth = 'This field is required.';
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim())) {
        next.dateOfBirth = 'Use date format YYYY-MM-DD.';
      }
      if (!form.gender) next.gender = 'This field is required.';
    }
    if (s === 3) {
      order.push('face');
      if (!form.faceUri) next.face = 'This field is required.';
    }
    if (s === 4) {
      order.push('services');
      if (form.selectedServiceIds.length < 1) {
        next.services = 'Select at least one service.';
      }
    }
    if (s === 5) {
      order.push('description', 'years', 'startPrice', 'maxPrice', 'days');
      const currentId = form.selectedServiceIds[form.detailIndex];
      const detail = currentId ? form.serviceDetails[currentId] : null;
      if (!detail) next.detail = 'Missing service details.';
      else {
        if (!detail.description.trim()) next.description = 'This field is required.';
        if (!detail.yearsExperience.trim()) next.years = 'This field is required.';
        else if (Number.isNaN(Number(detail.yearsExperience))) {
          next.years = 'Enter a valid number.';
        }
        if (!detail.startingPrice.trim()) next.startPrice = 'This field is required.';
        else if (Number.isNaN(Number(detail.startingPrice))) {
          next.startPrice = 'Enter a valid price in K.';
        }
        if (!detail.maxPrice.trim()) next.maxPrice = 'This field is required.';
        else if (Number.isNaN(Number(detail.maxPrice))) {
          next.maxPrice = 'Enter a valid price in K.';
        }
        if (detail.days.length < 1) next.days = 'Select at least one working day.';
      }
    }
    if (s === 6) {
      order.push('location', 'radius');
      if (!form.locationText.trim() && !form.geo) {
        next.location = 'This field is required.';
      }
      if (!form.radiusKm) next.radius = 'This field is required.';
    }
    if (s === 7) {
      order.push('nrcDoc');
      if (!form.nrcDocUri) next.nrcDoc = 'This field is required.';
    }
    if (s === 8) {
      order.push('password', 'confirm');
      if (!form.password) next.password = 'This field is required.';
      else if (!isStrongPassword(form.password)) {
        next.password = 'Password does not meet the requirements.';
      }
      if (!form.confirm) next.confirm = 'This field is required.';
      else if (form.password !== form.confirm) next.confirm = 'Passwords do not match.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const key = order.find((k) => next[k]) ?? Object.keys(next)[0];
      if (key) requestAnimationFrame(() => scrollToRegField(key));
      return false;
    }
    return true;
  }

  function goNext() {
    setBanner('');
    if (!validateStep(step)) return;

    if (step === 1) {
      patch({
        phone: normalizeZambianPhone(form.phone),
        legalName: form.legalName.trim() || fullName,
      });
    }

    if (step === 5) {
      const last = form.selectedServiceIds.length - 1;
      if (form.detailIndex < last) {
        patch({ detailIndex: form.detailIndex + 1 });
        return;
      }
    }

    setStep((s) => Math.min(TOTAL, s + 1));
  }

  async function onUseLocation() {
    setLocating(true);
    setBanner('');
    try {
      const geo = await requestDeviceLocation();
      patch({ geo, locationText: geo.address });
    } catch (err) {
      setBanner(
        err instanceof Error
          ? err.message
          : 'Location permission denied. Enter your area manually.',
      );
    } finally {
      setLocating(false);
    }
  }

  async function pickDoc(
    key: 'nrcDocUri' | 'businessUri' | 'certificateUri' | 'otherDocUri',
  ) {
    const picked = await pickDocumentImage();
    if (picked) patch({ [key]: picked.uri });
  }

  async function onCreateAccount() {
    for (const s of [1, 2, 3, 4, 6, 7, 8]) {
      if (!validateStep(s)) {
        setBanner('Please complete all required steps before submitting.');
        setStep(s);
        return;
      }
    }
    // Validate all service details
    for (let i = 0; i < form.selectedServiceIds.length; i++) {
      const id = form.selectedServiceIds[i];
      const detail = form.serviceDetails[id];
      if (
        !detail?.description.trim() ||
        !detail.yearsExperience.trim() ||
        !detail.startingPrice.trim() ||
        !detail.maxPrice.trim() ||
        detail.days.length < 1
      ) {
        setBanner('Please complete service details for every selected service.');
        patch({ detailIndex: i });
        setStep(5);
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
        role: 'provider',
      });

      const services = form.selectedServiceIds.map((id) => form.serviceDetails[id]);
      const primary = services[0];

      await saveProviderApplication({
        id: createId('papp'),
        userId: user.id,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        personal: {
          firstName: form.firstName.trim(),
          surname: form.surname.trim(),
          phone,
          email: form.email.trim().toLowerCase(),
          dateOfBirth: form.dateOfBirth.trim(),
          gender: form.gender,
        },
        identity: {
          nrcNumber: form.nrcNumber.trim(),
          legalName: form.legalName.trim() || fullName,
          dateOfBirth: form.dateOfBirth.trim(),
          gender: form.gender,
          nrcFrontUri: form.nrcDocUri,
          nrcBackUri: form.nrcDocUri,
          faceUri: form.faceUri,
        },
        services,
        location: {
          text: form.locationText.trim(),
          geo: form.geo ?? undefined,
          radiusKm: form.radiusKm,
        },
        documents: {
          nrcUri: form.nrcDocUri,
          businessUri: form.businessUri || undefined,
          certificateUri: form.certificateUri || undefined,
          otherUri: form.otherDocUri || undefined,
        },
        service: primary
          ? {
              categoryId: primary.categoryId,
              serviceOffered: services.map((s) => s.serviceName).join(', '),
              description: primary.description,
              yearsExperience: primary.yearsExperience,
              startingPrice: primary.startingPrice,
              location: form.locationText.trim(),
              radiusKm: form.radiusKm,
            }
          : undefined,
      });

      router.replace('/(provider)/(tabs)');
    } catch (err) {
      setBanner(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<number, { title: string; subtitle?: string }> = {
    1: { title: 'Personal Details', subtitle: 'Tell us who you are.' },
    2: {
      title: 'Verify Your Identity',
      subtitle: 'NRC details stay private and are never shown on your public profile.',
    },
    3: {
      title: 'Add Your Photo',
      subtitle: 'Customers should know who they are booking.',
    },
    4: {
      title: 'What Services Do You Provide?',
      subtitle: 'Select all that apply.',
    },
    5: {
      title: 'Service Details',
      subtitle: selectedMetas[form.detailIndex]
        ? `${selectedMetas[form.detailIndex].label} (${form.detailIndex + 1}/${selectedMetas.length})`
        : 'Add pricing and availability.',
    },
    6: {
      title: 'Where Do You Provide Your Services?',
      subtitle: 'Help customers find you nearby.',
    },
    7: {
      title: 'Verify Your Information',
      subtitle: 'Upload required ID. Extra documents are optional.',
    },
    8: { title: 'Account Security', subtitle: 'Create a strong password.' },
    9: {
      title: 'Review Your Provider Profile',
      subtitle: 'Confirm everything looks right, then submit.',
    },
  };

  const meta = titles[step];
  const currentServiceId = form.selectedServiceIds[form.detailIndex];
  const currentDetail = currentServiceId ? form.serviceDetails[currentServiceId] : null;

  return (
    <RegShell
      onBack={goBack}
      step={step}
      totalSteps={TOTAL}
      title={meta.title}
      subtitle={meta.subtitle}>
      {step === 1 ? (
        <>
          <RegField
            fieldKey="firstName"
            nextFieldKey="surname"
            label="First Name"
            value={form.firstName}
            onChangeText={(firstName) => patch({ firstName })}
            autoCapitalize="words"
            error={errors.firstName}
          />
          <RegField
            fieldKey="surname"
            nextFieldKey="phone"
            label="Surname"
            value={form.surname}
            onChangeText={(surname) => patch({ surname })}
            autoCapitalize="words"
            error={errors.surname}
          />
          <RegField
            fieldKey="phone"
            nextFieldKey="email"
            label="Phone Number"
            value={form.phone}
            onChangeText={(phone) => patch({ phone })}
            placeholder="+260 97 XXX XXXX"
            keyboardType="phone-pad"
            error={errors.phone}
          />
          <RegField
            fieldKey="email"
            nextFieldKey="dateOfBirth"
            label="Email"
            value={form.email}
            onChangeText={(email) => patch({ email })}
            keyboardType="email-address"
            error={errors.email}
          />
          <RegField
            fieldKey="dateOfBirth"
            label="Date of Birth"
            value={form.dateOfBirth}
            onChangeText={(dateOfBirth) => patch({ dateOfBirth })}
            placeholder="YYYY-MM-DD"
            error={errors.dateOfBirth}
            returnKeyType="done"
          />
          <View collapsable={false}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipRow}>
              {['Female', 'Male', 'Other', 'Prefer not to say'].map((g) => (
                <Chip
                  key={g}
                  label={g}
                  selected={form.gender === g}
                  onPress={() => patch({ gender: g })}
                />
              ))}
            </View>
            {errors.gender ? <Text style={styles.err}>{errors.gender}</Text> : null}
          </View>

          <RegError message={banner} />
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <RegField
            fieldKey="nrcNumber"
            nextFieldKey="legalName"
            label="NRC Number"
            value={form.nrcNumber}
            onChangeText={(nrcNumber) => patch({ nrcNumber })}
            placeholder="123456/78/1"
            error={errors.nrcNumber}
          />
          <RegField
            fieldKey="legalName"
            nextFieldKey="dateOfBirth"
            label="Full Legal Name"
            value={form.legalName}
            onChangeText={(legalName) => patch({ legalName })}
            autoCapitalize="words"
            placeholder={fullName || 'As on your NRC'}
            error={errors.legalName}
          />
          <RegField
            fieldKey="dateOfBirth"
            label="Date of Birth"
            value={form.dateOfBirth}
            onChangeText={(dateOfBirth) => patch({ dateOfBirth })}
            placeholder="YYYY-MM-DD"
            error={errors.dateOfBirth}
            returnKeyType="done"
          />
          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipRow}>
            {['Female', 'Male', 'Other', 'Prefer not to say'].map((g) => (
              <Chip
                key={g}
                label={g}
                selected={form.gender === g}
                onPress={() => patch({ gender: g })}
              />
            ))}
          </View>
          {errors.gender ? <Text style={styles.err}>{errors.gender}</Text> : null}
          <Text style={styles.note}>Your NRC is stored securely for verification only.</Text>
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <ProfilePhotoPicker
            uri={form.faceUri}
            size={140}
            onChange={(faceUri) => patch({ faceUri })}
            hint="Use a clear, well-lit photo of your face."
          />
          {errors.face ? <Text style={styles.err}>{errors.face}</Text> : null}
          <RegPrimaryButton label="Use Photo" onPress={goNext} disabled={!form.faceUri} />
        </>
      ) : null}

      {step === 4 ? (
        <>
          {PROVIDER_SERVICE_GROUPS.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.chipRow}>
                {group.items.map((item) => (
                  <Chip
                    key={item.id}
                    label={item.label}
                    selected={form.selectedServiceIds.includes(item.id)}
                    onPress={() => toggleService(item.id)}
                  />
                ))}
              </View>
            </View>
          ))}
          {errors.services ? <Text style={styles.err}>{errors.services}</Text> : null}
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 5 && currentDetail && currentServiceId ? (
        <>
          <RegField
            label="Service Name"
            value={currentDetail.serviceName}
            onChangeText={(serviceName) => updateDetail(currentServiceId, { serviceName })}
            autoCapitalize="words"
          />
          <RegField
            fieldKey="description"
            nextFieldKey="years"
            label="Description"
            value={currentDetail.description}
            onChangeText={(description) => updateDetail(currentServiceId, { description })}
            placeholder="What do you offer?"
            multiline
            autoCapitalize="sentences"
            error={errors.description}
          />
          <RegField
            fieldKey="years"
            nextFieldKey="startPrice"
            label="Years of Experience"
            value={currentDetail.yearsExperience}
            onChangeText={(yearsExperience) => updateDetail(currentServiceId, { yearsExperience })}
            keyboardType="number-pad"
            error={errors.years}
          />
          <RegField
            fieldKey="startPrice"
            nextFieldKey="maxPrice"
            label="Starting Price (K)"
            value={currentDetail.startingPrice}
            onChangeText={(startingPrice) => updateDetail(currentServiceId, { startingPrice })}
            placeholder="e.g. 150"
            keyboardType="decimal-pad"
            error={errors.startPrice}
          />
          <RegField
            fieldKey="maxPrice"
            label="Maximum Price (K)"
            value={currentDetail.maxPrice}
            onChangeText={(maxPrice) => updateDetail(currentServiceId, { maxPrice })}
            placeholder="e.g. 500"
            keyboardType="decimal-pad"
            error={errors.maxPrice}
            returnKeyType="done"
          />
          <Text style={styles.label}>Availability — days</Text>
          <View style={styles.chipRow}>
            {WEEK_DAYS.map((day) => {
              const selected = currentDetail.days.includes(day);
              return (
                <Chip
                  key={day}
                  label={day.slice(0, 3)}
                  selected={selected}
                  onPress={() => {
                    const days = selected
                      ? currentDetail.days.filter((d) => d !== day)
                      : [...currentDetail.days, day];
                    updateDetail(currentServiceId, { days });
                  }}
                />
              );
            })}
          </View>
          {errors.days ? <Text style={styles.err}>{errors.days}</Text> : null}
          <RegField
            label="Hours start"
            value={currentDetail.hoursStart}
            onChangeText={(hoursStart) => updateDetail(currentServiceId, { hoursStart })}
            placeholder="08:00"
          />
          <RegField
            label="Hours end"
            value={currentDetail.hoursEnd}
            onChangeText={(hoursEnd) => updateDetail(currentServiceId, { hoursEnd })}
            placeholder="17:00"
          />
          <RegPrimaryButton
            label={
              form.detailIndex < form.selectedServiceIds.length - 1
                ? 'Next Service'
                : 'Continue'
            }
            onPress={goNext}
          />
        </>
      ) : null}

      {step === 6 ? (
        <>
          <RegSecondaryButton
            label="Use My Current Location"
            icon="locate-outline"
            loading={locating}
            loadingLabel="Checking location…"
            onPress={onUseLocation}
          />
          <RegField
            fieldKey="location"
            label="Enter Location Manually"
            value={form.locationText}
            onChangeText={(locationText) => patch({ locationText, geo: null })}
            placeholder="Area, city — e.g. Roma, Lusaka"
            autoCapitalize="words"
            error={errors.location}
          />
          <Text style={styles.label}>How far are you willing to travel?</Text>
          <View style={styles.chipRow}>
            {TRAVEL_RADII.map((km) => (
              <Chip
                key={km}
                label={`${km} km`}
                selected={form.radiusKm === km}
                onPress={() => patch({ radiusKm: km })}
              />
            ))}
          </View>
          {errors.radius ? <Text style={styles.err}>{errors.radius}</Text> : null}
          <RegError message={banner} />
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 7 ? (
        <>
          <DocUpload
            label="NRC / ID"
            required
            uri={form.nrcDocUri}
            onPick={() => pickDoc('nrcDocUri')}
            onClear={() => patch({ nrcDocUri: '' })}
            error={errors.nrcDoc}
          />
          <DocUpload
            label="Business Registration"
            uri={form.businessUri}
            onPick={() => pickDoc('businessUri')}
            onClear={() => patch({ businessUri: '' })}
          />
          <DocUpload
            label="Professional Certificate"
            uri={form.certificateUri}
            onPick={() => pickDoc('certificateUri')}
            onClear={() => patch({ certificateUri: '' })}
          />
          <DocUpload
            label="Other Supporting Document"
            uri={form.otherDocUri}
            onPick={() => pickDoc('otherDocUri')}
            onClear={() => patch({ otherDocUri: '' })}
          />
          <Text style={styles.note}>Documents are used for verification only and stay private.</Text>
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 8 ? (
        <>
          <RegField
            fieldKey="password"
            nextFieldKey="confirm"
            label="Password"
            value={form.password}
            onChangeText={(password) => patch({ password })}
            secureTextEntry
            error={errors.password}
          />
          <PasswordStrength password={form.password} />
          <RegField
            fieldKey="confirm"
            label="Confirm Password"
            value={form.confirm}
            onChangeText={(confirm) => patch({ confirm })}
            secureTextEntry
            error={errors.confirm}
            returnKeyType="done"
          />
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 9 ? (
        <>
          <Summary
            title="Personal Information"
            onEdit={() => setStep(1)}
            lines={[fullName, form.phone, form.email, form.dateOfBirth, form.gender]}
          />
          <Summary
            title="Identity"
            onEdit={() => setStep(2)}
            lines={[`NRC on file: ${form.nrcNumber ? 'Yes (private)' : 'Missing'}`, form.legalName]}
          />
          <View style={styles.summary}>
            <View style={styles.summaryHead}>
              <Text style={styles.summaryTitle}>Profile Photo</Text>
              <Pressable onPress={() => setStep(3)}>
                <Text style={styles.edit}>Edit</Text>
              </Pressable>
            </View>
            {form.faceUri ? (
              <Image source={{ uri: form.faceUri }} style={styles.face} />
            ) : (
              <Text style={styles.summaryLine}>Missing</Text>
            )}
          </View>
          <Summary
            title="Services"
            onEdit={() => setStep(4)}
            lines={selectedMetas.map((s) => s.label)}
          />
          <Summary
            title="Experience & Prices"
            onEdit={() => {
              patch({ detailIndex: 0 });
              setStep(5);
            }}
            lines={form.selectedServiceIds.map((id) => {
              const d = form.serviceDetails[id];
              return `${d.serviceName}: K${d.startingPrice}–K${d.maxPrice} · ${d.yearsExperience} yrs`;
            })}
          />
          <Summary
            title="Location"
            onEdit={() => setStep(6)}
            lines={[form.locationText, `Travel: ${form.radiusKm} km`]}
          />
          <Summary
            title="Documents"
            onEdit={() => setStep(7)}
            lines={[
              `NRC: ${form.nrcDocUri ? 'Uploaded' : 'Missing'}`,
              form.businessUri ? 'Business reg: Uploaded' : 'Business reg: Optional',
              form.certificateUri ? 'Certificate: Uploaded' : 'Certificate: Optional',
            ]}
          />
          <RegError message={banner} />
          <RegPrimaryButton
            label="Create Provider Account"
            loading={loading}
            loadingLabel="Creating account…"
            onPress={onCreateAccount}
          />
        </>
      ) : null}
    </RegShell>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function DocUpload({
  label,
  required,
  uri,
  onPick,
  onClear,
  error,
}: {
  label: string;
  required?: boolean;
  uri: string;
  onPick: () => void;
  onClear: () => void;
  error?: string;
}) {
  return (
    <View style={styles.docCard}>
      <View style={styles.summaryHead}>
        <Text style={styles.summaryTitle}>
          {label}{' '}
          <Text style={required ? styles.req : styles.opt}>
            {required ? 'Required' : 'Optional'}
          </Text>
        </Text>
      </View>
      {uri ? (
        <View style={styles.docPreviewRow}>
          <Image source={{ uri }} style={styles.docThumb} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.summaryLine} numberOfLines={1}>
              Document selected
            </Text>
            <View style={styles.chipRow}>
              <Chip label="Replace" selected={false} onPress={onPick} />
              <Chip label="Remove" selected={false} onPress={onClear} />
            </View>
          </View>
        </View>
      ) : (
        <RegSecondaryButton label="Upload" icon="cloud-upload-outline" onPress={onPick} />
      )}
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

function Summary({
  title,
  lines,
  onEdit,
}: {
  title: string;
  lines: string[];
  onEdit: () => void;
}) {
  return (
    <View style={styles.summary}>
      <View style={styles.summaryHead}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Pressable onPress={onEdit}>
          <Text style={styles.edit}>Edit</Text>
        </Pressable>
      </View>
      {lines.filter(Boolean).map((line) => (
        <Text key={`${title}-${line}`} style={styles.summaryLine}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: RegColors.whiteSoft, fontSize: 13, fontWeight: '600', marginTop: 4 },
  note: { color: RegColors.goldSoft, fontSize: 12, lineHeight: 18 },
  err: { color: RegColors.error, fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chipSelected: {
    backgroundColor: RegColors.gold,
    borderColor: RegColors.gold,
  },
  chipText: { color: RegColors.white, fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: '#2C2420' },
  group: { gap: 8, marginBottom: 8 },
  groupTitle: {
    color: RegColors.goldSoft,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.35)' },
  orText: { color: RegColors.whiteMuted, fontSize: 11, fontWeight: '700' },
  summary: {
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
  face: { width: 72, height: 72, borderRadius: 36, marginTop: 4 },
  docCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    gap: 8,
  },
  docPreviewRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  docThumb: { width: 56, height: 56, borderRadius: 10 },
  req: { color: RegColors.amber, fontSize: 11, fontWeight: '700' },
  opt: { color: RegColors.whiteMuted, fontSize: 11, fontWeight: '600' },
});
