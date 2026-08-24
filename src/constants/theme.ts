import { Platform, type ViewStyle } from 'react-native';

export const Colors = {
  background: '#F8F4F0',
  cream: '#FBF7F2',
  surface: '#FFFFFF',
  charcoal: '#2C2420',
  text: '#2C2420',
  textMuted: '#7A7068',
  textLight: '#A39890',
  accent: '#C67C4E',
  accentDark: '#A65D35',
  accentSoft: '#F3E4D8',
  border: '#E8E0D8',
  success: '#3D8B6E',
  error: '#C45C4A',
  warning: '#D4A017',
  star: '#E8B84A',
  overlay: 'rgba(44, 36, 32, 0.45)',
  beauty: {
    background: '#F8E4E0',
    accent: '#D97B78',
    icon: '#C45C5A',
  },
  repair: {
    background: '#D9E6F2',
    accent: '#5B8FB8',
    icon: '#3E739C',
  },
  cleaning: {
    background: '#DCEBD8',
    accent: '#6AA36A',
    icon: '#4E8A4E',
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
  full: 999,
} as const;

export const Shadows: { card: ViewStyle; floating: ViewStyle } = {
  card: Platform.select<ViewStyle>({
    web: { boxShadow: '0px 6px 16px rgba(44, 36, 32, 0.08)' },
    default: {
      shadowColor: '#2C2420',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 3,
    },
  })!,
  floating: Platform.select<ViewStyle>({
    web: { boxShadow: '0px 10px 20px rgba(44, 36, 32, 0.12)' },
    default: {
      shadowColor: '#2C2420',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 6,
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
