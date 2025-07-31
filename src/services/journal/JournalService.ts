// JournalService.ts - Handles journal entry operations with Supabase
import { JournalEntry, AIAssistanceMode } from '@/types/database';
import { supabase } from '../supabase/client';

export interface CreateJournalEntryData {
  user_id: string;
  date: string;
  content: string;
  ai_assistance_used: AIAssistanceMode;
  word_count: number;
  writing_session_duration: number;
  patterns_identified?: string[];
  ai_insights?: string[];
  ai_conversation_thread?: {
    message_id: string;
    role: 'ai' | 'user';
    content: string;
    timestamp: string;
  }[];
}

class JournalService {
  /**
   * Create a new journal entry
   */
  async createJournalEntry(data: CreateJournalEntryData): Promise<JournalEntry> {
    try {
      console.log('📝 JournalService: Creating journal entry', data);
      
      const { data: entry, error } = await supabase
        .from('journal_entries')
        .insert([{
          user_id: data.user_id,
          date: data.date,
          content: data.content,
          ai_assistance_used: data.ai_assistance_used,
          word_count: data.word_count,
          writing_session_duration: data.writing_session_duration,
          patterns_identified: data.patterns_identified || [],
          ai_insights: data.ai_insights || [],
          ai_conversation_thread: data.ai_conversation_thread || []
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ JournalService: Error creating journal entry', error);
        throw error;
      }

      console.log('✅ JournalService: Journal entry created successfully', entry);
      return entry;
    } catch (error) {
      console.error('❌ JournalService: Failed to create journal entry', error);
      throw error;
    }
  }

  /**
   * Get journal entries for a specific date
   */
  async getJournalEntriesForDate(userId: string, date: string): Promise<JournalEntry[]> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ JournalService: Error fetching journal entries', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ JournalService: Failed to fetch journal entries', error);
      throw error;
    }
  }

  /**
   * Get journal entries for a date range
   */
  async getJournalEntriesForRange(userId: string, startDate: string, endDate: string): Promise<JournalEntry[]> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ JournalService: Error fetching journal entries for range', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ JournalService: Failed to fetch journal entries for range', error);
      throw error;
    }
  }

  /**
   * Update an existing journal entry
   */
  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ JournalService: Error updating journal entry', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ JournalService: Failed to update journal entry', error);
      throw error;
    }
  }

  /**
   * Delete a journal entry
   */
  async deleteJournalEntry(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ JournalService: Error deleting journal entry', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ JournalService: Failed to delete journal entry', error);
      throw error;
    }
  }

  /**
   * Get journal statistics for a user
   */
  async getJournalStats(userId: string): Promise<{
    totalEntries: number;
    totalWords: number;
    averageWords: number;
    totalWritingTime: number;
    mostUsedMode: AIAssistanceMode;
  }> {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('word_count, writing_session_duration, ai_assistance_used')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ JournalService: Error fetching journal stats', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalEntries: 0,
          totalWords: 0,
          averageWords: 0,
          totalWritingTime: 0,
          mostUsedMode: 'solo'
        };
      }

      // Calculate statistics
      const totalEntries = data.length;
      const totalWords = data.reduce((sum, entry) => sum + (entry.word_count || 0), 0);
      const averageWords = Math.round(totalWords / totalEntries);
      const totalWritingTime = data.reduce((sum, entry) => sum + (entry.writing_session_duration || 0), 0);

      // Find most used mode
      const modeCounts = data.reduce((acc, entry) => {
        const mode = entry.ai_assistance_used || 'solo';
        acc[mode] = (acc[mode] || 0) + 1;
        return acc;
      }, {} as Record<AIAssistanceMode, number>);

      const mostUsedMode = Object.entries(modeCounts)
        .sort(([, a], [, b]) => b - a)[0][0] as AIAssistanceMode;

      return {
        totalEntries,
        totalWords,
        averageWords,
        totalWritingTime,
        mostUsedMode
      };
    } catch (error) {
      console.error('❌ JournalService: Failed to get journal stats', error);
      throw error;
    }
  }
}

// Export singleton instance
export const journalService = new JournalService();
export default journalService; 