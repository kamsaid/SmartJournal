// ChallengeCard.tsx - Daily Challenge Display and Interaction

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { DailyChallenge, ChallengeType } from '@/types/database';

interface ChallengeCardProps {
  challenge: DailyChallenge;
  alternativeChallenge?: DailyChallenge;
  explanation: string;
  whyThisMatters: string;
  expectedInsights: string[];
  onComplete: (completionNotes: string) => void;
  onSwap: () => void;
  canSwap: boolean;
}

export default function ChallengeCard({
  challenge,
  alternativeChallenge,
  explanation,
  whyThisMatters,
  expectedInsights,
  onComplete,
  onSwap,
  canSwap,
}: ChallengeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');

  const getChallengeIcon = (type: ChallengeType): string => {
    switch (type) {
      case 'observation': return '👁️';
      case 'experiment': return '🧪';
      case 'action': return '⚡';
      case 'reflection': return '🤔';
      default: return '✨';
    }
  };

  const getChallengeTypeLabel = (type: ChallengeType): string => {
    switch (type) {
      case 'observation': return 'Notice';
      case 'experiment': return 'Try';
      case 'action': return 'Do';
      case 'reflection': return 'Reflect';
      default: return 'Explore';
    }
  };

  const getDifficultyLabel = (level: number): string => {
    if (level <= 2) return 'Gentle';
    if (level <= 3) return 'Moderate';
    if (level <= 4) return 'Challenging';
    return 'Advanced';
  };

  const handleComplete = () => {
    if (completionNotes.trim().length < 10) {
      return; // Require some reflection
    }
    onComplete(completionNotes);
    setShowCompletion(false);
    setCompletionNotes('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{getChallengeIcon(challenge.challenge_type)}</Text>
          <View>
            <Text style={styles.typeLabel}>
              {getChallengeTypeLabel(challenge.challenge_type)} Challenge
            </Text>
            <Text style={styles.difficultyLabel}>
              {getDifficultyLabel(challenge.difficulty_level)} • {challenge.growth_area_focus}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => setShowDetails(!showDetails)}
        >
          <Text style={styles.detailsButtonText}>
            {showDetails ? '▼' : '▶️'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.challengeText}>{challenge.challenge_text}</Text>

      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.explanation}>{explanation}</Text>
          
          <View style={styles.whySection}>
            <Text style={styles.sectionTitle}>Why this matters:</Text>
            <Text style={styles.whyText}>{whyThisMatters}</Text>
          </View>

          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>What you might discover:</Text>
            {expectedInsights.map((insight, index) => (
              <Text key={index} style={styles.insightItem}>• {insight}</Text>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => setShowCompletion(true)}
        >
          <Text style={styles.completeButtonText}>Complete Challenge</Text>
        </TouchableOpacity>

        {canSwap && alternativeChallenge && (
          <TouchableOpacity
            style={styles.swapButton}
            onPress={onSwap}
          >
            <Text style={styles.swapButtonText}>Try Different</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Completion Modal */}
      <Modal
        visible={showCompletion}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompletion(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.completionModal}>
            <Text style={styles.modalTitle}>How did it go?</Text>
            <Text style={styles.modalSubtitle}>
              Share what you noticed or learned from this challenge
            </Text>
            
            <TextInput
              style={styles.completionInput}
              value={completionNotes}
              onChangeText={setCompletionNotes}
              placeholder="I noticed that... I learned... I felt..."
              placeholderTextColor="#5A4E41" // Duson dark beige-gray
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={300}
            />
            
            <Text style={styles.charCounter}>
              {completionNotes.length}/300 characters
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCompletion(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  completionNotes.trim().length < 10 && styles.submitButtonDisabled,
                ]}
                onPress={handleComplete}
                disabled={completionNotes.trim().length < 10}
              >
                <Text style={styles.submitButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeLabel: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 2,
  },
  difficultyLabel: {
    fontSize: 12,
    color: '#a855f7',
    textTransform: 'capitalize',
  },
  detailsButton: {
    padding: 8,
  },
  detailsButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  challengeText: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 26,
    marginBottom: 16,
    fontWeight: '500',
  },
  detailsContainer: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  explanation: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 12,
  },
  whySection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 4,
  },
  whyText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  insightsSection: {
    marginBottom: 8,
  },
  insightItem: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginLeft: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  swapButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  swapButtonText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  completionInput: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  charCounter: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 8,
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