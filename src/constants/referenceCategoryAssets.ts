import type { ImageSourcePropType } from 'react-native';
import type { CategoryId } from '@/types';

/** Reference mockup canvas (661×1024). */
export const REFERENCE_MOCKUP = {
  width: 661,
  height: 1024,
  aspect: 661 / 1024,
  panel: {
    left: 44,
    top: 56,
    width: 573,
    height: 944,
  },
} as const;

const CARD_LEFT = REFERENCE_MOCKUP.panel.left + 12;
const CARD_W = 549;
const CARD_H = 174;
const CARD_TOPS = {
  beauty: REFERENCE_MOCKUP.panel.top + 148,
  repair: REFERENCE_MOCKUP.panel.top + 336,
  cleaning: REFERENCE_MOCKUP.panel.top + 524,
  continue: REFERENCE_MOCKUP.panel.top + 874,
} as const;

/** Hit zones on the full 661×1024 reference canvas. */
export const REFERENCE_CATEGORY = {
  hitZones: {
    beauty: {
      left: CARD_LEFT / REFERENCE_MOCKUP.width,
      top: CARD_TOPS.beauty / REFERENCE_MOCKUP.height,
      width: CARD_W / REFERENCE_MOCKUP.width,
      height: CARD_H / REFERENCE_MOCKUP.height,
    },
    repair: {
      left: CARD_LEFT / REFERENCE_MOCKUP.width,
      top: CARD_TOPS.repair / REFERENCE_MOCKUP.height,
      width: CARD_W / REFERENCE_MOCKUP.width,
      height: CARD_H / REFERENCE_MOCKUP.height,
    },
    cleaning: {
      left: CARD_LEFT / REFERENCE_MOCKUP.width,
      top: CARD_TOPS.cleaning / REFERENCE_MOCKUP.height,
      width: CARD_W / REFERENCE_MOCKUP.width,
      height: CARD_H / REFERENCE_MOCKUP.height,
    },
    continue: {
      left: CARD_LEFT / REFERENCE_MOCKUP.width,
      top: CARD_TOPS.continue / REFERENCE_MOCKUP.height,
      width: CARD_W / REFERENCE_MOCKUP.width,
      height: 56 / REFERENCE_MOCKUP.height,
    },
  },
} as const;

/** Full-screen reference composites — background + panel + cards as one image. */
export const REFERENCE_CATEGORY_SCREENS = {
  beauty: require('../../assets/images/reference-category/full-beauty.png'),
  repair: require('../../assets/images/reference-category/full-repair.png'),
  cleaning: require('../../assets/images/reference-category/full-cleaning.png'),
  none: require('../../assets/images/reference-category/full-none.png'),
} as const satisfies Record<string, ImageSourcePropType>;

export function screenForSelection(selectedId: CategoryId | ''): ImageSourcePropType {
  if (selectedId === 'repair') return REFERENCE_CATEGORY_SCREENS.repair;
  if (selectedId === 'cleaning') return REFERENCE_CATEGORY_SCREENS.cleaning;
  if (selectedId === 'beauty') return REFERENCE_CATEGORY_SCREENS.beauty;
  return REFERENCE_CATEGORY_SCREENS.none;
}

export const CATEGORY_ORDER: CategoryId[] = ['beauty', 'repair', 'cleaning'];

export type CategoryLayoutMetrics = {
  imageWidth: number;
  imageHeight: number;
  offsetX: number;
  offsetY: number;
  scale: number;
};

/** Fit the full reference mockup into the available area (letterbox, no crop). */
export function categoryLayoutMetrics(
  layoutWidth: number,
  layoutHeight: number,
): CategoryLayoutMetrics {
  const { width: refW, height: refH, aspect } = REFERENCE_MOCKUP;
  let imageWidth = layoutWidth;
  let imageHeight = layoutWidth / aspect;

  if (imageHeight > layoutHeight) {
    imageHeight = layoutHeight;
    imageWidth = layoutHeight * aspect;
  }

  return {
    imageWidth,
    imageHeight,
    offsetX: (layoutWidth - imageWidth) / 2,
    offsetY: (layoutHeight - imageHeight) / 2,
    scale: imageWidth / refW,
  };
}
