import { Platform, type ViewStyle } from 'react-native';
import { RegColors } from '@/constants/registrationTheme';

/**
 * ServiceHub design system — aligned with Create Account / RegShell.
 * Photo backdrop + glass surfaces + champagne gold accent.
 */
export const Colors = {
  background: RegColors.rootBg,
  cream: 'rgba(255,255,255,0.06)',
  surface: 'rgba(255,255,255,0.14)',
  surfaceSolid: 'rgba(22,28,48,0.92)',
  charcoal: RegColors.white,
  text: RegColors.white,
  textMuted: RegColors.whiteMuted,
  textLight: 'rgba(255,255,255,0.45)',
  accent: RegColors.gold,
  accentDark: '#C9975E',
  accentSoft: 'rgba(226,176,126,0.22)',
  border: RegColors.glassBorder,
  success: RegColors.success,
  error: RegColors.error,
  warning: '#E8C56A',
  star: '#E8B84A',
  overlay: RegColors.overlayMid,
  onAccent: '#2C2420',
  glassFill: RegColors.glassFill,
  whiteSoft: RegColors.whiteSoft,
  beauty: {
    background: 'rgba(217,123,120,0.28)',
    accent: '#F0A8A5',
    icon: '#F0A8A5',
  },
  repair: {
    background: 'rgba(91,143,184,0.28)',
    accent: '#8EC0E8',
    icon: '#8EC0E8',
  },
  cleaning: {
    background: 'rgba(106,163,106,0.28)',
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
  lg: 20,
  xl: 28,
  pill: 999,
  full: 999,
} as const;

export const Shadows: { card: ViewStyle; floating: ViewStyle } = {
  card: Platform.select<ViewStyle>({
    web: { boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.28)' },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 18,
      elevation: 8,
    },
  })!,
  floating: Platform.select<ViewStyle>({
    web: { boxShadow: '0px 12px 28px rgba(0, 0, 0, 0.35)' },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 22,
      elevation: 10,
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
  hero: 32,
} as const;
