/**
 * Pixel specs from the service-category reference mockup (661×1024).
 * Values are defined at reference panel inner width (551px) and scaled at runtime.
 */
export const CATEGORY_REF = {
  panelInnerWidth: 551,
  cardHeight: 183,
  cardGap: 14,
  cardRadius: 26,
  cardInnerRadius: 23,
  selectedBorderWidth: 2.5,
  idleBorderWidth: 1,
  cardPadH: 20,
  cardPadV: 18,
  textMaxRatio: 0.52,
  artWidthRatio: 0.62,
  artHeight: 182,
  artBottom: -4,
  artRight: -2,
  titleSize: 21,
  titleLineHeight: 27,
  descSize: 15,
  descLineHeight: 22,
  radioSize: 30,
  headerTitleSize: 26,
  headerTitleLineHeight: 32,
  headerSubtitleSize: 16,
  headerSubtitleLineHeight: 24,
  headerGap: 10,
  headerToCards: 14,
  buttonMarginTop: 20,
  buttonHeight: 52,
} as const;

export function categoryScale(contentWidth: number) {
  return Math.max(0.82, Math.min(1.12, contentWidth / CATEGORY_REF.panelInnerWidth));
}

export function scaled(value: number, contentWidth: number) {
  return Math.round(value * categoryScale(contentWidth));
}
