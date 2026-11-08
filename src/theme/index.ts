/**
 * Gender-neutral palette: deep ink + marigold (a festive accent that reads as
 * celebratory across Indian and global occasions, without pink/blue coding).
 */
export const colors = {
  bg: '#0F1115',
  surface: '#181B22',
  surfaceHigh: '#232733',
  border: '#2E3340',
  text: '#F4F5F7',
  textMuted: '#9AA1AE',
  accent: '#FFB020',
  accentText: '#1A1300',
  success: '#3DD68C',
  danger: '#FF5C5C',
  overlayScrim: 'rgba(0,0,0,0.45)',
} as const;

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const type = {
  title: { fontSize: 28, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
};
