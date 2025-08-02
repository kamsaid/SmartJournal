// AnimatedTabBar - Premium floating tab bar with micro-interactions
import React from 'react';
import { View, Pressable, Text, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing 
} from 'react-native-reanimated';
// Import Lucide icons as specified
import { 
  CheckSquare, 
  CalendarClock, 
  NotebookPen, 
  BarChart3, 
  Settings 
} from 'lucide-react-native';
import { theme } from '@/design-system';

// Tab item interface with proper typing
interface TabItem {
  key: string;
  title: string;
  icon: string; // Keep for backward compatibility but will use iconComponent
  iconComponent: React.ComponentType<any>; // Lucide icon component
  isActive?: boolean;
}

// Component props interface
interface AnimatedTabBarProps {
  tabs: TabItem[];
  onTabPress: (key: string) => void;
  activeTabKey: string;
}

const { width: screenWidth } = Dimensions.get('window');
const TAB_BAR_MARGIN = 16; // Reduced margin for cleaner look

// Clean-Minimal Tab Bar Component
export default function AnimatedTabBar({
  tabs,
  onTabPress,
  activeTabKey,
}: AnimatedTabBarProps) {
  
  // Early return for invalid props
  if (!tabs || !Array.isArray(tabs) || tabs.length === 0) {
    return null;
  }

  const insets = useSafeAreaInsets();

  // Animation value for color transitions
  const colorTransition = useSharedValue(0);

  // Handle tab press with haptic feedback potential
  const handleTabPress = React.useCallback((tabKey: string) => {
    // Trigger smooth color transition
    colorTransition.value = withTiming(1, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    });
    
    onTabPress(tabKey);
  }, [onTabPress, colorTransition]);

  // Render individual tab with Clean-Minimal styling
  const renderTab = (tab: TabItem, index: number) => {
    const isActive = tab.key === activeTabKey;
    const IconComponent = tab.iconComponent;

    return (
      <Pressable
        key={tab.key}
        style={styles.tab}
        onPress={() => handleTabPress(tab.key)}
        // Accessibility features as specified
        accessibilityRole="button"
        accessibilityLabel={tab.title}
        accessibilityState={{ selected: isActive }}
        // Native press feedback
        android_ripple={{ 
          color: theme.colors.crimson[500] + '20', 
          borderless: true 
        }}
      >
        <Animated.View style={[
          styles.tabContent,
          isActive && styles.activeTabContent
        ]}>
          {/* Icon with proper theming */}
          <IconComponent
            size={22}
            color={isActive 
              ? theme.colors.crimson[500] // Active: accent-600 equivalent 
              : theme.colors.dark.text.tertiary // Inactive: onSurface/60 equivalent
            }
            strokeWidth={isActive ? 2.5 : 2} // Slightly bolder when active
          />
          
          {/* Tab label with color states */}
          <Text style={[
            styles.tabTitle,
            {
              color: isActive 
                ? theme.colors.crimson[500] // Active: text-accent-600
                : theme.colors.dark.text.tertiary // Inactive: text-onSurface/60
            }
          ]}>
            {tab.title}
          </Text>

          {/* Active state border indicator */}
          {isActive && (
            <Animated.View style={[
              styles.activeIndicator,
              {
                backgroundColor: theme.colors.crimson[500], // border-accent-600
              }
            ]} />
          )}
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <View style={[
      styles.container,
      { 
        marginBottom: insets.bottom + 8,
        // Clean-Minimal container styling as specified
        backgroundColor: theme.colors.dark.surface + 'CC', // bg-surface/80 equivalent
      }
    ]}>
      {/* Tab container with proper spacing */}
      <View style={styles.tabsContainer}>
        {tabs.slice(0, 5).map(renderTab)}
      </View>
    </View>
  );
}

// Clean-Minimal styles following specifications
const styles = StyleSheet.create({
  container: {
    // Clean-Minimal container: flex flex-row justify-around py-2 px-4 bg-surface/80 backdrop-blur rounded-full shadow-md
    position: 'absolute',
    bottom: 0,
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
    minHeight: 56, // Ensure min-height ≥ 56 px (touch target)
    borderRadius: 28, // rounded-full equivalent
    paddingVertical: 8, // py-2 equivalent
    paddingHorizontal: 16, // px-4 equivalent
    // Shadow equivalent to shadow-md
    shadowColor: theme.colors.charcoal[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    // Backdrop blur effect simulation
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  tabsContainer: {
    // justify-around equivalent
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    // Touch target optimization
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 48, // Minimum touch target
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  activeTabContent: {
    // Active tab gets slightly more spacing
    paddingVertical: 6,
  },
  tabTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    // Transition equivalent: transition border-color, color 150ms ease-out
    // (React Native handles this through re-renders)
  },
  activeIndicator: {
    // Active state: border-b-2 border-accent-600
    position: 'absolute',
    bottom: -2,
    left: '50%',
    transform: [{ translateX: -12 }], // Center the 24px width indicator
    width: 24,
    height: 2,
    borderRadius: 1,
  },
});

// Updated TAB_CONFIG with Lucide icon components
export const TAB_CONFIG: TabItem[] = [
  {
    key: 'CheckInFlow',
    title: 'Check In',
    icon: '🎯', // Keep for backward compatibility
    iconComponent: CheckSquare,
  },
  {
    key: 'Calendar',
    title: 'Calendar',
    icon: '📅',
    iconComponent: CalendarClock,
  },
  {
    key: 'Journal',
    title: 'Journal',
    icon: '📝',
    iconComponent: NotebookPen,
  },
  {
    key: 'History',
    title: 'History',
    icon: '📊',
    iconComponent: BarChart3,
  },
  {
    key: 'Settings',
    title: 'Settings',
    icon: '⚙️',
    iconComponent: Settings,
  },
];