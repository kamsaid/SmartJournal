// Database Debug Utility
// Use this to check what data is actually stored in the database

import { supabase } from '@/services/supabase/client';
import { DEMO_USER_UUID } from './uuid';

export const databaseDebug = {
  
  // Check all morning check-ins for the specified user (defaults to demo user)
  checkMorningCheckIns: async (userId: string = DEMO_USER_UUID) => {
    console.log(`🔍 Checking morning check-ins in database for user: ${userId}...`);
    
    try {
      const { data, error } = await supabase
        .from('morning_check_ins')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching morning check-ins:', error);
        return;
      }

      console.log(`✅ Found ${data?.length || 0} morning check-ins:`, data);
      return data;
    } catch (error) {
      console.error('❌ Exception checking morning check-ins:', error);
      return [];
    }
  },

  // Check all nightly check-ins for the specified user (defaults to demo user)
  checkNightlyCheckIns: async (userId: string = DEMO_USER_UUID) => {
    console.log(`🔍 Checking nightly check-ins in database for user: ${userId}...`);
    
    try {
      const { data, error } = await supabase
        .from('nightly_check_ins')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching nightly check-ins:', error);
        return;
      }

      console.log(`✅ Found ${data?.length || 0} nightly check-ins:`, data);
      return data;
    } catch (error) {
      console.error('❌ Exception checking nightly check-ins:', error);
      return [];
    }
  },

  // Check check-ins for a specific date and user (defaults to demo user)
  checkDataForDate: async (date: string, userId: string = DEMO_USER_UUID) => {
    console.log(`🔍 Checking data for specific date: ${date}, user: ${userId}`);
    
    try {
      const [morningResult, nightlyResult] = await Promise.all([
        supabase
          .from('morning_check_ins')
          .select('*')
          .eq('user_id', userId)
          .eq('date', date)
          .single(),
        supabase
          .from('nightly_check_ins')
          .select('*')
          .eq('user_id', userId)
          .eq('date', date)
          .single()
      ]);

      const morning = morningResult.error?.code === 'PGRST116' ? null : morningResult.data;
      const nightly = nightlyResult.error?.code === 'PGRST116' ? null : nightlyResult.data;

      console.log(`📅 Data for ${date}, user ${userId}:`, {
        morningCheckIn: morning ? 'Found' : 'Not found',
        nightlyCheckIn: nightly ? 'Found' : 'Not found',
        morningData: morning,
        nightlyData: nightly
      });

      return { morning, nightly };
    } catch (error) {
      console.error('❌ Exception checking data for date:', error);
      return { morning: null, nightly: null };
    }
  },

  // Check today's data specifically
  checkTodayData: async (userId: string = DEMO_USER_UUID) => {
    const today = new Date().toISOString().split('T')[0];
    console.log(`🔍 Checking today's data: ${today}, user: ${userId}`);
    return databaseDebug.checkDataForDate(today, userId);
  },

  // Check recent data (last 7 days)
  checkRecentData: async (userId: string = DEMO_USER_UUID) => {
    console.log(`🔍 Checking recent data (last 7 days) for user: ${userId}...`);
    
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const startDateStr = startDate.toISOString().split('T')[0];

    try {
      const [morningResult, nightlyResult] = await Promise.all([
        supabase
          .from('morning_check_ins')
          .select('date, duration_minutes, created_at')
          .eq('user_id', userId)
          .gte('date', startDateStr)
          .lte('date', endDate)
          .order('date', { ascending: false }),
        supabase
          .from('nightly_check_ins')
          .select('date, duration_minutes, created_at')
          .eq('user_id', userId)
          .gte('date', startDateStr)
          .lte('date', endDate)
          .order('date', { ascending: false })
      ]);

      const morningData = morningResult.data || [];
      const nightlyData = nightlyResult.data || [];

      console.log(`📊 Recent check-ins summary for user ${userId}:`, {
        morningCheckIns: morningData.length,
        nightlyCheckIns: nightlyData.length,
        morningData,
        nightlyData
      });

      return { morningData, nightlyData };
    } catch (error) {
      console.error('❌ Exception checking recent data:', error);
      return { morningData: [], nightlyData: [] };
    }
  },

  // Full database status check
  fullDatabaseCheck: async (userId: string = DEMO_USER_UUID) => {
    console.log(`🔍 Running full database check for user: ${userId}...`);
    
    const [morning, nightly, today, recent] = await Promise.all([
      databaseDebug.checkMorningCheckIns(userId),
      databaseDebug.checkNightlyCheckIns(userId),
      databaseDebug.checkTodayData(userId),
      databaseDebug.checkRecentData(userId)
    ]);

    console.log(`📋 Full Database Check Summary for user ${userId}:`, {
      totalMorning: morning?.length || 0,
      totalNightly: nightly?.length || 0,
      todayData: today,
      recentSummary: recent
    });

    return { morning, nightly, today, recent };
  }
};

// Helper function to quickly debug from console
// Usage examples:
// dbDebug.fullDatabaseCheck() - check demo user
// dbDebug.fullDatabaseCheck('real-user-id') - check specific user
// dbDebug.checkTodayData('real-user-id') - check today's data for specific user
(global as any).dbDebug = databaseDebug; 