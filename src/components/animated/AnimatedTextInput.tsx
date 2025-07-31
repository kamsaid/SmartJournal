// AnimatedTextInput - Premium input with floating labels and micro-interactions
import React, { useState, useRef, useEffect } from 'react';
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticManager } from '@/utils/haptics';
import { theme, SPRING_CONFIGS, TIMING_CONFIGS } from '@/design-system';

interface AnimatedTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  success?: boolean;
  variant?: 'default' | 'floating' | 'glass' | 'cosmic';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  characterCount?: boolean;
  maxLength?: number;
  hapticFeedback?: boolean;
  glowOnFocus?: boolean;
}

const AnimatedTextInputComponent = Animated.createAnimatedComponent(TextInput);

export default function AnimatedTextInput({
  label,
  error,
  success = false,
  variant = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  characterCount = false,
  maxLength,
  hapticFeedback = true,
  glowOnFocus = true,
  value = '',
  onFocus,
  onBlur,
  onChangeText,
  ...textInputProps
}: AnimatedTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef<TextInput>(null);

  // Animated values
  const focusProgress = useSharedValue(0);
  const labelPosition = useSharedValue(0);
  const borderColor = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  // Update internal value when prop value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Haptic feedback helper
  const triggerHaptic = async () => {
    if (hapticFeedback) {
      await HapticManager.trigger('light');
    }
  };

  // Handle focus
  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, TIMING_CONFIGS.normal);
    borderColor.value = withTiming(1, TIMING_CONFIGS.normal);
    
    if (glowOnFocus) {
      glowIntensity.value = withTiming(1, TIMING_CONFIGS.normal);
    }
    
    if (label && variant === 'floating') {
      labelPosition.value = withSpring(1, SPRING_CONFIGS.gentle);
    }
    
    triggerHaptic();
    onFocus?.(e);
  };

  // Handle blur
  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, TIMING_CONFIGS.normal);
    borderColor.value = withTiming(0, TIMING_CONFIGS.normal);
    glowIntensity.value = withTiming(0, TIMING_CONFIGS.normal);
    
    if (label && variant === 'floating' && !internalValue) {
      labelPosition.value = withSpring(0, SPRING_CONFIGS.gentle);
    }
    
    onBlur?.(e);
  };

  // Handle text change
  const handleChangeText = (text: string) => {
    setInternalValue(text);
    
    if (label && variant === 'floating') {
      labelPosition.value = withSpring(text ? 1 : (isFocused ? 1 : 0), SPRING_CONFIGS.gentle);
    }
    
    onChangeText?.(text);
  };

  // Initialize label position for floating variant
  useEffect(() => {
    if (label && variant === 'floating') {
      labelPosition.value = internalValue || isFocused ? 1 : 0;
    }
  }, []);

  // Size configurations
  const sizeConfigs = {
    sm: {
      height: 40,
      paddingHorizontal: theme.spacing.md,
      fontSize: theme.typography.fontSizes.sm,
      borderRadius: theme.borderRadius.sm,
    },
    md: {
      height: 48,
      paddingHorizontal: theme.spacing.lg,
      fontSize: theme.typography.fontSizes.md,
      borderRadius: theme.borderRadius.md,
    },
    lg: {
      height: 56,
      paddingHorizontal: theme.spacing.xl,
      fontSize: theme.typography.fontSizes.lg,
      borderRadius: theme.borderRadius.lg,
    },
  };

  const currentSize = sizeConfigs[size];

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const borderColorValue = error
      ? theme.colors.error
      : success
      ? theme.colors.success
      : interpolateColor(
          borderColor.value,
          [0, 1],
          [theme.colors.dark.border, theme.colors.primary[500]]
        );

    const glowOpacity = glowOnFocus ? 0.3 * glowIntensity.value : 0;
    const glowRadius = 8 * glowIntensity.value;

    return {
      borderColor: borderColorValue,
      shadowColor: theme.colors.primary[500],
      shadowOpacity: glowOpacity,
      shadowRadius: glowRadius,
      elevation: 3 * glowIntensity.value,
    };
  });

  const floatingLabelStyle = useAnimatedStyle(() => {
    if (variant !== 'floating' || !label) return {};

    const translateY = interpolate(labelPosition.value, [0, 1], [0, -28]);
    const scale = interpolate(labelPosition.value, [0, 1], [1, 0.8]);
    const opacity = interpolate(labelPosition.value, [0, 1], [0.7, 1]);

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  // Base container style
  const baseContainerStyle = {
    minHeight: currentSize.height,
    borderWidth: 1,
    borderRadius: currentSize.borderRadius,
    backgroundColor: variant === 'glass' 
      ? 'rgba(255, 255, 255, 0.05)'
      : theme.colors.dark.card,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: currentSize.paddingHorizontal,
    position: 'relative' as const,
    ...containerStyle,
  };

  // Input style
  const baseInputStyle = {
    flex: 1,
    fontSize: currentSize.fontSize,
    color: theme.colors.dark.text.primary,
    fontWeight: theme.typography.fontWeights.normal,
    paddingVertical: variant === 'floating' ? theme.spacing.md : 0,
    ...inputStyle,
  };

  // Label style for floating variant
  const baseLabelStyle = {
    position: 'absolute' as const,
    left: currentSize.paddingHorizontal,
    fontSize: theme.typography.fontSizes.md,
    color: error 
      ? theme.colors.error 
      : isFocused 
      ? theme.colors.primary[500] 
      : theme.colors.dark.text.tertiary,
    fontWeight: theme.typography.fontWeights.medium,
    backgroundColor: theme.colors.dark.card,
    paddingHorizontal: theme.spacing.xs,
    ...labelStyle,
  };

  // Render cosmic variant with gradient border
  if (variant === 'cosmic') {
    return (
      <View style={{ position: 'relative' }}>
        <LinearGradient
          colors={theme.colors.gradients.cosmic}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: currentSize.borderRadius + 1,
            padding: 1,
          }}
        >
          <Animated.View style={[baseContainerStyle, containerAnimatedStyle, { borderWidth: 0 }]}>
            {leftIcon && <View style={{ marginRight: theme.spacing.sm }}>{leftIcon}</View>}
            <AnimatedTextInputComponent
              ref={inputRef}
              style={baseInputStyle}
              value={internalValue}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChangeText={handleChangeText}
              placeholderTextColor={theme.colors.dark.text.tertiary}
              {...textInputProps}
            />
            {rightIcon && <View style={{ marginLeft: theme.spacing.sm }}>{rightIcon}</View>}
          </Animated.View>
        </LinearGradient>
        
        {/* Character count */}
        {characterCount && maxLength && (
          <Text style={{
            position: 'absolute',
            right: theme.spacing.sm,
            bottom: -theme.spacing.lg,
            fontSize: theme.typography.fontSizes.xs,
            color: theme.colors.dark.text.tertiary,
          }}>
            {internalValue.length}/{maxLength}
          </Text>
        )}
        
        {/* Error message */}
        {error && (
          <Text style={{
            marginTop: theme.spacing.xs,
            fontSize: theme.typography.fontSizes.sm,
            color: theme.colors.error,
            fontWeight: theme.typography.fontWeights.medium,
          }}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      {/* Static label for non-floating variants */}
      {label && variant !== 'floating' && (
        <Text style={{
          fontSize: theme.typography.fontSizes.sm,
          color: theme.colors.dark.text.secondary,
          fontWeight: theme.typography.fontWeights.medium,
          marginBottom: theme.spacing.xs,
        }}>
          {label}
        </Text>
      )}
      
      <Animated.View style={[baseContainerStyle, containerAnimatedStyle]}>
        {leftIcon && <View style={{ marginRight: theme.spacing.sm }}>{leftIcon}</View>}
        <AnimatedTextInputComponent
          ref={inputRef}
          style={baseInputStyle}
          value={internalValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          placeholderTextColor={theme.colors.dark.text.tertiary}
          {...textInputProps}
        />
        {rightIcon && <View style={{ marginLeft: theme.spacing.sm }}>{rightIcon}</View>}
      </Animated.View>
      
      {/* Floating label */}
      {label && variant === 'floating' && (
        <Animated.Text style={[baseLabelStyle, floatingLabelStyle]}>
          {label}
        </Animated.Text>
      )}
      
      {/* Character count */}
      {characterCount && maxLength && (
        <Text style={{
          alignSelf: 'flex-end',
          marginTop: theme.spacing.xs,
          fontSize: theme.typography.fontSizes.xs,
          color: internalValue.length >= maxLength 
            ? theme.colors.error 
            : theme.colors.dark.text.tertiary,
        }}>
          {internalValue.length}/{maxLength}
        </Text>
      )}
      
      {/* Error message */}
      {error && (
        <Text style={{
          marginTop: theme.spacing.xs,
          fontSize: theme.typography.fontSizes.sm,
          color: theme.colors.error,
          fontWeight: theme.typography.fontWeights.medium,
        }}>
          {error}
        </Text>
      )}
    </View>
  );
}