// SliderQuestion.tsx - Slider input for 1-10 scale questions

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SliderQuestionProps {
  question: string;
  value: number;
  onValueChange: (value: number) => void;
  memoryContext?: string;
}

export default function SliderQuestion({ 
  question, 
  value, 
  onValueChange,
  memoryContext 
}: SliderQuestionProps) {
  const [currentValue, setCurrentValue] = useState(value);

  const handleValueChange = (newValue: number) => {
    setCurrentValue(newValue);
    onValueChange(Math.round(newValue));
  };

  const getEmoji = (val: number): string => {
    if (val <= 2) return '😟';
    if (val <= 4) return '😐';
    if (val <= 6) return '🙂';
    if (val <= 8) return '😊';
    return '🤩';
  };

  const getLabel = (val: number): string => {
    if (val <= 2) return 'Low';
    if (val <= 4) return 'Below Average';
    if (val <= 6) return 'Average';
    if (val <= 8) return 'Good';
    return 'Excellent';
  };

  return (
    <View style={styles.container}>
      {memoryContext && (
        <Text style={styles.memoryContext}>{memoryContext}</Text>
      )}
      
      <Text style={styles.question}>{question}</Text>
      
      <View style={styles.sliderContainer}>
        <View style={styles.valueDisplay}>
          <Text style={styles.emoji}>{getEmoji(currentValue)}</Text>
          <Text style={styles.valueText}>{Math.round(currentValue)}/10</Text>
          <Text style={styles.labelText}>{getLabel(currentValue)}</Text>
        </View>
        
        <View style={styles.buttonGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.numberButton,
                Math.round(currentValue) === num && styles.numberButtonSelected,
              ]}
              onPress={() => handleValueChange(num)}
            >
              <Text style={[
                styles.numberText,
                Math.round(currentValue) === num && styles.numberTextSelected,
              ]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>1</Text>
          <Text style={styles.scaleLabel}>5</Text>
          <Text style={styles.scaleLabel}>10</Text>
        </View>
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
    marginBottom: 20,
    lineHeight: 26,
  },
  sliderContainer: {
    paddingHorizontal: 16,
  },
  valueDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  labelText: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: '500',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  numberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  numberButtonSelected: {
    backgroundColor: '#8b5cf6',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
  },
  numberTextSelected: {
    color: '#ffffff',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  scaleLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});