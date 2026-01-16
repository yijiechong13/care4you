export const colors = {
  // Primary
  primary: '#002C5E',

  // Status
  success: '#22C55E',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  warningDark: '#92400E',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    100: '#F3F4F6',
    200: '#E5E7EB',
    400: '#9CA3AF',
    500: '#6B7280',
    700: '#374151',
  },

  // Background
  background: '#F5F5F5',
  cardBackground: '#FFFFFF',
} as const;

export type Colors = typeof colors;
