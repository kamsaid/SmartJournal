import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { systemsFramework, SystemHealth, SystemArchitecture } from '@/services/lifeSystems/systemsFramework';
import { lifeSystemsUtils } from '@/services/lifeSystems';
import { DEMO_USER_UUID } from '@/utils/uuid';

const { width } = Dimensions.get('window');

interface LifeSystemsScreenProps {
  navigation: any;
}

export default function LifeSystemsScreen({ navigation }: LifeSystemsScreenProps) {
  const [systemsData, setSystemsData] = useState<SystemArchitecture | null>(null);
  const [healthMonitoring, setHealthMonitoring] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemsData();
  }, []);

  const loadSystemsData = async () => {
    try {
      const userId = DEMO_USER_UUID; // Using demo UUID for testing - in real app, get from auth
      
      // Load systems architecture
      const architecture = await systemsFramework.assessSystemsHealth(userId);
      setSystemsData(architecture);

      // Load health monitoring
      const monitoring = await systemsFramework.monitorSystemHealth(userId);
      setHealthMonitoring(monitoring);
    } catch (error) {
      console.error('Error loading systems data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSystemPress = (systemType: string) => {
    navigation.navigate('SystemDetail', { systemType });
  };

  const getSystemHealthColor = (score: number) => {
    if (score >= 8) return '#10b981'; // Green
    if (score >= 6) return '#f59e0b'; // Amber
    if (score >= 4) return '#ef4444'; // Red
    return '#6b7280'; // Gray
  };

  const renderSystemCard = (system: SystemHealth) => {
    const systemColor = lifeSystemsUtils.getSystemColor(system.system_type);
    const systemIcon = lifeSystemsUtils.getSystemIcon(system.system_type);
    const systemName = lifeSystemsUtils.getSystemDisplayName(system.system_type);
    const healthColor = getSystemHealthColor(system.overall_score);

    return (
      <TouchableOpacity
        key={system.system_type}
        style={[styles.systemCard, { borderLeftColor: systemColor }]}
        onPress={() => handleSystemPress(system.system_type)}
      >
        <View style={styles.systemHeader}>
          <View style={[styles.systemIcon, { backgroundColor: systemColor + '20' }]}>
            <Text style={[styles.systemIconText, { color: systemColor }]}>
              {systemIcon}
            </Text>
          </View>
          <View style={styles.systemInfo}>
            <Text style={styles.systemName}>{systemName}</Text>
            <Text style={[styles.systemScore, { color: healthColor }]}>
              {system.overall_score.toFixed(1)}/10
            </Text>
          </View>
          <View style={styles.systemTrend}>
            <Text style={[
              styles.trendIndicator,
              { 
                color: system.trend_direction === 'improving' ? '#10b981' : 
                       system.trend_direction === 'declining' ? '#ef4444' : '#6b7280'
              }
            ]}>
              {system.trend_direction === 'improving' ? '↗' : 
               system.trend_direction === 'declining' ? '↘' : '→'}
            </Text>
          </View>
        </View>

        <View style={styles.systemProgress}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(system.overall_score / 10) * 100}%`,
                  backgroundColor: healthColor,
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.systemDetails}>
          {system.key_strengths.length > 0 && (
            <Text style={styles.systemStrength}>
              💪 {system.key_strengths[0]}
            </Text>
          )}
          {system.primary_challenges.length > 0 && (
            <Text style={styles.systemChallenge}>
              🎯 {system.primary_challenges[0]}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Analyzing your life systems...</Text>
      </View>
    );
  }

  if (!systemsData || !healthMonitoring) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load systems data</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Life Systems Architecture</Text>
        <Text style={styles.subtitle}>
          Design your reality through systematic thinking
        </Text>
      </View>

      {/* Overall Health Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Overall Architecture Health</Text>
          <Text style={[
            styles.overallScore,
            { color: getSystemHealthColor(healthMonitoring.overall_health_score) }
          ]}>
            {healthMonitoring.overall_health_score.toFixed(1)}/10
          </Text>
        </View>

        <View style={styles.summaryMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {Math.round(healthMonitoring.system_balance_score * 100)}%
            </Text>
            <Text style={styles.metricLabel}>System Balance</Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {healthMonitoring.trending_up.length}
            </Text>
            <Text style={styles.metricLabel}>Improving</Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {healthMonitoring.urgent_attention_needed.length}
            </Text>
            <Text style={styles.metricLabel}>Need Attention</Text>
          </View>
        </View>

        {healthMonitoring.recommended_focus && (
          <View style={styles.recommendedFocus}>
            <Text style={styles.recommendedFocusLabel}>Recommended Focus:</Text>
            <Text style={styles.recommendedFocusText}>
              {lifeSystemsUtils.getSystemDisplayName(healthMonitoring.recommended_focus)}
            </Text>
          </View>
        )}
      </View>

      {/* Systems Grid */}
      <View style={styles.systemsContainer}>
        <Text style={styles.sectionTitle}>Your Six Life Systems</Text>
        
        {systemsData.systems_health.map(system => renderSystemCard(system))}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('SystemsOptimization')}
        >
          <Text style={styles.actionIcon}>⚡</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Optimization Plan</Text>
            <Text style={styles.actionDescription}>
              Get personalized system improvements
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('SystemsCascades')}
        >
          <Text style={styles.actionIcon}>🔄</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Cascade Analysis</Text>
            <Text style={styles.actionDescription}>
              See how changes affect all systems
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('SystemsLeverage')}
        >
          <Text style={styles.actionIcon}>🎯</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Leverage Points</Text>
            <Text style={styles.actionDescription}>
              Find high-impact interventions
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Recent Improvements */}
      {healthMonitoring.recent_improvements.length > 0 && (
        <View style={styles.improvementsContainer}>
          <Text style={styles.sectionTitle}>Recent Improvements</Text>
          
          {healthMonitoring.recent_improvements.map((improvement: any, index: number) => (
            <View key={index} style={styles.improvementItem}>
              <Text style={styles.improvementIcon}>
                {lifeSystemsUtils.getSystemIcon(improvement.system)}
              </Text>
              <View style={styles.improvementContent}>
                <Text style={styles.improvementSystem}>
                  {lifeSystemsUtils.getSystemDisplayName(improvement.system)}
                </Text>
                <Text style={styles.improvementDescription}>
                  {improvement.improvement}
                </Text>
              </View>
              <Text style={[
                styles.improvementImpact,
                { color: getSystemHealthColor(improvement.impact) }
              ]}>
                +{improvement.impact.toFixed(1)}
              </Text>
            </View>
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
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
  summaryCard: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  overallScore: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  recommendedFocus: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 16,
  },
  recommendedFocusLabel: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 4,
  },
  recommendedFocusText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  systemsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  systemCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  systemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  systemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  systemIconText: {
    fontSize: 18,
  },
  systemInfo: {
    flex: 1,
  },
  systemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  systemScore: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  systemTrend: {
    alignItems: 'center',
  },
  trendIndicator: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  systemProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  systemDetails: {
    gap: 4,
  },
  systemStrength: {
    fontSize: 12,
    color: '#10b981',
  },
  systemChallenge: {
    fontSize: 12,
    color: '#f59e0b',
  },
  actionsContainer: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: '#9ca3af',
  },
  improvementsContainer: {
    padding: 20,
  },
  improvementItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  improvementIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  improvementContent: {
    flex: 1,
  },
  improvementSystem: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  improvementDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  improvementImpact: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});