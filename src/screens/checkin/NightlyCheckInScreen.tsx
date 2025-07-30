import React, { useState } from 'react';
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
            placeholderTextColor="#6b7280"
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
  const [sessionStartTime] = useState(new Date());
  const [savedResult, setSavedResult] = useState<{
    checkInId: string;
    memoryId: string;
    hasReflection: boolean;
  } | null>(null);

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
          { text: 'Retry', onPress: handleSubmit }
        ]
      );
    }
    setIsSubmitting(false);
  };

  const getProgress = () => {
    return ((currentStep + 1) / questions.length) * 100;
  };

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
              placeholderTextColor="#6b7280"
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
    backgroundColor: '#0f0f23',
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
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8b5cf6',
    lineHeight: 22,
    marginBottom: 20,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  questionContainer: {
    backgroundColor: '#1a1a2e',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#a855f7',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 20,
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#374151',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  listInputContainer: {
    marginTop: 8,
  },
  listInputTitle: {
    fontSize: 14,
    color: '#8b5cf6',
    marginBottom: 12,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    color: '#ffffff',
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
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#374151',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  addButtonText: {
    color: '#ffffff',
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
    borderColor: '#6b7280',
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    padding: 40,
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  completedSubtitle: {
    fontSize: 18,
    color: '#8b5cf6',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  completedMessage: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  completedDetails: {
    fontSize: 14,
    color: '#10b981',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    fontFamily: 'monospace',
  },
  doneButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});