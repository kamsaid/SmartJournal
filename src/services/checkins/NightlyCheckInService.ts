// NightlyCheckInService.ts - Handle nightly check-in responses and reflection analysis
import { NightlyCheckIn, MorningCheckIn } from '@/types/database';
import { memoryService } from '../memory/MemoryService';
import { morningCheckInService } from './MorningCheckInService';
import { aiOrchestrator } from '../openai/aiOrchestrator';
import { supabase } from '../supabase/client';
import { generateUUID } from '@/utils/uuid';

export interface NightlyCheckInSubmission {
  improvements: string;
  amazing_things: string[];
  accomplishments: string[];
  emotions: string;
}

export interface NightlyCheckInResult {
  checkIn: NightlyCheckIn;
  memoryId: string;
  morningReflection?: GreatDayReflection;
}

export interface GreatDayReflection {
  visionAlignment: number; // 0-1 scale of how well the day matched morning vision
  alignedElements: string[];
  missedElements: string[];
  unexpectedPositives: string[];
  learnings: string[];
  tomorrowSuggestions: string[];
}

export const nightlyCheckInService = {
  // Submit nightly check-in and analyze against morning vision
  submitNightlyCheckIn: async (
    userId: string,
    submission: NightlyCheckInSubmission,
    durationMinutes: number
  ): Promise<NightlyCheckInResult> => {
    try {
      const date = new Date().toISOString().split('T')[0];
      
      // First, check if a nightly check-in already exists for today
      const existingCheckIn = await nightlyCheckInService.getNightlyCheckIn(userId, date);
      
      if (existingCheckIn) {
        // If a check-in already exists, throw a user-friendly error
        throw new Error('You have already completed your nightly check-in for today. Each day only allows one nightly check-in.');
      }
      
      // Get morning check-in for comparison
      const morningCheckIn = await morningCheckInService.getMorningCheckIn(userId, date);

      // Create nightly check-in record with validated duration (ensure positive and within reasonable bounds)
      const validatedDuration = Math.max(1, Math.min(Math.floor(durationMinutes || 1), 720)); // 1-720 minutes (12 hours max)
      const nightlyCheckIn: NightlyCheckIn = {
        id: generateUUID(),
        user_id: userId,
        date,
        improvements: submission.improvements,
        amazing_things: submission.amazing_things,
        accomplishments: submission.accomplishments,
        emotions: submission.emotions,
        morning_checkin_id: morningCheckIn?.id,
        duration_minutes: validatedDuration,
        created_at: new Date().toISOString(),
      };

      // Generate reflection if morning check-in exists
      let morningReflection: GreatDayReflection | undefined;
      if (morningCheckIn) {
        morningReflection = await analyzeGreatDayAlignment(morningCheckIn, nightlyCheckIn);
        nightlyCheckIn.great_day_reflection = JSON.stringify(morningReflection);
      }

      // Save to database with proper error handling
      const { error: saveError } = await supabase
        .from('nightly_check_ins')
        .insert(nightlyCheckIn);

      if (saveError) {
        console.error('Failed to save nightly check-in:', saveError);
        
        // Handle specific constraint violations with user-friendly messages
        if (saveError.code === '23514' && saveError.message.includes('duration_minutes')) {
          throw new Error('Invalid session duration. Please try again.');
        }
        
        // Handle duplicate key constraint violations as a fallback
        if (saveError.code === '23505' && saveError.message.includes('nightly_check_ins_user_id_date_key')) {
          throw new Error('You have already completed your nightly check-in for today. Each day only allows one nightly check-in.');
        }
        
        throw new Error(`Failed to save nightly check-in: ${saveError.message}`);
      }

      // Store insights as memories
      const memory = await storeAsMemory(nightlyCheckIn, morningReflection);
      const memoryId = memory.id;

      return {
        checkIn: nightlyCheckIn,
        memoryId,
        morningReflection,
      };
    } catch (error) {
      console.error('Error submitting nightly check-in:', error);
      throw error;
    }
  },

  // Get nightly check-in for a specific date
  getNightlyCheckIn: async (userId: string, date: string): Promise<NightlyCheckIn | null> => {
    try {
      const { data, error } = await supabase
        .from('nightly_check_ins')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching nightly check-in:', error);
      return null;
    }
  },

  // Check if user has completed nightly check-in today
  hasCompletedTodayNightlyCheckIn: async (userId: string): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    const nightlyCheckIn = await nightlyCheckInService.getNightlyCheckIn(userId, today);
    return nightlyCheckIn !== null;
  },

  // Get recent nightly check-ins for pattern analysis
  getRecentNightlyCheckIns: async (
    userId: string, 
    days: number = 7
  ): Promise<NightlyCheckIn[]> => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('nightly_check_ins')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent nightly check-ins:', error);
      return [];
    }
  },

  // Analyze patterns across morning-nightly pairs
  analyzeMorningNightlyPatterns: async (userId: string): Promise<{
    visionAlignmentTrend: number[];
    commonAccomplishments: string[];
    frequentEmotions: string[];
    improvementThemes: string[];
    alignmentInsights: string[];
  }> => {
    try {
      const recentNightly = await nightlyCheckInService.getRecentNightlyCheckIns(userId, 14);
      const recentMorning = await morningCheckInService.getRecentMorningCheckIns(userId, 14);

      // Pair morning and nightly check-ins by date
      const pairs = recentNightly.map(nightly => {
        const morning = recentMorning.find(m => m.date === nightly.date);
        return { morning, nightly };
      }).filter((pair): pair is { morning: MorningCheckIn; nightly: NightlyCheckIn } => !!pair.morning); // Only include days with both

      if (pairs.length === 0) {
        return {
          visionAlignmentTrend: [],
          commonAccomplishments: [],
          frequentEmotions: [],
          improvementThemes: [],
          alignmentInsights: [],
        };
      }

      // Extract alignment scores
      const alignmentScores = pairs.map(pair => {
        if (pair.nightly.great_day_reflection) {
          try {
            const reflection = JSON.parse(pair.nightly.great_day_reflection) as GreatDayReflection;
            return reflection.visionAlignment;
          } catch {
            return 0.5; // Default middle score
          }
        }
        return 0.5;
      });

      // Extract common patterns
      const allAccomplishments = pairs.flatMap(p => p.nightly.accomplishments);
      const allEmotions = pairs.map(p => p.nightly.emotions).filter(Boolean);
      const allImprovements = pairs.map(p => p.nightly.improvements).filter(Boolean);

      return {
        visionAlignmentTrend: alignmentScores,
        commonAccomplishments: extractKeywords(allAccomplishments),
        frequentEmotions: extractEmotionKeywords(allEmotions),
        improvementThemes: extractKeywords(allImprovements),
        alignmentInsights: await generateAlignmentInsights(pairs),
      };
    } catch (error) {
      console.error('Error analyzing morning-nightly patterns:', error);
      return {
        visionAlignmentTrend: [],
        commonAccomplishments: [],
        frequentEmotions: [],
        improvementThemes: [],
        alignmentInsights: [],
      };
    }
  },

  // Generate follow-up questions for tomorrow morning based on tonight's reflection
  generateTomorrowFollowUps: async (
    nightlyCheckIn: NightlyCheckIn,
    morningCheckIn?: MorningCheckIn
  ): Promise<string[]> => {
    try {
      if (!morningCheckIn) {
        return [
          "What would make tomorrow feel meaningful?",
          "What energy do you want to bring to tomorrow?",
          "What small win could you celebrate tomorrow?"
        ];
      }

      // Analyze the gap between morning vision and nightly reality
      const followUps: string[] = [];

      // Based on improvements they wanted to make
      if (nightlyCheckIn.improvements.trim()) {
        followUps.push(`Yesterday you wanted to improve: "${nightlyCheckIn.improvements.slice(0, 50)}...". How can you apply this learning tomorrow?`);
      }

      // Based on accomplishments
      if (nightlyCheckIn.accomplishments.length > 0) {
        followUps.push(`You accomplished ${nightlyCheckIn.accomplishments.length} things yesterday. What would accomplishment feel like tomorrow?`);
      }

      // Based on emotions
      if (nightlyCheckIn.emotions.trim()) {
        followUps.push(`Reflecting on yesterday's emotions, what emotional tone do you want to set for today?`);
      }

      // Default fallbacks if we don't have enough specific content
      if (followUps.length < 3) {
        followUps.push(
          "Based on yesterday's reflection, what would make today feel successful?",
          "What did you learn about yourself yesterday that you want to remember today?",
          "How can you build on yesterday's wins?"
        );
      }

      return followUps.slice(0, 3);
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      return [
        "What would make today feel meaningful?",
        "What energy do you want to bring to today?",
        "What small win could you celebrate today?"
      ];
    }
  },
};

// Helper functions

async function analyzeGreatDayAlignment(
  morningCheckIn: MorningCheckIn,
  nightlyCheckIn: NightlyCheckIn
): Promise<GreatDayReflection> {
  try {
    const prompt = `Analyze how well this person's day aligned with their morning vision:

Morning Vision: "${morningCheckIn.great_day_vision}"
Morning Affirmations: "${morningCheckIn.affirmations}"
Morning Gratitude: "${morningCheckIn.gratitude}"

Evening Accomplishments: ${nightlyCheckIn.accomplishments.join(', ')}
Evening Amazing Things: ${nightlyCheckIn.amazing_things.join(', ')}
Evening Emotions: "${nightlyCheckIn.emotions}"
Evening Improvements: "${nightlyCheckIn.improvements}"

Return JSON with:
{
  "visionAlignment": 0.8,
  "alignedElements": ["specific things that matched their vision"],
  "missedElements": ["things from vision that didn't happen"],
  "unexpectedPositives": ["good things that happened but weren't in vision"],
  "learnings": ["insights about alignment"],
  "tomorrowSuggestions": ["specific suggestions for tomorrow"]
}`;

    const response = await aiOrchestrator.generateWisdomGuidedQuestion(
      { user: { id: morningCheckIn.user_id } as any },
      prompt
    );

    const reflection = JSON.parse(response.content);
    
    // Ensure proper structure and defaults
    return {
      visionAlignment: Math.max(0, Math.min(1, reflection.visionAlignment || 0.5)),
      alignedElements: reflection.alignedElements || [],
      missedElements: reflection.missedElements || [],
      unexpectedPositives: reflection.unexpectedPositives || [],
      learnings: reflection.learnings || [],
      tomorrowSuggestions: reflection.tomorrowSuggestions || [],
    };
  } catch (error) {
    console.error('Error analyzing great day alignment:', error);
    
    // Return basic reflection based on simple analysis
    return {
      visionAlignment: 0.7, // Default positive score
      alignedElements: nightlyCheckIn.accomplishments.slice(0, 2),
      missedElements: [],
      unexpectedPositives: nightlyCheckIn.amazing_things.slice(0, 2),
      learnings: ["Every day is a learning opportunity"],
      tomorrowSuggestions: ["Build on today's wins", "Apply today's lessons"],
    };
  }
}

async function storeAsMemory(
  nightlyCheckIn: NightlyCheckIn,
  reflection?: GreatDayReflection
): Promise<{ id: string }> {
  try {
    // Combine the most meaningful parts as a memory
    let memoryContent = `Evening Reflection: 
    Accomplishments: ${nightlyCheckIn.accomplishments.join(', ')}. 
    Amazing moments: ${nightlyCheckIn.amazing_things.join(', ')}. 
    Emotions: ${nightlyCheckIn.emotions}. 
    Could improve: ${nightlyCheckIn.improvements}.`;

    if (reflection) {
      memoryContent += ` Vision alignment: ${Math.round(reflection.visionAlignment * 100)}%. 
      Key learnings: ${reflection.learnings.join(', ')}.`;
    }

    const memory = await memoryService.storeMemory(
      nightlyCheckIn.user_id,
      memoryContent,
      nightlyCheckIn.date,
      'Nightly Check-in'
    );

    return memory;
  } catch (error) {
    console.error('Error storing nightly check-in as memory:', error);
    throw error;
  }
}

async function generateAlignmentInsights(
  pairs: { morning: MorningCheckIn; nightly: NightlyCheckIn }[]
): Promise<string[]> {
  // Generate insights about vision-reality alignment patterns
  const insights: string[] = [];

  if (pairs.length >= 3) {
    const avgAlignment = pairs.reduce((sum, pair) => {
      if (pair.nightly.great_day_reflection) {
        try {
          const reflection = JSON.parse(pair.nightly.great_day_reflection) as GreatDayReflection;
          return sum + reflection.visionAlignment;
        } catch {
          return sum + 0.5;
        }
      }
      return sum + 0.5;
    }, 0) / pairs.length;

    if (avgAlignment > 0.7) {
      insights.push("You're consistently good at turning your morning visions into reality");
    } else if (avgAlignment < 0.4) {
      insights.push("There's often a gap between your morning hopes and evening reality - consider making your visions more specific and achievable");
    } else {
      insights.push("You're moderately aligned with your morning visions - there's room to improve the connection between intention and action");
    }
  }

  // Analyze accomplishment patterns
  const allAccomplishments = pairs.flatMap(p => p.nightly.accomplishments);
  if (allAccomplishments.length > 0) {
    insights.push(`You frequently accomplish tasks related to: ${extractKeywords(allAccomplishments).slice(0, 2).join(', ')}`);
  }

  return insights.slice(0, 3);
}

function extractKeywords(texts: string[]): string[] {
  // Simple keyword extraction (same as morning service)
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

function extractEmotionKeywords(texts: string[]): string[] {
  const emotionWords = [
    'happy', 'sad', 'excited', 'anxious', 'grateful', 'frustrated', 'proud', 'disappointed',
    'energized', 'tired', 'confident', 'worried', 'peaceful', 'stressed', 'motivated', 'overwhelmed',
    'content', 'angry', 'hopeful', 'lonely', 'inspired', 'confused', 'accomplished', 'defeated'
  ];

  const foundEmotions = new Set<string>();
  
  texts.forEach(text => {
    const lowerText = text.toLowerCase();
    emotionWords.forEach(emotion => {
      if (lowerText.includes(emotion)) {
        foundEmotions.add(emotion);
      }
    });
  });

  return Array.from(foundEmotions).slice(0, 5);
}

export default nightlyCheckInService;