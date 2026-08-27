import { Platform, type ViewStyle } from 'react-native';
import { RegColors } from '@/constants/registrationTheme';

/**
 * App-wide design system aligned to Get Started reference.
 * Photo backdrop + frosted glass + champagne gold.
 */
export const Colors = {
  background: RegColors.rootBg,
  cream: 'rgba(255,255,255,0.05)',
  surface: RegColors.glassFill,
  surfaceSolid: 'rgba(16,22,42,0.88)',
  charcoal: RegColors.white,
  text: RegColors.white,
  textMuted: RegColors.whiteMuted,
  textLight: 'rgba(255,255,255,0.48)',
  accent: RegColors.gold,
  accentDark: RegColors.goldDeep,
  accentSoft: 'rgba(212,163,115,0.22)',
  border: RegColors.glassBorder,
  success: RegColors.success,
  error: RegColors.error,
  warning: '#E8C56A',
  star: '#E8B84A',
  overlay: RegColors.overlayMid,
  onAccent: '#2C2420',
  glassFill: RegColors.glassFill,
  whiteSoft: RegColors.whiteSoft,
  providerBlue: RegColors.providerBlue,
  beauty: {
    background: 'rgba(217,123,120,0.22)',
    accent: '#F0A8A5',
    icon: '#F0A8A5',
  },
  repair: {
    background: 'rgba(91,143,184,0.22)',
    accent: '#8EC0E8',
    icon: '#8EC0E8',
  },
  cleaning: {
    background: 'rgba(106,163,106,0.22)',
    accent: '#9CD49C',
    icon: '#9CD49C',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radii = {
  sm: 10,
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
  full: 999,
} as const;

export const Shadows: { card: ViewStyle; floating: ViewStyle } = {
  card: Platform.select<ViewStyle>({
    web: { boxShadow: '0px 10px 28px rgba(0, 0, 0, 0.32)' },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.32,
      shadowRadius: 20,
      elevation: 10,
    },
  })!,
  floating: Platform.select<ViewStyle>({
    web: { boxShadow: '0px 14px 32px rgba(0, 0, 0, 0.38)' },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.38,
      shadowRadius: 24,
      elevation: 12,
    },
  })!,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  hero: 34,
} as const;
