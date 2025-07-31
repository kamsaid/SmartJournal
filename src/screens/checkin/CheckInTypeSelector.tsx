import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckInType } from '@/types/database';
import { AnimatedCard, LoadingAnimation } from '@/components/animated';
import { theme, SPRING_CONFIGS, createStaggerAnimation } from '@/design-system';

interface CheckInOption {
  type: CheckInType;
  title: string;
  emoji: string;
  description: string;
  duration: string;
  questions: string[];
  timeOfDay: 'morning' | 'evening' | 'anytime';
  available: boolean;
  completedToday?: boolean;
}

interface CheckInTypeSelectorProps {
  onTypeSelect: (type: CheckInType) => void;
}

export default function CheckInTypeSelector({ onTypeSelect }: CheckInTypeSelectorProps) {
  const [checkInStatus, setCheckInStatus] = useState({
    morning: false,
    nightly: false,
    daily: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime] = useState(new Date());

  // Animation values - create at top level to avoid hook violations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const footerOpacity = useSharedValue(0);
  
  // Fixed-size animation arrays for 3 check-in options (morning, nightly, daily)
  // Create at top level to maintain consistent hook order
  const cardAnimations = [
    useSharedValue(0), // morning opacity
    useSharedValue(0), // nightly opacity  
    useSharedValue(0), // daily opacity
  ];
  
  const cardTranslations = [
    useSharedValue(30), // morning translateY
    useSharedValue(30), // nightly translateY
    useSharedValue(30), // daily translateY
  ];

  // Create animated styles at top level for all 3 cards
  // This ensures hooks are always called in the same order
  const cardAnimatedStyles = [
    useAnimatedStyle(() => ({
      opacity: cardAnimations[0].value,
      transform: [{ translateY: cardTranslations[0].value }],
    })),
    useAnimatedStyle(() => ({
      opacity: cardAnimations[1].value,
      transform: [{ translateY: cardTranslations[1].value }],
    })),
    useAnimatedStyle(() => ({
      opacity: cardAnimations[2].value,
      transform: [{ translateY: cardTranslations[2].value }],
    })),
  ];

  // Get check-in options - memoized based on checkInStatus only
  const checkInOptions: CheckInOption[] = useMemo(() => [
    {
      type: 'morning',
      title: 'Morning Check-in',
      emoji: '🌅',
      description: 'Set intentions and prepare for a great day',
      duration: '5-8 minutes',
      questions: [
        'Write out thoughts & anxieties',
        'What would make today great?',
        'Daily affirmations',
        'Morning gratitude',
      ],
      timeOfDay: 'morning',
      available: true,
      completedToday: checkInStatus.morning,
    },
    {
      type: 'nightly',
      title: 'Nightly Check-in',
      emoji: '🌙',
      description: 'Reflect on your day and celebrate growth',
      duration: '6-10 minutes',
      questions: [
        'How could today be better?',
        '3 amazing things that happened',
        '3 things you accomplished',
        'What made you happy/sad?',
      ],
      timeOfDay: 'evening',
      available: true,
      completedToday: checkInStatus.nightly,
    },
    {
      type: 'daily',
      title: 'AI-Guided Check-in',
      emoji: '🧠',
      description: 'Personalized questions based on your growth journey',
      duration: '8-12 minutes',
      questions: [
        'AI-selected personalized questions',
        'Based on your patterns & memories',
        'Adaptive to your growth phase',
        'Generates custom daily challenge',
      ],
      timeOfDay: 'anytime',
      available: true,
      completedToday: checkInStatus.daily,
    },
  ], [checkInStatus]);
  
  // Initialize entrance animations
  useEffect(() => {
    if (!isLoading) {
      // Header animation
      headerOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
      headerTranslateY.value = withDelay(200, withSpring(0, SPRING_CONFIGS.gentle));
      
      // Staggered card animations - safely iterate through fixed arrays
      cardAnimations.forEach((anim, index) => {
        if (anim) {
          anim.value = withDelay(600 + (index * 150), withTiming(1, { duration: 500 }));
        }
      });
      
      cardTranslations.forEach((trans, index) => {
        if (trans) {
          trans.value = withDelay(600 + (index * 150), withSpring(0, SPRING_CONFIGS.bouncy));
        }
      });
      
      // Footer animation
      footerOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
    }
  }, [isLoading]);

  useEffect(() => {
    loadCheckInStatus();
  }, []);

  const loadCheckInStatus = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement service to check which check-ins are completed today
      // For now, using mock data
      const today = new Date().toISOString().split('T')[0];
      
      setCheckInStatus({
        morning: false, // Would check if morning check-in exists for today
        nightly: false, // Would check if nightly check-in exists for today
        daily: false,   // Would check if daily check-in exists for today
      });
    } catch (error) {
      console.error('Error loading check-in status:', error);
    }
    setIsLoading(false);
  };


  const getTimeBasedRecommendation = (): CheckInType => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12 && !checkInStatus.morning) {
      return 'morning';
    } else if (hour >= 18 && hour < 24 && !checkInStatus.nightly) {
      return 'nightly';
    } else if (!checkInStatus.daily) {
      return 'daily';
    }
    
    return 'daily'; // Default fallback
  };

  const recommendedType = getTimeBasedRecommendation();

  // Updated renderCheckInOption to accept pre-created animated style
  const renderCheckInOption = (option: CheckInOption, index: number, animatedStyle: any) => {
    const isRecommended = option.type === recommendedType;
    const isCompleted = option.completedToday;
    
    return (
      <Animated.View key={option.type} style={animatedStyle}>
        <AnimatedCard
          variant={isRecommended ? 'cosmic' : isCompleted ? 'default' : 'glass'}
          size="lg"
          pressable={!isCompleted}
          onPress={() => onTypeSelect(option.type)}
          glowEffect={isRecommended}
          breathingAnimation={isRecommended}
          hapticFeedback={true}
          style={isCompleted ? { ...styles.optionCard, ...styles.completedCard } : styles.optionCard}
        >
          {/* Badge */}
          {isRecommended && (
            <View style={styles.recommendedBadge}>
              <LinearGradient
                colors={theme.colors.gradients.cosmic}
                style={styles.badgeGradient}
              >
                <Text style={styles.badgeText}>✨ Recommended Now</Text>
              </LinearGradient>
            </View>
          )}
          
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.badgeText}>✅ Completed Today</Text>
            </View>
          )}

          {/* Header */}
          <View style={styles.optionHeader}>
            <Text style={[styles.optionEmoji, isCompleted && styles.completedEmoji]}>
              {option.emoji}
            </Text>
            <View style={styles.optionTitleContainer}>
              <Text style={[
                styles.optionTitle, 
                isCompleted && styles.completedTitle,
                isRecommended && styles.recommendedTitle
              ]}>
                {option.title}
              </Text>
              <Text style={[
                styles.optionDuration, 
                isCompleted && styles.completedSubtext
              ]}>
                {option.duration}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={[
            styles.optionDescription, 
            isCompleted && styles.completedSubtext
          ]}>
            {option.description}
          </Text>

          {/* Questions List */}
          <View style={styles.questionsList}>
            {option.questions.map((question, qIndex) => (
              <View key={qIndex} style={styles.questionItem}>
                <Text style={[
                  styles.questionBullet, 
                  isCompleted && styles.completedSubtext,
                  isRecommended && styles.recommendedBullet
                ]}>
                  •
                </Text>
                <Text style={[
                  styles.questionText, 
                  isCompleted && styles.completedSubtext
                ]}>
                  {question}
                </Text>
              </View>
            ))}
          </View>

          {/* Start Button */}
          {!isCompleted && (
            <View style={styles.startButtonContainer}>
              {isRecommended ? (
                <LinearGradient
                  colors={theme.colors.gradients.cosmic}
                  style={styles.startButton}
                >
                  <Text style={styles.startButtonText}>
                    🚀 Start Recommended
                  </Text>
                </LinearGradient>
              ) : (
                <View style={[styles.startButton, styles.regularStartButton]}>
                  <Text style={styles.startButtonText}>
                    Start Check-in
                  </Text>
                </View>
              )}
            </View>
          )}
        </AnimatedCard>
      </Animated.View>
    );
  };

  // Animated styles for header and footer
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));
  
  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingAnimation
          variant="cosmic"
          size="lg"
          text="Loading your check-in options..."
        />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Animated Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <Text style={styles.title}>Choose Your Check-in</Text>
        <Text style={styles.subtitle}>
          Different types of check-ins for different moments in your day
        </Text>
      </Animated.View>

      {/* Animated Options */}
      <View style={styles.optionsContainer}>
        {checkInOptions && checkInOptions.length > 0 && 
          checkInOptions.map((option, index) => 
            // Pass the pre-created animated style to avoid hook order issues
            renderCheckInOption(option, index, cardAnimatedStyles[index])
          )
        }
      </View>

      {/* Animated Footer */}
      <Animated.View style={[styles.footer, footerAnimatedStyle]}>
        <AnimatedCard variant="glass" size="sm" style={styles.footerCard}>
          <Text style={styles.footerText}>
            💡 You can complete multiple check-ins throughout the day for deeper insights
          </Text>
        </AnimatedCard>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.bg,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing['6xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.bg,
  },
  header: {
    marginBottom: theme.spacing['4xl'],
  },
  title: {
    fontSize: theme.typography.fontSizes['4xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.dark.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.primary[400],
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.fontSizes.lg,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  optionsContainer: {
    gap: theme.spacing.xl,
  },
  optionCard: {
    position: 'relative',
  },
  completedCard: {
    opacity: 0.6,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -theme.spacing.sm,
    right: theme.spacing.lg,
    zIndex: 10,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  completedBadge: {
    position: 'absolute',
    top: -theme.spacing.sm,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    zIndex: 10,
  },
  badgeGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  badgeText: {
    color: theme.colors.dark.text.primary,
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  optionEmoji: {
    fontSize: 36,
    marginRight: theme.spacing.lg,
  },
  completedEmoji: {
    opacity: 0.6,
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.dark.text.primary,
    marginBottom: theme.spacing.xs,
  },
  recommendedTitle: {
    color: theme.colors.primary[300],
  },
  completedTitle: {
    color: theme.colors.dark.text.tertiary,
  },
  optionDuration: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary[400],
    fontWeight: theme.typography.fontWeights.medium,
  },
  optionDescription: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.dark.text.secondary,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.fontSizes.md,
    marginBottom: theme.spacing.lg,
  },
  completedSubtext: {
    color: theme.colors.dark.text.tertiary,
  },
  questionsList: {
    marginBottom: theme.spacing.xl,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  questionBullet: {
    color: theme.colors.primary[400],
    fontSize: theme.typography.fontSizes.lg,
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  recommendedBullet: {
    color: theme.colors.primary[300],
  },
  questionText: {
    flex: 1,
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.dark.text.secondary,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.fontSizes.sm,
  },
  startButtonContainer: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  startButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  regularStartButton: {
    backgroundColor: theme.colors.primary[500],
  },
  startButtonText: {
    color: theme.colors.dark.text.primary,
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  footer: {
    marginTop: theme.spacing['4xl'],
  },
  footerCard: {
    marginVertical: 0,
  },
  footerText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.dark.text.secondary,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.fontSizes.sm,
    textAlign: 'center',
  },
});