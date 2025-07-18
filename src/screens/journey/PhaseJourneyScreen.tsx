import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { phaseManager, PhaseAssessment } from '@/services/transformation/phaseManager';

const { width } = Dimensions.get('window');

interface PhaseJourneyScreenProps {
  navigation: any;
}

interface PhaseNode {
  phase: number;
  name: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  progress: number;
  daysInPhase?: number;
  estimatedDays?: number;
}

export default function PhaseJourneyScreen({ navigation }: PhaseJourneyScreenProps) {
  const [phaseNodes, setPhaseNodes] = useState<PhaseNode[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<PhaseAssessment | null>(null);
  const [encouragement, setEncouragement] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhaseJourney();
  }, []);

  const loadPhaseJourney = async () => {
    try {
      const userId = 'demo-user'; // In real app, get from auth
      
      // Get current assessment
      const assessment = await phaseManager.performRealTimeAssessment(userId);
      setCurrentAssessment(assessment);

      // Get phase encouragement
      const encouragementMsg = await phaseManager.getPhaseEncouragement(userId);
      setEncouragement(encouragementMsg);

      // Build phase nodes
      const nodes: PhaseNode[] = [
        {
          phase: 1,
          name: 'Recognition',
          description: 'The Two Types of People',
          status: assessment.phase_number > 1 ? 'completed' : 'current',
          progress: assessment.phase_number === 1 ? assessment.readiness_score : 1,
          daysInPhase: assessment.phase_number === 1 ? calculateDaysInPhase(assessment.assessment_date) : undefined,
          estimatedDays: assessment.phase_number === 1 ? assessment.estimated_completion_days : undefined,
        },
        {
          phase: 2,
          name: 'Understanding',
          description: 'The Leverage Principle',
          status: assessment.phase_number > 2 ? 'completed' : assessment.phase_number === 2 ? 'current' : 'locked',
          progress: assessment.phase_number === 2 ? assessment.readiness_score : assessment.phase_number > 2 ? 1 : 0,
          daysInPhase: assessment.phase_number === 2 ? calculateDaysInPhase(assessment.assessment_date) : undefined,
          estimatedDays: assessment.phase_number === 2 ? assessment.estimated_completion_days : undefined,
        },
        {
          phase: 3,
          name: 'Realization',
          description: 'The Meta-Life Loop',
          status: assessment.phase_number > 3 ? 'completed' : assessment.phase_number === 3 ? 'current' : 'locked',
          progress: assessment.phase_number === 3 ? assessment.readiness_score : assessment.phase_number > 3 ? 1 : 0,
          daysInPhase: assessment.phase_number === 3 ? calculateDaysInPhase(assessment.assessment_date) : undefined,
          estimatedDays: assessment.phase_number === 3 ? assessment.estimated_completion_days : undefined,
        },
        {
          phase: 4,
          name: 'Transformation',
          description: 'Infinite Leverage',
          status: assessment.phase_number > 4 ? 'completed' : assessment.phase_number === 4 ? 'current' : 'locked',
          progress: assessment.phase_number === 4 ? assessment.readiness_score : assessment.phase_number > 4 ? 1 : 0,
          daysInPhase: assessment.phase_number === 4 ? calculateDaysInPhase(assessment.assessment_date) : undefined,
          estimatedDays: assessment.phase_number === 4 ? assessment.estimated_completion_days : undefined,
        },
        {
          phase: 5,
          name: 'Vision',
          description: 'The Life You\'re Capable Of',
          status: assessment.phase_number > 5 ? 'completed' : assessment.phase_number === 5 ? 'current' : 'locked',
          progress: assessment.phase_number === 5 ? assessment.readiness_score : assessment.phase_number > 5 ? 1 : 0,
          daysInPhase: assessment.phase_number === 5 ? calculateDaysInPhase(assessment.assessment_date) : undefined,
          estimatedDays: assessment.phase_number === 5 ? assessment.estimated_completion_days : undefined,
        },
        {
          phase: 6,
          name: 'Reality',
          description: 'The Architected Life',
          status: assessment.phase_number > 6 ? 'completed' : assessment.phase_number === 6 ? 'current' : 'locked',
          progress: assessment.phase_number === 6 ? assessment.readiness_score : assessment.phase_number > 6 ? 1 : 0,
          daysInPhase: assessment.phase_number === 6 ? calculateDaysInPhase(assessment.assessment_date) : undefined,
          estimatedDays: assessment.phase_number === 6 ? assessment.estimated_completion_days : undefined,
        },
        {
          phase: 7,
          name: 'Integration',
          description: 'The Complete Transformation',
          status: assessment.phase_number === 7 ? 'current' : 'locked',
          progress: assessment.phase_number === 7 ? assessment.readiness_score : 0,
          daysInPhase: assessment.phase_number === 7 ? calculateDaysInPhase(assessment.assessment_date) : undefined,
          estimatedDays: assessment.phase_number === 7 ? assessment.estimated_completion_days : undefined,
        },
      ];

      setPhaseNodes(nodes);
    } catch (error) {
      console.error('Error loading phase journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysInPhase = (assessmentDate: string): number => {
    const now = new Date();
    const assessment = new Date(assessmentDate);
    const diffTime = Math.abs(now.getTime() - assessment.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPhaseStatusColor = (status: PhaseNode['status']) => {
    switch (status) {
      case 'completed': return '#10b981'; // Green
      case 'current': return '#8b5cf6';   // Purple
      case 'locked': return '#374151';    // Gray
    }
  };

  const getPhaseStatusIcon = (status: PhaseNode['status']) => {
    switch (status) {
      case 'completed': return '✓';
      case 'current': return '◊';
      case 'locked': return '○';
    }
  };

  const handlePhasePress = (phase: PhaseNode) => {
    if (phase.status === 'locked') return;
    
    // Navigate to phase details
    navigation.navigate('PhaseDetail', { phase: phase.phase });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your transformation journey...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Transformation Journey</Text>
        <Text style={styles.subtitle}>Seven phases from reactive to architect</Text>
      </View>

      {/* Current Phase Status */}
      {currentAssessment && (
        <View style={styles.currentStatusCard}>
          <Text style={styles.currentPhaseLabel}>Currently in Phase {currentAssessment.phase_number}</Text>
          <Text style={styles.currentPhaseName}>
            {phaseNodes.find(p => p.phase === currentAssessment.phase_number)?.name}
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${currentAssessment.readiness_score * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(currentAssessment.readiness_score * 100)}% Ready
            </Text>
          </View>

          {currentAssessment.estimated_completion_days > 0 && (
            <Text style={styles.estimatedCompletion}>
              Estimated completion: {currentAssessment.estimated_completion_days} days
            </Text>
          )}
        </View>
      )}

      {/* Encouragement Message */}
      {encouragement && (
        <View style={styles.encouragementCard}>
          <Text style={styles.encouragementText}>{encouragement}</Text>
        </View>
      )}

      {/* Phase Journey Map */}
      <View style={styles.journeyContainer}>
        {phaseNodes.map((phase, index) => (
          <View key={phase.phase} style={styles.phaseContainer}>
            <TouchableOpacity
              style={[
                styles.phaseNode,
                { backgroundColor: getPhaseStatusColor(phase.status) },
                phase.status === 'locked' && styles.lockedPhase,
              ]}
              onPress={() => handlePhasePress(phase)}
              disabled={phase.status === 'locked'}
            >
              <Text style={styles.phaseIcon}>{getPhaseStatusIcon(phase.status)}</Text>
              <Text style={styles.phaseNumber}>{phase.phase}</Text>
            </TouchableOpacity>

            <View style={styles.phaseInfo}>
              <Text style={styles.phaseName}>{phase.name}</Text>
              <Text style={styles.phaseDescription}>{phase.description}</Text>
              
              {phase.status === 'current' && (
                <View style={styles.currentPhaseDetails}>
                  {phase.progress > 0 && (
                    <View style={styles.miniProgressBar}>
                      <View 
                        style={[
                          styles.miniProgressFill, 
                          { width: `${phase.progress * 100}%` }
                        ]} 
                      />
                    </View>
                  )}
                  
                  {phase.daysInPhase && (
                    <Text style={styles.daysInPhase}>Day {phase.daysInPhase}</Text>
                  )}
                </View>
              )}

              {phase.status === 'completed' && (
                <Text style={styles.completedLabel}>Completed ✓</Text>
              )}
            </View>

            {/* Connection line to next phase */}
            {index < phaseNodes.length - 1 && (
              <View style={[
                styles.connectionLine,
                { 
                  backgroundColor: phase.status === 'completed' ? '#10b981' : '#374151'
                }
              ]} />
            )}
          </View>
        ))}
      </View>

      {/* Phase Insights */}
      {currentAssessment && currentAssessment.breakthrough_indicators.length > 0 && (
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Recent Breakthroughs</Text>
          {currentAssessment.breakthrough_indicators.map((insight, index) => (
            <Text key={index} style={styles.insightText}>• {insight}</Text>
          ))}
        </View>
      )}

      {/* Recommended Actions */}
      {currentAssessment && currentAssessment.recommended_actions.length > 0 && (
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Recommended Actions</Text>
          {currentAssessment.recommended_actions.map((action, index) => (
            <Text key={index} style={styles.actionText}>• {action}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8b5cf6',
    fontSize: 16,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  currentStatusCard: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  currentPhaseLabel: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 4,
  },
  currentPhaseName: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#d1d5db',
    textAlign: 'right',
  },
  estimatedCompletion: {
    fontSize: 12,
    color: '#9ca3af',
  },
  encouragementCard: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  encouragementText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  journeyContainer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  phaseContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  phaseNode: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  lockedPhase: {
    opacity: 0.5,
  },
  phaseIcon: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  phaseNumber: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  phaseInfo: {
    flex: 1,
    paddingTop: 8,
  },
  phaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  phaseDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  currentPhaseDetails: {
    marginTop: 8,
  },
  miniProgressBar: {
    height: 3,
    backgroundColor: '#374151',
    borderRadius: 2,
    marginBottom: 6,
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  daysInPhase: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  completedLabel: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  connectionLine: {
    position: 'absolute',
    left: 29,
    top: 60,
    width: 2,
    height: 32,
  },
  insightsCard: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 4,
  },
  actionsCard: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    marginBottom: 4,
  },
});