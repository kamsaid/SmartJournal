export const colors = {
  // Primary Duson Golden Yellow theme (minimize usage - special highlights only)
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
  },

  // Secondary Duson Crimson Red - Primary Interactive Color (20% usage)
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
    light: '#FD4A6B', // Light crimson for subtle accents
    dark: '#E01A42',  // Dark crimson for hover states
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
    muted: 'rgba(250, 245, 230, 0.7)', // Secondary text (70% opacity)
    base: '#FAF5E6',  // Primary text
    bright: '#FFFFFF', // High contrast text
  },

  // Neutral colors using Duson charcoal and cream (for compatibility)
  neutral: {
    50: '#FAF5E6',   // Duson Cream
    100: '#F5F0D7',  // Cream tint
    200: '#E6D6B8',  // Light cream-gray
    300: '#D7BC99',  // Medium cream-gray
    400: '#A89379',  // Medium gray-cream
    500: '#796A59',  // Darker cream-gray
    600: '#5A4E41',  // Dark cream-gray
    700: '#3B362F',  // Very dark cream-gray
    800: '#2D2C2E',  // Duson Dark Charcoal
    900: '#1C1B1D',  // Darkest charcoal
  },

  // Semantic colors using Dark Theme palette
  semantic: {
    success: '#FFB000',  // Golden yellow for success (sparingly)
    warning: '#FD1F4A',  // Crimson for warnings
    error: '#FD1F4A',    // Crimson for errors
    info: '#FD1F4A',     // Crimson for info
  },

  // Dark-compatible glassmorphic overlay colors
  glass: {
    light: 'rgba(250, 245, 230, 0.05)',     // Cream with transparency
    medium: 'rgba(250, 245, 230, 0.1)',     // Cream with more opacity
    dark: 'rgba(45, 44, 46, 0.8)',          // Dark charcoal with transparency
    blur: 'rgba(253, 31, 74, 0.1)',         // Crimson with transparency
    primary: 'rgba(253, 31, 74, 0.1)',      // Crimson with transparency
    secondary: 'rgba(58, 56, 57, 0.8)',     // Light charcoal with transparency
    tertiary: 'rgba(250, 245, 230, 0.05)',  // Cream with transparency
    border: 'rgba(250, 245, 230, 0.2)',     // Cream border for dark theme
    highlight: 'rgba(253, 31, 74, 0.3)',    // Crimson highlight
    card: 'rgba(45, 44, 46, 0.9)',          // Dark charcoal card background
    overlay: 'rgba(31, 30, 32, 0.8)',       // Dark overlay
  },

  // Dark theme background gradients
  gradients: {
    cosmic: ['#FD1F4A', '#E01A42'],        // Crimson gradient
    cosmicReverse: ['#E01A42', '#FD1F4A'], // Reverse crimson gradient
    night: ['#2D2C2E', '#1F1E20'],         // Dark charcoal variations
    nightReverse: ['#1F1E20', '#2D2C2E'],  // Reverse charcoal
    aurora: ['#FD1F4A', '#FD4A6B'],        // Crimson variations
    auroraFull: ['#FD1F4A', '#FD4A6B', '#FFB000'], // Crimson to golden (minimal golden)
    surface: ['#3A3839', '#2D2C2E'],       // Surface gradient
    surfaceReverse: ['#2D2C2E', '#3A3839'], // Reverse surface
    subtle: ['rgba(253, 31, 74, 0.1)', 'rgba(253, 31, 74, 0.05)'], // Subtle crimson
    glow: ['rgba(253, 31, 74, 0.4)', 'rgba(253, 31, 74, 0.0)'],    // Crimson glow
    overlay: ['rgba(31, 30, 32, 0.9)', 'rgba(45, 44, 46, 0.6)'],   // Dark overlay gradient
    cream: ['rgba(250, 245, 230, 0.1)', 'rgba(250, 245, 230, 0.05)'], // Subtle cream
    charcoal: ['#2D2C2E', '#1F1E20'],      // Charcoal gradient
    charcoalLight: ['#3A3839', '#2D2C2E'], // Light charcoal gradient
  },
};

export default colors;