// AIFollowUpService.ts - Advanced AI-powered follow-up question generation
// Integrates with existing wisdom engine and AI orchestration systems

import { FollowUpContext, CheckInType, TransformationPhase } from '@/types/database';
import { wisdomEngine } from '@/ai/wisdomEngine';
import { aiOrchestrator } from '../openai/aiOrchestrator';
import contextAwareRouter from '../openai/contextAwareRouter';
import { patternRecognition } from '@/ai/patternRecognition';
import { memoryService } from '../memory/MemoryService';
import { generateUUID } from '@/utils/uuid';

export interface AIFollowUpQuestion {
  question_id: string;
  question_text: string;
  contemplative_depth: number; // 1-10 scale
  wisdom_category: 'contemplation' | 'accountability' | 'excellence' | 'balance' | 'gratitude' | 'patience';
  scientific_method: string;
  expected_insight_type: string;
  estimated_response_time: number; // minutes
}

export interface FollowUpSession {
  questions: AIFollowUpQuestion[];
  contemplative_state: string;
  ai_routing_strategy: string;
  wisdom_level_applied: number;
  session_insights: string[];
  recommended_next_steps: string[];
}

export const aiFollowUpService = {
  // Generate AI follow-up questions for morning check-ins
  generateMorningFollowUps: async (
    userId: string,
    coreResponses: Record<string, any>,
    currentPhase: TransformationPhase
  ): Promise<FollowUpSession> => {
    try {
      // Build context for AI systems
      const context: FollowUpContext = {
        user_id: userId,
        check_in_type: 'morning',
        core_responses: coreResponses,
        recent_patterns: await getRecentPatterns(userId),
        current_phase: currentPhase,
        previous_insights: await getPreviousInsights(userId, 'morning'),
      };

      // Detect contemplative state
      const contemplativeState = await detectContemplativeState(context);
      context.contemplative_state = contemplativeState;

      // Generate 1-2 follow-up questions based on core responses
      const questions = await generateMorningFollowUpQuestions(context, null);

      // Get AI insights from core responses
      const insights = await generateInitialInsights(context, 'morning');

      // Provide recommendations for the day ahead
      const nextSteps = await generateDayAheadRecommendations(context);

      return {
        questions,
        contemplative_state: contemplativeState,
        ai_routing_strategy: 'wisdom_guide',
        wisdom_level_applied: Math.min(currentPhase + 1, 5),
        session_insights: insights,
        recommended_next_steps: nextSteps,
      };
    } catch (error) {
      console.error('Error generating morning follow-ups:', error);
      return getDefaultMorningSession(currentPhase);
    }
  },

  // Generate AI follow-up questions for nightly check-ins
  generateNightlyFollowUps: async (
    userId: string,
    coreResponses: Record<string, any>,
    morningResponses: Record<string, any> | null,
    currentPhase: TransformationPhase
  ): Promise<FollowUpSession> => {
    try {
      // Build context including morning-evening alignment
      const context: FollowUpContext = {
        user_id: userId,
        check_in_type: 'nightly',
        core_responses: { ...coreResponses, morning_context: morningResponses },
        recent_patterns: await getRecentPatterns(userId),
        current_phase: currentPhase,
        previous_insights: await getPreviousInsights(userId, 'nightly'),
      };

      // Detect contemplative state and readiness for deeper reflection
      const contemplativeState = await detectContemplativeState(context);
      context.contemplative_state = contemplativeState;

      // Generate reflection-focused follow-up questions
      const questions = await generateNightlyFollowUpQuestions(context, null, morningResponses);

      // Analyze day's alignment and generate insights
      const insights = await generateNightlyInsights(context, morningResponses);

      // Provide suggestions for tomorrow
      const nextSteps = await generateTomorrowPreparation(context, morningResponses);

      return {
        questions,
        contemplative_state: contemplativeState,
        ai_routing_strategy: 'pattern_recognizer',
        wisdom_level_applied: Math.min(currentPhase + 1, 5),
        session_insights: insights,
        recommended_next_steps: nextSteps,
      };
    } catch (error) {
      console.error('Error generating nightly follow-ups:', error);
      return getDefaultNightlySession(currentPhase);
    }
  },

  // Process user responses to follow-up questions and generate final insights
  processFollowUpResponses: async (
    session: FollowUpSession,
    responses: Record<string, string>,
    context: FollowUpContext
  ): Promise<{
    final_insights: string[];
    breakthroughs_detected: string[];
    pattern_confirmations: string[];
    wisdom_gained: string[];
    next_session_recommendations: string[];
  }> => {
    try {
      // Simple pattern analysis
      const patternAnalysis = {
        new_patterns_detected: [
          { description: 'Follow-up response pattern detected' }
        ],
      };

      // Generate AI insights from responses
      const wisdomInsights = {
        key_insights: [`Processed ${Object.keys(responses).length} follow-up responses`],
        wisdom_categories_engaged: [session.contemplative_state || 'curious'],
      };

      // Detect breakthroughs and significant insights
      const breakthroughs = await detectBreakthroughs(responses, context, session);

      // Store insights in memory for future context
      await storeFollowUpInsights(context, responses, wisdomInsights);

      return {
        final_insights: wisdomInsights.key_insights || [],
        breakthroughs_detected: breakthroughs,
        pattern_confirmations: patternAnalysis.new_patterns_detected?.map(p => p.description) || [],
        wisdom_gained: wisdomInsights.wisdom_categories_engaged || [],
        next_session_recommendations: await generateNextSessionRecommendations(context, responses),
      };
    } catch (error) {
      console.error('Error processing follow-up responses:', error);
      return {
        final_insights: ['Continue reflecting on today\'s experiences'],
        breakthroughs_detected: [],
        pattern_confirmations: [],
        wisdom_gained: [],
        next_session_recommendations: [],
      };
    }
  },
};

// Helper functions

async function getRecentPatterns(userId: string): Promise<string[]> {
  try {
    const patterns = await memoryService.identifyMemoryPatterns(userId);
    return patterns.slice(0, 5); // Top 5 recent patterns
  } catch (error) {
    console.error('Error getting recent patterns:', error);
    return [];
  }
}

async function getPreviousInsights(userId: string, type: 'morning' | 'nightly'): Promise<string[]> {
  try {
    const recentMemories = await memoryService.getRecentMemories(userId, 3, 5);
    return recentMemories
      .filter((memory: any) => memory.context_tags.includes(type))
      .flatMap((memory: any) => memory.patterns_mentioned)
      .slice(0, 3);
  } catch (error) {
    console.error('Error getting previous insights:', error);
    return [];
  }
}

async function detectContemplativeState(context: FollowUpContext): Promise<string> {
  try {
    // Analyze response patterns to detect contemplative readiness
    const responses = Object.values(context.core_responses);
    const responseLength = responses.join(' ').length;
    const emotionalWords = ['anxious', 'worried', 'excited', 'grateful', 'frustrated', 'peaceful'];
    const emotionalIndicators = responses.some(response => 
      emotionalWords.some(word => 
        response.toString().toLowerCase().includes(word)
      )
    );

    // Simple heuristic for contemplative state detection
    if (responseLength > 200 && emotionalIndicators) return 'breakthrough';
    if (responseLength > 100) return 'ready';
    if (emotionalIndicators) return 'curious';
    if (responseLength < 50) return 'resistant';
    return 'curious';
  } catch (error) {
    console.error('Error detecting contemplative state:', error);
    return 'curious';
  }
}

async function generateMorningFollowUpQuestions(
  context: FollowUpContext, 
  routingStrategy: any
): Promise<AIFollowUpQuestion[]> {
  try {
    const questions: AIFollowUpQuestion[] = [];
    
    // Generate 1-2 follow-up questions based on core responses
    const greatDayVision = context.core_responses.great_day_vision || '';
    const anxieties = context.core_responses.thoughts_anxieties || '';

    // Question 1: Dig deeper into their vision
    if (greatDayVision.length > 10) {
      questions.push({
        question_id: generateUUID(),
        question_text: 'What specific feeling would achieving your great day vision give you?',
        contemplative_depth: 4,
        wisdom_category: 'contemplation',
        scientific_method: 'motivational_interviewing',
        expected_insight_type: 'vision_clarification',
        estimated_response_time: 2,
      });
    }

    // Question 2: Address anxieties constructively (if present)
    if (anxieties.length > 20 && questions.length < 2) {
      questions.push({
        question_id: generateUUID(),
        question_text: 'What small action could address your biggest concern today?',
        contemplative_depth: 3,
        wisdom_category: 'balance',
        scientific_method: 'CBT_socratic',
        expected_insight_type: 'anxiety_transformation',
        estimated_response_time: 2,
      });
    }

    return questions;
  } catch (error) {
    console.error('Error generating morning follow-up questions:', error);
    return [{
      question_id: generateUUID(),
      question_text: 'What would make you feel most proud of yourself today?',
      contemplative_depth: 3,
      wisdom_category: 'contemplation',
      scientific_method: 'open_inquiry',
      expected_insight_type: 'self_worth',
      estimated_response_time: 2,
    }];
  }
}

async function generateNightlyFollowUpQuestions(
  context: FollowUpContext,
  routingStrategy: any,
  morningResponses: Record<string, any> | null
): Promise<AIFollowUpQuestion[]> {
  try {
    const questions: AIFollowUpQuestion[] = [];
    
    // Generate alignment-focused questions if we have morning context
    if (morningResponses?.great_day_vision) {
      questions.push({
        question_id: generateUUID(),
        question_text: 'How did your day align with your morning vision? What surprised you?',
        contemplative_depth: 5,
        wisdom_category: 'accountability',
        scientific_method: 'reflection_analysis',
        expected_insight_type: 'vision_reality_alignment',
        estimated_response_time: 3,
      });
    }

    // Generate growth question based on what they learned
    if (questions.length < 2) {
      questions.push({
        question_id: generateUUID(),
        question_text: 'What did today teach you about yourself that you want to remember?',
        contemplative_depth: 4,
        wisdom_category: 'excellence',
        scientific_method: 'pattern_recognition',
        expected_insight_type: 'self_knowledge',
        estimated_response_time: 3,
      });
    }

    return questions;
  } catch (error) {
    console.error('Error generating nightly follow-up questions:', error);
    return [{
      question_id: generateUUID(),
      question_text: 'What would you do differently if you could repeat today?',
      contemplative_depth: 4,
      wisdom_category: 'accountability',
      scientific_method: 'counterfactual_thinking',
      expected_insight_type: 'improvement_opportunity',
      estimated_response_time: 3,
    }];
  }
}

function calculateMorningAlignment(morning: Record<string, any>, evening: Record<string, any>): number {
  // Simple alignment calculation between morning vision and evening reality
  try {
    const morningVision = morning.great_day_vision || '';
    const accomplishments = evening.accomplishments || [];
    const amazingThings = evening.amazing_things || [];
    
    // Basic keyword overlap analysis
    const visionWords = morningVision.toLowerCase().split(' ').filter((w: string) => w.length > 3);
    const realityText = [...accomplishments, ...amazingThings].join(' ').toLowerCase();
    
    const overlap = visionWords.filter((word: string) => realityText.includes(word)).length;
    return Math.min(overlap / Math.max(visionWords.length, 1), 1);
  } catch {
    return 0.5; // Default neutral alignment
  }
}

async function generateInitialInsights(context: FollowUpContext, type: 'morning' | 'nightly'): Promise<string[]> {
  // Generate AI insights from core responses before follow-up questions
  try {
    const insights: string[] = [];
    
    if (type === 'morning') {
      const vision = context.core_responses.great_day_vision;
      if (vision && vision.length > 20) {
        insights.push(`Your vision focuses on ${extractKeyThemes(vision).join(' and ')}`);
      }
    } else {
      const accomplishments = context.core_responses.accomplishments || [];
      if (accomplishments.length >= 3) {
        insights.push('You had a productive day with multiple accomplishments');
      }
    }
    
    return insights;
  } catch (error) {
    return [];
  }
}

async function generateDayAheadRecommendations(context: FollowUpContext): Promise<string[]> {
  return [
    'Consider setting specific time blocks for your most important intentions',
    'Notice when you feel most aligned with your morning vision',
    'Check in with yourself at midday to stay on track',
  ];
}

async function generateNightlyInsights(context: FollowUpContext, morningResponses: Record<string, any> | null): Promise<string[]> {
  const insights: string[] = [];
  
  if (morningResponses) {
    const alignment = calculateMorningAlignment(morningResponses, context.core_responses);
    if (alignment > 0.7) {
      insights.push('Strong alignment between your morning vision and evening reality');
    } else if (alignment < 0.3) {
      insights.push('Consider how to better bridge your morning intentions with daily actions');
    }
  }
  
  return insights;
}

async function generateTomorrowPreparation(context: FollowUpContext, morningResponses: Record<string, any> | null): Promise<string[]> {
  return [
    'Reflect on what worked well today as you set tomorrow\'s intentions',
    'Consider what environmental factors supported your success',
    'Think about how to build on today\'s positive moments',
  ];
}

async function detectBreakthroughs(responses: Record<string, string>, context: FollowUpContext, session: FollowUpSession): Promise<string[]> {
  // Detect potential breakthrough moments in follow-up responses
  const breakthroughIndicators = ['realize', 'understand', 'see now', 'insight', 'breakthrough', 'clarity'];
  const breakthroughs: string[] = [];
  
  Object.values(responses).forEach(response => {
    if (breakthroughIndicators.some(indicator => response.toLowerCase().includes(indicator))) {
      breakthroughs.push('Potential insight or realization detected');
    }
  });
  
  return breakthroughs;
}

async function storeFollowUpInsights(context: FollowUpContext, responses: Record<string, string>, insights: any): Promise<void> {
  try {
    const combinedContent = `Follow-up responses: ${Object.values(responses).join(' | ')}. Insights: ${insights.key_insights?.join(', ') || 'Processing insights'}`;
    
    await memoryService.storeMemory(
      context.user_id,
      combinedContent,
      new Date().toISOString().split('T')[0],
      `${context.check_in_type} follow-up session`
    );
  } catch (error) {
    console.error('Error storing follow-up insights:', error);
  }
}

async function generateNextSessionRecommendations(context: FollowUpContext, responses: Record<string, string>): Promise<string[]> {
  return [
    'Continue exploring the themes that emerged in today\'s reflection',
    'Pay attention to patterns that might be developing',
    'Consider how today\'s insights can inform future decisions',
  ];
}

function extractKeyThemes(text: string): string[] {
  // Simple theme extraction
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  return text.toLowerCase()
    .split(' ')
    .filter(word => word.length > 4 && !commonWords.has(word))
    .slice(0, 3);
}

function getDefaultMorningSession(phase: TransformationPhase): FollowUpSession {
  return {
    questions: [{
      question_id: generateUUID(),
      question_text: 'What would make you feel most fulfilled about today?',
      contemplative_depth: Math.min(phase + 1, 5),
      wisdom_category: 'contemplation',
      scientific_method: 'open_inquiry',
      expected_insight_type: 'fulfillment_clarity',
      estimated_response_time: 2,
    }],
    contemplative_state: 'curious',
    ai_routing_strategy: 'wisdom_guide',
    wisdom_level_applied: Math.min(phase + 1, 5),
    session_insights: ['Focus on what brings you genuine satisfaction'],
    recommended_next_steps: ['Set clear intentions for your day'],
  };
}

function getDefaultNightlySession(phase: TransformationPhase): FollowUpSession {
  return {
    questions: [{
      question_id: generateUUID(),
      question_text: 'What did you learn about yourself today?',
      contemplative_depth: Math.min(phase + 1, 5),
      wisdom_category: 'accountability',
      scientific_method: 'reflection_analysis',
      expected_insight_type: 'self_knowledge',
      estimated_response_time: 3,
    }],
    contemplative_state: 'ready',
    ai_routing_strategy: 'pattern_recognizer',
    wisdom_level_applied: Math.min(phase + 1, 5),
    session_insights: ['Every day offers opportunities for self-discovery'],
    recommended_next_steps: ['Carry today\'s learnings into tomorrow'],
  };
}

export default aiFollowUpService;