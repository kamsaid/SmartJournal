export const typography = {
  // Font families
  fontFamily: {
    primary: 'System', // iOS: SF Pro, Android: Roboto
    mono: 'Courier New',
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Font weights
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 2,
  },

  // Text styles for common use cases
  textStyles: {
    h1: {
      fontSize: 36,
      fontWeight: '700' as const,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 30,
      fontWeight: '600' as const,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: 20,
      fontWeight: '500' as const,
      lineHeight: 1.4,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 1.6,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.4,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 1.3,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1.2,
    },
  },
};

export default typography;