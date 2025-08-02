import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { MorningCheckIn } from '@/types/database';
import { generateUUID } from '@/utils/uuid';
import { morningCheckInService, MorningCheckInSubmission } from '@/services/checkins/MorningCheckInService';
import { useAuth } from '@/hooks/useAuth';

interface MorningCheckInData {
  thoughts_anxieties: string;
  great_day_vision: string;
  affirmations: string;
  gratitude: string;
}

export default function MorningCheckInScreen() {
  // Authentication hook to get current user
  const { getCurrentUserId, loading: authLoading } = useAuth();
  const [responses, setResponses] = useState<MorningCheckInData>({
    thoughts_anxieties: '',
    great_day_vision: '',
    affirmations: '',
    gratitude: '',
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [sessionStartTime] = useState(new Date());
  const [savedResult, setSavedResult] = useState<{
    checkInId: string;
    challengeId: string;
    memoryId: string;
    challengeText: string;
  } | null>(null);

  // Check if user has already completed morning check-in today
  useEffect(() => {
    const checkExistingCheckIn = async () => {
      try {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
          setIsCheckingExisting(false);
          return;
        }

        const hasCompleted = await morningCheckInService.hasCompletedTodayMorningCheckIn(currentUserId);
        if (hasCompleted) {
          setAlreadyCompletedToday(true);
          // Show a completed state without allowing form submission
        }
      } catch (error) {
        console.error('Error checking existing morning check-in:', error);
        // If there's an error checking, allow the user to proceed
        // The server-side validation will catch any duplicates
      }
      setIsCheckingExisting(false);
    };

    if (!authLoading) {
      checkExistingCheckIn();
    }
  }, [getCurrentUserId, authLoading]);

  const questions = [
    {
      key: 'thoughts_anxieties' as keyof MorningCheckInData,
      title: 'Morning Brain Dump',
      question: 'Write out all your thoughts and anxieties',
      placeholder: 'Let everything out... thoughts, worries, what\'s on your mind...',
      multiline: true,
      minHeight: 120,
    },
    {
      key: 'great_day_vision' as keyof MorningCheckInData,
      title: 'Great Day Vision',
      question: 'What would make today a great day?',
      placeholder: 'What specific things would make you feel great about today?',
      multiline: true,
      minHeight: 80,
    },
    {
      key: 'affirmations' as keyof MorningCheckInData,
      title: 'Daily Affirmations',
      question: 'I am...',
      placeholder: 'I am strong, I am capable, I am...',
      multiline: true,
      minHeight: 80,
    },
    {
      key: 'gratitude' as keyof MorningCheckInData,
      title: 'Morning Gratitude',
      question: 'I am grateful for...',
      placeholder: 'What are you grateful for right now?',
      multiline: true,
      minHeight: 80,
    },
  ];

  const currentQuestion = questions[currentStep];

  const handleResponseChange = (text: string) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.key]: text,
    }));
  };

  const isCurrentStepComplete = () => {
    return responses[currentQuestion.key].trim().length > 0;
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Calculate session duration with validation (ensure positive and within reasonable bounds)
      const rawDuration = Math.round((Date.now() - sessionStartTime.getTime()) / 60000);
      const sessionDuration = Math.max(1, Math.min(rawDuration, 720)); // 1-720 minutes (12 hours max)
      
      const submission: MorningCheckInSubmission = {
        thoughts_anxieties: responses.thoughts_anxieties,
        great_day_vision: responses.great_day_vision,
        affirmations: responses.affirmations,
        gratitude: responses.gratitude,
      };

      // Get current user ID from auth
      const currentUserId = getCurrentUserId();
      
      if (!currentUserId) {
        throw new Error('Please sign in to save your check-in');
      }

      // Save to Supabase using the service
      const result = await morningCheckInService.submitMorningCheckIn(
        currentUserId,
        submission,
        sessionDuration
      );

      const resultData = {
        checkInId: result.checkIn.id,
        challengeId: result.challenge.id,
        memoryId: result.memoryId,
        challengeText: result.challenge.challenge_text,
      };
      
      console.log('Morning check-in saved successfully:', resultData);
      setSavedResult(resultData);
      setIsCompleted(true);
    } catch (error) {
      console.error('Error submitting morning check-in:', error);
      
      // More specific error messages
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred. Please check your internet connection and try again.';
      
      Alert.alert(
        'Failed to Save Check-in', 
        errorMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Retry', 
            onPress: () => {
              // Allow retry by resetting submission state
              setIsSubmitting(false);
              handleSubmit();
            }
          }
        ]
      );
    } finally {
      // Always reset submission state unless we successfully completed
      if (!isCompleted) {
        setIsSubmitting(false);
      }
    }
  };

  const getProgress = () => {
    return ((currentStep + 1) / questions.length) * 100;
  };

  // Loading state while checking for existing check-in
  if (authLoading || isCheckingExisting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Checking your morning check-in status...</Text>
      </View>
    );
  }

  // Already completed state - prevent duplicate submissions
  if (alreadyCompletedToday) {
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedTitle}>🌅 Morning Check-in Already Complete!</Text>
        <Text style={styles.completedSubtitle}>
          You've already completed your morning check-in for today.
        </Text>
        <Text style={styles.completedMessage}>
          Each day allows only one morning check-in to maintain the integrity of your daily reflection practice. Come back tomorrow for your next check-in!
        </Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {/* Navigate back to main screen */}}
        >
          <Text style={styles.doneButtonText}>Continue with Your Day</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Completed state
  if (isCompleted) {
    const sessionDuration = Math.round((Date.now() - sessionStartTime.getTime()) / 60000);
    
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedTitle}>🌅 Morning Check-in Complete!</Text>
        <Text style={styles.completedSubtitle}>
          You spent {sessionDuration} minutes setting intentions for your day.
        </Text>
        <Text style={styles.completedMessage}>
          Your responses have been saved and a personalized challenge has been created based on your vision for a great day.
        </Text>
        {savedResult && (
          <>
            <Text style={styles.completedDetails}>
              ✓ Check-in saved to database{'\n'}
              ✓ Stored in AI memory for future context{'\n'}
              ✓ Challenge generated for your day
            </Text>
            <View style={styles.challengeCard}>
              <Text style={styles.challengeTitle}>🎯 Your Daily Challenge</Text>
              <Text style={styles.challengeText}>{savedResult.challengeText}</Text>
            </View>
          </>
        )}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {/* Navigate back */}}
        >
          <Text style={styles.doneButtonText}>Start Your Great Day!</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header with progress */}
        <View style={styles.header}>
          <Text style={styles.title}>Morning Check-in</Text>
          <Text style={styles.subtitle}>
            Set your intentions and prepare for a great day
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${getProgress()}%` }]} 
              />
            </View>
            <Text style={styles.progressText}>
              {currentStep + 1} of {questions.length} questions
            </Text>
          </View>
        </View>

        {/* Current Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          
          <TextInput
            style={[
              styles.textInput,
              { minHeight: currentQuestion.minHeight },
              currentQuestion.multiline && styles.multilineInput,
            ]}
            value={responses[currentQuestion.key]}
            onChangeText={handleResponseChange}
            placeholder={currentQuestion.placeholder}
            placeholderTextColor="rgba(250, 245, 230, 0.5)" // Cream muted for placeholders
            multiline={currentQuestion.multiline}
            textAlignVertical="top"
            autoFocus
          />
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              !isCurrentStepComplete() && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!isCurrentStepComplete() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentStep === questions.length - 1 ? 'Complete Morning Check-in' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D2C2E', // Main Duson Dark Charcoal background (was #0f0f23)
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FAF5E6', // Duson Cream for primary text (was #ffffff)
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FD1F4A', // Main Duson Crimson (was #8b5cf6)
    lineHeight: 22,
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity (was #374151)
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FD1F4A', // Main Duson Crimson (was #8b5cf6)
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(250, 245, 230, 0.6)', // Cream with 60% opacity (was #6b7280)
    textAlign: 'center',
  },
  questionContainer: {
    backgroundColor: '#3A3839', // Light charcoal for elevated surfaces (was #1a1a2e)
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#FD1F4A', // Main Duson Crimson (was #a855f7)
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FD1F4A', // Main Duson Crimson (was #a855f7)
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#FAF5E6', // Duson Cream for primary text (was #ffffff)
    marginBottom: 20,
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: '#454344', // Even lighter charcoal for elevated surfaces (was #16213e)
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FAF5E6', // Duson Cream for primary text (was #ffffff)
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity (was #374151)
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.5)', // Cream muted (was #6b7280)
  },
  backButtonText: {
    color: 'rgba(250, 245, 230, 0.5)', // Cream muted (was #6b7280)
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#FD1F4A', // Main Duson Crimson (was #8b5cf6)
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(250, 245, 230, 0.2)', // Cream with low opacity (was #4b5563)
  },
  nextButtonText: {
    color: '#FAF5E6', // Duson Cream (was #ffffff)
    fontSize: 16,
    fontWeight: '600',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D2C2E', // Main Duson Dark Charcoal background (was #0f0f23)
    padding: 40,
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FAF5E6', // Duson Cream for primary text (was #ffffff)
    textAlign: 'center',
    marginBottom: 16,
  },
  completedSubtitle: {
    fontSize: 18,
    color: '#FD1F4A', // Main Duson Crimson (was #8b5cf6)
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  completedMessage: {
    fontSize: 16,
    color: 'rgba(250, 245, 230, 0.8)', // Cream with 80% opacity (was #d1d5db)
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  completedDetails: {
    fontSize: 14,
    color: '#FFB000', // Duson Golden Yellow for success (was #10b981)
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  challengeCard: {
    backgroundColor: '#3A3839', // Light charcoal for elevated surfaces (was #1a1a2e)
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB000', // Duson Golden Yellow for special highlights (was #f59e0b)
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFB000', // Duson Golden Yellow for special highlights (was #f59e0b)
    marginBottom: 8,
    textAlign: 'center',
  },
  challengeText: {
    fontSize: 14,
    color: 'rgba(250, 245, 230, 0.8)', // Cream with 80% opacity (was #d1d5db)
    lineHeight: 20,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: '#FD1F4A', // Main Duson Crimson (was #8b5cf6)
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#FAF5E6', // Duson Cream (was #ffffff)
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D2C2E', // Main Duson Dark Charcoal background (was #0f0f23)
  },
  loadingText: {
    marginTop: 10,
    color: '#FAF5E6', // Duson Cream (was #ffffff)
    fontSize: 16,
  },
});