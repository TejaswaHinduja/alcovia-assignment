export const Colors = {
  primary: '#6C5CE7',
  primaryLight: '#EDE9FE',
  success: '#00B894',
  successLight: '#D1FAE5',
  amber: '#F39C12',
  amberLight: '#FEF3C7',
  background: '#F5F6FA',
  surface: '#FFFFFF',
  text: '#1A1D26',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  error: '#EF4444',
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cta: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;

export const Radii = {
  button: 12,
  statCard: 14,
  card: 16,
  pill: 20,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;
