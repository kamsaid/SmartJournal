// Gesture Utilities - Advanced gesture handling with haptic feedback
import { Gesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  useSharedValue,
  withSpring,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { HapticManager } from '@/utils/haptics';
import { SPRING_CONFIGS, TIMING_CONFIGS, HAPTICS } from '@/design-system';

// Haptic feedback helper
export const triggerHaptic = async (type: keyof typeof HAPTICS) => {
  await HapticManager.trigger(type);
};

// Advanced gesture creators
export class GestureFactory {
  // Enhanced tap gesture with haptic feedback and animations
  static createTapGesture({
    onTap,
    onPressIn,
    onPressOut,
    hapticType = 'impactMedium',
    enableHaptic = true,
    scale,
    opacity,
  }: {
    onTap?: () => void;
    onPressIn?: () => void;
    onPressOut?: () => void;
    hapticType?: keyof typeof HAPTICS;
    enableHaptic?: boolean;
    scale?: SharedValue<number>;
    opacity?: SharedValue<number>;
  }) {
    return Gesture.Tap()
      .onBegin(() => {
        if (scale) {
          scale.value = withSpring(0.95, SPRING_CONFIGS.snappy);
        }
        if (opacity) {
          opacity.value = withTiming(0.8, TIMING_CONFIGS.fast);
        }
        if (onPressIn) {
          runOnJS(onPressIn)();
        }
        if (enableHaptic) {
          runOnJS(triggerHaptic)(hapticType);
        }
      })
      .onEnd(() => {
        if (scale) {
          scale.value = withSpring(1, SPRING_CONFIGS.bouncy);
        }
        if (opacity) {
          opacity.value = withTiming(1, TIMING_CONFIGS.normal);
        }
        if (onPressOut) {
          runOnJS(onPressOut)();
        }
        if (onTap) {
          runOnJS(onTap)();
        }
      });
  }

  // Long press gesture with progressive haptic feedback
  static createLongPressGesture({
    onLongPress,
    onStart,
    onEnd,
    minDuration = 500,
    hapticType = 'impactHeavy',
    enableHaptic = true,
    scale,
  }: {
    onLongPress?: () => void;
    onStart?: () => void;
    onEnd?: () => void;
    minDuration?: number;
    hapticType?: keyof typeof HAPTICS;
    enableHaptic?: boolean;
    scale?: SharedValue<number>;
  }) {
    return Gesture.LongPress()
      .minDuration(minDuration)
      .onStart(() => {
        if (scale) {
          scale.value = withSpring(1.05, SPRING_CONFIGS.gentle);
        }
        if (onStart) {
          runOnJS(onStart)();
        }
        if (enableHaptic) {
          runOnJS(triggerHaptic)(hapticType);
        }
        if (onLongPress) {
          runOnJS(onLongPress)();
        }
      })
      .onEnd(() => {
        if (scale) {
          scale.value = withSpring(1, SPRING_CONFIGS.bouncy);
        }
        if (onEnd) {
          runOnJS(onEnd)();
        }
      });
  }

  // Pan gesture with spring back and threshold detection
  static createPanGesture({
    onPan,
    onEnd,
    threshold = 100,
    onThresholdReached,
    hapticOnThreshold = true,
    translateX,
    translateY,
  }: {
    onPan?: (x: number, y: number) => void;
    onEnd?: (x: number, y: number, velocityX: number, velocityY: number) => void;
    threshold?: number;
    onThresholdReached?: () => void;
    hapticOnThreshold?: boolean;
    translateX?: SharedValue<number>;
    translateY?: SharedValue<number>;
  }) {
    let thresholdReached = false;

    return Gesture.Pan()
      .onUpdate((event) => {
        if (translateX) {
          translateX.value = event.translationX;
        }
        if (translateY) {
          translateY.value = event.translationY;
        }
        
        if (onPan) {
          runOnJS(onPan)(event.translationX, event.translationY);
        }

        // Check threshold
        const distance = Math.sqrt(
          event.translationX ** 2 + event.translationY ** 2
        );
        
        if (distance > threshold && !thresholdReached) {
          thresholdReached = true;
          if (hapticOnThreshold) {
            runOnJS(triggerHaptic)('impactMedium');
          }
          if (onThresholdReached) {
            runOnJS(onThresholdReached)();
          }
        }
      })
      .onEnd((event) => {
        thresholdReached = false;
        
        // Spring back animation
        if (translateX) {
          translateX.value = withSpring(0, SPRING_CONFIGS.bouncy);
        }
        if (translateY) {
          translateY.value = withSpring(0, SPRING_CONFIGS.bouncy);
        }
        
        if (onEnd) {
          runOnJS(onEnd)(
            event.translationX,
            event.translationY,
            event.velocityX,
            event.velocityY
          );
        }
      });
  }

  // Swipe gesture with direction detection
  static createSwipeGesture({
    direction = 'horizontal',
    threshold = 50,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    hapticOnSwipe = true,
  }: {
    direction?: 'horizontal' | 'vertical' | 'both';
    threshold?: number;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    hapticOnSwipe?: boolean;
  }) {
    return Gesture.Pan()
      .onEnd((event) => {
        const { translationX, translationY, velocityX, velocityY } = event;
        
        // Determine if it's a swipe based on velocity and distance
        const isHorizontalSwipe = Math.abs(velocityX) > Math.abs(velocityY) && 
                                  Math.abs(translationX) > threshold;
        const isVerticalSwipe = Math.abs(velocityY) > Math.abs(velocityX) && 
                               Math.abs(translationY) > threshold;

        if (direction === 'horizontal' || direction === 'both') {
          if (isHorizontalSwipe) {
            if (hapticOnSwipe) {
              runOnJS(triggerHaptic)('impactLight');
            }
            
            if (translationX > 0 && onSwipeRight) {
              runOnJS(onSwipeRight)();
            } else if (translationX < 0 && onSwipeLeft) {
              runOnJS(onSwipeLeft)();
            }
          }
        }

        if (direction === 'vertical' || direction === 'both') {
          if (isVerticalSwipe) {
            if (hapticOnSwipe) {
              runOnJS(triggerHaptic)('impactLight');
            }
            
            if (translationY > 0 && onSwipeDown) {
              runOnJS(onSwipeDown)();
            } else if (translationY < 0 && onSwipeUp) {
              runOnJS(onSwipeUp)();
            }
          }
        }
      });
  }

  // Pinch gesture for scaling
  static createPinchGesture({
    onPinch,
    onEnd,
    minScale = 0.5,
    maxScale = 3,
    hapticOnScale = true,
    scale,
  }: {
    onPinch?: (scale: number) => void;
    onEnd?: (scale: number) => void;
    minScale?: number;
    maxScale?: number;
    hapticOnScale?: boolean;
    scale?: SharedValue<number>;
  }) {
    let initialScale = 1;
    let hasTriggeredHaptic = false;

    return Gesture.Pinch()
      .onBegin(() => {
        initialScale = scale?.value || 1;
        hasTriggeredHaptic = false;
      })
      .onUpdate((event) => {
        const newScale = Math.min(
          Math.max(initialScale * event.scale, minScale),
          maxScale
        );
        
        if (scale) {
          scale.value = newScale;
        }
        
        if (onPinch) {
          runOnJS(onPinch)(newScale);
        }

        // Haptic feedback at scale thresholds
        if (hapticOnScale && !hasTriggeredHaptic) {
          if (event.scale > 1.2 || event.scale < 0.8) {
            hasTriggeredHaptic = true;
            runOnJS(triggerHaptic)('impactLight');
          }
        }
      })
      .onEnd(() => {
        const finalScale = scale?.value || 1;
        
        if (onEnd) {
          runOnJS(onEnd)(finalScale);
        }

        // Snap back to bounds if needed
        if (scale) {
          if (finalScale < 1) {
            scale.value = withSpring(1, SPRING_CONFIGS.bouncy);
          } else if (finalScale > 2) {
            scale.value = withSpring(2, SPRING_CONFIGS.bouncy);
          }
        }
      });
  }

  // Double tap gesture
  static createDoubleTapGesture({
    onDoubleTap,
    maxDelay = 300,
    hapticType = 'impactMedium',
    enableHaptic = true,
    scale,
  }: {
    onDoubleTap?: () => void;
    maxDelay?: number;
    hapticType?: keyof typeof HAPTICS;
    enableHaptic?: boolean;  
    scale?: SharedValue<number>;
  }) {
    return Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(maxDelay)
      .onEnd(() => {
        if (scale) {
          scale.value = withSpring(1.1, SPRING_CONFIGS.bouncy, () => {
            scale.value = withSpring(1, SPRING_CONFIGS.gentle);
          });
        }
        
        if (enableHaptic) {
          runOnJS(triggerHaptic)(hapticType);
        }
        
        if (onDoubleTap) {
          runOnJS(onDoubleTap)();
        }
      });
  }
}

// Pull-to-refresh gesture
export const createPullToRefreshGesture = ({
  onRefresh,
  threshold = 100,
  translateY,
  isRefreshing,
}: {
  onRefresh: () => void;
  threshold?: number;
  translateY: SharedValue<number>;
  isRefreshing: SharedValue<boolean>;
}) => {
  return Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0 && !isRefreshing.value) {
        translateY.value = event.translationY * 0.5; // Damping effect
      }
    })
    .onEnd((event) => {
      if (event.translationY > threshold && !isRefreshing.value) {
        isRefreshing.value = true;
        runOnJS(triggerHaptic)('impactMedium');
        runOnJS(onRefresh)();
      } else {
        translateY.value = withSpring(0, SPRING_CONFIGS.bouncy);
      }
    });
};

// Swipe-to-dismiss gesture
export const createSwipeToDismissGesture = ({
  onDismiss,
  threshold = 150,
  translateX,
  opacity,
}: {
  onDismiss: () => void;
  threshold?: number;
  translateX: SharedValue<number>;
  opacity?: SharedValue<number>;
}) => {
  return Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      if (opacity) {
        opacity.value = Math.max(0.3, 1 - Math.abs(event.translationX) / 200);
      }
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > threshold) {
        if (opacity) {
          opacity.value = withTiming(0, TIMING_CONFIGS.fast);
        }
        translateX.value = withTiming(
          event.translationX > 0 ? 500 : -500,
          TIMING_CONFIGS.fast,
          () => {
            runOnJS(onDismiss)();
          }
        );
        runOnJS(triggerHaptic)('impactLight');
      } else {
        translateX.value = withSpring(0, SPRING_CONFIGS.bouncy);
        if (opacity) {
          opacity.value = withTiming(1, TIMING_CONFIGS.normal);
        }
      }
    });
};