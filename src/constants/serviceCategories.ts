import type { CategoryId } from '@/types';
import type { ImageSourcePropType } from 'react-native';

export type SparkleDot = { top: number; right: number; size: number; opacity: number };

export type ServiceCategoryVisual = {
  id: CategoryId;
  label: string;
  description: string;
  image: ImageSourcePropType;
  /** Base glass + category tint gradient */
  cardFill: readonly [string, string, string];
  /** Radial bloom behind artwork (bottom-right) */
  radialGlow: string;
  selectedBorder: string;
  selectedGlow: string;
  accent: string;
  sparkleColor?: string;
  sparkles?: SparkleDot[];
  artScale?: number;
  artRight?: number;
  artBottom?: number;
};

export const SERVICE_CATEGORY_OPTIONS: ServiceCategoryVisual[] = [
  {
    id: 'beauty',
    label: 'Beauty & Cosmetics',
    description: 'Salon, barbershop, nails, makeup and beauty services.',
    image: require('../../assets/images/services/category-beauty.png'),
    cardFill: [
      'rgba(218, 118, 108, 0.82)',
      'rgba(175, 82, 78, 0.74)',
      'rgba(95, 48, 44, 0.66)',
    ],
    radialGlow: 'rgba(255, 150, 105, 0.48)',
    selectedBorder: 'rgba(255, 198, 158, 0.98)',
    selectedGlow: 'rgba(255, 165, 105, 0.72)',
    accent: '#FFC498',
    sparkleColor: 'rgba(255, 220, 175, 0.95)',
    sparkles: [
      { top: 18, right: 120, size: 5, opacity: 0.92 },
      { top: 42, right: 96, size: 3, opacity: 0.78 },
      { top: 66, right: 136, size: 4, opacity: 0.88 },
      { top: 94, right: 108, size: 3, opacity: 0.72 },
      { top: 122, right: 144, size: 5, opacity: 0.85 },
      { top: 150, right: 114, size: 3, opacity: 0.68 },
    ],
    artScale: 1.14,
    artRight: -8,
    artBottom: -10,
  },
  {
    id: 'repair',
    label: 'Repair',
    description: 'Electronics, appliances, plumbing and home repairs.',
    image: require('../../assets/images/services/category-repair.png'),
    cardFill: [
      'rgba(88, 102, 128, 0.78)',
      'rgba(64, 78, 104, 0.70)',
      'rgba(38, 48, 68, 0.62)',
    ],
    radialGlow: 'rgba(140, 180, 230, 0.30)',
    selectedBorder: 'rgba(210, 228, 252, 0.96)',
    selectedGlow: 'rgba(155, 195, 248, 0.58)',
    accent: '#C2D8F8',
    artScale: 1.08,
    artRight: -6,
    artBottom: -8,
  },
  {
    id: 'cleaning',
    label: 'Cleaning Services',
    description: 'Home, office, laundry and outdoor cleaning.',
    image: require('../../assets/images/services/category-cleaning.png'),
    cardFill: [
      'rgba(72, 128, 82, 0.78)',
      'rgba(52, 98, 62, 0.70)',
      'rgba(32, 68, 42, 0.62)',
    ],
    radialGlow: 'rgba(135, 225, 155, 0.34)',
    selectedBorder: 'rgba(205, 242, 215, 0.96)',
    selectedGlow: 'rgba(125, 215, 145, 0.58)',
    accent: '#B8ECC0',
    sparkleColor: 'rgba(195, 255, 210, 0.9)',
    sparkles: [
      { top: 22, right: 128, size: 4, opacity: 0.85 },
      { top: 54, right: 102, size: 3, opacity: 0.72 },
      { top: 86, right: 142, size: 4, opacity: 0.82 },
      { top: 116, right: 116, size: 3, opacity: 0.68 },
    ],
    artScale: 1.12,
    artRight: -6,
    artBottom: -10,
  },
];

export function getServiceCategoryOption(id: CategoryId) {
  return SERVICE_CATEGORY_OPTIONS.find((item) => item.id === id);
}
