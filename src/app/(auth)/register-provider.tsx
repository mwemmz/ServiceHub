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
import { BusinessInformationStep } from '@/components/registration/BusinessInformationStep';
import { BusinessOwnerNrcStep } from '@/components/registration/BusinessOwnerNrcStep';
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
import { updateUser } from '@/services/authService';
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
  setActiveProviderDraftKind,
  setProviderRegistrationDraft,
  type ProviderDraftKind,
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
  getConfirmPasswordError,
  getEmailError,
  getNrcError,
  getPasswordError,
  getPhoneError,
  isValidDateOfBirth,
  normalizeDateOfBirth,
  normalizeZambianPhone,
} from '@/utils/registrationValidation';

const INDIVIDUAL_TOTAL = 9;
const BUSINESS_TOTAL = 6;
/** Form steps start at 2 — type is chosen on /(auth)/provider-type. */
const FORM_START_STEP = 2;

function parseProviderDraftKind(raw: string | string[] | undefined): ProviderDraftKind | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'individual' || value === 'business') return value;
  return null;
}

export default function RegisterProviderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const draftKind = parseProviderDraftKind(params.type);
  const { register, user, refresh } = useAuth();
  const [step, setStep] = useState(FORM_START_STEP);
  const [form, setForm] = useState<ProviderRegistrationForm>(
    emptyProviderRegistrationForm(draftKind ?? ''),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [docBusy, setDocBusy] = useState<string | null>(null);
  const [businessUserId, setBusinessUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!draftKind) {
      router.replace('/(auth)/provider-type' as Href);
      return;
    }
    setActiveProviderDraftKind(draftKind);
    let cancelled = false;
    hydrateProviderRegistrationDraft(draftKind).then((saved) => {
      if (cancelled) return;
      setForm({ ...saved.form, providerType: draftKind });
      setStep(Math.max(FORM_START_STEP, saved.step));
      setBusinessUserId(saved.businessUserId);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [draftKind, router]);

  useEffect(() => {
    if (!hydrated || !draftKind) return;
    setProviderRegistrationDraft(
      { form: { ...form, providerType: draftKind }, step, businessUserId },
      draftKind,
    );
  }, [form, step, businessUserId, hydrated, draftKind]);

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
          if (key === 'faceUri') delete next.face;
          if (key === 'nrcDocUri' || key === 'nrcDocFileName') delete next.nrcDoc;
          if (key === 'businessUri' || key === 'businessLicenceFileName') {
            delete next.businessLicence;
          }
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

  const isBusiness = (draftKind ?? form.providerType) === 'business';
  const totalSteps = isBusiness ? BUSINESS_TOTAL : INDIVIDUAL_TOTAL;

  const businessCategoryLabel = useMemo(
    () =>
      BUSINESS_REGISTRATION_CATEGORIES.find((c) => c.id === form.businessCategoryId)?.label ?? '',
    [form.businessCategoryId],
  );

  const goBack = useCallback(() => {
    setBanner('');
    setErrors({});
    if (step <= FORM_START_STEP) {
      router.replace('/(auth)/provider-type' as Href);
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
        order.push('firstName', 'surname', 'phone', 'email', 'dateOfBirth', 'gender', 'password', 'confirm');
        if (!form.individual.firstName.trim()) next.firstName = 'First name is required.';
        if (!form.individual.surname.trim()) next.surname = 'Surname is required.';
        const phoneError = getPhoneError(form.individual.phone);
        if (phoneError) next.phone = phoneError;
        const emailError = getEmailError(form.individual.email);
        if (emailError) next.email = emailError;
        if (!form.individual.dateOfBirth.trim()) next.dateOfBirth = 'Date of birth is required.';
        else if (!isValidDateOfBirth(form.individual.dateOfBirth)) {
          next.dateOfBirth = 'Use date format YYYY-MM-DD or YYYY/MM/DD.';
        }
        if (!form.individual.gender) next.gender = 'Please select your gender.';
        const passwordError = getPasswordError(form.password);
        if (passwordError) next.password = passwordError;
        const confirmError = getConfirmPasswordError(form.password, form.confirm);
        if (confirmError) next.confirm = confirmError;
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
        if (!detail?.yearsExperience.trim()) next[yearsKey] = 'Years of experience is required.';
        else if (Number.isNaN(Number(detail.yearsExperience))) {
          next[yearsKey] = 'Enter a valid number of years.';
        }
        if (!detail?.days.length) next[daysKey] = 'Select at least one working day.';
      }
    }

    if (s === 6 && form.providerType === 'individual') {
      order.push('face');
      if (!form.faceUri) {
        next.face = 'Profile photo is required. Please take a photo before continuing.';
      }
      order.push('nrcNumber', 'nrcDoc');
      const nrcError = getNrcError(form.nrcNumber);
      if (nrcError) next.nrcNumber = nrcError;
      if (!form.nrcDocUri) {
        next.nrcDoc = 'NRC document is required. Please upload your NRC before continuing.';
      }
    }

    if (s === 7 && form.providerType === 'individual') {
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

    if (s === 8 && form.providerType === 'individual') {
      order.push('location', 'radius');
      if (!form.locationText.trim() && !form.geo) {
        next.location = 'Service location is required.';
      }
      if (!form.radiusKm) next.radius = 'Please select your travel radius.';
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
      order.push('businessName', 'contactPhone', 'contactEmail', 'password', 'confirm', 'location');
      if (!form.business.businessName.trim()) next.businessName = 'Business name is required.';
      const phoneError = getPhoneError(form.business.contactPhone, 'Business phone number');
      if (phoneError) next.contactPhone = phoneError;
      const emailError = getEmailError(form.business.contactEmail, 'Business email');
      if (emailError) next.contactEmail = emailError;
      const passwordError = getPasswordError(form.password);
      if (passwordError) next.password = passwordError;
      const confirmError = getConfirmPasswordError(form.password, form.confirm);
      if (confirmError) next.confirm = confirmError;
      if (!form.locationText.trim() && !form.geo) {
        next.location = 'Business location is required.';
      }
    }

    if (s === 3) {
      order.push('nrcNumber');
      const nrcError = getNrcError(
        form.nrcNumber,
        "Please enter the owner's/representative's NRC number.",
      );
      if (nrcError) next.nrcNumber = nrcError;
    }

    if (s === 4) {
      order.push('businessCategory');
      if (!form.businessCategoryId) {
        next.businessCategory = 'Please select a service category.';
      }
    }

    if (s === 5) {
      order.push('businessLicence');
      if (!form.businessUri) {
        next.businessLicence =
          'Business licence is required. Please upload your business licence before continuing.';
      }
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

  async function pickSingleDoc(
    kind: 'nrc' | 'licence',
  ) {
    if (docBusy) return;
    setDocBusy(kind);
    try {
      const picked = await pickDocumentImage();
      if (!picked) return;
      if (kind === 'nrc') {
        patch({
          nrcDocUri: picked.uri,
          nrcDocFileName: picked.fileName ?? 'NRC document',
        });
      } else {
        patch({
          businessUri: picked.uri,
          businessLicenceFileName: picked.fileName ?? 'Business licence',
        });
      }
    } catch {
      setBanner("We couldn't upload this document. Please try again.");
    } finally {
      setDocBusy(null);
    }
  }

  async function addListDoc(kind: 'certifications' | 'supportingDocuments') {
    if (docBusy) return;
    setDocBusy(kind);
    try {
      const picked = await pickDocumentImage();
      if (!picked) return;
      const doc = {
        id: createId('doc'),
        uri: picked.uri,
        fileName: picked.fileName ?? (kind === 'certifications' ? 'Certificate' : 'Supporting document'),
      };
      const current = form[kind] ?? [];
      patch({ [kind]: [...current, doc] });
    } catch {
      setBanner("We couldn't upload this document. Please try again.");
    } finally {
      setDocBusy(null);
    }
  }

  function removeListDoc(kind: 'certifications' | 'supportingDocuments', id: string) {
    patch({ [kind]: (form[kind] ?? []).filter((d) => d.id !== id) });
  }

  async function replaceListDoc(kind: 'certifications' | 'supportingDocuments', id: string) {
    if (docBusy) return;
    setDocBusy(`${kind}:${id}`);
    try {
      const picked = await pickDocumentImage();
      if (!picked) return;
      patch({
        [kind]: (form[kind] ?? []).map((d) =>
          d.id === id
            ? {
                ...d,
                uri: picked.uri,
                fileName: picked.fileName ?? d.fileName,
              }
            : d,
        ),
      });
    } catch {
      setBanner("We couldn't upload this document. Please try again.");
    } finally {
      setDocBusy(null);
    }
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
        certificateUri:
          (form.certifications ?? [])[0]?.uri || form.certificateUri || undefined,
        otherUri:
          (form.supportingDocuments ?? [])[0]?.uri || form.otherDocUri || undefined,
        certificationUris: (form.certifications ?? []).map((d) => d.uri),
        supportingUris: (form.supportingDocuments ?? []).map((d) => d.uri),
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
    if (loading) return;
    for (const s of [2, 3, 4, 5, 6, 7, 8]) {
      if (!validateStep(s)) {
        setBanner('Please complete all required steps before submitting.');
        setStep(Math.max(FORM_START_STEP, s));
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
      try {
        await updateUser(created.id, {
          providerKind: draftKind === 'business' ? 'business' : 'individual',
        });
        await refresh();
      } catch {
        // best-effort subtype stamp for local session routing
      }
      await resetProviderRegistrationDraft(draftKind ?? 'individual');
      router.replace('/(provider)/(tabs)');
    } catch (err) {
      setBanner(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function onCompleteBusinessProfile() {
    if (loading) return;
    for (const s of [2, 3, 4, 5, 6]) {
      if (!validateBusinessStep(s)) {
        setBanner('Please complete all required steps before creating your account.');
        setStep(Math.max(FORM_START_STEP, s));
        return;
      }
    }

    setLoading(true);
    setBanner('');
    try {
      let userId = businessUserId ?? user?.id;
      if (!userId) {
        const phone = normalizeZambianPhone(form.business.contactPhone);
        const email = form.business.contactEmail.trim().toLowerCase();
        const { user: created } = await register({
          fullName: form.business.businessName.trim(),
          email,
          phone,
          password: form.password,
          role: 'provider',
        });
        userId = created.id;
        setBusinessUserId(userId);
        patch({
          business: { ...form.business, contactPhone: phone, contactEmail: email },
        });
      }

      await submitProviderApplication(userId);
      try {
        await updateUser(userId, { providerKind: 'business' });
        await refresh();
      } catch {
        // best-effort
      }
      await resetProviderRegistrationDraft('business');
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
      title: 'Verification',
      subtitle: 'Take your profile photo with the camera, then upload your NRC and any certifications.',
    },
    7: {
      title: 'Upload Your Latest Work',
      subtitle: 'Show customers your latest work by uploading photos of your services.',
    },
    8: {
      title: 'Where Do You Provide Your Services?',
      subtitle: 'Help customers find you nearby.',
    },
    9: {
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
      title: 'Business Documents',
      subtitle: 'Upload your business licence and any supporting documents.',
    },
    6: {
      title: 'Upload Your Latest Work',
      subtitle: 'Show customers your latest work by uploading photos of your services.',
    },
  };

  const meta = (isBusiness ? businessTitles : individualTitles)[step] ?? {
    title: 'Create Your Account',
    subtitle: undefined,
  };
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
      categoryPanelLayout={categoryStep}
      showProgress={false}>
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
            password={form.password}
            confirm={form.confirm}
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
            onChangePassword={(password) => patch({ password })}
            onChangeConfirm={(confirm) => patch({ confirm })}
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
          <Text style={styles.label}>Business Description</Text>
          <RegField
            fieldKey="businessDescription"
            label="About your business"
            value={form.business.description}
            onChangeText={(description) =>
              patch({ business: { ...form.business, description } })
            }
            multiline
            autoCapitalize="sentences"
            variant="glass"
          />
          <DocUpload
            label="Business Licence"
            required
            uri={form.businessUri}
            fileName={form.businessLicenceFileName}
            loading={docBusy === 'licence'}
            onPick={() => pickSingleDoc('licence')}
            onClear={() => patch({ businessUri: '', businessLicenceFileName: '' })}
            error={errors.businessLicence}
          />
          <MultiDocUpload
            label="Supporting Documents"
            hint="Business registration, permits, certificates, or other relevant documents (optional)."
            docs={form.supportingDocuments ?? []}
            loading={
              docBusy === 'supportingDocuments' ||
              Boolean(docBusy?.startsWith('supportingDocuments:'))
            }
            onAdd={() => addListDoc('supportingDocuments')}
            onReplace={(id) => replaceListDoc('supportingDocuments', id)}
            onRemove={(id) => removeListDoc('supportingDocuments', id)}
          />
          <Text style={styles.note}>Documents are used for verification only and stay private.</Text>
          <RegError message={banner} />
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 6 && isBusiness ? (
        <>
          <BusinessProfileSetupStep
            mode="portfolio"
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
            label="Create Business Account"
            loading={loading}
            loadingLabel="Creating account…"
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
            keyboardType="phone-pad"
            countryCodePrefix="+260"
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
          <PasswordPairFields
            password={form.password}
            confirm={form.confirm}
            errors={errors}
            onChangePassword={(password) => patch({ password })}
            onChangeConfirm={(confirm) => patch({ confirm })}
            onConfirmSubmit={goNext}
          />
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
          <ProfilePhotoPicker
            uri={form.faceUri}
            size={140}
            cameraRequired
            onChange={(faceUri) => patch({ faceUri })}
            hint="Take a clear photo of your face using your device camera. This photo is required."
          />
          {errors.face ? <Text style={styles.err}>{errors.face}</Text> : null}
          <RegField
            fieldKey="nrcNumber"
            label="NRC Number"
            value={form.nrcNumber}
            onChangeText={(nrcNumber) => patch({ nrcNumber })}
            error={errors.nrcNumber}
          />
          <DocUpload
            label="NRC Document"
            required
            uri={form.nrcDocUri}
            fileName={form.nrcDocFileName}
            loading={docBusy === 'nrc'}
            onPick={() => pickSingleDoc('nrc')}
            onClear={() => patch({ nrcDocUri: '', nrcDocFileName: '' })}
            error={errors.nrcDoc}
          />
          <MultiDocUpload
            label="Professional Certification (if applicable)"
            hint="Chef, beauty, plumbing, electrical, or other relevant certificates — optional."
            docs={form.certifications ?? []}
            loading={
              docBusy === 'certifications' || Boolean(docBusy?.startsWith('certifications:'))
            }
            onAdd={() => addListDoc('certifications')}
            onReplace={(id) => replaceListDoc('certifications', id)}
            onRemove={(id) => removeListDoc('certifications', id)}
          />
          <Text style={styles.note}>Documents are used for verification only and stay private.</Text>
          <RegError message={banner} />
          <RegPrimaryButton label="Continue" onPress={goNext} />
        </>
      ) : null}

      {step === 7 && form.providerType === 'individual' ? (
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

      {step === 8 && form.providerType === 'individual' ? (
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

      {step === 9 && form.providerType === 'individual' ? (
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
            onEdit={() => setStep(8)}
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
  fileName,
  loading,
  onPick,
  onClear,
  error,
}: {
  label: string;
  required?: boolean;
  uri: string;
  fileName?: string;
  loading?: boolean;
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
            <Text style={styles.summaryLine} numberOfLines={2}>
              {fileName?.trim() || 'Document selected'}
            </Text>
            <View style={styles.chipRow}>
              <Chip label="Replace" selected={false} onPress={onPick} />
              <Chip label="Remove" selected={false} onPress={onClear} />
            </View>
          </View>
        </View>
      ) : (
        <RegSecondaryButton
          label="Upload"
          icon="cloud-upload-outline"
          loading={loading}
          loadingLabel="Opening…"
          onPress={onPick}
        />
      )}
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

function MultiDocUpload({
  label,
  hint,
  docs,
  loading,
  onAdd,
  onReplace,
  onRemove,
}: {
  label: string;
  hint?: string;
  docs: { id: string; uri: string; fileName: string }[];
  loading?: boolean;
  onAdd: () => void;
  onReplace: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <View style={styles.docCard}>
      <Text style={styles.summaryTitle}>
        {label} <Text style={styles.opt}>Optional</Text>
      </Text>
      {hint ? <Text style={styles.note}>{hint}</Text> : null}
      {docs.map((doc) => (
        <View key={doc.id} style={styles.docPreviewRow}>
          <Image source={{ uri: doc.uri }} style={styles.docThumb} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.summaryLine} numberOfLines={2}>
              {doc.fileName || 'Document selected'}
            </Text>
            <View style={styles.chipRow}>
              <Chip label="Replace" selected={false} onPress={() => onReplace(doc.id)} />
              <Chip label="Remove" selected={false} onPress={() => onRemove(doc.id)} />
            </View>
          </View>
        </View>
      ))}
      <RegSecondaryButton
        label={docs.length ? 'Add another document' : 'Upload'}
        icon="cloud-upload-outline"
        loading={loading}
        loadingLabel="Opening…"
        onPress={onAdd}
      />
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
