// AnimatedButton - Premium button with micro-interactions
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
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

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'cosmic' | 'aurora';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  glowEffect?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  hapticFeedback = true,
  glowEffect = false,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const glowIntensity = useSharedValue(0);

  // Haptic feedback helper
  const triggerHaptic = async (type: keyof typeof HAPTICS) => {
    if (hapticFeedback && !disabled) {
      await HapticManager.trigger(type);
    }
  };

  // Press gesture handler
  const pressGesture = Gesture.Tap()
    .onBegin(() => {
      if (disabled || loading) return;
      
      scale.value = withSpring(theme.animations.scale.press, SPRING_CONFIGS.snappy);
      opacity.value = withTiming(0.8, TIMING_CONFIGS.fast);
      
      if (glowEffect) {
        glowIntensity.value = withTiming(1, TIMING_CONFIGS.fast);
      }
      
      runOnJS(triggerHaptic)('light');
    })
    .onEnd(() => {
      if (disabled || loading) return;
      
      scale.value = withSpring(1, SPRING_CONFIGS.bouncy);
      opacity.value = withTiming(1, TIMING_CONFIGS.normal);
      
      if (glowEffect) {
        glowIntensity.value = withTiming(0, TIMING_CONFIGS.normal);
      }
      
      runOnJS(triggerHaptic)('medium');
      runOnJS(onPress)();
    });

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => {
    if (!glowEffect) return {};
    
    return {
      shadowOpacity: 0.3 * glowIntensity.value,
      shadowRadius: 8 * (1 + glowIntensity.value),
      elevation: 5 * (1 + glowIntensity.value),
    };
  });

  // Style configurations
  const sizeStyles = {
    sm: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      fontSize: theme.typography.fontSizes.sm,
      borderRadius: theme.borderRadius.sm,
      minWidth: 80,
      height: 32,
    },
    md: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.fontSizes.md,
      borderRadius: theme.borderRadius.md,
      minWidth: 120,
      height: 44,
    },
    lg: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      fontSize: theme.typography.fontSizes.lg,
      borderRadius: theme.borderRadius.lg,
      minWidth: 160,
      height: 56,
    },
  };

  const getVariantStyles = () => {
    const variants = {
      primary: {
        backgroundColor: theme.colors.primary[500],
        borderWidth: 0,
        borderColor: 'transparent', // Add borderColor to all variants
        textColor: theme.colors.dark.text.primary,
        shadowColor: theme.colors.primary[500],
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary[500],
        textColor: theme.colors.primary[500],
        shadowColor: theme.colors.primary[500],
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: 'transparent', // Add borderColor
        textColor: theme.colors.dark.text.secondary,
        shadowColor: 'transparent',
      },
      cosmic: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary[400],
        textColor: theme.colors.dark.text.primary,
        shadowColor: theme.colors.primary[400],
        gradient: theme.colors.gradients.cosmic,
      },
      aurora: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.aurora[400],
        textColor: theme.colors.dark.text.primary,
        shadowColor: theme.colors.aurora[400],
        gradient: theme.colors.gradients.aurora,
      },
    };

    return variants[variant];
  };

  const currentSize = sizeStyles[size];
  const currentVariant = getVariantStyles();

  const buttonStyle = {
    backgroundColor: currentVariant.backgroundColor,
    borderWidth: currentVariant.borderWidth,
    borderColor: currentVariant.borderColor,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: currentSize.paddingHorizontal,
    paddingVertical: currentSize.paddingVertical,
    minWidth: currentSize.minWidth,
    height: currentSize.height,
    width: fullWidth ? '100%' as const : undefined, // Fix width type
    shadowColor: currentVariant.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    ...style,
  };

  const buttonTextStyle = {
    fontSize: currentSize.fontSize,
    fontWeight: theme.typography.fontWeights.semibold,
    color: currentVariant.textColor,
    marginLeft: icon && iconPosition === 'left' ? theme.spacing.sm : 0,
    marginRight: icon && iconPosition === 'right' ? theme.spacing.sm : 0,
    ...textStyle,
  };

  const renderContent = () => (
    <>
      {icon && iconPosition === 'left' && icon}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={currentVariant.textColor}
          style={{ marginRight: title ? theme.spacing.sm : 0 }}
        />
      ) : null}
      {title ? <Text style={buttonTextStyle}>{title}</Text> : null}
      {icon && iconPosition === 'right' && icon}
    </>
  );

  if (variant === 'cosmic') {
    return (
      <GestureDetector gesture={pressGesture}>
        <Animated.View style={[animatedStyle, glowStyle]}>
          <LinearGradient
            colors={theme.colors.gradients.cosmic}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={buttonStyle}
          >
            {renderContent()}
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
    );
  }

  return (
    <GestureDetector gesture={pressGesture}>
      <AnimatedTouchable
        style={[buttonStyle, animatedStyle, glowStyle]}
        disabled={disabled || loading}
        activeOpacity={1} // We handle opacity via animations
      >
        {renderContent()}
      </AnimatedTouchable>
    </GestureDetector>
  );
}