// Design System Tokens - Duson Dark Charcoal Theme
// Dark theme with Charcoal backgrounds, Crimson accents, and Cream text

export const COLORS = {
  // Primary Duson Golden Yellow Theme (minimize usage - only for special highlights)
  primary: {
    50: '#FFFEF7',   // Lightest golden tint
    100: '#FFFAEF',  // Very light golden
    200: '#FFF2D4',  // Light golden
    300: '#FFE5B9',  // Medium light golden
    400: '#FFCA5C',  // Medium golden
    500: '#FFB000',  // Main Duson Golden Yellow (use sparingly)
    600: '#E69D00',  // Darker golden
    700: '#CC8A00',  // Dark golden
    800: '#B37700',  // Very dark golden
    900: '#996400',  // Darkest golden
    950: '#805500',  // Ultra dark golden
  },
  
  // Duson Crimson Red - Primary Interactive Color (20% usage)
  crimson: {
    50: '#FFF5F7',   // Lightest crimson tint
    100: '#FFEBEF',  // Very light crimson
    200: '#FFD7DF',  // Light crimson
    300: '#FFC3CF',  // Medium light crimson
    400: '#FF6195',  // Medium crimson
    500: '#FD1F4A',  // Main Duson Crimson (CTAs, accents, active states)
    600: '#E41C42',  // Darker crimson (hover states)
    700: '#CB193B',  // Dark crimson
    800: '#B21633',  // Very dark crimson
    900: '#99132B',  // Darkest crimson
    950: '#80102A',  // Ultra dark crimson
    light: '#FD4A6B', // Light crimson for subtle accents
    dark: '#E01A42',  // Dark crimson for hover states
  },

  // Duson Charcoal - Primary Background Colors (70% usage)
  charcoal: {
    50: '#F5F4F5',   // Lightest charcoal (rarely used)
    100: '#E8E7E8',  // Very light charcoal (rarely used)
    200: '#D1CFD1',  // Light charcoal (rarely used)
    300: '#A8A5A8',  // Medium light charcoal
    400: '#6B686B',  // Medium charcoal
    500: '#3A3839',  // Light charcoal (elevated surfaces)
    600: '#2D2C2E',  // Main Duson Dark Charcoal (primary background)
    700: '#252425',  // Darker charcoal
    800: '#1F1E20',  // Very dark charcoal (recessed areas)
    900: '#1C1B1D',  // Darkest charcoal
    950: '#0A0A0B',  // Ultra dark charcoal
    light: '#3A3839', // Elevated surfaces
    base: '#2D2C2E',  // Main background
    dark: '#1F1E20',  // Recessed areas
  },

  // Duson Cream - Text and Accent Colors (10% usage)
  cream: {
    50: '#FFFFFF',   // Pure white for high contrast
    100: '#FEFCF7',  // Near white
    200: '#FDF9F0',  // Very light cream
    300: '#FBF6E9',  // Light cream
    400: '#F8F1DD',  // Medium light cream
    500: '#FAF5E6',  // Main Duson Cream (primary text)
    600: '#F0E6C7',  // Darker cream
    700: '#E6D6B8',  // Dark cream
    800: '#D7BC99',  // Very dark cream
    900: '#A89379',  // Darkest cream
    950: '#796A59',  // Ultra dark cream
    muted: 'rgba(250, 245, 230, 0.7)', // Secondary text (70% opacity)
    base: '#FAF5E6',  // Primary text
    bright: '#FFFFFF', // High contrast text
  },
  
  // Legacy aurora mapping to crimson for backward compatibility
  aurora: {
    50: '#FFF5F7',   // Lightest crimson tint
    100: '#FFEBEF',  // Very light crimson
    200: '#FFD7DF',  // Light crimson
    300: '#FFC3CF',  // Medium light crimson
    400: '#FF6195',  // Medium crimson
    500: '#FD1F4A',  // Main Duson Crimson
    600: '#E41C42',  // Darker crimson
    700: '#CB193B',  // Dark crimson
    800: '#B21633',  // Very dark crimson
    900: '#99132B',  // Darkest crimson
    950: '#80102A',  // Ultra dark crimson
  },
  
  // Dark-compatible Glassmorphic Backgrounds
  glass: {
    primary: 'rgba(253, 31, 74, 0.1)',      // Crimson with transparency
    secondary: 'rgba(58, 56, 57, 0.8)',     // Light charcoal with transparency
    tertiary: 'rgba(250, 245, 230, 0.05)',  // Cream with transparency
    border: 'rgba(250, 245, 230, 0.2)',     // Cream border for dark theme
    highlight: 'rgba(253, 31, 74, 0.3)',    // Crimson highlight
    card: 'rgba(45, 44, 46, 0.9)',          // Dark charcoal card background
    overlay: 'rgba(31, 30, 32, 0.8)',       // Dark overlay
  },
  
  // True Dark Theme Colors (70% charcoal, 20% crimson, 10% cream)
  dark: {
    bg: '#2D2C2E',        // Main Duson Dark Charcoal background
    surface: '#3A3839',   // Light charcoal for elevated surfaces
    card: '#3A3839',      // Light charcoal for cards
    elevated: '#454344',  // Even lighter charcoal for highly elevated surfaces
    recessed: '#1F1E20',  // Dark charcoal for recessed areas
    border: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
    divider: 'rgba(250, 245, 230, 0.1)', // Subtle cream dividers
    text: {
      primary: '#FAF5E6',   // Duson Cream for primary text
      secondary: 'rgba(250, 245, 230, 0.8)', // Cream with 80% opacity
      tertiary: 'rgba(250, 245, 230, 0.6)',  // Cream with 60% opacity
      accent: '#FD1F4A',    // Duson Crimson for accent text
      muted: 'rgba(250, 245, 230, 0.5)',     // Cream with 50% opacity
      inverse: '#2D2C2E',   // Dark text for light backgrounds (rare)
    },
  },
  
  // Semantic Colors using Dark Theme Palette
  success: '#FFB000',  // Golden yellow for success (sparingly)
  warning: '#FD1F4A',  // Crimson for warnings
  error: '#FD1F4A',    // Crimson for errors
  info: '#FD1F4A',     // Crimson for info
  
  // Dark Theme Gradients
  gradients: {
    cosmic: ['#FD1F4A', '#E01A42'],        // Crimson gradient
    cosmicReverse: ['#E01A42', '#FD1F4A'], // Reverse crimson gradient
    subtle: ['rgba(253, 31, 74, 0.1)', 'rgba(253, 31, 74, 0.05)'], // Subtle crimson
    glow: ['rgba(253, 31, 74, 0.4)', 'rgba(253, 31, 74, 0.0)'],    // Crimson glow
    aurora: ['#FD1F4A', '#FD4A6B', '#FFB000'], // Crimson to golden (minimal golden)
    charcoal: ['#2D2C2E', '#1F1E20'],      // Charcoal gradient
    charcoalReverse: ['#1F1E20', '#2D2C2E'], // Reverse charcoal
    surface: ['#3A3839', '#2D2C2E'],       // Surface gradient
    overlay: ['rgba(31, 30, 32, 0.9)', 'rgba(45, 44, 46, 0.6)'], // Dark overlay gradient
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

export const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  },
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#FAF5E6', // Cream shadows for dark theme
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#FAF5E6', // Cream shadows for dark theme
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#FAF5E6', // Cream shadows for dark theme
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#FAF5E6', // Cream shadows for dark theme
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  // Dark theme glow effects using Crimson
  cosmic: {
    shadowColor: '#FD1F4A', // Crimson glow for dark theme
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  aurora: {
    shadowColor: '#FD1F4A', // Crimson glow for dark theme
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  // Golden glow for special highlights only
  golden: {
    shadowColor: '#FFB000', // Golden yellow glow (use sparingly)
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

// Animation configurations
export const ANIMATIONS = {
  // Timing values
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 750,
  },
  
  // Easing curves
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Scale values for micro-interactions
  scale: {
    tap: 0.98,
    press: 0.95,
    hover: 1.02,
    active: 1.05,
  },
  
  // Common animation presets
  presets: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideUp: {
      from: { transform: [{ translateY: 20 }], opacity: 0 },
      to: { transform: [{ translateY: 0 }], opacity: 1 },
    },
    slideDown: {
      from: { transform: [{ translateY: -20 }], opacity: 0 },
      to: { transform: [{ translateY: 0 }], opacity: 1 },
    },
    scaleIn: {
      from: { transform: [{ scale: 0.8 }], opacity: 0 },
      to: { transform: [{ scale: 1 }], opacity: 1 },
    },
    bounce: {
      from: { transform: [{ scale: 0.3 }] },
      to: { transform: [{ scale: 1 }] },
    },
  },
} as const;

// Haptic feedback patterns
export const HAPTICS = {
  light: 'impactLight',
  medium: 'impactMedium',
  heavy: 'impactHeavy',
  success: 'notificationSuccess',
  warning: 'notificationWarning',
  error: 'notificationError',
  selection: 'selection',
} as const;

// Dark theme glassmorphism presets using Duson colors
export const GLASS_PRESETS = {
  primary: {
    backgroundColor: COLORS.glass.primary, // Crimson with transparency
    borderWidth: 1,
    borderColor: COLORS.glass.border, // Cream border
    backdropFilter: 'blur(20px)',
  },
  secondary: {
    backgroundColor: COLORS.glass.secondary, // Light charcoal with transparency
    borderWidth: 1,
    borderColor: COLORS.glass.border, // Cream border
    backdropFilter: 'blur(15px)',
  },
  card: {
    backgroundColor: COLORS.glass.card, // Dark charcoal card background
    borderWidth: 1,
    borderColor: COLORS.glass.border, // Cream border
    backdropFilter: 'blur(10px)',
  },
  overlay: {
    backgroundColor: COLORS.glass.overlay, // Dark overlay
    borderWidth: 0,
    backdropFilter: 'blur(8px)',
  },
  highlight: {
    backgroundColor: COLORS.glass.highlight, // Crimson highlight
    borderWidth: 1,
    borderColor: COLORS.crimson[500],
    backdropFilter: 'blur(12px)',
  },
} as const;

export const BREAKPOINTS = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
} as const;