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
import { NightlyCheckIn } from '@/types/database';
import { generateUUID } from '@/utils/uuid';
import { nightlyCheckInService, NightlyCheckInSubmission } from '@/services/checkins/NightlyCheckInService';
import { useAuth } from '@/hooks/useAuth';

interface NightlyCheckInData {
  improvements: string;
  amazing_things: string[];
  accomplishments: string[];
  emotions: string;
}

interface ListInputProps {
  title: string;
  items: string[];
  onItemsChange: (items: string[]) => void;
  placeholder: string;
  maxItems?: number;
}

function ListInput({ title, items, onItemsChange, placeholder, maxItems = 3 }: ListInputProps) {
  const [currentItem, setCurrentItem] = useState('');

  const addItem = () => {
    if (currentItem.trim() && items.length < maxItems) {
      onItemsChange([...items, currentItem.trim()]);
      setCurrentItem('');
    }
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.listInputContainer}>
      <Text style={styles.listInputTitle}>{title}</Text>
      
      {/* Display added items */}
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listItemText}>{index + 1}. {item}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeItem(index)}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add new item input */}
      {items.length < maxItems && (
        <View style={styles.addItemContainer}>
          <TextInput
            style={styles.addItemInput}
            value={currentItem}
            onChangeText={setCurrentItem}
            placeholder={`${placeholder} (${items.length + 1}/${maxItems})`}
            placeholderTextColor="rgba(250, 245, 230, 0.5)" // Cream muted for placeholders
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              !currentItem.trim() && styles.addButtonDisabled,
            ]}
            onPress={addItem}
            disabled={!currentItem.trim()}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function NightlyCheckInScreen() {
  // Authentication hook to get current user
  const { getCurrentUserId, loading: authLoading } = useAuth();
  const [responses, setResponses] = useState<NightlyCheckInData>({
    improvements: '',
    amazing_things: [],
    accomplishments: [],
    emotions: '',
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(true);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [sessionStartTime] = useState(new Date());
  const [savedResult, setSavedResult] = useState<{
    checkInId: string;
    memoryId: string;
    hasReflection: boolean;
  } | null>(null);

  // Check if user has already completed nightly check-in today
  useEffect(() => {
    const checkExistingCheckIn = async () => {
      try {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
          setIsCheckingExisting(false);
          return;
        }

        const hasCompleted = await nightlyCheckInService.hasCompletedTodayNightlyCheckIn(currentUserId);
        if (hasCompleted) {
          setAlreadyCompletedToday(true);
          // Show a completed state without allowing form submission
        }
      } catch (error) {
        console.error('Error checking existing nightly check-in:', error);
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
      key: 'improvements' as keyof NightlyCheckInData,
      title: 'Daily Reflection',
      question: 'How could I have made today better?',
      placeholder: 'What would you change about today if you could do it over?',
      type: 'text' as const,
    },
    {
      key: 'amazing_things' as keyof NightlyCheckInData,
      title: 'Amazing Moments',
      question: '3 amazing things that happened today...',
      placeholder: 'Something amazing that happened',
      type: 'list' as const,
    },
    {
      key: 'accomplishments' as keyof NightlyCheckInData,
      title: 'Daily Wins',
      question: '3 things you accomplished',
      placeholder: 'Something you accomplished today',
      type: 'list' as const,
    },
    {
      key: 'emotions' as keyof NightlyCheckInData,
      title: 'Emotional Check-in',
      question: 'What made you happy/sad today?',
      placeholder: 'Share what emotions you felt today and what caused them...',
      type: 'text' as const,
    },
  ];

  const currentQuestion = questions[currentStep];

  const handleTextChange = (text: string) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.key]: text,
    }));
  };

  const handleListChange = (items: string[]) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.key]: items,
    }));
  };

  const isCurrentStepComplete = () => {
    if (currentQuestion.type === 'text') {
      return (responses[currentQuestion.key] as string).trim().length > 0;
    } else {
      return (responses[currentQuestion.key] as string[]).length > 0;
    }
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
      // Get current user ID from auth
      const currentUserId = getCurrentUserId();
      
      if (!currentUserId) {
        throw new Error('Please sign in to save your check-in');
      }

      // Calculate session duration with validation (ensure positive and within reasonable bounds)
      const rawDuration = Math.round((Date.now() - sessionStartTime.getTime()) / 60000);
      const sessionDuration = Math.max(1, Math.min(rawDuration, 720)); // 1-720 minutes (12 hours max)
      
      const submission: NightlyCheckInSubmission = {
        improvements: responses.improvements,
        amazing_things: responses.amazing_things,
        accomplishments: responses.accomplishments,
        emotions: responses.emotions,
      };

      // Save to Supabase using the service
      const result = await nightlyCheckInService.submitNightlyCheckIn(
        currentUserId,
        submission,
        sessionDuration
      );

      const resultData = {
        checkInId: result.checkIn.id,
        memoryId: result.memoryId,
        hasReflection: !!result.morningReflection,
      };
      
      console.log('Nightly check-in saved successfully:', resultData);
      setSavedResult(resultData);
      setIsCompleted(true);
    } catch (error) {
      console.error('Error submitting nightly check-in:', error);
      
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
        <Text style={styles.loadingText}>Checking your nightly check-in status...</Text>
      </View>
    );
  }

  // Already completed state - prevent duplicate submissions
  if (alreadyCompletedToday) {
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedTitle}>🌙 Nightly Check-in Already Complete!</Text>
        <Text style={styles.completedSubtitle}>
          You've already completed your nightly check-in for today.
        </Text>
        <Text style={styles.completedMessage}>
          Each day allows only one nightly check-in to maintain the integrity of your daily reflection practice. Come back tomorrow for your next check-in!
        </Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {/* Navigate back to main screen */}}
        >
          <Text style={styles.doneButtonText}>Good Night!</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Completed state
  if (isCompleted) {
    const sessionDuration = Math.max(0, Math.round((Date.now() - sessionStartTime.getTime()) / 60000));
    
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedTitle}>🌙 Nightly Check-in Complete!</Text>
        <Text style={styles.completedSubtitle}>
          You spent {sessionDuration} minutes reflecting on your day.
        </Text>
        <Text style={styles.completedMessage}>
          Your reflections have been saved{savedResult?.hasReflection ? ' with AI insights from your morning vision' : ''}. Sleep well knowing you've captured the wisdom of your day.
        </Text>
        {savedResult && (
          <Text style={styles.completedDetails}>
            ✓ Check-in saved to database{'\n'}
            ✓ Stored in AI memory for future context{'\n'}
            {savedResult.hasReflection && '✓ Generated vision alignment analysis'}
          </Text>
        )}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {/* Navigate back */}}
        >
          <Text style={styles.doneButtonText}>Good Night!</Text>
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
          <Text style={styles.title}>Nightly Check-in</Text>
          <Text style={styles.subtitle}>
            Reflect on your day and celebrate your growth
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
          
          {currentQuestion.type === 'text' ? (
            <TextInput
              style={styles.textInput}
              value={responses[currentQuestion.key] as string}
              onChangeText={handleTextChange}
              placeholder={currentQuestion.placeholder}
              placeholderTextColor="#5A4E41" // Duson dark beige-gray
              multiline
              textAlignVertical="top"
              autoFocus
            />
          ) : (
            <ListInput
              title=""
              items={responses[currentQuestion.key] as string[]}
              onItemsChange={handleListChange}
              placeholder={currentQuestion.placeholder}
              maxItems={3}
            />
          )}
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
                {currentStep === questions.length - 1 ? 'Complete Nightly Check-in' : 'Next'}
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  listInputContainer: {
    marginTop: 8,
  },
  listInputTitle: {
    fontSize: 14,
    color: '#FD1F4A', // Main Duson Crimson (was #8b5cf6)
    marginBottom: 12,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#454344', // Even lighter charcoal for elevated surfaces (was #16213e)
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity (was #374151)
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#FAF5E6', // Duson Cream for primary text (was #ffffff)
    lineHeight: 20,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FD1F4A', // Main Duson Crimson (was #ef4444)
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    color: '#FAF5E6', // Duson Cream (was #ffffff)
    fontSize: 16,
    fontWeight: 'bold',
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: '#454344', // Even lighter charcoal for elevated surfaces (was #16213e)
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FAF5E6', // Duson Cream for primary text (was #ffffff)
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity (was #374151)
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#FD1F4A', // Main Duson Crimson (was #8b5cf6)
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(250, 245, 230, 0.2)', // Cream with low opacity (was #4b5563)
  },
  addButtonText: {
    color: '#FAF5E6', // Duson Cream (was #ffffff)
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 32,
    fontFamily: 'monospace',
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
    color: '#FD1F4A', // Main Duson Crimson (was #8b5cf6)
    fontSize: 16,
  },
});