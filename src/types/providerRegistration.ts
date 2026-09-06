import type { CategoryId, GeoLocation } from '@/types';

export type ProviderRegistrationType = 'individual' | 'business' | 'registered_business';

export type ProviderPriceType = 'fixed' | 'starting_from';

/** One portfolio work sample — photo with optional caption and price. */
export type ProviderPortfolioItem = {
  id: string;
  uri: string;
  caption: string;
  price: string;
};

/** One selected service with experience, availability, and portfolio work samples. */
export type ProviderRegistrationService = {
  serviceId: string;
  serviceName: string;
  groupTitle: string;
  categoryId: CategoryId;
  yearsExperience: string;
  portfolioItems: ProviderPortfolioItem[];
  days: string[];
  hoursStart: string;
  hoursEnd: string;
};

export type IndividualProviderInfo = {
  firstName: string;
  surname: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
};

export type BusinessProviderInfo = {
  businessName: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
};

export type RegisteredBusinessProviderInfo = {
  registeredName: string;
  registrationNumber: string;
  contactPhone: string;
  contactEmail: string;
  taxId: string;
};

export type ProviderRegistrationForm = {
  providerType: ProviderRegistrationType | '';
  individual: IndividualProviderInfo;
  business: BusinessProviderInfo;
  registeredBusiness: RegisteredBusinessProviderInfo;
  selectedServiceIds: string[];
  serviceDetails: Record<string, ProviderRegistrationService>;
  /** Individual flow — single category pick. */
  businessCategoryId: CategoryId | '';
  /** Business flow — multi-select categories (empty on first load). */
  businessCategoryIds: CategoryId[];
  faceUri: string;
  nrcNumber: string;
  locationText: string;
  geo: GeoLocation | null;
  radiusKm: string;
  nrcDocUri: string;
  businessUri: string;
  certificateUri: string;
  otherDocUri: string;
  password: string;
  confirm: string;
};

export const PROVIDER_TYPE_LABELS: Record<ProviderRegistrationType, string> = {
  individual: 'Individual Service Provider',
  business: 'Business',
  registered_business: 'Registered Business',
};
