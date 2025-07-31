import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { DailySummary, CalendarInsight } from '@/types/database';
import { DEMO_USER_UUID } from '@/utils/uuid';
import { calendarService } from '@/services/calendar/CalendarService';
import { databaseDebug } from '@/utils/database-debug';
import { useAuth } from '@/hooks/useAuth';

const { width } = Dimensions.get('window');
const CALENDAR_WIDTH = width - 40;
const DAY_SIZE = (CALENDAR_WIDTH - 60) / 7; // 7 days per week with spacing

interface CalendarScreenProps {
  navigation: any;
}

interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  summary?: DailySummary;
}

export default function CalendarScreen({ navigation }: CalendarScreenProps) {
  // Authentication hook to get current user
  const { getCurrentUserId, loading: authLoading } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [monthInsights, setMonthInsights] = useState<CalendarInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading your calendar...');

  useEffect(() => {
    // Don't load calendar data if auth is still loading
    if (!authLoading) {
      loadCalendarData();
    }
  }, [currentDate, authLoading]);

  const loadCalendarData = async () => {
    setLoading(true);
    setError(null);
    setLoadingMessage('Loading your calendar...');
    
    try {
      // Get current authenticated user ID
      const userId = getCurrentUserId();
      
      if (!userId) {
        console.error('❌ CalendarScreen: No authenticated user found');
        setError('Please sign in to view your calendar');
        setLoading(false);
        return;
      }
      
      console.log('✅ CalendarScreen: Using authenticated user ID:', userId);
      
      // Debug: Check what data is actually in the database for this user
      console.log('🔍 CalendarScreen: Starting debug check...');
      await databaseDebug.fullDatabaseCheck(userId);
      
      // Generate calendar days for current month
      const days = generateCalendarDays(currentDate);
      setLoadingMessage('Loading check-in data...');
      
      // Load daily summaries for the month using CalendarService
      console.log(`📅 CalendarScreen: Loading summaries for ${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`);
      const summaries = await calendarService.getDailySummaries(
        userId, 
        currentDate.getFullYear(), 
        currentDate.getMonth()
      );
      
      console.log(`📊 CalendarScreen: Loaded ${summaries.length} daily summaries:`, summaries);
      
      // Attach summaries to calendar days
      const daysWithSummaries = days.map(day => ({
        ...day,
        summary: summaries.find(s => s.date === day.date),
      }));
      
      setCalendarDays(daysWithSummaries);
      setLoadingMessage('Generating insights...');
      
      // Load monthly insights using CalendarService
      const insights = await calendarService.getMonthlyInsights(
        userId, 
        currentDate.getFullYear(), 
        currentDate.getMonth()
      );
      setMonthInsights(insights);
      
    } catch (error) {
      console.error('Error loading calendar data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load calendar data';
      setError(errorMessage);
      
      // Set fallback data to prevent broken UI
      const days = generateCalendarDays(currentDate);
      setCalendarDays(days);
      setMonthInsights(null);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday of the calendar view
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks) for calendar grid
    const days: CalendarDay[] = [];
    const currentIterationDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateString = currentIterationDate.toISOString().split('T')[0];
      const isCurrentMonth = currentIterationDate.getMonth() === month;
      const isToday = 
        currentIterationDate.getDate() === today.getDate() &&
        currentIterationDate.getMonth() === today.getMonth() &&
        currentIterationDate.getFullYear() === today.getFullYear();
      
      days.push({
        date: dateString,
        day: currentIterationDate.getDate(),
        isCurrentMonth,
        isToday,
      });
      
      currentIterationDate.setDate(currentIterationDate.getDate() + 1);
    }
    
    return days;
  };


  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const handleDayPress = (day: CalendarDay) => {
    // Only prevent navigation for days outside the current month
    if (!day.isCurrentMonth) return;
    
    console.log('📅 CalendarScreen: Navigating to day detail for:', day.date, 'has summary:', !!day.summary);
    
    // Navigate to day detail screen - create a default summary if none exists
    const summary = day.summary || {
      date: day.date,
      morning_completed: false,
      nightly_completed: false,
      journal_entries_count: 0,
      ai_insights_count: 0,
      key_themes: [],
      streak_day: undefined,
    };
    
    navigation.navigate('DayDetail', { 
      date: day.date,
      summary: summary,
    });
  };

  const getMonthYearString = () => {
    return currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getDayStatusColor = (day: CalendarDay) => {
    if (!day.summary || !day.isCurrentMonth) return '#374151';
    
    const { morning_completed, nightly_completed } = day.summary;
    
    if (morning_completed && nightly_completed) return '#10b981'; // Green - both completed
    if (morning_completed || nightly_completed) return '#f59e0b'; // Amber - one completed
    return '#6b7280'; // Gray - none completed
  };

  const getDayStatusIcon = (day: CalendarDay) => {
    if (!day.summary || !day.isCurrentMonth) return '';
    
    const { morning_completed, nightly_completed, journal_entries_count } = day.summary;
    
    if (morning_completed && nightly_completed) {
      return journal_entries_count > 0 ? '✨' : '✓';
    }
    if (morning_completed) return '🌅';
    if (nightly_completed) return '🌙';
    return '';
  };

  const renderCalendarDay = (day: CalendarDay) => {
    const statusColor = getDayStatusColor(day);
    const statusIcon = getDayStatusIcon(day);
    
    return (
      <TouchableOpacity
        key={day.date}
        style={[
          styles.dayContainer,
          { 
            backgroundColor: day.isToday ? '#FFB000' : 'transparent', // Duson Golden Yellow for today
            opacity: day.isCurrentMonth ? 1 : 0.3,
          },
        ]}
        onPress={() => handleDayPress(day)}
        disabled={!day.isCurrentMonth}
      >
        <Text style={[
          styles.dayNumber,
          { color: day.isToday ? '#ffffff' : '#ffffff' }
        ]}>
          {day.day}
        </Text>
        
        {statusIcon && (
          <Text style={styles.dayIcon}>{statusIcon}</Text>
        )}
        
        <View style={[
          styles.dayIndicator,
          { backgroundColor: statusColor }
        ]} />
        
        {day.summary?.streak_day && (
          <View style={styles.streakIndicator}>
            <Text style={styles.streakText}>{day.summary.streak_day}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFB000" /> {/* Duson Golden Yellow */}
        <Text style={styles.loadingText}>
          {authLoading ? 'Authenticating...' : loadingMessage}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Journey Calendar</Text>
        <Text style={styles.subtitle}>Track your growth over time</Text>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadCalendarData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Month Navigation */}
      <View style={styles.monthNavigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>{getMonthYearString()}</Text>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🌅</Text>
          <Text style={styles.legendText}>Morning</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>🌙</Text>
          <Text style={styles.legendText}>Nightly</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>✨</Text>
          <Text style={styles.legendText}>Both + Journal</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>✓</Text>
          <Text style={styles.legendText}>Both</Text>
        </View>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        {/* Day Headers */}
        <View style={styles.weekHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.weekHeaderText}>{day}</Text>
          ))}
        </View>
        
        {/* Calendar Days */}
        <View style={styles.calendarGrid}>
          {calendarDays.map(renderCalendarDay)}
        </View>
      </View>

      {/* Monthly Insights */}
      {monthInsights && (
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Monthly Insights</Text>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{monthInsights.current_streak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{monthInsights.total_checkins}</Text>
              <Text style={styles.statLabel}>Total Check-ins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{monthInsights.journal_entries}</Text>
              <Text style={styles.statLabel}>Journal Entries</Text>
            </View>
          </View>

          {/* AI Summary */}
          <View style={styles.aiSummaryCard}>
            <Text style={styles.aiSummaryTitle}>🤖 AI Monthly Summary</Text>
            <Text style={styles.aiSummaryText}>{monthInsights.ai_monthly_summary}</Text>
          </View>

          {/* Growth Indicators */}
          <View style={styles.growthCard}>
            <Text style={styles.growthTitle}>📈 Growth Indicators</Text>
            {monthInsights.growth_indicators.map((indicator, index) => (
              <Text key={index} style={styles.growthItem}>• {indicator}</Text>
            ))}
          </View>

          {/* Recommended Focus */}
          <View style={styles.focusCard}>
            <Text style={styles.focusTitle}>🎯 Focus Areas</Text>
            {monthInsights.recommended_focus_areas.map((area, index) => (
              <Text key={index} style={styles.focusItem}>• {area}</Text>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D2C2E', // Dark charcoal background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2D2C2E', // Dark charcoal background
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FD1F4A', // Crimson accent
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FAF5E6', // Cream text
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FD1F4A', // Crimson accent
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3A3839', // Light charcoal surface
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  navButtonText: {
    fontSize: 24,
    color: '#FD1F4A', // Crimson accent
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FAF5E6', // Cream text
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  legendItem: {
    alignItems: 'center',
  },
  legendIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 12,
    color: 'rgba(250, 245, 230, 0.8)', // Cream with opacity
  },
  calendarContainer: {
    backgroundColor: '#3A3839', // Light charcoal surface
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weekHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FD1F4A', // Crimson accent
    width: DAY_SIZE,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayContainer: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 8,
    position: 'relative',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: '#FAF5E6', // Cream text
  },
  dayIcon: {
    fontSize: 12,
    position: 'absolute',
    top: 4,
    right: 4,
  },
  dayIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FD1F4A', // Crimson indicator
  },
  streakIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#FFB000', // Golden for success (special highlight)
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 10,
    color: '#2D2C2E', // Dark text on golden background
    fontWeight: 'bold',
  },
  insightsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  insightsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FAF5E6', // Cream text
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#3A3839', // Light charcoal surface
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FD1F4A', // Crimson accent
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(250, 245, 230, 0.8)', // Cream with opacity
    textAlign: 'center',
  },
  aiSummaryCard: {
    backgroundColor: '#3A3839', // Light charcoal surface
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FD1F4A', // Crimson accent border
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  aiSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FD1F4A', // Crimson accent
    marginBottom: 8,
  },
  aiSummaryText: {
    fontSize: 14,
    color: 'rgba(250, 245, 230, 0.9)', // Cream with slight opacity
    lineHeight: 20,
  },
  growthCard: {
    backgroundColor: '#3A3839', // Light charcoal surface
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB000', // Golden accent for growth (special highlight)
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  growthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFB000', // Golden accent for growth (special highlight)
    marginBottom: 8,
  },
  growthItem: {
    fontSize: 14,
    color: 'rgba(250, 245, 230, 0.9)', // Cream with slight opacity
    lineHeight: 20,
    marginBottom: 4,
  },
  focusCard: {
    backgroundColor: '#3A3839', // Light charcoal surface
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FD1F4A', // Crimson accent border
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FD1F4A', // Crimson accent
    marginBottom: 8,
  },
  focusItem: {
    fontSize: 14,
    color: 'rgba(250, 245, 230, 0.9)', // Cream with slight opacity
    lineHeight: 20,
    marginBottom: 4,
  },
  errorBanner: {
    backgroundColor: 'rgba(253, 31, 74, 0.2)', // Crimson error background with transparency
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FD1F4A', // Crimson border
  },
  errorText: {
    color: '#FAF5E6', // Cream text
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  retryButton: {
    backgroundColor: '#FD1F4A', // Crimson background
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FAF5E6', // Cream text
    fontSize: 14,
    fontWeight: '600',
  },
});