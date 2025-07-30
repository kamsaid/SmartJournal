// TextQuestion.tsx - Short text input for reflective questions

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';

interface TextQuestionProps {
  question: string;
  value: string;
  onValueChange: (value: string) => void;
  memoryContext?: string;
  placeholder?: string;
  maxLength?: number;
}

export default function TextQuestion({ 
  question, 
  value, 
  onValueChange,
  memoryContext,
  placeholder = "Share what's on your mind...",
  maxLength = 200
}: TextQuestionProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(value.length);

  const handleTextChange = (text: string) => {
    setCharCount(text.length);
    onValueChange(text);
  };

  const clearText = () => {
    onValueChange('');
    setCharCount(0);
  };

  return (
    <View style={styles.container}>
      {memoryContext && (
        <Text style={styles.memoryContext}>{memoryContext}</Text>
      )}
      
      <Text style={styles.question}>{question}</Text>
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
      ]}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={handleTextChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={4}
          maxLength={maxLength}
          textAlignVertical="top"
          autoCapitalize="sentences"
          autoCorrect={true}
        />
        
        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearText}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.footer}>
        <Text style={[
          styles.charCount,
          charCount > maxLength * 0.9 && styles.charCountWarning,
        ]}>
          {charCount}/{maxLength}
        </Text>
        
        {value.length > 10 && (
          <Text style={styles.encouragement}>
            Great insight! 💡
          </Text>
        )}
      </View>
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
    marginBottom: 16,
    lineHeight: 26,
  },
  inputContainer: {
    position: 'relative',
    backgroundColor: '#374151',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4b5563',
    padding: 16,
    minHeight: 100,
  },
  inputContainerFocused: {
    borderColor: '#8b5cf6',
    backgroundColor: '#3f3f52',
  },
  textInput: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
    minHeight: 80,
    paddingRight: 40, // Space for clear button
  },
  clearButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  charCountWarning: {
    color: '#f59e0b',
  },
  encouragement: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
});