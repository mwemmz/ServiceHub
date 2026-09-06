import { SERVICE_CATEGORY_OPTIONS } from '@/constants/serviceCategories';
import type { CategoryId } from '@/types';

/** @deprecated use SERVICE_CATEGORY_OPTIONS from serviceCategories */
export const BUSINESS_REGISTRATION_CATEGORIES = SERVICE_CATEGORY_OPTIONS.map(
  ({ id, label, description }) => ({ id, label, description }),
);
