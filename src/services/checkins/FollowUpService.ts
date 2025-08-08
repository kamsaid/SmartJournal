// FollowUpService.ts - Coordinates follow-up logic between morning and nightly check-ins
import { morningCheckInService } from './MorningCheckInService';
import { nightlyCheckInService } from './NightlyCheckInService';
import { aiOrchestrator } from '../openai/aiOrchestrator';

export interface FollowUpQuestions {
  baseQuestions: {
    key: string;
    question: string;
    context: string;
  }[];
  customizedQuestions: {
    key: string;
    question: string;
    context: string;
    basedOn: 'previous_night' | 'pattern' | 'alignment';
  }[];
  continuityMessage?: string;
}

export interface SessionContinuity {
  yesterdayNight: boolean;
  yesterdayMorning: boolean;
  hasPattern: boolean;
  alignmentTrend: 'improving' | 'declining' | 'stable' | 'unknown';
  suggestedFocus: string;
}

export const followUpService = {
  // Generate morning questions that follow up on last night's reflection
  generateMorningFollowUps: async (userId: string): Promise<FollowUpQuestions> => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];

      // Get yesterday's check-ins
      const lastNightCheckin = await nightlyCheckInService.getNightlyCheckIn(userId, yesterdayDate);
      const yesterdayMorning = await morningCheckInService.getMorningCheckIn(userId, yesterdayDate);

      // Get recent patterns for context
      const patterns = await nightlyCheckInService.analyzeMorningNightlyPatterns(userId);

      // Base morning questions (always present)
      const baseQuestions = [
        {
          key: 'thoughts_anxieties',
          question: 'Write out all your thoughts and anxieties',
          context: 'Start your day with a mental clearing',
        },
        {
          key: 'great_day_vision',
          question: 'List 3 things that would make today a great day',
          context: 'Set specific intentions for your day ahead',
        },
        {
          key: 'affirmations',
          question: 'I am...',
          context: 'Affirm your strength and potential',
        },
        {
          key: 'gratitude',
          question: 'I am grateful for...',
          context: 'Begin with appreciation',
        },
      ];

      let customizedQuestions: FollowUpQuestions['customizedQuestions'] = [];
      let continuityMessage: string | undefined;

      // If we have yesterday's nightly check-in, generate follow-ups
      if (lastNightCheckin) {
        const tomorrowQuestions = await nightlyCheckInService.generateTomorrowFollowUps(
          lastNightCheckin,
          yesterdayMorning || undefined
        );

        // Convert follow-up suggestions into customized questions
        customizedQuestions = await convertToCustomizedQuestions(tomorrowQuestions, lastNightCheckin, yesterdayMorning || undefined);
        
        continuityMessage = `Building on yesterday's reflection: "${lastNightCheckin.improvements.slice(0, 80)}${lastNightCheckin.improvements.length > 80 ? '...' : ''}"`;
      }

      // Add pattern-based customizations if we have enough data
      if (patterns.visionAlignmentTrend.length >= 3) {
        const patternQuestion = await generatePatternBasedQuestion(patterns, userId);
        if (patternQuestion) {
          customizedQuestions.push(patternQuestion);
        }
      }

      return {
        baseQuestions,
        customizedQuestions,
        continuityMessage,
      };
    } catch (error) {
      console.error('Error generating morning follow-ups:', error);
      
      // Return default questions if something goes wrong
      return {
        baseQuestions: [
          {
            key: 'thoughts_anxieties',
            question: 'Write out all your thoughts and anxieties',
            context: 'Start your day with a mental clearing',
          },
          {
            key: 'great_day_vision',
            question: 'What would make today a great day?',
            context: 'Set your intention for the day ahead',
          },
          {
            key: 'affirmations',
            question: 'I am...',
            context: 'Affirm your strength and potential',
          },
          {
            key: 'gratitude',
            question: 'I am grateful for...',
            context: 'Begin with appreciation',
          },
        ],
        customizedQuestions: [],
      };
    }
  },

  // Generate nightly questions that reflect on morning intentions
  generateNightlyFollowUps: async (userId: string): Promise<FollowUpQuestions> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thismorning = await morningCheckInService.getMorningCheckIn(userId, today);

      // Base nightly questions (always present)
      const baseQuestions = [
        {
          key: 'improvements',
          question: 'How could I have made today better?',
          context: 'Reflect honestly on the day',
        },
        {
          key: 'amazing_things',
          question: '3 amazing things that happened today...',
          context: 'Celebrate the good moments',
        },
        {
          key: 'accomplishments',
          question: '3 things you accomplished',
          context: 'Acknowledge your progress',
        },
        {
          key: 'emotions',
          question: 'What made you happy/sad today?',
          context: 'Process your emotional experience',
        },
      ];

      let customizedQuestions: FollowUpQuestions['customizedQuestions'] = [];
      let continuityMessage: string | undefined;

      // If we have this morning's check-in, create reflection questions
      if (thismorning) {
        customizedQuestions = await generateMorningReflectionQuestions(thismorning);
        continuityMessage = `Reflecting on your morning vision: "${thismorning.great_day_vision.slice(0, 80)}${thismorning.great_day_vision.length > 80 ? '...' : ''}"`;
      }

      return {
        baseQuestions,
        customizedQuestions,
        continuityMessage,
      };
    } catch (error) {
      console.error('Error generating nightly follow-ups:', error);
      
      // Return default questions
      return {
        baseQuestions: [
          {
            key: 'improvements',
            question: 'How could I have made today better?',
            context: 'Reflect honestly on the day',
          },
          {
            key: 'amazing_things',
            question: '3 amazing things that happened today...',
            context: 'Celebrate the good moments',
          },
          {
            key: 'accomplishments',
            question: '3 things you accomplished',
            context: 'Acknowledge your progress',
          },
          {
            key: 'emotions',
            question: 'What made you happy/sad today?',
            context: 'Process your emotional experience',
          },
        ],
        customizedQuestions: [],
      };
    }
  },

  // Get session continuity information
  getSessionContinuity: async (userId: string): Promise<SessionContinuity> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];

      const [todayMorning, yesterdayNight, yesterdayMorning, patterns] = await Promise.all([
        morningCheckInService.getMorningCheckIn(userId, today),
        nightlyCheckInService.getNightlyCheckIn(userId, yesterdayDate),
        morningCheckInService.getMorningCheckIn(userId, yesterdayDate),
        nightlyCheckInService.analyzeMorningNightlyPatterns(userId),
      ]);

      // Determine alignment trend
      let alignmentTrend: SessionContinuity['alignmentTrend'] = 'unknown';
      if (patterns.visionAlignmentTrend.length >= 3) {
        const recent = patterns.visionAlignmentTrend.slice(0, 3);
        const trend = recent[0] - recent[2]; // Compare most recent to 3 days ago
        if (trend > 0.1) alignmentTrend = 'improving';
        else if (trend < -0.1) alignmentTrend = 'declining';
        else alignmentTrend = 'stable';
      }

      // Suggest focus area
      let suggestedFocus = 'self-awareness';
      if (patterns.improvementThemes.length > 0) {
        suggestedFocus = patterns.improvementThemes[0];
      } else if (alignmentTrend === 'declining') {
        suggestedFocus = 'vision-alignment';
      }

      return {
        yesterdayNight: !!yesterdayNight,
        yesterdayMorning: !!yesterdayMorning,
        hasPattern: patterns.visionAlignmentTrend.length >= 3,
        alignmentTrend,
        suggestedFocus,
      };
    } catch (error) {
      console.error('Error getting session continuity:', error);
      return {
        yesterdayNight: false,
        yesterdayMorning: false,
        hasPattern: false,
        alignmentTrend: 'unknown',
        suggestedFocus: 'self-awareness',
      };
    }
  },
};

// Helper functions

async function convertToCustomizedQuestions(
  followUpTexts: string[],
  lastNightCheckin: any,
  yesterdayMorning?: any
): Promise<FollowUpQuestions['customizedQuestions']> {
  const customized: FollowUpQuestions['customizedQuestions'] = [];

  // Convert the first follow-up into a customized "great day" question
  if (followUpTexts[0] && followUpTexts[0].length > 10) {
    customized.push({
      key: 'great_day_vision',
      question: followUpTexts[0],
      context: 'Based on yesterday\'s reflection',
      basedOn: 'previous_night',
    });
  }

  // Convert other follow-ups into affirmation or gratitude customizations
  if (followUpTexts[1]) {
    customized.push({
      key: 'affirmations',
      question: `Building on yesterday's growth, I am...`,
      context: followUpTexts[1],
      basedOn: 'previous_night',
    });
  }

  return customized;
}

async function generatePatternBasedQuestion(
  patterns: any,
  userId: string
): Promise<FollowUpQuestions['customizedQuestions'][0] | null> {
  try {
    if (patterns.alignmentInsights.length === 0) return null;

    const insight = patterns.alignmentInsights[0];
    const prompt = `Based on this pattern insight: "${insight}"
    
Create a personalized morning question that helps them improve their vision-reality alignment.
The question should be:
- Specific to their pattern
- Forward-looking
- Actionable
- 3-8 words when possible

Return just the question text.`;

    const response = await aiOrchestrator.generateWisdomGuidedQuestion(
      { user: { id: userId } as any },
      prompt
    );

    return {
      key: 'great_day_vision',
      question: response.content.trim(),
      context: `Pattern insight: ${insight.slice(0, 60)}...`,
      basedOn: 'pattern',
    };
  } catch (error) {
    console.error('Error generating pattern-based question:', error);
    return null;
  }
}

async function generateMorningReflectionQuestions(
  morningCheckin: any
): Promise<FollowUpQuestions['customizedQuestions']> {
  const customized: FollowUpQuestions['customizedQuestions'] = [];

  // Create a reflection question based on their morning vision
  if (morningCheckin.great_day_vision.trim()) {
    customized.push({
      key: 'improvements',
      question: `How well did you live up to your morning vision: "${morningCheckin.great_day_vision.slice(0, 50)}..."? What would you change?`,
      context: 'Reflecting on your morning intention',
      basedOn: 'alignment',
    });
  }

  // Create accomplishment question based on affirmations
  if (morningCheckin.affirmations.trim()) {
    customized.push({
      key: 'accomplishments',
      question: `Your morning affirmation was "${morningCheckin.affirmations.slice(0, 30)}..." - what did you accomplish that proves this?`,
      context: 'Connecting affirmations to actions',
      basedOn: 'alignment',
    });
  }

  return customized;
}

export default followUpService;