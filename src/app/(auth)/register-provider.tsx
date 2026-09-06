import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  ActivityIndicator,
  Image,
  Platform,
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
import { AuthSignInLink } from '@/components/registration/AuthSignInLink';
import { BusinessInformationStep } from '@/components/registration/BusinessInformationStep';
import { BusinessOwnerNrcStep } from '@/components/registration/BusinessOwnerNrcStep';
import { BusinessPasswordStep } from '@/components/registration/BusinessPasswordStep';
import { BusinessProfileSetupStep } from '@/components/registration/BusinessProfileSetupStep';
import { ProviderPortfolioStep } from '@/components/registration/ProviderPortfolioStep';
import { ProviderServiceDetailsStep } from '@/components/registration/ProviderServiceDetailsStep';
import { ProviderServicePickStep } from '@/components/registration/ProviderServicePickStep';
import { ServiceCategoryReferenceStep } from '@/components/registration/ServiceCategoryReferenceStep';
import { RegShell } from '@/components/registration/RegShell';
import { scrollToRegField } from '@/components/registration/RegScrollContext';
import { BUSINESS_REGISTRATION_CATEGORIES } from '@/constants/businessRegistration';
import { TRAVEL_RADII } from '@/constants/providerServices';
import { RegColors } from '@/constants/registrationTheme';
import { useAuth } from '@/context/AuthContext';
import { requestDeviceLocation } from '@/services/locationService';
import { pickDocumentImage } from '@/services/mediaPicker';
import {
  saveProviderApplication,
  type ProviderApplicationInfo,
} from '@/services/providerApplicationService';
import {
  emptyProviderRegistrationForm,
  hydrateProviderRegistrationDraft,
  resetProviderRegistrationDraft,
  setProviderRegistrationDraft,
} from '@/services/providerRegistrationDraft';
import type { ProviderRegistrationForm, ProviderRegistrationType } from '@/types/providerRegistration';
import { PROVIDER_TYPE_LABELS } from '@/types/providerRegistration';
import { createId } from '@/utils/id';
import {
  formatServicePrice,
  getGroupedSelectedServices,
  providerContactEmail,
  providerContactPhone,
  providerDisplayName,
  selectBusinessCategory,
  selectProviderCategory,
  syncServiceDetails,
  toApplicationService,
} from '@/utils/providerRegistration';
import {
  friendlyAuthError,
  isStrongPassword,
  isValidDateOfBirth,
  isValidEmail,
  isValidZambianNrc,
  isValidZambianPhone,
  normalizeDateOfBirth,
  normalizeZambianPhone,
} from '@/utils/registrationValidation';

const INDIVIDUAL_TOTAL = 10;
const BUSINESS_TOTAL = 6;

export default function RegisterProviderScreen() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProviderRegistrationForm>(emptyProviderRegistrationForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [businessUserId, setBusinessUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateProviderRegistrationDraft().then((saved) => {
      setForm(saved.form);
      setStep(saved.step);
      setBusinessUserId(saved.businessUserId);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setProviderRegistrationDraft({ form, step, businessUserId });
  }, [form, step, businessUserId, hydrated]);

  function patch(partial: Partial<ProviderRegistrationForm>) {
    setForm((prev) => ({ ...prev, ...partial }));
    const keys = Object.keys(partial);
    if (keys.length) {
      setErrors((prev) => {
        const next = { ...prev };
        for (const key of keys) {
          if (key === 'geo') continue;
          delete next[key];
          if (key === 'locationText') delete next.location;
          if (key === 'businessCategoryIds' || key === 'businessCategoryId') {
            delete next.businessCategory;
          }
        }
        return next;
      });
    }
  }

  const displayName = useMemo(
    () =>
      providerDisplayName(
        form.providerType,
        form.individual,
        form.business,
        form.registeredBusiness,
      ),
    [form.providerType, form.individual, form.business, form.registeredBusiness],
  );

  const groupedServices = useMemo(
    () => getGroupedSelectedServices(form.selectedServiceIds),
    [form.selectedServiceIds],
  );

  const isBusiness = form.providerType === 'business';
  const totalSteps = isBusiness ? BUSINESS_TOTAL : INDIVIDUAL_TOTAL;

  const businessCategoryLabel = useMemo(
    () =>
      BUSINESS_REGISTRATION_CATEGORIES.find((c) => c.id === form.businessCategoryId)?.label ?? '',
    [form.businessCategoryId],
  );

  const goBack = useCallback(() => {
    setBanner('');
    setErrors({});
    if (step <= 1) {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace('/(auth)/account-type' as Href);
      return;
    }
    setStep((s) => s - 1);
  }, [router, step]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [goBack]);

  function toggleService(id: string) {
    setForm((prev) => {
      const exists = prev.selectedServiceIds.includes(id);
      const selectedServiceIds = exists
        ? prev.selectedServiceIds.filter((x) => x !== id)
        : [...prev.selectedServiceIds, id];
      return {
        ...prev,
        selectedServiceIds,
        serviceDetails: syncServiceDetails(selectedServiceIds, prev.serviceDetails),
      };
    });
  }

  function updateDetail(serviceId: string, partial: Partial<(typeof form.serviceDetails)[string]>) {
    setForm((prev) => ({
      ...prev,
      serviceDetails: {
        ...prev.serviceDetails,
        [serviceId]: { ...prev.serviceDetails[serviceId], ...partial },
      },
    }));
    const errKeys = Object.keys(partial).map((k) => `${k}:${serviceId}`);
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of errKeys) delete next[key];
      if (partial.portfolioItems !== undefined) delete next[`portfolio:${serviceId}`];
      return next;
    });
  }

  function addPortfolioItem(serviceId: string, uri: string) {
    setForm((prev) => {
      const detail = prev.serviceDetails[serviceId];
      if (!detail) return prev;
      const item = { id: createId('work'), uri, caption: '', price: '' };
      return {
        ...prev,
        serviceDetails: {
          ...prev.serviceDetails,
          [serviceId]: {
            ...detail,
            portfolioItems: [...detail.portfolioItems, item],
          },
        },
      };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`portfolio:${serviceId}`];
      return next;
    });
  }

  function removePortfolioItem(serviceId: string, itemId: string) {
    setForm((prev) => {
      const detail = prev.serviceDetails[serviceId];
      if (!detail) return prev;
      return {
        ...prev,
        serviceDetails: {
          ...prev.serviceDetails,
          [serviceId]: {
            ...detail,
            portfolioItems: detail.portfolioItems.filter((item) => item.id !== itemId),
          },
        },
      };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`portfolio:${serviceId}`];
      delete next[`portfolioPrice:${serviceId}:${itemId}`];
      delete next[`portfolioCaption:${serviceId}:${itemId}`];
      return next;
    });
  }

  function updatePortfolioItem(
    serviceId: string,
    itemId: string,
    patch: Partial<{ caption: string; price: string; uri: string }>,
  ) {
    setForm((prev) => {
      const detail = prev.serviceDetails[serviceId];
      if (!detail) return prev;
      return {
        ...prev,
        serviceDetails: {
          ...prev.serviceDetails,
          [serviceId]: {
            ...detail,
            portfolioItems: detail.portfolioItems.map((item) =>
              item.id === itemId ? { ...item, ...patch } : item,
            ),
          },
        },
      };
    });
    setErrors((prev) => {
      const next = { ...prev };
      if (patch.price !== undefined) delete next[`portfolioPrice:${serviceId}:${itemId}`];
      if (patch.caption !== undefined) delete next[`portfolioCaption:${serviceId}:${itemId}`];
      return next;
    });
  }

  function replacePortfolioPhoto(serviceId: string, itemId: string, uri: string) {
    updatePortfolioItem(serviceId, itemId, { uri });
  }

  function validateStep(s: number): boolean {
    const next: Record<string, string> = {};
    const order: string[] = [];

    if (s === 1) {
      order.push('providerType');
      if (!form.providerType) next.providerType = 'Select how you are registering.';
    }

    if (s === 2) {
      if (form.providerType === 'individual') {
        order.push('firstName', 'surname', 'phone', 'email', 'dateOfBirth', 'gender');
        if (!form.individual.firstName.trim()) next.firstName = 'This field is required.';
        if (!form.individual.surname.trim()) next.surname = 'This field is required.';
        if (!form.individual.phone.trim()) next.phone = 'This field is required.';
        else if (!isValidZambianPhone(form.individual.phone)) {
          next.phone = 'Use a valid Zambian number, e.g. +260 97 XXX XXXX.';
        }
        if (!form.individual.email.trim()) next.email = 'This field is required.';
        else if (!isValidEmail(form.individual.email)) next.email = 'Enter a valid email address.';
        if (!form.individual.dateOfBirth.trim()) next.dateOfBirth = 'This field is required.';
        else if (!isValidDateOfBirth(form.individual.dateOfBirth)) {
          next.dateOfBirth = 'Use date format YYYY-MM-DD or YYYY/MM/DD.';
        }
        if (!form.individual.gender) next.gender = 'This field is required.';
      }
    }

    if (s === 3 && form.providerType === 'individual') {
      order.push('businessCategory');
      if (!form.businessCategoryId) next.businessCategory = 'Please select a service category.';
    }

    if (s === 4 && form.providerType === 'individual') {
      order.push('services');
      if (form.selectedServiceIds.length < 1) next.services = 'Select at least one service.';
    }

    if (s === 5 && form.providerType === 'individual') {
      for (const id of form.selectedServiceIds) {
        const detail = form.serviceDetails[id];
        const yearsKey = `years:${id}`;
        const daysKey = `days:${id}`;
        order.push(yearsKey, daysKey);
        if (!detail?.yearsExperience.trim()) next[yearsKey] = 'This field is required.';
        else if (Number.isNaN(Number(detail.yearsExperience))) {
          next[yearsKey] = 'Enter a valid number.';
        }
        if (!detail?.days.length) next[daysKey] = 'Select at least one working day.';
      }
    }

    if (s === 6 && form.providerType === 'individual') {
      const minPhotos = 2;
      for (const id of form.selectedServiceIds) {
        const detail = form.serviceDetails[id];
        const portfolioKey = `portfolio:${id}`;
        order.push(portfolioKey);
        const items = detail?.portfolioItems ?? [];
        if (items.length < minPhotos) {
          next[portfolioKey] = `Upload at least ${minPhotos} photos of your work.`;
        }
        for (const item of items) {
          const priceKey = `portfolioPrice:${id}:${item.id}`;
          order.push(priceKey);
          if (!item.price.trim()) next[priceKey] = 'Enter a price for this work item.';
          else if (Number.isNaN(Number(item.price))) {
            next[priceKey] = 'Enter a valid price in K.';
          }
        }
      }
    }

    if (s === 7 && form.providerType === 'individual') {
      order.push('location', 'radius');
      if (!form.locationText.trim() && !form.geo) next.location = 'This field is required.';
      if (!form.radiusKm) next.radius = 'This field is required.';
    }

    if (s === 8 && form.providerType === 'individual') {
      order.push('face');
      if (!form.faceUri) next.face = 'This field is required.';
      order.push('nrcNumber', 'nrcDoc');
      if (!form.nrcNumber.trim()) next.nrcNumber = 'This field is required.';
      else if (!isValidZambianNrc(form.nrcNumber)) {
        next.nrcNumber = 'Use NRC format 123456/78/1.';
      }
      if (!form.nrcDocUri) next.nrcDoc = 'This field is required.';
    }

    if (s === 9 && form.providerType === 'individual') {
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

  function validateBusinessStep(s: number): boolean {
    const next: Record<string, string> = {};
    const order: string[] = [];

    if (s === 1) {
      order.push('providerType');
      if (!form.providerType) next.providerType = 'Select how you are registering.';
    }

    if (s === 2) {
      order.push('businessName', 'contactPhone', 'contactEmail', 'location');
      if (!form.business.businessName.trim()) next.businessName = 'Business name is required.';
      if (!form.business.contactPhone.trim()) {
        next.contactPhone = 'Business phone number is required.';
      } else if (!isValidZambianPhone(form.business.contactPhone)) {
        next.contactPhone = 'Please enter a valid business phone number.';
      }
      if (!form.business.contactEmail.trim()) {
        next.contactEmail = 'Business email is required.';
      } else if (!isValidEmail(form.business.contactEmail)) {
        next.contactEmail = 'Please enter a valid business email.';
      }
      if (!form.locationText.trim() && !form.geo) {
        next.location = 'Business location is required.';
      }
    }

    if (s === 3) {
      order.push('nrcNumber');
      if (!form.nrcNumber.trim()) {
        next.nrcNumber = "Please enter the owner's/representative's NRC number.";
      } else if (!isValidZambianNrc(form.nrcNumber)) {
        next.nrcNumber = 'Use NRC format 123456/78/1.';
      }
    }

    if (s === 4) {
      order.push('businessCategory');
      if (!form.businessCategoryId) {
        next.businessCategory = 'Please select a service category.';
      }
    }

    if (s === 5) {
      order.push('password', 'confirm');
      if (!form.password) next.password = 'Password is required.';
      else if (!isStrongPassword(form.password)) {
        next.password = 'Password does not meet the requirements.';
      }
      if (!form.confirm) next.confirm = 'Confirm password is required.';
      else if (form.password !== form.confirm) next.confirm = 'Passwords do not match.';
    }

    if (s === 6) {
      const minPhotos = 2;
      for (const id of form.selectedServiceIds) {
        const detail = form.serviceDetails[id];
        const portfolioKey = `portfolio:${id}`;
        order.push(portfolioKey);
        const items = detail?.portfolioItems ?? [];
        if (items.length < minPhotos) {
          next[portfolioKey] = `Upload at least ${minPhotos} photos of your work.`;
        }
        for (const item of items) {
          const captionKey = `portfolioCaption:${id}:${item.id}`;
          const priceKey = `portfolioPrice:${id}:${item.id}`;
          order.push(captionKey, priceKey);
          if (!item.caption.trim()) next[captionKey] = 'Add a caption for this work.';
          if (!item.price.trim()) next[priceKey] = 'Enter a price for this work item.';
          else if (Number.isNaN(Number(item.price))) {
            next[priceKey] = 'Enter a valid price in K.';
          }
        }
      }
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
    const valid = isBusiness ? validateBusinessStep(step) : validateStep(step);
    if (!valid) return;

    if (step === 2 && form.providerType === 'individual') {
      patch({
        individual: {
          ...form.individual,
          phone: normalizeZambianPhone(form.individual.phone),
        },
      });
    }
    if (step === 2 && form.providerType === 'business') {
      patch({
        business: {
          ...form.business,
          contactPhone: normalizeZambianPhone(form.business.contactPhone),
        },
      });
    }

    if (isBusiness && step === 5) return;

    setStep((s) => Math.min(totalSteps, s + 1));
  }

  async function onUseLocation() {
    if (locating) return;
    setLocating(true);
    setBanner('');
    try {
      const geo = await requestDeviceLocation();
      patch({ geo, locationText: geo.address });
    } catch (err) {
      patch({ geo: null });
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

  function buildProviderInfo(): ProviderApplicationInfo {
    if (form.providerType === 'business') {
      return {
        providerType: 'business',
        businessName: form.business.businessName.trim(),
        contactPhone: normalizeZambianPhone(form.business.contactPhone),
        contactEmail: form.business.contactEmail.trim().toLowerCase(),
        description: form.business.description.trim() || undefined,
      };
    }
    return {
      providerType: 'individual',
      firstName: form.individual.firstName.trim(),
      surname: form.individual.surname.trim(),
      phone: normalizeZambianPhone(form.individual.phone),
      email: form.individual.email.trim().toLowerCase(),
      dateOfBirth: normalizeDateOfBirth(form.individual.dateOfBirth),
      gender: form.individual.gender,
    };
  }

  async function submitProviderApplication(userId: string) {
    const services = form.selectedServiceIds.map((id) =>
      toApplicationService(form.serviceDetails[id]),
    );
    const primary = services[0];
    const providerInfo = buildProviderInfo();
    const phone = providerContactPhone(
      form.providerType,
      form.individual,
      form.business,
      form.registeredBusiness,
    );
    const email = providerContactEmail(
      form.providerType,
      form.individual,
      form.business,
      form.registeredBusiness,
    );

    await saveProviderApplication({
      id: createId('papp'),
      userId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      providerType: form.providerType as ProviderRegistrationType,
      providerInfo,
      personal: {
        firstName:
          form.providerType === 'individual'
            ? form.individual.firstName.trim()
            : displayName.split(' ')[0] ?? displayName,
        surname:
          form.providerType === 'individual'
            ? form.individual.surname.trim()
            : displayName.split(' ').slice(1).join(' '),
        phone,
        email,
        dateOfBirth:
          form.providerType === 'individual'
            ? normalizeDateOfBirth(form.individual.dateOfBirth)
            : '',
        gender: form.providerType === 'individual' ? form.individual.gender : '',
      },
      identity: {
        nrcNumber: form.nrcNumber.trim(),
        legalName: displayName,
        dateOfBirth:
          form.providerType === 'individual'
            ? normalizeDateOfBirth(form.individual.dateOfBirth)
            : '',
        gender: form.providerType === 'individual' ? form.individual.gender : '',
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
            serviceOffered: services.map((svc) => svc.serviceName).join(', '),
            description: primary.description,
            yearsExperience: primary.yearsExperience,
            startingPrice: primary.price,
            location: form.locationText.trim(),
            radiusKm: form.radiusKm,
          }
        : undefined,
    });
  }

  async function onCreateAccount() {
    for (const s of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      if (!validateStep(s)) {
        setBanner('Please complete all required steps before submitting.');
        setStep(s);
        return;
      }
    }

    setLoading(true);
    setBanner('');
    try {
      const phone = providerContactPhone(
        form.providerType,
        form.individual,
        form.business,
        form.registeredBusiness,
      );
      const email = providerContactEmail(
        form.providerType,
        form.individual,
        form.business,
        form.registeredBusiness,
      );
      const { user: created } = await register({
        fullName: displayName,
        email,
        phone,
        password: form.password,
        role: 'provider',
      });

      await submitProviderApplication(created.id);
      await resetProviderRegistrationDraft();
      router.replace('/(provider)/(tabs)');
    } catch (err) {
      setBanner(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function onCreateBusinessAccount() {
    for (const s of [1, 2, 3, 4, 5]) {
      if (!validateBusinessStep(s)) {
        setStep(s);
        return;
      }
    }

    setLoading(true);
    setBanner('');
    try {
      const phone = normalizeZambianPhone(form.business.contactPhone);
      const email = form.business.contactEmail.trim().toLowerCase();
      const { user: created } = await register({
        fullName: form.business.businessName.trim(),
        email,
        phone,
        password: form.password,
        role: 'provider',
      });
      setBusinessUserId(created.id);
      patch({
        business: { ...form.business, contactPhone: phone, contactEmail: email },
      });
      setStep(6);
    } catch (err) {
      setBanner(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function onCompleteBusinessProfile() {
    if (!validateBusinessStep(6)) return;

    const userId = businessUserId ?? user?.id;
    if (!userId) {
      setBanner('Please create your business account first.');
      setStep(5);
      return;
    }

    setLoading(true);
    setBanner('');
    try {
      await submitProviderApplication(userId);
      await resetProviderRegistrationDraft();
      router.replace('/(provider)/(tabs)');
    } catch (err) {
      setBanner(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  const individualTitles: Record<number, { title: string; subtitle?: string }> = {
    1: {
      title: 'How are you registering?',
      subtitle: 'Choose the option that best describes you.',
    },
    2: {
      title: 'Your Information',
      subtitle: 'Tell us who you are.',
    },
    3: {
      title: 'What Service Do You Provide?',
      subtitle: 'Select the category that best describes your business.',
    },
    4: {
      title: 'Select Your Services',
      subtitle: 'Choose all the services you offer in this category.',
    },
    5: {
      title: 'Service Details',
      subtitle: 'Add details for every service you selected.',
    },
    6: {
      title: 'Upload Your Latest Work',
      subtitle: 'Show customers your latest work by uploading photos of your services.',
    },
    7: {
      title: 'Where Do You Provide Your Services?',
      subtitle: 'Help customers find you nearby.',
    },
    8: {
      title: 'Verification',
      subtitle: 'Profile photo and documents for verification only.',
    },
    9: { title: 'Account Security', subtitle: 'Create a strong password.' },
    10: {
      title: 'Review Your Provider Profile',
      subtitle: 'Confirm everything customers will see.',
    },
  };

  const businessTitles: Record<number, { title: string; subtitle?: string }> = {
    1: {
      title: 'How are you registering?',
      subtitle: 'Choose the option that best describes you.',
    },
    2: {
      title: 'Create Your Business Account',
      subtitle:
        'Set up your business profile and connect with customers looking for your services.',
    },
    3: {
      title: 'Create Your Business Account',
      subtitle:
        'Set up your business profile and connect with customers looking for your services.',
    },
    4: {
      title: 'What Service Do You Provide?',
      subtitle: 'Select the category that best describes your business.',
    },
    5: {
      title: 'Create Your Business Account',
      subtitle:
        'Set up your business profile and connect with customers looking for your services.',
    },
    6: {
      title: 'Complete Your Business Profile',
      subtitle: 'Add your logo, description, and showcase your work.',
    },
  };

  const meta = (isBusiness ? businessTitles : individualTitles)[step];
  const categoryStep =
    (isBusiness && step === 4) || (form.providerType === 'individual' && step === 3);

  if (!hydrated) {
    return (
      <View style={styles.hydrating}>
        <ActivityIndicator color={RegColors.gold} size="large" />
      </View>
    );
  }

  return (
    <RegShell
      onBack={goBack}
      backLabel="Back"
      showBackIcon
      step={step}
      totalSteps={totalSteps}
      title={meta.title}
      subtitle={meta.subtitle}
      embedHeaderInPanel={categoryStep}
      categoryPanelLayout={categoryStep}>
      {step === 1 ? (
        <>
          <Text style={styles.label}>How are you registering?</Text>
          {(['individual', 'business'] as ProviderRegistrationType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => patch({ providerType: type })}
              style={[styles.typeRow, form.providerType === type && styles.typeRowSelected]}>
              <View style={[styles.radio, form.providerType === type && styles.radioSelected]} />
              <Text style={styles.typeLabel}>{PROVIDER_TYPE_LABELS[type]}</Text>
            </Pressable>
          ))}
          {errors.providerType ? <Text style={styles.err}>{errors.providerType}</Text> : null}
          <RegError message={banner} />
          <RegPrimaryButton label="Continue" onPress={goNext} />
          <AuthSignInLink />
        </>
      ) : null}

      {step === 2 && isBusiness ? (
        <>
          <BusinessInformationStep
            businessName={form.business.businessName}
            contactPhone={form.business.contactPhone}
            contactEmail={form.business.contactEmail}
            locationText={form.locationText}
            geo={form.geo}
            locating={locating}
            errors={errors}
            locationMessage={banner}
            onChange={({ businessName, contactPhone, contactEmail, locationText }) => {
              patch({
                business: {
                  ...form.business,
                  ...(businessName !== undefined ? { businessName } : {}),
                  ...(contactPhone !== undefined ? { contactPhone } : {}),
                  ...(contactEmail !== undefined ? { contactEmail } : {}),
                },
                ...(locationText !== undefined ? { locationText, geo: null } : {}),
              });
            }}
            onUseLocation={onUseLocation}
          />
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 3 && isBusiness ? (
        <>
          <BusinessOwnerNrcStep
            nrcNumber={form.nrcNumber}
            error={errors.nrcNumber}
            onChange={(nrcNumber) => patch({ nrcNumber })}
          />
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 4 && isBusiness ? (
        <>
          <ServiceCategoryReferenceStep
            selectedCategoryId={form.businessCategoryId}
            error={errors.businessCategory}
            onSelect={(categoryId) => {
              if (form.businessCategoryId === categoryId) {
                patch({
                  businessCategoryId: '',
                  businessCategoryIds: [],
                  selectedServiceIds: [],
                  serviceDetails: {},
                });
              } else {
                patch(selectBusinessCategory(categoryId));
              }
            }}
            onContinue={goNext}
            continueDisabled={!form.businessCategoryId}
          />
        </>
      ) : null}

      {step === 5 && isBusiness ? (
        <>
          <BusinessPasswordStep
            password={form.password}
            confirm={form.confirm}
            errors={errors}
            onChangePassword={(password) => patch({ password })}
            onChangeConfirm={(confirm) => patch({ confirm })}
          />
          <RegError message={banner} />
          <RegPrimaryButton
            label="Create Business Account"
            loading={loading}
            loadingLabel="Creating account…"
            onPress={onCreateBusinessAccount}
          />
        </>
      ) : null}

      {step === 6 && isBusiness ? (
        <>
          <BusinessProfileSetupStep
            description={form.business.description}
            faceUri={form.faceUri}
            categoryLabel={businessCategoryLabel}
            serviceDetails={form.serviceDetails}
            errors={errors}
            onChangeDescription={(description) =>
              patch({ business: { ...form.business, description } })
            }
            onChangePhoto={(faceUri) => patch({ faceUri })}
            onAddPortfolioItem={addPortfolioItem}
            onRemovePortfolioItem={removePortfolioItem}
            onUpdatePortfolioItem={updatePortfolioItem}
            onReplacePortfolioPhoto={replacePortfolioPhoto}
          />
          <RegError message={banner} />
          <RegPrimaryButton
            label="Complete Business Profile"
            loading={loading}
            loadingLabel="Saving profile…"
            onPress={onCompleteBusinessProfile}
          />
        </>
      ) : null}

      {step === 2 && form.providerType === 'individual' ? (
        <>
          <RegField
            fieldKey="firstName"
            nextFieldKey="surname"
            label="First Name"
            value={form.individual.firstName}
            onChangeText={(firstName) =>
              patch({ individual: { ...form.individual, firstName } })
            }
            autoCapitalize="words"
            error={errors.firstName}
          />
          <RegField
            fieldKey="surname"
            nextFieldKey="phone"
            label="Surname"
            value={form.individual.surname}
            onChangeText={(surname) => patch({ individual: { ...form.individual, surname } })}
            autoCapitalize="words"
            error={errors.surname}
          />
          <RegField
            fieldKey="phone"
            nextFieldKey="email"
            label="Contact Number"
            value={form.individual.phone}
            onChangeText={(phone) => patch({ individual: { ...form.individual, phone } })}
            placeholder="+260 97 XXX XXXX"
            keyboardType="phone-pad"
            error={errors.phone}
          />
          <RegField
            fieldKey="email"
            nextFieldKey="dateOfBirth"
            label="Email"
            value={form.individual.email}
            onChangeText={(email) => patch({ individual: { ...form.individual, email } })}
            keyboardType="email-address"
            error={errors.email}
          />
          <RegField
            fieldKey="dateOfBirth"
            label="Date of Birth"
            value={form.individual.dateOfBirth}
            onChangeText={(dateOfBirth) =>
              patch({ individual: { ...form.individual, dateOfBirth } })
            }
            placeholder="YYYY-MM-DD or YYYY/MM/DD"
            error={errors.dateOfBirth}
          />
          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipRow}>
            {['Female', 'Male', 'Other', 'Prefer not to say'].map((g) => (
              <Chip
                key={g}
                label={g}
                selected={form.individual.gender === g}
                onPress={() => patch({ individual: { ...form.individual, gender: g } })}
              />
            ))}
          </View>
          {errors.gender ? <Text style={styles.err}>{errors.gender}</Text> : null}
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}


      {step === 3 && form.providerType === 'individual' ? (
        <>
          <ServiceCategoryReferenceStep
            selectedCategoryId={form.businessCategoryId}
            error={errors.businessCategory}
            onSelect={(categoryId) => {
              if (form.businessCategoryId === categoryId) {
                patch({
                  businessCategoryId: '',
                  selectedServiceIds: [],
                  serviceDetails: {},
                });
              } else {
                patch(selectProviderCategory(categoryId));
              }
            }}
            onContinue={goNext}
            continueDisabled={!form.businessCategoryId}
          />
        </>
      ) : null}

      {step === 4 && form.providerType === 'individual' ? (
        <>
          <ProviderServicePickStep
            categoryId={form.businessCategoryId}
            selectedServiceIds={form.selectedServiceIds}
            error={errors.services}
            onToggle={toggleService}
          />
          <RegPrimaryButton
            label="Continue"
            onPress={goNext}
            disabled={form.selectedServiceIds.length < 1}
          />
        </>
      ) : null}

      {step === 5 && form.providerType === 'individual' ? (
        <>
          <ProviderServiceDetailsStep
            groups={groupedServices}
            serviceDetails={form.serviceDetails}
            errors={errors}
            onUpdate={updateDetail}
          />
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 6 && form.providerType === 'individual' ? (
        <>
          <ProviderPortfolioStep
            groups={groupedServices}
            serviceDetails={form.serviceDetails}
            errors={errors}
            onAddPortfolioItem={addPortfolioItem}
            onRemovePortfolioItem={removePortfolioItem}
            onUpdatePortfolioItem={updatePortfolioItem}
            onReplacePortfolioPhoto={replacePortfolioPhoto}
          />
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 7 && form.providerType === 'individual' ? (
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

      {step === 8 && form.providerType === 'individual' ? (
        <>
          <ProfilePhotoPicker
            uri={form.faceUri}
            size={140}
            onChange={(faceUri) => patch({ faceUri })}
            hint="Use a clear photo — your face or business logo."
          />
          {errors.face ? <Text style={styles.err}>{errors.face}</Text> : null}
          {form.providerType === 'individual' ? (
            <>
              <RegField
                fieldKey="nrcNumber"
                label="NRC Number"
                value={form.nrcNumber}
                onChangeText={(nrcNumber) => patch({ nrcNumber })}
                placeholder="123456/78/1"
                error={errors.nrcNumber}
              />
              <DocUpload
                label="NRC / ID"
                required
                uri={form.nrcDocUri}
                onPick={() => pickDoc('nrcDocUri')}
                onClear={() => patch({ nrcDocUri: '' })}
                error={errors.nrcDoc}
              />
            </>
          ) : null}
          <DocUpload
            label="Professional Certificate"
            uri={form.certificateUri}
            onPick={() => pickDoc('certificateUri')}
            onClear={() => patch({ certificateUri: '' })}
          />
          <Text style={styles.note}>Documents are used for verification only and stay private.</Text>
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 9 && form.providerType === 'individual' ? (
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

      {step === 10 && form.providerType === 'individual' ? (
        <>
          <View style={styles.reviewHero}>
            <Text style={styles.reviewName}>{displayName}</Text>
            <Text style={styles.reviewType}>
              {form.providerType ? PROVIDER_TYPE_LABELS[form.providerType] : ''}
            </Text>
          </View>
          <Summary
            title="Contact"
            onEdit={() => setStep(2)}
            lines={[
              providerContactPhone(
                form.providerType,
                form.individual,
                form.business,
                form.registeredBusiness,
              ),
              providerContactEmail(
                form.providerType,
                form.individual,
                form.business,
                form.registeredBusiness,
              ),
            ]}
          />
          {groupedServices.map((group) => (
            <View key={group.title} style={styles.summary}>
              <View style={styles.summaryHead}>
                <Text style={styles.summaryTitle}>{group.title}</Text>
                <Pressable onPress={() => setStep(4)}>
                  <Text style={styles.edit}>Edit</Text>
                </Pressable>
              </View>
              {group.items.map((item) => {
                const detail = form.serviceDetails[item.id];
                if (!detail) return null;
                return (
                  <View key={item.id} style={styles.reviewService}>
                    <Text style={styles.reviewServiceName}>{detail.serviceName}</Text>
                    <Text style={styles.reviewPrice}>{formatServicePrice(detail)}</Text>
                    <Text style={styles.summaryLine}>
                      {detail.yearsExperience} yrs experience
                    </Text>
                    {detail.portfolioItems.length > 0 ? (
                      <View style={styles.reviewPortfolioList}>
                        {detail.portfolioItems.map((work) => (
                          <View key={work.id} style={styles.reviewWorkItem}>
                            <Image source={{ uri: work.uri }} style={styles.reviewPhoto} />
                            <View style={styles.reviewWorkMeta}>
                              <Text style={styles.summaryLine} numberOfLines={2}>
                                {work.caption.trim() || 'Work sample'}
                              </Text>
                              <Text style={styles.reviewWorkPrice}>
                                {work.price.trim() ? `K${work.price.trim()}` : '—'}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.summaryLine}>No portfolio photos</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
          <Summary
            title="Location"
            onEdit={() => setStep(7)}
            lines={[form.locationText, `Travel: ${form.radiusKm} km`]}
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
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
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
      <Text style={styles.summaryTitle}>
        {label}{' '}
        <Text style={required ? styles.req : styles.opt}>
          {required ? 'Required' : 'Optional'}
        </Text>
      </Text>
      {uri ? (
        <View style={styles.docPreviewRow}>
          <Image source={{ uri }} style={styles.docThumb} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.summaryLine}>Document selected</Text>
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
  hydrating: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RegColors.rootBg,
  },
  label: { color: RegColors.whiteSoft, fontSize: 14, fontWeight: '700', marginTop: 4 },
  note: { color: RegColors.goldSoft, fontSize: 14, lineHeight: 22 },
  err: { color: RegColors.error, fontSize: 14, lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chipSelected: { backgroundColor: RegColors.gold, borderColor: RegColors.gold },
  chipText: { color: RegColors.white, fontSize: 14, fontWeight: '600' },
  chipTextSelected: { color: '#2C2420' },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    marginBottom: 8,
  },
  typeRowSelected: {
    borderColor: 'rgba(242, 246, 252, 0.82)',
    backgroundColor: 'rgba(118, 108, 98, 0.16)',
    ...Platform.select({
      ios: {
        shadowColor: '#E8ECF4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      web: {
        boxShadow:
          '0 0 0 1px rgba(230, 236, 246, 0.45), 0 0 18px rgba(210, 218, 230, 0.48)',
      } as object,
      default: {},
    }),
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(210, 218, 228, 0.48)',
  },
  radioSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.65,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
      web: {
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.55)',
      } as object,
      default: {},
    }),
  },
  typeLabel: { color: RegColors.white, fontWeight: '700', fontSize: 15, flex: 1 },
  group: { gap: 8, marginBottom: 8 },
  groupTitle: {
    color: RegColors.goldSoft,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summary: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    gap: 4,
    marginBottom: 10,
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
  reviewHero: { alignItems: 'center', marginBottom: 12, gap: 4 },
  reviewName: { color: RegColors.white, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  reviewType: { color: RegColors.goldSoft, fontSize: 13, fontWeight: '600' },
  reviewService: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.16)',
    paddingTop: 8,
    marginTop: 6,
    gap: 4,
  },
  reviewServiceName: { color: RegColors.white, fontWeight: '800', fontSize: 14 },
  reviewPrice: { color: RegColors.gold, fontWeight: '700', fontSize: 13 },
  reviewPortfolioList: { gap: 8, marginTop: 6 },
  reviewWorkItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 8,
  },
  reviewWorkMeta: { flex: 1, gap: 2 },
  reviewWorkPrice: { color: RegColors.goldSoft, fontWeight: '700', fontSize: 12 },
  reviewPhoto: { width: 56, height: 56, borderRadius: 8 },
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
