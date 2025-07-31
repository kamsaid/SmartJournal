import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCard, AnimatedButton } from '@/components/animated';
import { useTheme, THEME_CONFIG } from '@/contexts/ThemeContext';
import { HapticManager } from '@/utils/haptics';
import { theme, SPRING_CONFIGS } from '@/design-system';

interface SettingItem {
  type: 'switch' | 'option' | 'theme-selector' | 'color-scheme-selector';
  label: string;
  subtitle: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { 
    currentTheme, 
    themeMode, 
    colorScheme, 
    setThemeMode, 
    setColorScheme,
    toggleTheme,
    isTransitioning 
  } = useTheme();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [deepModeEnabled, setDeepModeEnabled] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-20);
  const sectionAnimations = Array.from({ length: 4 }, () => ({
    opacity: useSharedValue(0),
    translateY: useSharedValue(30),
    scale: useSharedValue(0.95),
  }));

  useEffect(() => {
    // Staggered entrance animation
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerY.value = withSpring(0, SPRING_CONFIGS.gentle);

    sectionAnimations.forEach((anim, index) => {
      const delay = 200 + (index * 150);
      anim.opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
      anim.translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIGS.bouncy));
      anim.scale.value = withDelay(delay, withSpring(1, SPRING_CONFIGS.gentle));
    });
  }, []);

  const handleHapticsToggle = (enabled: boolean) => {
    setHapticsEnabled(enabled);
    HapticManager.setEnabled(enabled);
    if (enabled) {
      HapticManager.success();
    }
  };

  const handleThemeModePress = (mode: typeof themeMode) => {
    setThemeMode(mode);
    HapticManager.contextual('theme-change');
  };

  const handleColorSchemePress = (scheme: typeof colorScheme) => {
    setColorScheme(scheme);
    HapticManager.contextual('theme-change');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            HapticManager.warning();
            // Handle sign out logic
          }
        },
      ]
    );
  };

  const handleResetJourney = () => {
    Alert.alert(
      'Reset Journey',
      'This will permanently delete all your progress and insights. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            HapticManager.error();
            // Handle reset logic
          }
        },
      ]
    );
  };

  const settingSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Appearance & Experience',
      items: [
        {
          type: 'theme-selector',
          label: 'Theme Mode',
          subtitle: `Current: ${THEME_CONFIG.modes.find(m => m.key === themeMode)?.title}`,
        },
        {
          type: 'color-scheme-selector',
          label: 'Color Scheme',
          subtitle: `Current: ${THEME_CONFIG.colorSchemes.find(c => c.key === colorScheme)?.title}`,
        },
        {
          type: 'switch',
          label: 'Haptic Feedback',
          subtitle: 'Enhanced tactile feedback for interactions',
          value: hapticsEnabled,
          onValueChange: handleHapticsToggle,
        },
      ],
    },
    {
      title: 'Transformation Settings',
      items: [
        {
          type: 'switch',
          label: 'Deep Reflection Mode',
          subtitle: 'Enable more challenging questions for deeper insights',
          value: deepModeEnabled,
          onValueChange: setDeepModeEnabled,
        },
        {
          type: 'option',
          label: 'Question Depth Preference',
          subtitle: 'Medium depth cognitive analysis',
          onPress: () => HapticManager.cardTap(),
        },
        {
          type: 'option',
          label: 'Reflection Reminder Time',
          subtitle: '9:00 AM daily wisdom inquiry',
          onPress: () => HapticManager.cardTap(),
        },
      ],
    },
    {
      title: 'Privacy & Data',
      items: [
        {
          type: 'switch',
          label: 'Daily Notifications',
          subtitle: 'Remind me to do my daily check-in',
          value: notificationsEnabled,
          onValueChange: setNotificationsEnabled,
        },
        {
          type: 'option',
          label: 'Export Data',
          subtitle: 'Download your transformation journey',
          onPress: () => HapticManager.cardTap(),
        },
        {
          type: 'option',
          label: 'Privacy Settings',
          subtitle: 'Manage your data and privacy preferences',
          onPress: () => HapticManager.cardTap(),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          type: 'option',
          label: 'Profile',
          subtitle: 'Update your personal information',
          onPress: () => HapticManager.cardTap(),
        },
        {
          type: 'option',
          label: 'Reset Journey',
          subtitle: 'Start your transformation from the beginning',
          onPress: handleResetJourney,
          danger: true,
        },
        {
          type: 'option',
          label: 'Sign Out',
          subtitle: 'Sign out of your account',
          onPress: handleSignOut,
          danger: true,
        },
      ],
    },
  ];

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const renderThemeSelector = () => (
    <View style={styles.themeSelectorContainer}>
      {THEME_CONFIG.modes.map((mode) => (
        <AnimatedButton
          key={mode.key}
          title={mode.icon + ' ' + mode.title} // Use title prop instead of children
          variant={themeMode === mode.key ? 'cosmic' : 'secondary'}
          size="sm"
          onPress={() => handleThemeModePress(mode.key)}
          style={{ flex: 1 }}
        />
      ))}
    </View>
  );

  const renderColorSchemeSelector = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.colorSchemeContainer}
      contentContainerStyle={styles.colorSchemeContent}
    >
      {THEME_CONFIG.colorSchemes.map((scheme) => (
        <View key={scheme.key} style={styles.colorSchemeItem}>
          <AnimatedButton
            title={scheme.title} // Use title prop
            variant={colorScheme === scheme.key ? 'cosmic' : 'secondary'} // Change glass to secondary
            onPress={() => handleColorSchemePress(scheme.key)}
            size="sm"
            style={styles.colorSchemeButton}
          />
          <View style={styles.colorPreview}>
            <LinearGradient
              colors={scheme.gradient} // Use gradient instead of colors
              style={styles.colorGradient}
            />
          </View>
          <Text style={styles.colorSchemeIcon}>
            {colorScheme === scheme.key ? '✓' : ''} // Remove icon property reference
          </Text>
        </View>
      ))}
      </ScrollView>
  );

  const renderSettingItem = (item: SettingItem, index: number) => {
    if (item.type === 'theme-selector') {
      return (
        <View key={index} style={styles.customSettingItem}>
          <View style={styles.settingHeader}>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          </View>
          {renderThemeSelector()}
        </View>
      );
    }

    if (item.type === 'color-scheme-selector') {
      return (
        <View key={index} style={styles.customSettingItem}>
          <View style={styles.settingHeader}>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          </View>
          {renderColorSchemeSelector()}
        </View>
      );
    }

    return (
      <AnimatedCard
        key={index}
        variant="glass"
        style={[styles.settingItem, { marginBottom: theme.spacing.md }]}
        pressable={!!item.onPress} // Use pressable instead of pressScale
        onPress={item.onPress}
        disabled={item.type === 'switch' && item.danger && item.value}
      >
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, item.danger && styles.dangerText]}>
            {item.label}
          </Text>
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        </View>
        
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={(value) => {
              HapticManager.selection();
              item.onValueChange?.(value);
            }}
            trackColor={{ 
              false: 'rgba(250, 245, 230, 0.3)', // Cream with opacity for inactive
              true: '#FD1F4A' // Crimson for active
            }}
            thumbColor={item.value ? '#FAF5E6' : 'rgba(250, 245, 230, 0.8)'} // Cream colors
            ios_backgroundColor="rgba(250, 245, 230, 0.3)" // Cream with opacity
          />
        ) : (
          <Text style={styles.settingArrow}>›</Text>
        )}
      </AnimatedCard>
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: currentTheme.colors.dark.bg }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <LinearGradient
          colors={currentTheme.colors.gradients.cosmic}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your life architecture experience</Text>
        </LinearGradient>
      </Animated.View>

      {/* Settings Sections */}
      {settingSections.map((section, sectionIndex) => {
        const sectionAnimation = sectionAnimations[sectionIndex];
        
        const sectionAnimatedStyle = useAnimatedStyle(() => ({
          opacity: sectionAnimation.opacity.value,
          transform: [
            { translateY: sectionAnimation.translateY.value },
            { scale: sectionAnimation.scale.value },
          ],
        }));

        return (
          <Animated.View key={sectionIndex} style={[styles.section, sectionAnimatedStyle]}>
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.primary[400] }]}>
              {section.title}
            </Text>
            
            {section.items.map(renderSettingItem)}
          </Animated.View>
        );
      })}

      {/* App Info */}
      <AnimatedCard variant="glass" style={styles.appInfo}>
        <Text style={styles.appInfoText}>Life Systems Architect</Text>
        <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
        <Text style={styles.appInfoSubtext}>
          Transforming reactive problem-solving into proactive life design
        </Text>
      </AnimatedCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  headerGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSizes['3xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: '#FAF5E6', // Cream text for title
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: 'rgba(250, 245, 230, 0.8)', // Cream with opacity
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
    marginHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#FD1F4A', // Crimson accent for section titles
  },
  settingCard: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingItem: {
    backgroundColor: '#3A3839', // Light charcoal surface
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  customSettingItem: {
    marginBottom: theme.spacing.md,
    backgroundColor: '#3A3839', // Light charcoal surface
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  settingHeader: {
    marginBottom: theme.spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.medium,
    color: '#FAF5E6', // Cream text
    marginBottom: theme.spacing.xs,
  },
  settingSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: 'rgba(250, 245, 230, 0.8)', // Cream with opacity
    lineHeight: 20,
  },
  settingArrow: {
    fontSize: 20,
    color: '#FD1F4A', // Crimson accent for arrows
    marginLeft: theme.spacing.md,
  },
  dangerText: {
    color: '#FD1F4A', // Use crimson for danger text
  },
  themeSelectorContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  themeModeButton: {
    flex: 1,
  },
  themeModeText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
  },
  colorSchemeContainer: {
    marginVertical: theme.spacing.xs,
  },
  colorSchemeContent: {
    paddingRight: theme.spacing.md,
  },
  colorSchemeItem: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  colorSchemeButton: {
    marginBottom: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  colorPreview: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.3)', // Cream border with opacity
  },
  colorGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
  },
  colorSchemeIcon: {
    fontSize: 12,
    color: '#FD1F4A', // Crimson for checkmark
    fontWeight: 'bold',
  },
  colorSchemeText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: '#FAF5E6', // Cream text
  },
  appInfo: {
    alignItems: 'center',
    margin: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: '#3A3839', // Light charcoal surface
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  appInfoText: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: '#FAF5E6', // Cream text
    marginBottom: theme.spacing.xs,
  },
  appInfoVersion: {
    fontSize: theme.typography.fontSizes.sm,
    color: 'rgba(250, 245, 230, 0.8)', // Cream with opacity
    marginBottom: theme.spacing.md,
  },
  appInfoSubtext: {
    fontSize: theme.typography.fontSizes.sm,
    color: 'rgba(250, 245, 230, 0.8)', // Cream with opacity
    textAlign: 'center',
    lineHeight: 20,
  },
});