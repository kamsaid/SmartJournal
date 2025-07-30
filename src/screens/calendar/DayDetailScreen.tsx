import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { DailySummary, MorningCheckIn, NightlyCheckIn, JournalEntry } from '@/types/database';
import { morningCheckInService } from '@/services/checkins/MorningCheckInService';
import { nightlyCheckInService } from '@/services/checkins/NightlyCheckInService';
import { calendarService } from '@/services/calendar/CalendarService';
import { DEMO_USER_UUID } from '@/utils/uuid';
import { databaseDebug } from '@/utils/database-debug';
import { useAuth } from '@/hooks/useAuth';

interface DayDetailScreenProps {
  route: {
    params: {
      date: string;
      summary: DailySummary;
    };
  };
  navigation: any;
}

interface DayData {
  morningCheckIn?: MorningCheckIn;
  nightlyCheckIn?: NightlyCheckIn;
  journalEntries: JournalEntry[];
}

export default function DayDetailScreen({ route, navigation }: DayDetailScreenProps) {
  const { date, summary } = route.params;
  // Authentication hook to get current user
  const { getCurrentUserId, loading: authLoading } = useAuth();
  
  const [dayData, setDayData] = useState<DayData>({ journalEntries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't load day data if auth is still loading
    if (!authLoading) {
      loadDayData();
    }
  }, [date, authLoading]);

  const loadDayData = async () => {
    setLoading(true);
    setError(null);
    console.log('🔄 DayDetailScreen: Starting to load day data for:', date);
    
    // Create a safety timeout wrapper to prevent infinite loading
    const safetyTimeoutMs = 8000; // 8 seconds
    const safetyTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Day detail loading timed out')), safetyTimeoutMs)
    );
    
    try {
      // Get current authenticated user ID
      const userId = getCurrentUserId();
      
      if (!userId) {
        console.error('❌ DayDetailScreen: No authenticated user found');
        setError('Please sign in to view your day data');
        setLoading(false);
        return;
      }
      
      console.log('✅ DayDetailScreen: Using authenticated user ID:', userId);
      console.log('📅 DayDetailScreen: Loading data for user:', userId, 'date:', date);
      
      // Debug: Check what data exists for this specific date for this user
      console.log('🔍 DayDetailScreen: Starting debug check for date:', date);
      await databaseDebug.checkDataForDate(date, userId);
      
      // Load complete day data using CalendarService with safety timeout
      const dayDataPromise = calendarService.getDayData(userId, date);
      const dayData = await Promise.race([dayDataPromise, safetyTimeout]);

      console.log('✅ DayDetailScreen: Successfully loaded day data:', dayData);

      if (dayData) {
        setDayData({
          morningCheckIn: dayData.morningCheckIn,
          nightlyCheckIn: dayData.nightlyCheckIn,
          journalEntries: dayData.journalEntries,
        });
        console.log('📝 DayDetailScreen: Set day data with:', {
          morningCheckIn: !!dayData.morningCheckIn,
          nightlyCheckIn: !!dayData.nightlyCheckIn,
          journalEntries: dayData.journalEntries?.length || 0
        });
      } else {
        console.log('📭 DayDetailScreen: No data found for this day, setting empty state');
        setDayData({ journalEntries: [] });
      }
    } catch (error) {
      console.error('❌ DayDetailScreen: Error loading day data:', error);
      
      // Set empty data on error to allow UI to show empty state
      setDayData({ journalEntries: [] });
      
      // Set error state for retry button
      const errorMessage = error instanceof Error ? error.message : 'Failed to load day details';
      setError(errorMessage);
      
      // Show more specific error messages
      if (errorMessage.includes('timed out')) {
        console.warn('⏰ DayDetailScreen: Loading timed out, user can retry');
      }
    } finally {
      console.log('🏁 DayDetailScreen: Finished loading, setting loading to false');
      setLoading(false);
    }
  };

  // Retry function for manual retry
  const handleRetry = () => {
    console.log('🔄 DayDetailScreen: Manual retry triggered');
    loadDayData();
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderMorningCheckIn = () => {
    if (!dayData.morningCheckIn) return null;

    const { morningCheckIn } = dayData;
    
    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🌅 Morning Check-in</Text>
          <Text style={styles.sectionTime}>{morningCheckIn.duration_minutes} min</Text>
        </View>

        <View style={styles.responseItem}>
          <Text style={styles.questionText}>Thoughts & Anxieties</Text>
          <Text style={styles.responseText}>{morningCheckIn.thoughts_anxieties}</Text>
        </View>

        <View style={styles.responseItem}>
          <Text style={styles.questionText}>Great Day Vision</Text>
          <Text style={styles.responseText}>{morningCheckIn.great_day_vision}</Text>
        </View>

        <View style={styles.responseItem}>
          <Text style={styles.questionText}>Daily Affirmations</Text>
          <Text style={styles.responseText}>{morningCheckIn.affirmations}</Text>
        </View>

        <View style={styles.responseItem}>
          <Text style={styles.questionText}>Gratitude</Text>
          <Text style={styles.responseText}>{morningCheckIn.gratitude}</Text>
        </View>
      </View>
    );
  };

  const renderNightlyCheckIn = () => {
    if (!dayData.nightlyCheckIn) return null;

    const { nightlyCheckIn } = dayData;
    
    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🌙 Nightly Check-in</Text>
          <Text style={styles.sectionTime}>{nightlyCheckIn.duration_minutes} min</Text>
        </View>

        <View style={styles.responseItem}>
          <Text style={styles.questionText}>How could I have made today better?</Text>
          <Text style={styles.responseText}>{nightlyCheckIn.improvements}</Text>
        </View>

        <View style={styles.responseItem}>
          <Text style={styles.questionText}>3 Amazing Things</Text>
          {nightlyCheckIn.amazing_things.map((thing, index) => (
            <Text key={index} style={styles.listItem}>• {thing}</Text>
          ))}
        </View>

        <View style={styles.responseItem}>
          <Text style={styles.questionText}>3 Accomplishments</Text>
          {nightlyCheckIn.accomplishments.map((accomplishment, index) => (
            <Text key={index} style={styles.listItem}>• {accomplishment}</Text>
          ))}
        </View>

        <View style={styles.responseItem}>
          <Text style={styles.questionText}>Emotions</Text>
          <Text style={styles.responseText}>{nightlyCheckIn.emotions}</Text>
        </View>

        {nightlyCheckIn.great_day_reflection && (
          <View style={styles.reflectionCard}>
            <Text style={styles.reflectionTitle}>🤖 AI Vision Alignment</Text>
            {(() => {
              try {
                const reflection = JSON.parse(nightlyCheckIn.great_day_reflection);
                return (
                  <View>
                    <View style={styles.alignmentScore}>
                      <Text style={styles.alignmentText}>
                        Alignment Score: {Math.round(reflection.visionAlignment * 100)}%
                      </Text>
                    </View>
                    
                    {reflection.alignedElements?.length > 0 && (
                      <View style={styles.insightSection}>
                        <Text style={styles.insightTitle}>✅ What Aligned</Text>
                        {reflection.alignedElements.map((element: string, index: number) => (
                          <Text key={index} style={styles.insightItem}>• {element}</Text>
                        ))}
                      </View>
                    )}

                    {reflection.learnings?.length > 0 && (
                      <View style={styles.insightSection}>
                        <Text style={styles.insightTitle}>💡 Key Learnings</Text>
                        {reflection.learnings.map((learning: string, index: number) => (
                          <Text key={index} style={styles.insightItem}>• {learning}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                );
              } catch {
                return <Text style={styles.responseText}>Processing reflection...</Text>;
              }
            })()}
          </View>
        )}
      </View>
    );
  };

  const renderJournalEntries = () => {
    if (dayData.journalEntries.length === 0) return null;

    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📝 Journal Entries</Text>
        
        {dayData.journalEntries.map((entry) => (
          <View key={entry.id} style={styles.journalEntry}>
            <View style={styles.journalHeader}>
              <Text style={styles.journalMeta}>
                {entry.word_count} words • {entry.writing_session_duration} min • {entry.ai_assistance_used}
              </Text>
            </View>
            
            <Text style={styles.journalContent}>
              {entry.content.length > 200 ? 
                `${entry.content.substring(0, 200)}...` : 
                entry.content
              }
            </Text>

            {entry.patterns_identified.length > 0 && (
              <View style={styles.patternsContainer}>
                <Text style={styles.patternsTitle}>Patterns Identified:</Text>
                <View style={styles.patternTags}>
                  {entry.patterns_identified.map((pattern, index) => (
                    <View key={index} style={styles.patternTag}>
                      <Text style={styles.patternTagText}>{pattern}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => navigation.navigate('JournalDetail', { entryId: entry.id })}
            >
              <Text style={styles.expandButtonText}>Read Full Entry</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderDaySummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Day Summary</Text>
      
      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Check-ins</Text>
          <Text style={styles.statValue}>
            {(summary.morning_completed ? 1 : 0) + (summary.nightly_completed ? 1 : 0)}/2
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Journal Entries</Text>
          <Text style={styles.statValue}>{summary.journal_entries_count}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>AI Insights</Text>
          <Text style={styles.statValue}>{summary.ai_insights_count}</Text>
        </View>
      </View>

      {summary.key_themes.length > 0 && (
        <View style={styles.themesContainer}>
          <Text style={styles.themesTitle}>Key Themes:</Text>
          <View style={styles.themesTags}>
            {summary.key_themes.map((theme, index) => (
              <View key={index} style={styles.themeTag}>
                <Text style={styles.themeTagText}>{theme}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {summary.streak_day && (
        <View style={styles.streakContainer}>
          <Text style={styles.streakText}>🔥 Day {summary.streak_day} of your current streak!</Text>
        </View>
      )}
    </View>
  );

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>
          {authLoading ? 'Authenticating...' : 'Loading day details...'}
        </Text>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error.includes('timed out') ? 'Loading is taking longer than expected' : error}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>{formatDate(date)}</Text>
          <Text style={styles.subtitle}>Your journey for this day</Text>
        </View>
      </View>

      {/* Day Summary */}
      {renderDaySummary()}

      {/* Morning Check-in */}
      {renderMorningCheckIn()}

      {/* Nightly Check-in */}
      {renderNightlyCheckIn()}

      {/* Journal Entries */}
      {renderJournalEntries()}

      {/* Empty State */}
      {!dayData.morningCheckIn && !dayData.nightlyCheckIn && dayData.journalEntries.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No data for this day</Text>
          <Text style={styles.emptyText}>
            This day doesn't have any check-ins or journal entries yet.
          </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8b5cf6',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 18,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8b5cf6',
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  themesContainer: {
    marginBottom: 12,
  },
  themesTitle: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 8,
  },
  themesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  themeTag: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  themeTagText: {
    fontSize: 12,
    color: '#d1d5db',
  },
  streakContainer: {
    marginTop: 8,
  },
  streakText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  responseItem: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 6,
  },
  responseText: {
    fontSize: 16,
    color: '#d1d5db',
    lineHeight: 22,
  },
  listItem: {
    fontSize: 16,
    color: '#d1d5db',
    lineHeight: 22,
    marginBottom: 4,
  },
  reflectionCard: {
    backgroundColor: '#0f1419',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  reflectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 12,
  },
  alignmentScore: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  alignmentText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
  },
  insightSection: {
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 6,
  },
  insightItem: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 4,
  },
  journalEntry: {
    backgroundColor: '#0f1419',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  journalHeader: {
    marginBottom: 12,
  },
  journalMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  journalContent: {
    fontSize: 16,
    color: '#d1d5db',
    lineHeight: 22,
    marginBottom: 12,
  },
  patternsContainer: {
    marginBottom: 12,
  },
  patternsTitle: {
    fontSize: 12,
    color: '#8b5cf6',
    marginBottom: 6,
  },
  patternTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  patternTag: {
    backgroundColor: '#4c1d95',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  patternTagText: {
    fontSize: 11,
    color: '#c4b5fd',
  },
  expandButton: {
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});