// MorningCheckInService.ts - Handle morning check-in responses and challenge generation
import { MorningCheckIn, DailyChallenge } from '@/types/database';
import { memoryService } from '../memory/MemoryService';
import { challengeGenerator } from '../challenges/ChallengeGenerator';
import { supabase } from '../supabase/client';
import { generateUUID } from '@/utils/uuid';

export interface MorningCheckInSubmission {
  thoughts_anxieties: string;
  great_day_vision: string;
  affirmations: string;
  gratitude: string;
}

export interface MorningCheckInResult {
  checkIn: MorningCheckIn;
  challenge: DailyChallenge;
  memoryId: string;
}

export const morningCheckInService = {
  // Submit morning check-in and generate challenge
  submitMorningCheckIn: async (
    userId: string,
    submission: MorningCheckInSubmission,
    durationMinutes: number
  ): Promise<MorningCheckInResult> => {
    try {
      const date = new Date().toISOString().split('T')[0];
      
      // Create morning check-in record with validated duration (ensure positive and within reasonable bounds)
      const validatedDuration = Math.max(1, Math.min(Math.floor(durationMinutes || 1), 720)); // 1-720 minutes (12 hours max)
      
      const morningCheckIn: MorningCheckIn = {
        id: generateUUID(),
        user_id: userId,
        date,
        thoughts_anxieties: submission.thoughts_anxieties,
        great_day_vision: submission.great_day_vision,
        affirmations: submission.affirmations,
        gratitude: submission.gratitude,
        duration_minutes: validatedDuration,
        created_at: new Date().toISOString(),
      };

      // Save to database
      const { error: saveError } = await supabase
        .from('morning_check_ins')
        .insert(morningCheckIn);

      if (saveError) {
        console.error('Failed to save morning check-in:', saveError);
        
        // Handle specific constraint violations with user-friendly messages
        if (saveError.code === '23514' && saveError.message.includes('duration_minutes')) {
          throw new Error('Invalid session duration. Please try again.');
        }
        
        throw new Error(`Failed to save morning check-in: ${saveError.message}`);
      }

      // Store key insights as memories
      const memory = await storeAsMemory(morningCheckIn);
      const memoryId = memory.id;

      // Generate challenge based on "great day" vision
      const challenge = await generateGreatDayChallenge(morningCheckIn);

      // Update morning check-in with challenge reference
      await supabase
        .from('morning_check_ins')
        .update({ challenge_generated: challenge.id })
        .eq('id', morningCheckIn.id);

      return {
        checkIn: { ...morningCheckIn, challenge_generated: challenge.id },
        challenge,
        memoryId,
      };
    } catch (error) {
      console.error('Error submitting morning check-in:', error);
      throw error;
    }
  },

  // Get morning check-in for a specific date
  getMorningCheckIn: async (userId: string, date: string): Promise<MorningCheckIn | null> => {
    try {
      const { data, error } = await supabase
        .from('morning_check_ins')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching morning check-in:', error);
      return null;
    }
  },

  // Check if user has completed morning check-in today
  hasCompletedTodayMorningCheckIn: async (userId: string): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    const morningCheckIn = await morningCheckInService.getMorningCheckIn(userId, today);
    return morningCheckIn !== null;
  },

  // Get recent morning check-ins for pattern analysis
  getRecentMorningCheckIns: async (
    userId: string, 
    days: number = 7
  ): Promise<MorningCheckIn[]> => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('morning_check_ins')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent morning check-ins:', error);
      return [];
    }
  },

  // Analyze morning check-in patterns
  analyzeMorningPatterns: async (userId: string): Promise<{
    commonThemes: string[];
    gratitudePatterns: string[];
    visionPatterns: string[];
    anxietyPatterns: string[];
  }> => {
    try {
      const recentCheckIns = await morningCheckInService.getRecentMorningCheckIns(userId, 30);
      
      if (recentCheckIns.length === 0) {
        return {
          commonThemes: [],
          gratitudePatterns: [],
          visionPatterns: [],
          anxietyPatterns: [],
        };
      }

      // Combine all text for pattern analysis
      const allText = recentCheckIns.map(checkIn => 
        `${checkIn.thoughts_anxieties} ${checkIn.great_day_vision} ${checkIn.affirmations} ${checkIn.gratitude}`
      ).join(' ');

      // Use memory service for pattern recognition
      const patterns = await memoryService.identifyMemoryPatterns(userId);

      // Extract specific patterns (simplified implementation)
      const gratitudeTexts = recentCheckIns.map(c => c.gratitude).filter(Boolean);
      const visionTexts = recentCheckIns.map(c => c.great_day_vision).filter(Boolean);
      const anxietyTexts = recentCheckIns.map(c => c.thoughts_anxieties).filter(Boolean);

      return {
        commonThemes: patterns.slice(0, 3),
        gratitudePatterns: extractKeywords(gratitudeTexts),
        visionPatterns: extractKeywords(visionTexts),
        anxietyPatterns: extractKeywords(anxietyTexts),
      };
    } catch (error) {
      console.error('Error analyzing morning patterns:', error);
      return {
        commonThemes: [],
        gratitudePatterns: [],
        visionPatterns: [],
        anxietyPatterns: [],
      };
    }
  },
};

// Helper functions

async function storeAsMemory(morningCheckIn: MorningCheckIn): Promise<{ id: string }> {
  try {
    // Combine the most meaningful parts as a memory
    const memoryContent = `Morning Intentions: ${morningCheckIn.great_day_vision}. 
    Affirmations: ${morningCheckIn.affirmations}. 
    Grateful for: ${morningCheckIn.gratitude}.`;

    const memory = await memoryService.storeMemory(
      morningCheckIn.user_id,
      memoryContent,
      morningCheckIn.date,
      'Morning Check-in'
    );

    return memory;
  } catch (error) {
    console.error('Error storing morning check-in as memory:', error);
    throw error;
  }
}

async function generateGreatDayChallenge(morningCheckIn: MorningCheckIn): Promise<DailyChallenge> {
  try {
    // Create challenge context focused on "great day" vision
    const challengeContext = {
      user: { id: morningCheckIn.user_id, current_phase: 1 } as any, // Simplified for now
      todayResponses: [morningCheckIn.great_day_vision],
      recentMemories: [],
      patterns: [],
      currentStruggles: extractStruggles(morningCheckIn.thoughts_anxieties),
      growthEdge: 'great-day-realization',
    };

    // Generate challenge specifically tied to their great day vision
    const challengeOptions = await challengeGenerator.generateDailyChallenge(challengeContext);

    // Customize the challenge to be more specific to their vision
    const customizedChallenge = await customizeGreatDayChallenge(
      challengeOptions.primary,
      morningCheckIn.great_day_vision
    );

    // Save challenge to database
    const { error } = await supabase
      .from('daily_challenges')
      .insert(customizedChallenge);

    if (error) {
      console.error('Error saving challenge:', error);
      // Return the challenge anyway, even if save failed
    }

    return customizedChallenge;
  } catch (error) {
    console.error('Error generating great day challenge:', error);
    
    // Return fallback challenge
    return {
      id: generateUUID(),
      user_id: morningCheckIn.user_id,
      challenge_text: `Take one specific action today that moves you toward your vision: "${morningCheckIn.great_day_vision.slice(0, 50)}..."`,
      challenge_type: 'action',
      assigned_date: morningCheckIn.date,
      swap_count: 0,
      difficulty_level: 2,
      growth_area_focus: 'vision-alignment',
      created_at: new Date().toISOString(),
    };
  }
}

async function customizeGreatDayChallenge(
  baseChallenge: DailyChallenge,
  greatDayVision: string
): Promise<DailyChallenge> {
  // Customize the challenge text to reference their specific vision
  const visionKeywords = extractKeywords([greatDayVision]);
  const primaryKeyword = visionKeywords[0] || 'your goal';

  let customizedText = baseChallenge.challenge_text;
  
  // Add vision-specific context to the challenge
  if (greatDayVision.trim()) {
    customizedText = `${baseChallenge.challenge_text} Remember: "${greatDayVision.slice(0, 100)}${greatDayVision.length > 100 ? '...' : ''}"`;
  }

  return {
    ...baseChallenge,
    challenge_text: customizedText,
    growth_area_focus: 'great-day-alignment',
  };
}

function extractStruggles(thoughtsAndAnxieties: string): string[] {
  // Simple keyword extraction for struggles/anxieties
  const struggleKeywords = [
    'worry', 'anxious', 'stress', 'afraid', 'nervous', 'overwhelmed',
    'difficult', 'hard', 'struggle', 'challenge', 'problem', 'issue'
  ];

  const struggles: string[] = [];
  const lowerText = thoughtsAndAnxieties.toLowerCase();

  struggleKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      struggles.push(keyword);
    }
  });

  return struggles.slice(0, 3); // Return top 3 struggles
}

function extractKeywords(texts: string[]): string[] {
  // Simple keyword extraction (in a real app, you might use NLP)
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);
  
  const wordFreq: Record<string, number> = {};
  
  texts.forEach(text => {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
  });

  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

export default morningCheckInService;