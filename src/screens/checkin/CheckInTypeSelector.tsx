import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CheckInType } from '@/types/database';

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

  const checkInOptions: CheckInOption[] = [
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
  ];

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

  const renderCheckInOption = (option: CheckInOption) => {
    const isRecommended = option.type === recommendedType;
    const isCompleted = option.completedToday;

    return (
      <TouchableOpacity
        key={option.type}
        style={[
          styles.optionCard,
          isRecommended && styles.recommendedCard,
          isCompleted && styles.completedCard,
        ]}
        onPress={() => onTypeSelect(option.type)}
        disabled={isCompleted}
      >
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>Recommended Now</Text>
          </View>
        )}
        
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓ Completed Today</Text>
          </View>
        )}

        <View style={styles.optionHeader}>
          <Text style={styles.optionEmoji}>{option.emoji}</Text>
          <View style={styles.optionTitleContainer}>
            <Text style={[styles.optionTitle, isCompleted && styles.completedTitle]}>
              {option.title}
            </Text>
            <Text style={[styles.optionDuration, isCompleted && styles.completedSubtext]}>
              {option.duration}
            </Text>
          </View>
        </View>

        <Text style={[styles.optionDescription, isCompleted && styles.completedSubtext]}>
          {option.description}
        </Text>

        <View style={styles.questionsList}>
          {option.questions.map((question, index) => (
            <View key={index} style={styles.questionItem}>
              <Text style={[styles.questionBullet, isCompleted && styles.completedSubtext]}>•</Text>
              <Text style={[styles.questionText, isCompleted && styles.completedSubtext]}>
                {question}
              </Text>
            </View>
          ))}
        </View>

        {!isCompleted && (
          <View style={styles.startButton}>
            <Text style={styles.startButtonText}>
              {isRecommended ? 'Start Recommended' : 'Start Check-in'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading your check-in options...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Check-in</Text>
        <Text style={styles.subtitle}>
          Different types of check-ins for different moments in your day
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {checkInOptions.map(renderCheckInOption)}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 You can complete multiple check-ins throughout the day for deeper insights
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8b5cf6',
    textAlign: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8b5cf6',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  recommendedCard: {
    borderColor: '#8b5cf6',
    backgroundColor: '#1e1b2e',
  },
  completedCard: {
    backgroundColor: '#0f1419',
    opacity: 0.7,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  recommendedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  completedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  completedTitle: {
    color: '#6b7280',
  },
  optionDuration: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 16,
  },
  completedSubtext: {
    color: '#6b7280',
  },
  questionsList: {
    marginBottom: 20,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  questionBullet: {
    color: '#8b5cf6',
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  questionText: {
    flex: 1,
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 18,
  },
  startButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  footerText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    textAlign: 'center',
  },
});