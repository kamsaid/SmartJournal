// AnimatedTabBar - Premium floating tab bar with micro-interactions
import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticManager } from '@/utils/haptics';
import { theme, SPRING_CONFIGS } from '@/design-system';

interface TabItem {
  key: string;
  title: string;
  icon: string;
  isActive: boolean;
}

interface AnimatedTabBarProps {
  tabs: TabItem[];
  onTabPress: (key: string) => void;
  activeTabKey: string;
}

const { width: screenWidth } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 80;
const TAB_BAR_MARGIN = 20;
const TAB_WIDTH = (screenWidth - (TAB_BAR_MARGIN * 2)) / 5;

export default function AnimatedTabBar({
  tabs,
  onTabPress,
  activeTabKey,
}: AnimatedTabBarProps) {
  // Early return if tabs is undefined or empty to prevent errors
  if (!tabs || !Array.isArray(tabs) || tabs.length === 0) {
    return null;
  }

  const insets = useSafeAreaInsets();
  
  // Animation values - all at top level
  const tabBarY = useSharedValue(100); // Start hidden
  const activeIndicatorX = useSharedValue(0);
  const activeIndicatorScale = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  // Create animation values for each tab at the top level
  // Using a fixed number of tabs to avoid hook order changes
  const tab0Scale = useSharedValue(1);
  const tab1Scale = useSharedValue(1);
  const tab2Scale = useSharedValue(1);
  const tab3Scale = useSharedValue(1);
  const tab4Scale = useSharedValue(1);
  
  const tab0Opacity = useSharedValue(0.6);
  const tab1Opacity = useSharedValue(0.6);
  const tab2Opacity = useSharedValue(0.6);
  const tab3Opacity = useSharedValue(0.6);
  const tab4Opacity = useSharedValue(0.6);

  // Create arrays of shared values for easier access
  const tabScales = useMemo(() => [
    tab0Scale, tab1Scale, tab2Scale, tab3Scale, tab4Scale
  ], [tab0Scale, tab1Scale, tab2Scale, tab3Scale, tab4Scale]);

  const tabOpacities = useMemo(() => [
    tab0Opacity, tab1Opacity, tab2Opacity, tab3Opacity, tab4Opacity
  ], [tab0Opacity, tab1Opacity, tab2Opacity, tab3Opacity, tab4Opacity]);

  // Create animated styles for each tab at the top level
  const tab0AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tab0Scale.value }],
    opacity: tab0Opacity.value,
  }));

  const tab1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tab1Scale.value }],
    opacity: tab1Opacity.value,
  }));

  const tab2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tab2Scale.value }],
    opacity: tab2Opacity.value,
  }));

  const tab3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tab3Scale.value }],
    opacity: tab3Opacity.value,
  }));

  const tab4AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tab4Scale.value }],
    opacity: tab4Opacity.value,
  }));

  // Array of animated styles for easier access
  const tabAnimatedStyles = useMemo(() => [
    tab0AnimatedStyle, tab1AnimatedStyle, tab2AnimatedStyle, tab3AnimatedStyle, tab4AnimatedStyle
  ], [tab0AnimatedStyle, tab1AnimatedStyle, tab2AnimatedStyle, tab3AnimatedStyle, tab4AnimatedStyle]);

  // Initialize animations
  useEffect(() => {
    // Slide up tab bar
    tabBarY.value = withSpring(0, SPRING_CONFIGS.bouncy);
    
    // Initialize active indicator
    const activeIndex = tabs.findIndex(tab => tab.key === activeTabKey);
    if (activeIndex !== -1) {
      activeIndicatorX.value = activeIndex * TAB_WIDTH;
      activeIndicatorScale.value = withSpring(1, SPRING_CONFIGS.gentle);
      if (tabOpacities[activeIndex]) {
        tabOpacities[activeIndex].value = withTiming(1);
      }
    }
  }, []);

  // Update active tab animations
  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.key === activeTabKey);
    
    if (activeIndex !== -1) {
      // Move active indicator
      activeIndicatorX.value = withSpring(
        activeIndex * TAB_WIDTH,
        SPRING_CONFIGS.gentle
      );
      
      // Scale and opacity animations for all tabs
      tabs.forEach((_, index) => {
        if (index < tabScales.length && index < tabOpacities.length) {
          if (index === activeIndex) {
            tabScales[index].value = withSpring(1.1, SPRING_CONFIGS.bouncy);
            tabOpacities[index].value = withTiming(1);
          } else {
            tabScales[index].value = withSpring(1, SPRING_CONFIGS.gentle);
            tabOpacities[index].value = withTiming(0.6);
          }
        }
      });
      
      // Glow effect
      glowIntensity.value = withTiming(1, { duration: 200 }, () => {
        glowIntensity.value = withTiming(0, { duration: 300 });
      });
    }
  }, [activeTabKey, tabs]);

  // Haptic feedback
  const triggerHaptic = async () => {
    await HapticManager.trigger('medium');
  };

  // Handle tab press
  const handleTabPress = async (tabKey: string) => {
    if (tabKey !== activeTabKey) {
      await triggerHaptic();
      onTabPress(tabKey);
    }
  };

  // Animated styles
  const tabBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tabBarY.value }],
  }));

  const activeIndicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: activeIndicatorX.value },
      { scale: activeIndicatorScale.value },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(glowIntensity.value, [0, 1], [0, 0.6]);
    const glowRadius = interpolate(glowIntensity.value, [0, 1], [0, 20]);
    
    return {
      shadowOpacity: glowOpacity,
      shadowRadius: glowRadius,
      elevation: 10 * glowIntensity.value,
    };
  });

  const renderTab = (tab: TabItem, index: number) => {
    // Only render if we have the animated style for this index
    if (index >= tabAnimatedStyles.length) {
      return null;
    }

    const tabAnimatedStyle = tabAnimatedStyles[index];

    return (
      <TouchableOpacity
        key={tab.key}
        style={styles.tab}
        onPress={() => handleTabPress(tab.key)}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.tabContent, tabAnimatedStyle]}>
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabTitle,
            tab.key === activeTabKey && styles.activeTabTitle
          ]}>
            {tab.title}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        tabBarAnimatedStyle,
        glowAnimatedStyle,
        { paddingBottom: insets.bottom + 10 }
      ]}
    >
      {/* Glassmorphic Background */}
      <LinearGradient
        colors={[
          'rgba(26, 26, 46, 0.9)',
          'rgba(22, 33, 62, 0.95)',
        ]}
        style={styles.background}
      >
        {/* Active Indicator */}
        <Animated.View style={[styles.activeIndicator, activeIndicatorAnimatedStyle]}>
          <LinearGradient
            colors={theme.colors.gradients.cosmic}
            style={styles.indicatorGradient}
          />
        </Animated.View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.slice(0, 5).map(renderTab)} {/* Limit to 5 tabs to match our fixed hooks */}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
    height: TAB_BAR_HEIGHT,
    borderRadius: theme.borderRadius.xl,
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  background: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    overflow: 'hidden',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: TAB_WIDTH - 16,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: 2,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabTitle: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.dark.text.tertiary,
    textAlign: 'center',
  },
  activeTabTitle: {
    color: theme.colors.primary[300],
    fontWeight: theme.typography.fontWeights.semibold,
  },
});

// Tab configuration - base config without isActive (added dynamically)
interface TabConfig {
  key: string;
  title: string;
  icon: string;
}

export const TAB_CONFIG: TabConfig[] = [
  {
    key: 'CheckInFlow',
    title: 'Check In',
    icon: '🎯',
  },
  {
    key: 'Calendar',
    title: 'Calendar',
    icon: '📅',
  },
  {
    key: 'Journal',
    title: 'Journal',
    icon: '📝',
  },
  {
    key: 'History',
    title: 'History',
    icon: '📊',
  },
  {
    key: 'Settings',
    title: 'Settings',
    icon: '⚙️',
  },
];