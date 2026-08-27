/** ServiceHub design tokens — matched to Get Started reference (glass + champagne gold). */
export const RegColors = {
  gold: '#D4A373',
  goldSoft: '#E8C4A0',
  goldDeep: '#C4894A',
  peach: '#F5D5C0',
  amber: '#E8A86A',
  providerBlue: '#3B7FD4',
  providerBlueDeep: '#1E5AA8',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.90)',
  whiteMuted: 'rgba(255,255,255,0.70)',
  /** Thin frosted border from reference cards */
  glassBorder: 'rgba(255,255,255,0.45)',
  /** ~20–28% white tint — background must show through */
  glassFill: 'rgba(255,255,255,0.14)',
  glassFillLight: 'rgba(255,255,255,0.10)',
  glassFillStrong: 'rgba(255,255,255,0.20)',
  error: '#FF8A7A',
  success: '#7DDBB0',
  /** Lighter overlays so the photo remains visible */
  overlayTop: 'rgba(8,12,28,0.18)',
  overlayMid: 'rgba(10,14,30,0.38)',
  overlayBot: 'rgba(6,8,20,0.68)',
  rootBg: '#0A1020',
} as const;

export const ScriptFont = {
  ios: 'Snell Roundhand',
  android: 'cursive',
  web: '"Segoe Script", "Brush Script MT", cursive',
  default: 'cursive',
} as const;
