// YesNoQuestion.tsx - Yes/No binary choice questions

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface YesNoQuestionProps {
  question: string;
  value: boolean | null;
  onValueChange: (value: boolean) => void;
  memoryContext?: string;
}

export default function YesNoQuestion({ 
  question, 
  value, 
  onValueChange,
  memoryContext 
}: YesNoQuestionProps) {
  return (
    <View style={styles.container}>
      {memoryContext && (
        <Text style={styles.memoryContext}>{memoryContext}</Text>
      )}
      
      <Text style={styles.question}>{question}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            styles.yesButton,
            value === true && styles.selectedYes,
          ]}
          onPress={() => onValueChange(true)}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.optionText,
            value === true && styles.selectedText,
          ]}>
            Yes
          </Text>
          {value === true && (
            <Text style={styles.emoji}>✓</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.optionButton,
            styles.noButton,
            value === false && styles.selectedNo,
          ]}
          onPress={() => onValueChange(false)}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.optionText,
            value === false && styles.selectedText,
          ]}>
            No
          </Text>
          {value === false && (
            <Text style={styles.emoji}>✗</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {value !== null && (
        <View style={styles.confirmationContainer}>
          <Text style={styles.confirmationText}>
            {value ? '👍 Got it!' : '👌 Understood'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  memoryContext: {
    fontSize: 14,
    color: '#a855f7',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 20,
  },
  question: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 20,
    lineHeight: 26,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  yesButton: {
    backgroundColor: '#1f2937',
    borderColor: '#10b981',
  },
  noButton: {
    backgroundColor: '#1f2937',
    borderColor: '#f59e0b',
  },
  selectedYes: {
    backgroundColor: '#065f46',
    borderColor: '#10b981',
  },
  selectedNo: {
    backgroundColor: '#78350f',
    borderColor: '#f59e0b',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1d5db',
  },
  selectedText: {
    color: '#ffffff',
  },
  emoji: {
    fontSize: 18,
    color: '#ffffff',
  },
  confirmationContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  confirmationText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
});