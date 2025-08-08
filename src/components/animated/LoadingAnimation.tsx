// LoadingAnimation - Premium loading states with cosmic animations
import React, { useEffect } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/design-system';

interface LoadingAnimationProps {
  variant?: 'spinner' | 'dots' | 'pulse' | 'cosmic' | 'shimmer' | 'breathe';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  style?: ViewStyle;
}

export default function LoadingAnimation({
  variant = 'cosmic',
  size = 'md',
  color = theme.colors.primary[500],
  text,
  style,
}: LoadingAnimationProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const shimmerX = useSharedValue(-100);

  // Size configurations
  const sizeConfigs = {
    sm: { width: 24, height: 24, dotSize: 6, fontSize: theme.typography.fontSizes.sm },
    md: { width: 40, height: 40, dotSize: 8, fontSize: theme.typography.fontSizes.md },
    lg: { width: 60, height: 60, dotSize: 12, fontSize: theme.typography.fontSizes.lg },
  };

  const currentSize = sizeConfigs[size];

  // Start animations
  useEffect(() => {
    switch (variant) {
      case 'spinner':
        rotation.value = withRepeat(
          withTiming(360, { duration: 1000, easing: Easing.linear }),
          -1,
          false
        );
        break;

      case 'pulse':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 600 }),
            withTiming(1, { duration: 600 })
          ),
          -1,
          true
        );
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.5, { duration: 600 }),
            withTiming(1, { duration: 600 })
          ),
          -1,
          true
        );
        break;

      case 'cosmic':
        rotation.value = withRepeat(
          withTiming(360, { duration: 2000, easing: Easing.linear }),
          -1,
          false
        );
        scale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          true
        );
        break;

      case 'shimmer':
        shimmerX.value = withRepeat(
          withTiming(200, { duration: 1500, easing: Easing.linear }),
          -1,
          false
        );
        break;

      case 'breathe':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        break;
    }
  }, [variant]);

  // Animated styles
  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  // Render different variants
  const renderSpinner = () => (
    <Animated.View style={[spinnerStyle, { width: currentSize.width, height: currentSize.height }]}>
      <View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: currentSize.width / 2,
          borderWidth: 3,
          borderColor: 'transparent',
          borderTopColor: color,
          borderRightColor: `${color}80`,
        }}
      />
    </Animated.View>
  );

  const renderDots = () => {
    // Create animation values outside of map
    const dotOpacities = React.useMemo(() => 
      [0, 1, 2].map(() => useSharedValue(0.3)), 
      []
    );
    
    const dotStyles = React.useMemo(() => 
      dotOpacities.map((dotOpacity) => 
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useAnimatedStyle(() => ({
          opacity: dotOpacity.value,
        }))
      ), 
      [dotOpacities]
    );
    
    React.useEffect(() => {
      dotOpacities.forEach((dotOpacity, index) => {
        dotOpacity.value = withRepeat(
          withDelay(
            index * 200,
            withSequence(
              withTiming(1, { duration: 400 }),
              withTiming(0.3, { duration: 400 })
            )
          ),
          -1,
          false
        );
      });
    }, [dotOpacities]);

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              dotStyles[index],
              {
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.colors.primary[500],
                marginHorizontal: 4,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderPulse = () => (
    <Animated.View
      style={[
        spinnerStyle,
        {
          width: currentSize.width,
          height: currentSize.height,
          borderRadius: currentSize.width / 2,
          backgroundColor: color,
        },
      ]}
    />
  );

  const renderCosmic = () => (
    <Animated.View style={[spinnerStyle, { width: currentSize.width, height: currentSize.height }]}>
      <LinearGradient
        colors={theme.colors.gradients.cosmic}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: currentSize.width / 2,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: '70%',
            height: '70%',
            borderRadius: (currentSize.width * 0.7) / 2,
            backgroundColor: theme.colors.dark.bg,
          }}
        />
      </LinearGradient>
    </Animated.View>
  );

  const renderShimmer = () => (
    <View
      style={{
        width: 100,
        height: 20,
        backgroundColor: theme.colors.dark.border,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          shimmerStyle,
          {
            width: 100,
            height: '100%',
            backgroundColor: `${color}40`,
          },
        ]}
      />
    </View>
  );

  const renderBreathe = () => (
    <Animated.View
      style={[
        spinnerStyle,
        {
          width: currentSize.width,
          height: currentSize.height,
          borderRadius: currentSize.width / 2,
          backgroundColor: `${color}20`,
          borderWidth: 2,
          borderColor: color,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      <View
        style={{
          width: '60%',
          height: '60%',
          borderRadius: (currentSize.width * 0.6) / 2,
          backgroundColor: color,
        }}
      />
    </Animated.View>
  );

  const renderAnimation = () => {
    switch (variant) {
      case 'spinner':
        return renderSpinner();
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'cosmic':
        return renderCosmic();
      case 'shimmer':
        return renderShimmer();
      case 'breathe':
        return renderBreathe();
      default:
        return renderCosmic();
    }
  };

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {renderAnimation()}
      {text && (
        <Text
          style={{
            marginTop: theme.spacing.md,
            fontSize: currentSize.fontSize,
            color: theme.colors.dark.text.secondary,
            fontWeight: theme.typography.fontWeights.medium,
            textAlign: 'center',
          }}
        >
          {text}
        </Text>
      )}
    </View>
  );
}

// Skeleton loader component
interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = 100,
  height = 20,
  borderRadius = theme.borderRadius.sm,
  style,
}: SkeletonLoaderProps) {
  const shimmerX = useSharedValue(-200);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(200, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  return (
    <View
      style={[
        {
          width: width,
          height,
          backgroundColor: theme.colors.dark.border,
          borderRadius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          shimmerStyle,
          {
            width: '50%',
            height: '100%',
            backgroundColor: `${theme.colors.primary[500]}20`,
          },
        ]}
      />
    </View>
  );
}