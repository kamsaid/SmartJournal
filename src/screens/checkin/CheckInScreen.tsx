import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { socraticEngine } from '@/ai/socraticEngine';
import { aiOrchestrator } from '@/services/openai';
import { DEMO_USER_UUID } from '@/utils/uuid';

export default function CheckInScreen() {
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [userResponse, setUserResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  useEffect(() => {
    generateInitialQuestion();
  }, []);

  const generateInitialQuestion = async () => {
    setIsLoading(true);
    try {
      // Mock user context for demo - in real app this would come from auth/storage
      const mockContext = {
        user: {
          id: DEMO_USER_UUID,
          email: 'demo@example.com',
          current_phase: 1 as const,
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        currentPhase: null,
        currentDepthLevel: 1,
      };

      const question = await socraticEngine.generateQuestion(mockContext);
      setCurrentQuestion(question.question);
    } catch (error) {
      console.error('Error generating question:', error);
      setCurrentQuestion('What pattern from your past are you unconsciously recreating, and what would breaking it unlock?');
    }
    setIsLoading(false);
  };

  const handleSubmitResponse = async () => {
    if (!userResponse.trim()) return;

    setIsLoading(true);
    const newEntry = {
      role: 'user',
      content: userResponse,
      timestamp: new Date().toISOString(),
    };

    setConversationHistory(prev => [...prev, 
      { role: 'ai', content: currentQuestion, timestamp: new Date().toISOString() },
      newEntry
    ]);

    try {
      // Process the response and generate follow-up
      const mockContext = {
        user: {
          id: DEMO_USER_UUID,
          email: 'demo@example.com',
          current_phase: 1 as const,
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        currentPhase: null,
        currentDepthLevel: Math.min(conversationHistory.length / 2 + 1, 5),
        conversationHistory: [...conversationHistory, newEntry],
      };

      const aiResponse = await aiOrchestrator.generateSocraticQuestion(mockContext, userResponse);
      setCurrentQuestion(aiResponse.content);
      setUserResponse('');
    } catch (error) {
      console.error('Error processing response:', error);
      setCurrentQuestion('How does what you just shared connect to other areas of your life?');
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Daily Check-In</Text>
        <Text style={styles.subtitle}>Phase 1: Recognition</Text>

        {/* Conversation History */}
        {conversationHistory.map((entry, index) => (
          <View
            key={index}
            style={[
              styles.messageContainer,
              entry.role === 'ai' ? styles.aiMessage : styles.userMessage,
            ]}
          >
            <Text style={styles.messageText}>{entry.content}</Text>
          </View>
        ))}

        {/* Current Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionLabel}>Reflection Question:</Text>
          <Text style={styles.question}>{currentQuestion}</Text>
        </View>
      </ScrollView>

      {/* Response Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Share your thoughts..."
          placeholderTextColor="#6b7280"
          value={userResponse}
          onChangeText={setUserResponse}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.submitButton, !userResponse.trim() && styles.submitButtonDisabled]}
          onPress={handleSubmitResponse}
          disabled={!userResponse.trim() || isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Processing...' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    flex: 1,
    padding: 20,
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
    marginBottom: 32,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  aiMessage: {
    backgroundColor: '#1f2937',
    marginRight: 40,
  },
  userMessage: {
    backgroundColor: '#8b5cf6',
    marginLeft: 40,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
  },
  questionContainer: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  questionLabel: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  question: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 26,
    fontWeight: '500',
  },
  inputContainer: {
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});