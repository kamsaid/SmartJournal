// ThemeContext - Dynamic theming with smooth transitions
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StatusBar, Appearance } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as baseTheme, Theme, themes } from '@/design-system';
import { HapticManager } from '@/utils/haptics';

// Types
export type ThemeMode = 'dark' | 'light' | 'auto';
export type ColorScheme = 'cosmic' | 'aurora' | 'nova' | 'stellar' | 'nebula';

interface ThemeContextType {
  currentTheme: Theme;
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  setThemeMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleTheme: () => void;
  isTransitioning: boolean;
  transitionProgress: Animated.SharedValue<number>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Color scheme variations using Duson Dark Theme
const colorSchemes = {
  cosmic: {
    // Crimson-based theme (main dark theme)
    primary: baseTheme.colors.crimson, // Uses the crimson color scheme as primary
  },
  aurora: {
    // Aurora crimson variant with lighter tones
    primary: {
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
  },
  nova: {
    // Charcoal-based neutral variant
    primary: baseTheme.colors.charcoal, // Uses the charcoal color scheme
  },
  stellar: {
    // Golden variant (minimal use for special highlights)
    primary: baseTheme.colors.primary, // Uses the golden color scheme
  },
  nebula: {
    // Mixed crimson variant with warmer tones
    primary: {
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
  },
} as const;

// Time-based theme suggestions
const getTimeBasedScheme = (): ColorScheme => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 10) return 'aurora'; // Morning
  if (hour >= 10 && hour < 17) return 'cosmic'; // Day
      if (hour >= 17 && hour < 20) return 'nebula'; // Evening
    if (hour >= 20 || hour < 5) return 'stellar'; // Night
  
  return 'cosmic';
};

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('cosmic');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Animation values
  const transitionProgress = useSharedValue(0);
  const themeTransition = useSharedValue(0);
  
  // Load saved preferences
  useEffect(() => {
    loadThemePreferences();
  }, []);

  // Auto theme based on system appearance
  useEffect(() => {
    if (themeMode === 'auto') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        handleSystemThemeChange(colorScheme);
      });
      
      // Initial system theme
      handleSystemThemeChange(Appearance.getColorScheme());
      
      return () => subscription?.remove();
    }
  }, [themeMode]);

  // Time-based automatic color scheme
  useEffect(() => {
    const interval = setInterval(() => {
      if (themeMode === 'auto') {
        const suggestedScheme = getTimeBasedScheme();
        if (suggestedScheme !== colorScheme) {
          setColorScheme(suggestedScheme);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [themeMode, colorScheme]);

  const loadThemePreferences = async () => {
    try {
      const [savedMode, savedScheme] = await Promise.all([
        AsyncStorage.getItem('theme_mode'),
        AsyncStorage.getItem('color_scheme'),
      ]);
      
      if (savedMode) {
        setThemeModeState(savedMode as ThemeMode);
      }
      
      if (savedScheme) {
        setColorSchemeState(savedScheme as ColorScheme);
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    }
  };

  const handleSystemThemeChange = (systemScheme: 'light' | 'dark' | null) => {
    // For now, we only support dark theme, but this is where light theme would be handled
    // The transition animation would happen here
    animateThemeTransition();
  };

  const animateThemeTransition = () => {
    setIsTransitioning(true);
    
    transitionProgress.value = withTiming(1, { duration: 600 }, () => {
      transitionProgress.value = withTiming(0, { duration: 400 }, () => {
        runOnJS(setIsTransitioning)(false);
      });
    });
    
    HapticManager.contextual('theme-change');
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    animateThemeTransition();
    
    try {
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  };

  const setColorScheme = async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    animateThemeTransition();
    
    try {
      await AsyncStorage.setItem('color_scheme', scheme);
    } catch (error) {
      console.error('Failed to save color scheme:', error);
    }
  };

  const toggleTheme = () => {
    const modes: ThemeMode[] = ['dark', 'auto'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  // Create current theme with color scheme applied
  const getCurrentTheme = (): Theme => {
    const schemeColors = colorSchemes[colorScheme];
    
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        ...schemeColors,
      },
    };
  };

  const contextValue: ThemeContextType = {
    currentTheme: getCurrentTheme(),
    themeMode,
    colorScheme,
    setThemeMode,
    setColorScheme,
    toggleTheme,
    isTransitioning,
    transitionProgress,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={getCurrentTheme().colors.dark.bg}
        translucent
      />
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme transition overlay component
interface ThemeTransitionOverlayProps {
  children: ReactNode;
}

export function ThemeTransitionOverlay({ children }: ThemeTransitionOverlayProps) {
  const { transitionProgress, isTransitioning } = useTheme();

  const overlayStyle = useAnimatedStyle(() => {
    const opacity = transitionProgress.value;
    
    return {
      opacity,
      backgroundColor: interpolateColor(
        transitionProgress.value,
        [0, 1],
        ['transparent', 'rgba(0, 0, 0, 0.8)']
      ),
    };
  });

  if (!isTransitioning) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            pointerEvents: 'none',
          },
          overlayStyle,
        ]}
      />
    </>
  );
}

// Themed component wrapper
interface ThemedViewProps {
  children: ReactNode;
  style?: any;
}

export function ThemedView({ children, style }: ThemedViewProps) {
  const { currentTheme, transitionProgress } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: currentTheme.colors.dark.bg,
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

// Theme configuration for settings
export const THEME_CONFIG = {
  colorSchemes: [
    { key: 'cosmic' as const, title: 'Duson Crimson', gradient: ['#FD1F4A', '#E01A42'] }, // Now crimson-based
    { key: 'aurora' as const, title: 'Duson Aurora', gradient: ['#FD1F4A', '#FD4A6B'] }, // Crimson variations
    { key: 'nova' as const, title: 'Duson Charcoal', gradient: ['#2D2C2E', '#1F1E20'] }, // Dark charcoal
    { key: 'stellar' as const, title: 'Duson Golden', gradient: ['#FFB000', '#FFCA5C'] }, // Golden (minimal use)
    { key: 'nebula' as const, title: 'Duson Mixed', gradient: ['#FD1F4A', '#FFB000'] }, // Crimson to golden
  ],
  modes: [
    { key: 'dark' as const, title: 'Dark Mode', icon: '🌙' }, // Default dark theme
    { key: 'light' as const, title: 'Light Mode', icon: '☀️' },
    { key: 'auto' as const, title: 'Auto', icon: '✨' },
  ],
} as const;

export default ThemeContext;