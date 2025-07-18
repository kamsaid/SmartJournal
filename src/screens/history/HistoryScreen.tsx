import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function HistoryScreen() {
  // Mock data for demonstration
  const mockReflections = [
    {
      id: '1',
      date: '2024-01-15',
      depth: 7,
      insights: ['Recognized pattern of reactive decision-making', 'Connected health habits to energy management'],
    },
    {
      id: '2',
      date: '2024-01-14',
      depth: 5,
      insights: ['Identified leverage point in morning routine'],
    },
    {
      id: '3',
      date: '2024-01-13',
      depth: 6,
      insights: ['Uncovered assumption about work-life balance', 'Saw connection between environment and focus'],
    },
  ];

  const mockPhaseProgress = {
    currentPhase: 1,
    phaseName: 'Recognition - The Two Types of People',
    daysInPhase: 12,
    completionProgress: 0.6,
    keyMilestones: [
      { completed: true, text: 'Recognize reactive vs proactive patterns' },
      { completed: true, text: 'Identify recurring problems' },
      { completed: false, text: 'Question underlying assumptions' },
      { completed: false, text: 'Begin systems thinking' },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Journey</Text>

      {/* Phase Progress */}
      <View style={styles.phaseContainer}>
        <Text style={styles.phaseTitle}>Current Phase</Text>
        <Text style={styles.phaseName}>{mockPhaseProgress.phaseName}</Text>
        <Text style={styles.phaseInfo}>Day {mockPhaseProgress.daysInPhase}</Text>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${mockPhaseProgress.completionProgress * 100}%` }
            ]} 
          />
        </View>

        <View style={styles.milestonesContainer}>
          <Text style={styles.milestonesTitle}>Milestones</Text>
          {mockPhaseProgress.keyMilestones.map((milestone, index) => (
            <View key={index} style={styles.milestoneItem}>
              <View 
                style={[
                  styles.milestoneIndicator,
                  milestone.completed && styles.milestoneCompleted
                ]} 
              />
              <Text 
                style={[
                  styles.milestoneText,
                  milestone.completed && styles.milestoneTextCompleted
                ]}
              >
                {milestone.text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Reflections */}
      <View style={styles.reflectionsContainer}>
        <Text style={styles.sectionTitle}>Recent Reflections</Text>
        
        {mockReflections.map((reflection) => (
          <TouchableOpacity key={reflection.id} style={styles.reflectionCard}>
            <View style={styles.reflectionHeader}>
              <Text style={styles.reflectionDate}>{reflection.date}</Text>
              <View style={styles.depthBadge}>
                <Text style={styles.depthText}>Depth {reflection.depth}/10</Text>
              </View>
            </View>
            
            <View style={styles.insightsContainer}>
              {reflection.insights.map((insight, index) => (
                <Text key={index} style={styles.insightText}>• {insight}</Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transformation Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Transformation Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>6.2</Text>
            <Text style={styles.statLabel}>Avg Depth</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Insights</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Patterns</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
  },
  phaseContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  phaseTitle: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 4,
  },
  phaseName: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 4,
  },
  phaseInfo: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 3,
  },
  milestonesContainer: {
    marginTop: 8,
  },
  milestonesTitle: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#374151',
    marginRight: 12,
  },
  milestoneCompleted: {
    backgroundColor: '#10b981',
  },
  milestoneText: {
    fontSize: 14,
    color: '#9ca3af',
    flex: 1,
  },
  milestoneTextCompleted: {
    color: '#d1d5db',
  },
  reflectionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  reflectionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reflectionDate: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  depthBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  depthText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  insightsContainer: {
    gap: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});