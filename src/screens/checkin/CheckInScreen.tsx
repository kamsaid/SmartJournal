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
} from 'react-native';
import { User, DailyCheckIn, UserMemory } from '@/types/database';
import { questionSelector, QuestionSelection, SelectedQuestion } from '@/services/questions/QuestionSelector';
import { challengeGenerator, ChallengeOptions } from '@/services/challenges/ChallengeGenerator';
import { memoryService } from '@/services/memory/MemoryService';
import { DEMO_USER_UUID } from '@/utils/uuid';

// Import question components
import SliderQuestion from '@/components/QuestionTypes/SliderQuestion';
import YesNoQuestion from '@/components/QuestionTypes/YesNoQuestion';
import TextQuestion from '@/components/QuestionTypes/TextQuestion';
import ChallengeCard from '@/components/ChallengeCard/ChallengeCard';

interface QuestionResponse {
  questionId: string;
  response: string | number | boolean;
  isComplete: boolean;
}

export default function CheckInScreen() {
  // Core state
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'questions' | 'challenge' | 'completed'>('questions');
  
  // Question flow state
  const [questionSelection, setQuestionSelection] = useState<QuestionSelection | null>(null);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Challenge state
  const [challengeOptions, setChallengeOptions] = useState<ChallengeOptions | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<'primary' | 'alternative'>('primary');
  
  // Session state
  const [sessionStartTime] = useState(new Date());
  const [memoryReferences, setMemoryReferences] = useState<string[]>([]);
  
  // Mock user data (replace with actual user context)
  const mockUser: User = {
    id: DEMO_USER_UUID,
    email: 'demo@example.com',
    current_phase: 1,
    transformation_start_date: new Date().toISOString(),
    life_systems_data: {
      health: {},
      wealth: {},
      relationships: {},
      growth: {},
      purpose: {},
      environment: {},
    },
    profile_data: {},
    consecutive_completions: 5,
    total_memories: 12,
    ai_readiness_score: 0.6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  useEffect(() => {
    initializeDailyCheckIn();
  }, []);

  // Initialize daily check-in with personalized questions
  const initializeDailyCheckIn = async () => {
    setIsLoading(true);
    try {
      // Get recent memories for context
      const recentMemories = await memoryService.getRecentMemories(mockUser.id, 7, 5);
      
      // Select today's questions based on user's journey and patterns
      const selection = await questionSelector.selectDailyQuestions(
        mockUser,
        recentMemories,
        // Could include yesterday's responses here
      );
      
      setQuestionSelection(selection);
      setMemoryReferences(selection.memoryReferences);
      
      // Initialize response tracking
      const initialResponses: QuestionResponse[] = selection.questions.map(q => ({
        questionId: q.id,
        response: q.input_type === 'slider' ? 5 : q.input_type === 'yes_no' ? false : '',
        isComplete: false,
      }));
      
      setResponses(initialResponses);
      
    } catch (error) {
      console.error('Error initializing check-in:', error);
      // Set fallback questions
      setQuestionSelection({
        questions: [{
          id: 'fallback-1',
          question_text: 'How are you feeling today?',
          input_type: 'slider',
          depth_level: 1,
          scientific_method: 'baseline',
          expected_duration_minutes: 1,
        }],
        memoryReferences: [],
        totalEstimatedMinutes: 3,
        adaptationReason: 'Getting started',
      });
    }
    setIsLoading(false);
  };

  // Handle response to current question
  const handleQuestionResponse = (response: string | number | boolean) => {
    if (!questionSelection) return;
    
    const updatedResponses = [...responses];
    updatedResponses[currentQuestionIndex] = {
      questionId: questionSelection.questions[currentQuestionIndex].id,
      response,
      isComplete: true,
    };
    
    setResponses(updatedResponses);
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (!questionSelection) return;
    
    if (currentQuestionIndex < questionSelection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeQuestionPhase();
    }
  };

  // Complete question phase and generate challenge
  const completeQuestionPhase = async () => {
    if (!questionSelection) return;
    
    setIsProcessing(true);
    try {
      // Store memories for each response
      for (let i = 0; i < responses.length; i++) {
        const question = questionSelection.questions[i];
        const response = responses[i];
        
        if (response.isComplete && typeof response.response === 'string') {
          await memoryService.storeMemory(
            mockUser.id,
            response.response,
            new Date().toISOString().split('T')[0],
            question.question_text
          );
        }
      }
      
      // Generate today's challenge based on responses
      const responseTexts = responses
        .filter(r => r.isComplete && typeof r.response === 'string')
        .map(r => r.response as string);
      
      const patterns = await memoryService.identifyMemoryPatterns(mockUser.id);
      
      const challengeContext = {
        user: mockUser,
        todayResponses: responseTexts,
        recentMemories: await memoryService.getRecentMemories(mockUser.id, 7, 5),
        patterns,
        currentStruggles: [], // Extract from responses
        growthEdge: 'self-awareness', // Determine from analysis
      };
      
      const challenge = await challengeGenerator.generateDailyChallenge(challengeContext);
      setChallengeOptions(challenge);
      setCurrentStep('challenge');
      
    } catch (error) {
      console.error('Error completing question phase:', error);
    }
    
    setIsProcessing(false);
  };

  // Complete challenge
  const handleChallengeComplete = async (completionNotes: string) => {
    if (!challengeOptions) return;
    
    try {
      const activeChallenge = selectedChallenge === 'primary' 
        ? challengeOptions.primary 
        : challengeOptions.alternative;
      
      await challengeGenerator.completeChallenge(
        activeChallenge.id,
        completionNotes,
        mockUser.id
      );
      
      // Store completion as memory
      await memoryService.storeMemory(
        mockUser.id,
        `Challenge completed: ${activeChallenge.challenge_text}. ${completionNotes}`,
        new Date().toISOString().split('T')[0],
        'Daily Challenge'
      );
      
      setCurrentStep('completed');
      
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };

  // Swap to alternative challenge
  const handleChallengeSwap = () => {
    setSelectedChallenge(selectedChallenge === 'primary' ? 'alternative' : 'primary');
  };

  // Get current question being displayed
  const getCurrentQuestion = (): SelectedQuestion | null => {
    if (!questionSelection || currentQuestionIndex >= questionSelection.questions.length) {
      return null;
    }
    return questionSelection.questions[currentQuestionIndex];
  };

  // Check if current response is complete
  const isCurrentResponseComplete = (): boolean => {
    const currentResponse = responses[currentQuestionIndex];
    if (!currentResponse) return false;
    
    const question = getCurrentQuestion();
    if (!question) return false;
    
    if (question.input_type === 'slider') {
      return typeof currentResponse.response === 'number';
    } else if (question.input_type === 'yes_no') {
      return currentResponse.response !== null;
    } else {
      return typeof currentResponse.response === 'string' && currentResponse.response.trim().length > 0;
    }
  };

  // Calculate progress
  const getProgress = () => {
    const completed = responses.filter(r => r.isComplete).length;
    const total = questionSelection?.questions.length || 1;
    return { completed, total, percentage: (completed / total) * 100 };
  };

  // Render current question based on type
  const renderCurrentQuestion = () => {
    const question = getCurrentQuestion();
    const currentResponse = responses[currentQuestionIndex];
    
    if (!question || !currentResponse) return null;
    
    const memoryContext = currentQuestionIndex === 0 && memoryReferences.length > 0 
      ? memoryReferences[0] 
      : question.memory_context;
    
    switch (question.input_type) {
      case 'slider':
        return (
          <SliderQuestion
            question={question.question_text}
            value={typeof currentResponse.response === 'number' ? currentResponse.response : 5}
            onValueChange={(value) => handleQuestionResponse(value)}
            memoryContext={memoryContext}
          />
        );
      
      case 'yes_no':
        return (
          <YesNoQuestion
            question={question.question_text}
            value={typeof currentResponse.response === 'boolean' ? currentResponse.response : null}
            onValueChange={(value) => handleQuestionResponse(value)}
            memoryContext={memoryContext}
          />
        );
      
      case 'short_text':
        return (
          <TextQuestion
            question={question.question_text}
            value={typeof currentResponse.response === 'string' ? currentResponse.response : ''}
            onValueChange={(value) => handleQuestionResponse(value)}
            memoryContext={memoryContext}
          />
        );
      
      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Preparing your personalized check-in...</Text>
      </View>
    );
  }

  // Completed state
  if (currentStep === 'completed') {
    const sessionDuration = Math.round((Date.now() - sessionStartTime.getTime()) / 60000);
    
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedTitle}>🎉 Check-in Complete!</Text>
        <Text style={styles.completedSubtitle}>
          You spent {sessionDuration} minutes investing in your growth today.
        </Text>
        <Text style={styles.completedMessage}>
          Your insights have been saved and will help me ask even better questions tomorrow.
        </Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {/* Navigate back or close */}}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main render
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header with progress */}
        <View style={styles.header}>
          <Text style={styles.title}>Daily Check-in</Text>
          <Text style={styles.subtitle}>
            Phase {mockUser.current_phase} • {questionSelection?.adaptationReason || 'Personalized for you'}
          </Text>
          
          {questionSelection && currentStep === 'questions' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${getProgress().percentage}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>
                {getProgress().completed} of {getProgress().total} questions
              </Text>
            </View>
          )}
        </View>

        {/* Memory references */}
        {memoryReferences.length > 0 && currentStep === 'questions' && (
          <View style={styles.memoryContainer}>
            <Text style={styles.memoryTitle}>Continuing our conversation...</Text>
            {memoryReferences.slice(0, 2).map((reference, index) => (
              <Text key={index} style={styles.memoryText}>{reference}</Text>
            ))}
          </View>
        )}

        {/* Question Phase */}
        {currentStep === 'questions' && (
          <View style={styles.questionContainer}>
            {renderCurrentQuestion()}
            
            {isCurrentResponseComplete() && (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNextQuestion}
                disabled={isProcessing}
              >
                <Text style={styles.nextButtonText}>
                  {currentQuestionIndex < (questionSelection?.questions.length || 1) - 1 
                    ? 'Next Question' 
                    : 'Get Today\'s Challenge'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Challenge Phase */}
        {currentStep === 'challenge' && challengeOptions && (
          <ChallengeCard
            challenge={selectedChallenge === 'primary' ? challengeOptions.primary : challengeOptions.alternative}
            alternativeChallenge={selectedChallenge === 'primary' ? challengeOptions.alternative : challengeOptions.primary}
            explanation={challengeOptions.explanation}
            whyThisMatters={challengeOptions.whyThisMatters}
            expectedInsights={challengeOptions.expectedInsights}
            onComplete={handleChallengeComplete}
            onSwap={handleChallengeSwap}
            canSwap={selectedChallenge === 'primary' ? challengeOptions.primary.swap_count === 0 : challengeOptions.alternative.swap_count === 0}
          />
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#8b5cf6" />
            <Text style={styles.processingText}>
              Creating your personalized challenge...
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
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
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    padding: 40,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#8b5cf6',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  completedMessage: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8b5cf6',
    lineHeight: 20,
    marginBottom: 16,
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
  memoryContainer: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
  },
  memoryTitle: {
    fontSize: 14,
    color: '#a855f7',
    fontWeight: '600',
    marginBottom: 8,
  },
  memoryText: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 18,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  questionContainer: {
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginBottom: 16,
  },
  processingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#8b5cf6',
    fontStyle: 'italic',
  },
});