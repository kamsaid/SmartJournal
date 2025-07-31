// Theme System with Animation Support - Duson Color Palette
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS, ANIMATIONS, HAPTICS } from './tokens';

export interface Theme {
  colors: typeof COLORS;
  spacing: typeof SPACING;
  borderRadius: typeof BORDER_RADIUS;
  typography: typeof TYPOGRAPHY;
  shadows: typeof SHADOWS;
  animations: typeof ANIMATIONS;
  haptics: typeof HAPTICS;
}

// Main theme object
export const theme: Theme = {
  colors: COLORS,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  typography: TYPOGRAPHY,
  shadows: SHADOWS,
  animations: ANIMATIONS,
  haptics: HAPTICS,
};

// Theme variants
export const themes = {
  dark: theme, // Default dark theme
  // Could add light theme here in the future
} as const;

export type ThemeName = keyof typeof themes;

// Theme utilities
export const getTheme = (themeName: ThemeName = 'dark') => themes[themeName];

// Style mixins for common patterns using Duson Dark Theme
export const StyleMixins = {
  // Dark theme glassmorphic card using Duson colors
  glassCard: {
    backgroundColor: COLORS.glass.card, // Dark charcoal glass
    borderWidth: 1,
    borderColor: COLORS.glass.border, // Cream border
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  
  // Crimson glow effect for interactive elements
  crimsonGlow: {
    backgroundColor: COLORS.crimson[500], // Main crimson
    ...SHADOWS.cosmic, // Crimson glow shadow
    borderRadius: BORDER_RADIUS.lg,
  },
  
  // Charcoal surface with elevation
  elevatedSurface: {
    backgroundColor: COLORS.dark.surface, // Light charcoal elevated surface
    ...SHADOWS.lg,
    borderRadius: BORDER_RADIUS.xl,
  },
  
  // Floating element with dark theme styling
  floating: {
    ...SHADOWS.lg,
    backgroundColor: COLORS.dark.card, // Light charcoal card
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.dark.border, // Cream border with opacity
  },
  
  // Interactive surface with dark theme styling
  interactive: {
    backgroundColor: COLORS.dark.surface, // Light charcoal surface
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.dark.border, // Cream border with opacity
    ...SHADOWS.sm,
  },
  
  // Text styles using dark theme colors
  headingText: {
    fontSize: TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.dark.text.primary, // Cream text
    lineHeight: TYPOGRAPHY.lineHeights.tight,
  },
  
  bodyText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.normal,
    color: COLORS.dark.text.secondary, // Cream with 80% opacity
    lineHeight: TYPOGRAPHY.lineHeights.normal,
  },
  
  accentText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.crimson[500], // Crimson accent text
    lineHeight: TYPOGRAPHY.lineHeights.normal,
  },
  
  mutedText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.normal,
    color: COLORS.dark.text.muted, // Cream with 50% opacity
    lineHeight: TYPOGRAPHY.lineHeights.normal,
  },
  
  // Button styles using dark theme colors
  primaryButton: {
    backgroundColor: COLORS.crimson[500], // Main crimson
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    ...SHADOWS.cosmic, // Crimson glow
  },
  
  primaryButtonText: {
    color: COLORS.cream.bright, // White text for high contrast
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.crimson[500], // Crimson border
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  
  secondaryButtonText: {
    color: COLORS.crimson[500], // Crimson text
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
  
  ghostButton: {
    backgroundColor: 'transparent',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  
  ghostButtonText: {
    color: COLORS.dark.text.accent, // Crimson text
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  
  // Input styles using dark theme colors
  textInput: {
    backgroundColor: COLORS.dark.surface, // Light charcoal background
    borderWidth: 1,
    borderColor: COLORS.dark.border, // Cream border with opacity
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.dark.text.primary, // Cream text
  },
  
  focusedInput: {
    borderColor: COLORS.crimson[500], // Crimson focus border
    ...SHADOWS.cosmic, // Crimson glow
  },
  
  inputPlaceholder: {
    color: COLORS.dark.text.tertiary, // Cream with 60% opacity
  },
  
  // Layout helpers
  centerContent: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  spaceBetween: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  
  fullWidth: {
    width: '100%' as const,
  },
  
  flex1: {
    flex: 1,
  },
  
  // Container styles for dark theme
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.dark.bg, // Main dark charcoal background
    paddingHorizontal: SPACING.xl,
  },
  
  cardContainer: {
    backgroundColor: COLORS.dark.card, // Light charcoal card
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.dark.border, // Cream border with opacity
    ...SHADOWS.md,
  },
  
  sectionContainer: {
    marginVertical: SPACING.lg,
  },
  
  // Dividers and separators
  divider: {
    height: 1,
    backgroundColor: COLORS.dark.divider, // Subtle cream divider
    marginVertical: SPACING.md,
  },
  
  verticalDivider: {
    width: 1,
    backgroundColor: COLORS.dark.divider, // Subtle cream divider
    marginHorizontal: SPACING.md,
  },
  
  // Modal and overlay styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.glass.overlay, // Dark overlay with transparency
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  modalContainer: {
    backgroundColor: COLORS.dark.surface, // Light charcoal modal background
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING['2xl'],
    margin: SPACING.xl,
    maxWidth: '90%' as const,
    ...SHADOWS.xl,
    borderWidth: 1,
    borderColor: COLORS.dark.border, // Cream border with opacity
  },
  
  // List item styles
  listItem: {
    backgroundColor: COLORS.dark.surface, // Light charcoal background
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.dark.border, // Cream border with opacity
  },
  
  listItemPressed: {
    backgroundColor: COLORS.charcoal[500], // Slightly lighter charcoal on press
    borderColor: COLORS.crimson[500], // Crimson border on press
  },
  
  // Status indicator styles
  successIndicator: {
    backgroundColor: COLORS.success, // Golden yellow (sparingly)
    ...SHADOWS.golden, // Golden glow
  },
  
  errorIndicator: {
    backgroundColor: COLORS.error, // Crimson
    ...SHADOWS.cosmic, // Crimson glow
  },
  
  warningIndicator: {
    backgroundColor: COLORS.warning, // Crimson
    ...SHADOWS.cosmic, // Crimson glow
  },
  
  infoIndicator: {
    backgroundColor: COLORS.info, // Crimson
    ...SHADOWS.cosmic, // Crimson glow
  },
} as const;

// Animation presets with dark theme integration
export const ThemedAnimations = {
  // Crimson glow animation for interactive elements
  crimsonGlow: (intensity = 1) => ({
    shadowColor: COLORS.crimson[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4 * intensity,
    shadowRadius: 8 * intensity,
    elevation: 5 * intensity,
  }),
  
  // Crimson pulse for active states
  crimsonPulse: (intensity = 1) => ({
    shadowColor: COLORS.crimson[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3 * intensity,
    shadowRadius: 6 * intensity,
    elevation: 4 * intensity,
  }),
  
  // Golden glow for success states (use sparingly)
  goldenGlow: (intensity = 1) => ({
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4 * intensity,
    shadowRadius: 10 * intensity,
    elevation: 6 * intensity,
  }),
  
  // Subtle cream glow for elevated surfaces
  creamGlow: (intensity = 1) => ({
    shadowColor: COLORS.cream[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15 * intensity,
    shadowRadius: 4 * intensity,
    elevation: 3 * intensity,
  }),
  
  // Error glow using crimson
  errorGlow: (intensity = 1) => ({
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4 * intensity,
    shadowRadius: 8 * intensity,
    elevation: 5 * intensity,
  }),
  
  // Dark surface elevation
  darkElevation: (intensity = 1) => ({
    shadowColor: COLORS.cream[500],
    shadowOffset: { width: 0, height: 2 * intensity },
    shadowOpacity: 0.1 * intensity,
    shadowRadius: 4 * intensity,
    elevation: 3 * intensity,
  }),
} as const;

// Responsive helpers
export const ResponsiveHelpers = {
  // Scale based on screen size
  scaleSize: (baseSize: number, factor = 1.2) => {
    // This would typically use device dimensions
    // For now, returning base size
    return baseSize * factor;
  },
  
  // Responsive spacing
  responsiveSpacing: (base: keyof typeof SPACING) => {
    return SPACING[base];
  },
  
  // Responsive font size
  responsiveFontSize: (base: keyof typeof TYPOGRAPHY.fontSizes) => {
    return TYPOGRAPHY.fontSizes[base];
  },
} as const;

export default theme;