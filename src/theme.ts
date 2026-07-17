export const theme = {
  colors: {
    background: '#0B1220',
    surface: '#151E30',
    surfaceAlt: '#1E2A42',
    border: '#26344F',
    text: '#F4F7FF',
    textMuted: '#8A97B1',
    accent: '#39E0A6',
    accentDim: '#1C6B54',
    warn: '#FF5C5C',
    warnDim: '#5A2130',
    track: '#233250',
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    pill: 999,
  },
  spacing: (n: number) => n * 8,
} as const;

export type Theme = typeof theme;
