// AnimatedCard - Premium card with glassmorphism and micro-interactions
import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticManager } from '@/utils/haptics';
import { theme, SPRING_CONFIGS, TIMING_CONFIGS, HAPTICS } from '@/design-system';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  variant?: 'default' | 'glass' | 'cosmic' | 'floating' | 'interactive';
  size?: 'sm' | 'md' | 'lg';
  pressable?: boolean;
  hoverable?: boolean;
  glowEffect?: boolean;
  breathingAnimation?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  hapticFeedback?: boolean;
  borderGlow?: boolean;
  elevation?: number;
}

export default function AnimatedCard({
  children,
  onPress,
  onLongPress,
  variant = 'default',
  size = 'md',
  pressable = false,
  hoverable = false,
  glowEffect = false,
  breathingAnimation = false,
  style,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  contentStyle,
  hapticFeedback = true,
  borderGlow = false,
  elevation = 1,
}: AnimatedCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const breatheScale = useSharedValue(1);
  const borderGlowIntensity = useSharedValue(0);

  // Haptic feedback helper
  const triggerHaptic = async (type: keyof typeof HAPTICS) => {
    if (hapticFeedback) {
      await HapticManager.trigger(type);
    }
  };

  // Initialize breathing animation
  React.useEffect(() => {
    if (breathingAnimation) {
      const animate = () => {
        breatheScale.value = withSpring(1.02, SPRING_CONFIGS.gentle, () => {
          breatheScale.value = withSpring(1, SPRING_CONFIGS.gentle, animate);
        });
      };
      animate();
    }
  }, [breathingAnimation]);

  // Initialize border glow animation
  React.useEffect(() => {
    if (borderGlow) {
      const animate = () => {
        borderGlowIntensity.value = withTiming(1, { duration: 2000 }, () => {
          borderGlowIntensity.value = withTiming(0, { duration: 2000 }, animate);
        });
      };
      animate();
    }
  }, [borderGlow]);

  // Press gesture handler
  const pressGesture = Gesture.Tap()
    .onBegin(() => {
      if (!pressable || !onPress) return;
      
      scale.value = withSpring(theme.animations.scale.press, SPRING_CONFIGS.snappy);
      translateY.value = withSpring(2, SPRING_CONFIGS.snappy);
      
      if (glowEffect) {
        glowIntensity.value = withTiming(1, TIMING_CONFIGS.fast);
      }
      
      runOnJS(triggerHaptic)('light');
    })
    .onEnd(() => {
      if (!pressable || !onPress) return;
      
      scale.value = withSpring(hoverable ? theme.animations.scale.hover : 1, SPRING_CONFIGS.bouncy);
      translateY.value = withSpring(0, SPRING_CONFIGS.bouncy);
      
      if (glowEffect) {
        glowIntensity.value = withTiming(0, TIMING_CONFIGS.normal);
      }
      
      runOnJS(triggerHaptic)('medium');
      runOnJS(onPress)();
    });

  // Long press gesture handler
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      if (!onLongPress) return;
      
      scale.value = withSpring(1.05, SPRING_CONFIGS.gentle);
      runOnJS(triggerHaptic)('heavy');
      runOnJS(onLongPress)();
    })
    .onEnd(() => {
      scale.value = withSpring(1, SPRING_CONFIGS.bouncy);
    });

  // Combined gesture
  const combinedGesture = onLongPress 
    ? Gesture.Exclusive(longPressGesture, pressGesture)
    : pressGesture;

  // Size configurations
  const sizeConfigs = {
    sm: {
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    md: {
      padding: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
    },
    lg: {
      padding: theme.spacing['2xl'],
      borderRadius: theme.borderRadius.xl,
    },
  };

  const currentSize = sizeConfigs[size];

  // Variant styles
  const variantStyles = {
    default: {
      backgroundColor: theme.colors.dark.surface,
      borderWidth: 1,
      borderColor: theme.colors.dark.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 * elevation },
      shadowOpacity: 0.1 * elevation,
      shadowRadius: 4 * elevation,
      elevation: 2 * elevation,
    },
    glass: {
      backgroundColor: theme.colors.glass.primary,
      borderWidth: 1,
      borderColor: theme.colors.glass.border,
      backdropFilter: 'blur(20px)',
      shadowColor: theme.colors.primary[500],
      shadowOffset: { width: 0, height: 2 * elevation },
      shadowOpacity: 0.1 * elevation,
      shadowRadius: 8 * elevation,
      elevation: 3 * elevation,
    },
    cosmic: {
      backgroundColor: 'transparent', // Will use gradient
      borderWidth: 0,
      shadowColor: theme.colors.primary[500],
      shadowOffset: { width: 0, height: 4 * elevation },
      shadowOpacity: 0.2 * elevation,
      shadowRadius: 12 * elevation,
      elevation: 4 * elevation,
    },
    floating: {
      backgroundColor: theme.colors.dark.surface,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 * elevation },
      shadowOpacity: 0.15 * elevation,
      shadowRadius: 16 * elevation,
      elevation: 6 * elevation,
    },
    interactive: {
      backgroundColor: theme.colors.dark.card,
      borderWidth: 1,
      borderColor: theme.colors.dark.border,
      shadowColor: theme.colors.primary[500],
      shadowOffset: { width: 0, height: 2 * elevation },
      shadowOpacity: 0.05 * elevation,
      shadowRadius: 6 * elevation,
      elevation: 2 * elevation,
    },
  };

  const currentVariant = variantStyles[variant];

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * breatheScale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => {
    if (!glowEffect) return {};
    
    return {
      shadowOpacity: (currentVariant.shadowOpacity || 0.1) * (1 + glowIntensity.value),
      shadowRadius: (currentVariant.shadowRadius || 4) * (1 + glowIntensity.value * 0.5),
      elevation: (currentVariant.elevation || 2) * (1 + glowIntensity.value),
    };
  });

  const borderGlowStyle = useAnimatedStyle(() => {
    if (!borderGlow) return {};
    
    return {
      borderColor: `rgba(139, 92, 246, ${0.2 + 0.3 * borderGlowIntensity.value})`,
      shadowColor: theme.colors.primary[500],
      shadowOpacity: 0.3 * borderGlowIntensity.value,
      shadowRadius: 8 * borderGlowIntensity.value,
    };
  });

  // Base card style
  const baseCardStyle = {
    padding: currentSize.padding,
    borderRadius: currentSize.borderRadius,
    ...currentVariant,
    ...style,
  };

  // Render cosmic variant with gradient background
  if (variant === 'cosmic') {
    if (pressable) {
      return (
        <GestureDetector gesture={combinedGesture}>
          <Animated.View style={[animatedStyle, glowStyle, borderGlowStyle]}>
            <LinearGradient
              colors={[
                'rgba(139, 92, 246, 0.1)',
                'rgba(59, 130, 246, 0.05)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={baseCardStyle}
            >
              {children}
            </LinearGradient>
          </Animated.View>
        </GestureDetector>
      );
    } else {
      return (
        <Animated.View style={[animatedStyle, glowStyle, borderGlowStyle]}>
          <LinearGradient
            colors={[
              'rgba(139, 92, 246, 0.1)',
              'rgba(59, 130, 246, 0.05)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={baseCardStyle}
          >
            {children}
          </LinearGradient>
        </Animated.View>
      );
    }
  }

  // Render other variants
  if (pressable) {
    return (
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={[baseCardStyle, animatedStyle, glowStyle, borderGlowStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    );
  } else {
    return (
      <Animated.View style={[baseCardStyle, animatedStyle, glowStyle, borderGlowStyle]}>
        {children}
      </Animated.View>
    );
  }
}