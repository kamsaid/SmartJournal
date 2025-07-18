// Create a theme object that combines all design tokens
import colors from './colors';
import spacing from './spacing';
import typography from './typography';

export { default as colors } from './colors';
export { default as spacing } from './spacing';
export { default as typography } from './typography';
export { default as config } from './config';

export const theme = {
  colors,
  spacing,
  typography,
  // Glassmorphic shadow styles
  shadows: {
    sm: {
      shadowColor: colors.neutral[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: colors.neutral[900],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: colors.neutral[900],
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: colors.primary[500],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};