// Animation Utilities for Modern UI
import {
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  Extrapolation,
  runOnJS,
  SharedValue,
  AnimationCallback,
} from 'react-native-reanimated';
import { ANIMATIONS } from './tokens';

// Spring configurations
export const SPRING_CONFIGS = {
  gentle: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  bouncy: {
    damping: 15,
    stiffness: 400,
    mass: 0.6,
  },
  snappy: {
    damping: 25,
    stiffness: 500,
    mass: 0.5,
  },
  wobbly: {
    damping: 10,
    stiffness: 200,
    mass: 1,
  },
} as const;

// Timing configurations
export const TIMING_CONFIGS = {
  fast: { duration: ANIMATIONS.timing.fast },
  normal: { duration: ANIMATIONS.timing.normal },
  slow: { duration: ANIMATIONS.timing.slow },
  slower: { duration: ANIMATIONS.timing.slower },
} as const;

// Common animation factories
export const AnimationFactories = {
  // Fade animations
  fadeIn: (delay = 0) =>
    withDelay(delay, withTiming(1, TIMING_CONFIGS.normal)),
  
  fadeOut: (delay = 0) =>
    withDelay(delay, withTiming(0, TIMING_CONFIGS.fast)),
  
  // Scale animations
  scaleIn: (delay = 0) =>
    withDelay(delay, withSpring(1, SPRING_CONFIGS.bouncy)),
  
  scaleOut: (delay = 0) =>
    withDelay(delay, withTiming(0, TIMING_CONFIGS.fast)),
  
  // Slide animations
  slideInUp: (delay = 0) =>
    withDelay(delay, withSpring(0, SPRING_CONFIGS.gentle)),
  
  slideInDown: (delay = 0) =>
    withDelay(delay, withSpring(0, SPRING_CONFIGS.gentle)),
  
  slideInLeft: (delay = 0) =>
    withDelay(delay, withSpring(0, SPRING_CONFIGS.gentle)),
  
  slideInRight: (delay = 0) =>
    withDelay(delay, withSpring(0, SPRING_CONFIGS.gentle)),
  
  // Rotation animations
  rotate360: (duration = ANIMATIONS.timing.slower) =>
    withRepeat(withTiming(360, { duration }), -1, false),
  
  wobble: () =>
    withSequence(
      withTiming(-3, { duration: 100 }),
      withRepeat(withTiming(3, { duration: 100 }), 4, true),
      withTiming(0, { duration: 100 })
    ),
  
  // Breathing animation
  breathe: (scale = 1.05) =>
    withRepeat(
      withSequence(
        withTiming(scale, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    ),
  
  // Pulse animation
  pulse: (opacity = 0.5) =>
    withRepeat(
      withSequence(
        withTiming(opacity, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    ),
  
  // Button press animation
  buttonPress: {
    in: () => withTiming(ANIMATIONS.scale.press, TIMING_CONFIGS.fast),
    out: () => withTiming(1, TIMING_CONFIGS.fast),
  },
  
  // Loading shimmer
  shimmer: (width: number) =>
    withRepeat(
      withTiming(width, { duration: 1500 }),
      -1,
      false
    ),
  
  // Success celebration
  celebration: () =>
    withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(0.95, { duration: 200 }),
      withTiming(1, { duration: 200 })
    ),
  
  // Error shake
  shake: () =>
    withSequence(
      withTiming(-10, { duration: 50 }),
      withRepeat(withTiming(10, { duration: 100 }), 3, true),
      withTiming(0, { duration: 50 })
    ),
} as const;

// Interpolation helpers
export const InterpolationHelpers = {
  // Scale interpolation for gestures
  scaleInterpolation: (
    progress: SharedValue<number>,
    inputRange = [0, 1],
    outputRange = [1, 1.05]
  ) =>
    interpolate(
      progress.value,
      inputRange,
      outputRange,
      Extrapolation.CLAMP
    ),
  
  // Opacity interpolation
  opacityInterpolation: (
    progress: SharedValue<number>,
    inputRange = [0, 1],
    outputRange = [0, 1]
  ) =>
    interpolate(
      progress.value,
      inputRange,
      outputRange,
      Extrapolation.CLAMP
    ),
  
  // Translation interpolation
  translateInterpolation: (
    progress: SharedValue<number>,
    inputRange = [0, 1],
    outputRange = [0, 20]
  ) =>
    interpolate(
      progress.value,
      inputRange,
      outputRange,
      Extrapolation.CLAMP
    ),
  
  // Rotation interpolation
  rotateInterpolation: (
    progress: SharedValue<number>,
    inputRange = [0, 1],
    outputRange = [0, 360]
  ) =>
    interpolate(
      progress.value,
      inputRange,
      outputRange,
      Extrapolation.CLAMP
    ),
} as const;

// Stagger animation helper
export const createStaggerAnimation = (
  items: any[],
  animationFactory: (delay: number) => any,
  staggerDelay = 100
) => {
  return items.map((_, index) => animationFactory(index * staggerDelay));
};

// Chain animations with callbacks
export const chainAnimations = (
  animations: {
    value: SharedValue<number>;
    animation: any;
    callback?: () => void;
  }[]
) => {
  const runNext = (index: number) => {
    if (index >= animations.length) return;
    
    const { value, animation, callback } = animations[index];
    
    const nextAnimation = callback
      ? withTiming(animation, TIMING_CONFIGS.normal, () => {
          runOnJS(() => {
            callback();
            runNext(index + 1);
          })();
        })
      : withTiming(animation, TIMING_CONFIGS.normal, () => {
          runOnJS(() => runNext(index + 1))();
        });
    
    value.value = nextAnimation;
  };
  
  runNext(0);
};

// Gesture animation helpers
export const GestureAnimations = {
  // Pan gesture with spring back
  panWithSpringBack: (
    translateX: SharedValue<number>,
    translateY: SharedValue<number>
  ) => {
    translateX.value = withSpring(0, SPRING_CONFIGS.bouncy);
    translateY.value = withSpring(0, SPRING_CONFIGS.bouncy);
  },
  
  // Scale on press
  pressScale: (scale: SharedValue<number>, isPressed: boolean) => {
    scale.value = withSpring(
      isPressed ? ANIMATIONS.scale.press : 1,
      SPRING_CONFIGS.snappy
    );
  },
  
  // Swipe threshold animation
  swipeThreshold: (
    progress: SharedValue<number>,
    threshold: number,
    onThresholdReached?: () => void
  ) => {
    if (Math.abs(progress.value) > threshold && onThresholdReached) {
      runOnJS(onThresholdReached)();
    }
  },
} as const;

// Loading animations
export const LoadingAnimations = {
  // Spinner rotation
  spinner: () => AnimationFactories.rotate360(1000),
  
  // Dots animation
  dots: (delay = 0) =>
    withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.3, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      )
    ),
  
  // Progress bar
  progressBar: (progress: number, duration = 300) =>
    withTiming(progress, { duration }),
  
  // Skeleton shimmer
  skeleton: (width: number) =>
    withRepeat(
      withSequence(
        withTiming(-width, { duration: 0 }),
        withTiming(width, { duration: 1500 })
      ),
      -1,
      false
    ),
} as const;

// Layout transition animations
export const LayoutAnimations = {
  // Smooth height change
  expandHeight: (height: number) =>
    withSpring(height, SPRING_CONFIGS.gentle),
  
  // Smooth width change
  expandWidth: (width: number) =>
    withSpring(width, SPRING_CONFIGS.gentle),
  
  // Card flip
  cardFlip: (isFlipped: boolean) =>
    withTiming(isFlipped ? 180 : 0, { duration: 600 }),
  
  // Accordion expand/collapse
  accordion: (isExpanded: boolean, maxHeight: number) =>
    withSpring(isExpanded ? maxHeight : 0, SPRING_CONFIGS.gentle),
} as const;