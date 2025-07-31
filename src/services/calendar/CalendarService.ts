// CalendarService.ts - Aggregate check-in data for calendar display
import { DailySummary, CalendarInsight, MorningCheckIn, NightlyCheckIn, JournalEntry } from '@/types/database';
import { morningCheckInService } from '../checkins/MorningCheckInService';
import { nightlyCheckInService } from '../checkins/NightlyCheckInService';
import { supabase } from '../supabase/client';

export interface CalendarData {
  dailySummaries: DailySummary[];
  monthlyInsights: CalendarInsight;
}

export interface DayData {
  morningCheckIn?: MorningCheckIn;
  nightlyCheckIn?: NightlyCheckIn;
  journalEntries: JournalEntry[];
  summary: DailySummary;
}

// Simple in-memory cache with 5-minute TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCached = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
};

const setCache = <T>(key: string, data: T, ttl: number = CACHE_TTL): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

export const calendarService = {
  // Get daily summaries for a specific month
  getDailySummaries: async (userId: string, year: number, month: number): Promise<DailySummary[]> => {
    const cacheKey = `summaries:${userId}:${year}-${month}`;
    console.log(`📅 CalendarService: Loading summaries for ${year}-${month + 1}, user: ${userId}`);
    
    // Check cache first
    const cached = getCached<DailySummary[]>(cacheKey);
    if (cached) {
      console.log(`💾 CalendarService: Using cached summaries for ${year}-${month + 1}`);
      return cached;
    }
    
    const startTime = Date.now();
    
    try {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      console.log(`📅 Date range: ${startDate} to ${endDate}`);

      // Individual service timeout helper for monthly data (longer timeout)
      const createMonthlyServiceTimeout = <T>(promise: Promise<T>, serviceName: string, timeoutMs: number = 5000): Promise<T> => {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            console.warn(`⏰ CalendarService: ${serviceName} timed out after ${timeoutMs}ms for ${year}-${month + 1}`);
            reject(new Error(`${serviceName} timed out`));
          }, timeoutMs);
        });
        
        return Promise.race([promise, timeoutPromise]);
      };

      // Fetch all data in parallel
      const [morningCheckIns, nightlyCheckIns, journalEntries] = await Promise.all([
        supabase
          .from('morning_check_ins')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate)
          .then(result => {
            if (result.error) {
              console.error('❌ CalendarService: Morning check-ins error:', result.error);
              return [];
            }
            return result.data || [];
          }),
        
        supabase
          .from('nightly_check_ins')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate)
          .then(result => {
            if (result.error) {
              console.error('❌ CalendarService: Nightly check-ins error:', result.error);
              return [];
            }
            return result.data || [];
          }),
        
        supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate)
          .then(result => {
            if (result.error) {
              console.error('❌ CalendarService: Journal entries error:', result.error);
              return [];
            }
            return result.data || [];
          }),
      ]);
      
      // Log results for debugging
      console.log(`✅ CalendarService: Monthly data loaded:`, {
        morningCheckIns: morningCheckIns.length,
        nightlyCheckIns: nightlyCheckIns.length,
        journalEntries: journalEntries.length
      });

      console.log(`📊 Loaded data: ${morningCheckIns.length} morning, ${nightlyCheckIns.length} nightly, ${journalEntries.length} journal entries`);

      // Create summaries for each date in the month
      const summaries: DailySummary[] = [];
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day).toISOString().split('T')[0];
        
        const morningCompleted = morningCheckIns?.some((checkin: any) => checkin.date === date) || false;
        const nightlyCompleted = nightlyCheckIns?.some((checkin: any) => checkin.date === date) || false;
        const journalEntriesCount = journalEntries?.filter((entry: any) => entry.date === date).length || 0;

        // Calculate AI insights count (morning + nightly + journal AI insights)
        let aiInsightsCount = 0;
        if (morningCompleted) aiInsightsCount += 1; // Morning generates challenge
        if (nightlyCompleted) aiInsightsCount += 1; // Nightly generates reflection
        aiInsightsCount += journalEntriesCount; // Each journal entry has AI insights

        // Extract key themes from the day's content
        const dayMorning = morningCheckIns?.find((c: any) => c.date === date);
        const dayNightly = nightlyCheckIns?.find((c: any) => c.date === date);
        const dayJournals = journalEntries?.filter((j: any) => j.date === date) || [];
        
        const keyThemes = extractKeyThemes(dayMorning, dayNightly, dayJournals);

        // Calculate streak day (consecutive days with both check-ins)
        const streakDay = calculateStreakDay(date, morningCheckIns, nightlyCheckIns);

        summaries.push({
          date,
          morning_completed: morningCompleted,
          nightly_completed: nightlyCompleted,
          journal_entries_count: journalEntriesCount,
          ai_insights_count: aiInsightsCount,
          key_themes: keyThemes,
          streak_day: streakDay,
        });
      }

      const loadTime = Date.now() - startTime;
      console.log(`✅ CalendarService: Loaded ${summaries.length} summaries in ${loadTime}ms`);
      
      // Cache the results
      setCache(cacheKey, summaries);
      
      return summaries;
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error(`❌ CalendarService: Failed to load summaries after ${loadTime}ms:`, error);
      
      // Return empty array instead of throwing to prevent calendar from breaking
      return [];
    }
  },

  // Get monthly insights with AI analysis
  getMonthlyInsights: async (userId: string, year: number, month: number): Promise<CalendarInsight> => {
    try {
      const summaries = await calendarService.getDailySummaries(userId, year, month);
      
      // Calculate monthly stats
      const totalCheckIns = summaries.filter(s => s.morning_completed || s.nightly_completed).length;
      const morningCheckIns = summaries.filter(s => s.morning_completed).length;
      const nightlyCheckIns = summaries.filter(s => s.nightly_completed).length;
      const journalEntries = summaries.reduce((sum, s) => sum + s.journal_entries_count, 0);

      // Calculate streaks
      const currentStreak = calculateCurrentStreak(summaries);
      const longestStreak = calculateLongestStreak(summaries);

      // Extract monthly patterns
      const monthlyPatterns = extractMonthlyPatterns(summaries);

      // Generate AI monthly summary
      const aiMonthlySummary = await generateAIMonthlySummary(summaries, userId);

      // Generate growth indicators
      const growthIndicators = generateGrowthIndicators(summaries);

      // Generate recommended focus areas
      const recommendedFocusAreas = generateFocusAreas(summaries);

      return {
        id: `${userId}-${year}-${String(month + 1).padStart(2, '0')}`,
        user_id: userId,
        month_year: `${year}-${String(month + 1).padStart(2, '0')}`,
        total_checkins: totalCheckIns,
        morning_checkins: morningCheckIns,
        nightly_checkins: nightlyCheckIns,
        journal_entries: journalEntries,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        monthly_patterns: monthlyPatterns,
        ai_monthly_summary: aiMonthlySummary,
        growth_indicators: growthIndicators,
        recommended_focus_areas: recommendedFocusAreas,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating monthly insights:', error);
      // Return fallback insights
      return {
        id: `${userId}-${year}-${String(month + 1).padStart(2, '0')}`,
        user_id: userId,
        month_year: `${year}-${String(month + 1).padStart(2, '0')}`,
        total_checkins: 0,
        morning_checkins: 0,
        nightly_checkins: 0,
        journal_entries: 0,
        current_streak: 0,
        longest_streak: 0,
        monthly_patterns: [],
        ai_monthly_summary: 'Keep building your reflection practice consistently.',
        growth_indicators: ['Starting your journey of self-reflection'],
        recommended_focus_areas: ['Complete daily check-ins regularly'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  // Get complete data for a specific day  
  getDayData: async (userId: string, date: string): Promise<DayData | null> => {
    const cacheKey = `daydata:${userId}:${date}`;
    console.log(`📅 CalendarService: Loading day data for ${date}, user: ${userId}`);
    
    // Check cache first (shorter TTL for day data since it changes more frequently)
    const cached = getCached<DayData>(cacheKey);
    if (cached) {
      console.log(`💾 CalendarService: Using cached day data for ${date}`);
      return cached;
    }
    
    const startTime = Date.now();
    
    try {
      // Individual service timeout helper (shorter timeout per service)
      const createServiceTimeout = <T>(promise: Promise<T>, serviceName: string, timeoutMs: number = 3000): Promise<T> => {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            console.warn(`⏰ CalendarService: ${serviceName} timed out after ${timeoutMs}ms for ${date}`);
            reject(new Error(`${serviceName} timed out`));
          }, timeoutMs);
        });
        
        return Promise.race([promise, timeoutPromise]);
      };

      // Fetch each data source with individual timeouts and graceful fallbacks
      console.log(`🌅 CalendarService: Fetching morning check-in for ${date}`);
      const morningPromise = createServiceTimeout(
        morningCheckInService.getMorningCheckIn(userId, date),
        'Morning check-in service',
        3000
      ).catch(error => {
        console.error(`❌ CalendarService: Morning check-in failed for ${date}:`, error);
        return null; // Graceful fallback
      });

      console.log(`🌙 CalendarService: Fetching nightly check-in for ${date}`);
      const nightlyPromise = createServiceTimeout(
        nightlyCheckInService.getNightlyCheckIn(userId, date),
        'Nightly check-in service',
        3000
      ).catch(error => {
        console.error(`❌ CalendarService: Nightly check-in failed for ${date}:`, error);
        return null; // Graceful fallback
      });

      console.log(`📝 CalendarService: Fetching journal entries for ${date}`);
      // Fetch journal entries for the day with error handling
      const journalResult = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .then(result => {
          if (result.error) {
            console.error(`❌ CalendarService: Journal entries error for ${date}:`, result.error);
            return { data: [] };
          }
          return result;
        });

              // Execute all promises concurrently and collect results (allowing partial failures)
        const [morningCheckIn, nightlyCheckIn] = await Promise.all([
          morningPromise,
          nightlyPromise
        ]);

              console.log(`✅ CalendarService: All data fetched for ${date}:`, {
          morningCheckIn: !!morningCheckIn,
          nightlyCheckIn: !!nightlyCheckIn,
          journalCount: journalResult?.data?.length || 0
        });

        const journalEntries = journalResult?.data || [];

      // Create summary for this day
      const summary: DailySummary = {
        date,
        morning_completed: !!morningCheckIn,
        nightly_completed: !!nightlyCheckIn,
        journal_entries_count: journalEntries.length,
        ai_insights_count: (morningCheckIn ? 1 : 0) + (nightlyCheckIn ? 1 : 0) + journalEntries.length,
        key_themes: extractKeyThemes(morningCheckIn as any, nightlyCheckIn as any, journalEntries),
        streak_day: undefined, // Would need more context to calculate
      };

      const loadTime = Date.now() - startTime;
      console.log(`✅ CalendarService: Loaded day data for ${date} in ${loadTime}ms`);

      const dayData: DayData = {
        morningCheckIn: (morningCheckIn as any) || undefined,
        nightlyCheckIn: (nightlyCheckIn as any) || undefined, 
        journalEntries: journalEntries,
        summary,
      };
      
      // Cache with shorter TTL for day data (2 minutes) since it changes more frequently
      setCache(cacheKey, dayData, 2 * 60 * 1000);
      
      return dayData;
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error(`❌ CalendarService: Failed to load day data for ${date} after ${loadTime}ms:`, error);
      
      // Return null instead of throwing to allow graceful handling
      return null;
    }
  },
};

// Helper functions

function extractKeyThemes(
  morning?: MorningCheckIn | null, 
  nightly?: NightlyCheckIn | null, 
  journals: JournalEntry[] = []
): string[] {
  const themes = new Set<string>();
  
  // Extract from morning check-in
  if (morning) {
    if (morning.gratitude) themes.add('gratitude');
    if (morning.thoughts_anxieties && morning.thoughts_anxieties.length > 20) themes.add('reflection');
    if (morning.great_day_vision) themes.add('vision');
    if (morning.affirmations) themes.add('affirmations');
  }

  // Extract from nightly check-in
  if (nightly) {
    if (nightly.accomplishments && nightly.accomplishments.length > 0) themes.add('accomplishment');
    if (nightly.amazing_things && nightly.amazing_things.length > 0) themes.add('appreciation');
    if (nightly.emotions) themes.add('emotional-awareness');
    if (nightly.improvements) themes.add('growth');
  }

  // Extract from journal entries
  journals.forEach(journal => {
    if (journal.patterns_identified) {
      journal.patterns_identified.forEach(pattern => {
        themes.add(pattern.toLowerCase().replace(/\s+/g, '-'));
      });
    }
  });

  return Array.from(themes).slice(0, 5); // Return top 5 themes
}

function calculateStreakDay(
  date: string, 
  morningCheckIns: MorningCheckIn[] = [], 
  nightlyCheckIns: NightlyCheckIn[] = []
): number | undefined {
  // This is a simplified calculation - in a real app, you'd want more sophisticated streak logic
  const dateObj = new Date(date);
  let streak = 0;
  
  for (let i = 0; i < 30; i++) { // Check last 30 days
    const checkDate = new Date(dateObj);
    checkDate.setDate(dateObj.getDate() - i);
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    const hasMorning = morningCheckIns.some(c => c.date === checkDateStr);
    const hasNightly = nightlyCheckIns.some(c => c.date === checkDateStr);
    
    if (hasMorning && hasNightly) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak > 0 ? streak : undefined;
}

function calculateCurrentStreak(summaries: DailySummary[]): number {
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  
  // Start from today and go backwards
  for (let i = summaries.length - 1; i >= 0; i--) {
    const summary = summaries[i];
    if (summary.date <= today && summary.morning_completed && summary.nightly_completed) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateLongestStreak(summaries: DailySummary[]): number {
  let longestStreak = 0;
  let currentStreak = 0;
  
  summaries.forEach(summary => {
    if (summary.morning_completed && summary.nightly_completed) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });
  
  return longestStreak;
}

function extractMonthlyPatterns(summaries: DailySummary[]): string[] {
  const patterns = [];
  
  const morningRate = summaries.filter(s => s.morning_completed).length / summaries.length;
  const nightlyRate = summaries.filter(s => s.nightly_completed).length / summaries.length;
  const journalRate = summaries.filter(s => s.journal_entries_count > 0).length / summaries.length;
  
  if (morningRate > 0.7) patterns.push('Strong morning routine consistency');
  if (nightlyRate > 0.7) patterns.push('Excellent evening reflection habit');
  if (journalRate > 0.3) patterns.push('Regular journaling practice developing');
  
  // Analyze theme consistency
  const allThemes = summaries.flatMap(s => s.key_themes);
  const themeFreq = allThemes.reduce((acc, theme) => {
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const frequentThemes = Object.entries(themeFreq)
    .filter(([, count]) => count > summaries.length * 0.3)
    .map(([theme]) => theme);
  
  if (frequentThemes.includes('gratitude')) patterns.push('Gratitude practice is becoming consistent');
  if (frequentThemes.includes('growth')) patterns.push('Strong focus on personal development');
  
  return patterns;
}

async function generateAIMonthlySummary(summaries: DailySummary[], userId: string): Promise<string> {
  // In a real app, this would use AI to generate insights
  // For now, return a template-based summary
  const completionRate = summaries.filter(s => s.morning_completed || s.nightly_completed).length / summaries.length;
  const journalDays = summaries.filter(s => s.journal_entries_count > 0).length;
  
  if (completionRate > 0.8) {
    return `Exceptional month of consistent reflection! You completed check-ins on ${Math.round(completionRate * 100)}% of days and journaled ${journalDays} times. Your dedication to self-awareness is creating real momentum.`;
  } else if (completionRate > 0.5) {
    return `Good progress this month with ${Math.round(completionRate * 100)}% completion rate. You're building solid reflection habits. Consider focusing on consistency to deepen your insights.`;
  } else {
    return `This month is a fresh start for building your reflection practice. Every check-in matters - focus on small, consistent steps to develop this valuable habit.`;
  }
}

function generateGrowthIndicators(summaries: DailySummary[]): string[] {
  const indicators = [];
  
  const recentWeek = summaries.slice(-7);
  const previousWeek = summaries.slice(-14, -7);
  
  const recentRate = recentWeek.filter(s => s.morning_completed && s.nightly_completed).length / 7;
  const previousRate = previousWeek.filter(s => s.morning_completed && s.nightly_completed).length / 7;
  
  if (recentRate > previousRate) {
    indicators.push('Improving consistency in daily check-ins');
  }
  
  const journalTrend = recentWeek.reduce((sum, s) => sum + s.journal_entries_count, 0) - 
                     previousWeek.reduce((sum, s) => sum + s.journal_entries_count, 0);
  
  if (journalTrend > 0) {
    indicators.push('Increasing engagement with long-form reflection');
  }
  
  if (summaries.some(s => s.streak_day && s.streak_day > 5)) {
    indicators.push('Building strong consistency habits');
  }
  
  return indicators.length > 0 ? indicators : ['Beginning your reflection journey'];
}

function generateFocusAreas(summaries: DailySummary[]): string[] {
  const focusAreas = [];
  
  const morningRate = summaries.filter(s => s.morning_completed).length / summaries.length;
  const nightlyRate = summaries.filter(s => s.nightly_completed).length / summaries.length;
  const journalRate = summaries.filter(s => s.journal_entries_count > 0).length / summaries.length;
  
  if (morningRate < 0.6) focusAreas.push('Strengthen morning intention-setting routine');
  if (nightlyRate < 0.6) focusAreas.push('Develop consistent evening reflection practice');
  if (journalRate < 0.2) focusAreas.push('Explore deeper insights through journaling');
  
  if (focusAreas.length === 0) {
    focusAreas.push('Continue your excellent reflection practice');
    focusAreas.push('Consider exploring new areas of self-discovery');
  }
  
  return focusAreas;
}

export default calendarService;