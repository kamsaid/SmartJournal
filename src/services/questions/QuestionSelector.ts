// QuestionSelector.ts - Adaptive Question Selection for Daily Check-ins
// Selects 3-4 personalized questions based on user's memory, phase, and recent patterns

import { QuestionTemplate, UserMemory, User, QuestionInputType, TransformationPhase } from '@/types/database';
import { memoryService } from '../memory/MemoryService';
import { aiOrchestrator } from '../openai/aiOrchestrator';

export interface QuestionSelection {
  questions: SelectedQuestion[];
  memoryReferences: string[];
  totalEstimatedMinutes: number;
  adaptationReason: string;
}

export interface SelectedQuestion {
  id: string;
  question_text: string;
  input_type: QuestionInputType;
  depth_level: number;
  scientific_method: string;
  memory_context?: string; // Reference to past conversation
  expected_duration_minutes: number;
}

// Question bank with different types and depth levels
const QUESTION_BANK: QuestionTemplate[] = [
  // Slider Questions (1-10 scale)
  {
    id: 'energy-1',
    question_text: 'How energized do you feel today?',
    input_type: 'slider',
    depth_level: 1,
    required_phase: 1,
    scientific_method: 'baseline_tracking',
    expected_insights: ['Energy patterns', 'Daily rhythms'],
    context_triggers: ['health', 'energy', 'morning', 'tired'],
  },
  {
    id: 'control-2',
    question_text: 'How much control do you feel over your day?',
    input_type: 'slider',
    depth_level: 2,
    required_phase: 1,
    scientific_method: 'agency_assessment',
    expected_insights: ['Personal agency', 'Life control'],
    context_triggers: ['overwhelmed', 'stress', 'control', 'chaos'],
  },
  {
    id: 'growth-3',
    question_text: 'How challenged are you feeling lately?',
    input_type: 'slider',
    depth_level: 3,
    required_phase: 2,
    scientific_method: 'growth_zone_tracking',
    expected_insights: ['Comfort zone status', 'Growth opportunities'],
    context_triggers: ['comfort', 'challenge', 'growth', 'stagnant'],
  },

  // Yes/No Questions
  {
    id: 'patterns-1',
    question_text: 'Did you notice any recurring thoughts today?',
    input_type: 'yes_no',
    depth_level: 2,
    required_phase: 1,
    scientific_method: 'pattern_recognition',
    expected_insights: ['Thought patterns', 'Self-awareness'],
    context_triggers: ['thoughts', 'patterns', 'mindset', 'beliefs'],
  },
  {
    id: 'action-1',
    question_text: 'Did you act on something you normally avoid?',
    input_type: 'yes_no',
    depth_level: 3,
    required_phase: 2,
    scientific_method: 'behavioral_change',
    expected_insights: ['Action patterns', 'Avoidance behaviors'],
    context_triggers: ['avoid', 'procrastinate', 'fear', 'action'],
  },

  // Short Text Questions
  {
    id: 'moment-1',
    question_text: 'What moment made you feel most alive today?',
    input_type: 'short_text',
    depth_level: 2,
    required_phase: 1,
    scientific_method: 'narrative_concrete',
    expected_insights: ['Life energy sources', 'Values alignment'],
    context_triggers: ['alive', 'energy', 'joy', 'purpose'],
  },
  {
    id: 'learn-1',
    question_text: 'What did you learn about yourself today?',
    input_type: 'short_text',
    depth_level: 4,
    required_phase: 1,
    scientific_method: 'self_reflection',
    expected_insights: ['Self-awareness', 'Personal growth'],
    context_triggers: ['learn', 'discover', 'realize', 'insight'],
  },
  {
    id: 'choice-1',
    question_text: 'What choice are you avoiding right now?',
    input_type: 'short_text',
    depth_level: 5,
    required_phase: 2,
    scientific_method: 'CBT_socratic',
    expected_insights: ['Avoidance patterns', 'Decision-making'],
    context_triggers: ['avoid', 'choice', 'decision', 'stuck'],
  },
  {
    id: 'grateful-1',
    question_text: 'What are you grateful for in this challenge?',
    input_type: 'short_text',
    depth_level: 3,
    required_phase: 1,
    scientific_method: 'gratitude_reframing',
    expected_insights: ['Perspective shifts', 'Hidden blessings'],
    context_triggers: ['challenge', 'difficult', 'struggle', 'problem'],
    prerequisite_patterns: ['facing challenges'],
  },

  // Deep Reflection Questions
  {
    id: 'pattern-deep-1',
    question_text: 'What pattern from your past are you repeating?',
    input_type: 'short_text',
    depth_level: 6,
    required_phase: 2,
    scientific_method: 'pattern_analysis',
    expected_insights: ['Life patterns', 'Historical repetition'],
    context_triggers: ['repeat', 'pattern', 'again', 'cycle'],
  },
  {
    id: 'belief-deep-1',
    question_text: 'What belief is creating this situation?',
    input_type: 'short_text',
    depth_level: 7,
    required_phase: 3,
    scientific_method: 'root_cause_analysis',
    expected_insights: ['Core beliefs', 'Belief systems'],
    context_triggers: ['belief', 'think', 'assume', 'expect'],
  },
];

export const questionSelector = {
  // Select 3-4 questions for today's check-in
  selectDailyQuestions: async (
    user: User,
    recentMemories: UserMemory[],
    yesterdayResponses?: string[]
  ): Promise<QuestionSelection> => {
    try {
      // Get relevant memories and patterns
      const relevantMemories = await memoryService.getRelevantMemories({
        userId: user.id,
        currentInput: 'daily check-in',
        recentResponses: yesterdayResponses,
      });

      // Filter questions by user's phase and available depth
      const availableQuestions = filterQuestionsByPhase(user, QUESTION_BANK);
      
      // Select question mix: 1 slider, 1 yes/no, 2 text (or 1 if short on time)
      const selectedQuestions: SelectedQuestion[] = [];
      
      // 1. Select one slider question
      const sliderQuestion = selectBestQuestion(
        availableQuestions.filter(q => q.input_type === 'slider'),
        relevantMemories,
        'slider'
      );
      if (sliderQuestion) selectedQuestions.push(sliderQuestion);

      // 2. Select one yes/no question  
      const yesNoQuestion = selectBestQuestion(
        availableQuestions.filter(q => q.input_type === 'yes_no'),
        relevantMemories,
        'yes_no'
      );
      if (yesNoQuestion) selectedQuestions.push(yesNoQuestion);

      // 3. Select 1-2 text questions based on context
      const textQuestions = selectTextQuestions(
        availableQuestions.filter(q => q.input_type === 'short_text'),
        relevantMemories,
        2
      );
      selectedQuestions.push(...textQuestions);

      // Generate memory references for continuity
      const memoryReferences = relevantMemories.memoryReferences.slice(0, 2);

      // Calculate total time
      const totalMinutes = selectedQuestions.reduce(
        (sum, q) => sum + q.expected_duration_minutes, 
        0
      );

      // Create adaptation reason
      const adaptationReason = createAdaptationReason(
        relevantMemories.patterns,
        selectedQuestions.length,
        user.current_phase
      );

      return {
        questions: selectedQuestions,
        memoryReferences,
        totalEstimatedMinutes: totalMinutes,
        adaptationReason,
      };
    } catch (error) {
      console.error('Error selecting daily questions:', error);
      return getDefaultQuestions(user);
    }
  },

  // Get questions that follow up on specific patterns or insights
  getFollowUpQuestions: async (
    patterns: string[],
    insights: string[],
    userPhase: TransformationPhase
  ): Promise<QuestionTemplate[]> => {
    return QUESTION_BANK.filter(question => {
      // Check if question addresses any of the discovered patterns
      const addressesPattern = patterns.some(pattern =>
        question.context_triggers.some(trigger =>
          pattern.toLowerCase().includes(trigger.toLowerCase())
        )
      );

      // Check if prerequisites are met
      const prerequisitesMet = !question.prerequisite_patterns ||
        question.prerequisite_patterns.some(prereq =>
          patterns.some(pattern =>
            pattern.toLowerCase().includes(prereq.toLowerCase())
          )
        );

      return addressesPattern && prerequisitesMet && question.required_phase <= userPhase;
    });
  },

  // Generate contextual questions based on memory analysis
  generateContextualQuestion: async (
    memoryContext: string,
    userPhase: TransformationPhase,
    targetDepth: number
  ): Promise<SelectedQuestion | null> => {
    try {
      const prompt = `Based on this user's recent conversation context: "${memoryContext}"

Generate a personalized question that:
- References their specific situation naturally
- Is appropriate for Phase ${userPhase} of their growth journey
- Targets depth level ${targetDepth}/10
- Takes 2-3 minutes to answer thoughtfully
- Feels like it comes from a wise friend who remembers their story

Return JSON with:
{
  "question_text": "the personalized question",
  "input_type": "short_text",
  "scientific_method": "the psychological approach used",
  "memory_context": "brief reference to what they shared before"
}`;

      const response = await aiOrchestrator.generateWisdomGuidedQuestion(
        { user: { current_phase: userPhase } as any },
        prompt
      );

      const questionData = JSON.parse(response.content);

      return {
        id: `contextual-${Date.now()}`,
        question_text: questionData.question_text,
        input_type: 'short_text',
        depth_level: targetDepth,
        scientific_method: questionData.scientific_method,
        memory_context: questionData.memory_context,
        expected_duration_minutes: 3,
      };
    } catch (error) {
      console.error('Error generating contextual question:', error);
      return null;
    }
  },
};

// Helper functions

function filterQuestionsByPhase(user: User, questions: QuestionTemplate[]): QuestionTemplate[] {
  return questions.filter(question => {
    return question.required_phase <= user.current_phase;
  });
}

function selectBestQuestion(
  candidates: QuestionTemplate[],
  relevantMemories: any,
  type: string
): SelectedQuestion | null {
  if (candidates.length === 0) return null;

  // Score questions based on relevance to memory patterns
  const scoredQuestions = candidates.map(question => {
    let score = 0;
    
    // Boost score if question addresses current patterns
    const patternsMatch = question.context_triggers.some(trigger =>
      relevantMemories.patterns.some((pattern: string) =>
        pattern.toLowerCase().includes(trigger.toLowerCase())
      )
    );
    if (patternsMatch) score += 10;

    // Boost score for appropriate depth
    score += question.depth_level;

    // Random factor to avoid repetition
    score += Math.random() * 5;

    return { question, score };
  });

  const bestQuestion = scoredQuestions
    .sort((a, b) => b.score - a.score)[0]
    .question;

  return {
    id: bestQuestion.id,
    question_text: bestQuestion.question_text,
    input_type: bestQuestion.input_type,
    depth_level: bestQuestion.depth_level,
    scientific_method: bestQuestion.scientific_method,
    expected_duration_minutes: type === 'slider' ? 1 : type === 'yes_no' ? 1.5 : 3,
  };
}

function selectTextQuestions(
  candidates: QuestionTemplate[],
  relevantMemories: any,
  count: number
): SelectedQuestion[] {
  const scored = candidates.map(question => {
    let score = 0;
    
    // Prioritize questions that address current patterns
    const patternsMatch = question.context_triggers.some(trigger =>
      relevantMemories.patterns.some((pattern: string) =>
        pattern.toLowerCase().includes(trigger.toLowerCase())
      )
    );
    if (patternsMatch) score += 20;

    // Prefer higher depth questions for more insights
    score += question.depth_level * 2;

    // Prerequisites check
    if (question.prerequisite_patterns) {
      const prerequisitesMet = question.prerequisite_patterns.some(prereq =>
        relevantMemories.patterns.some((pattern: string) =>
          pattern.toLowerCase().includes(prereq.toLowerCase())
        )
      );
      if (!prerequisitesMet) score -= 50;
    }

    score += Math.random() * 10;

    return { question, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(item => ({
      id: item.question.id,
      question_text: item.question.question_text,
      input_type: item.question.input_type,
      depth_level: item.question.depth_level,
      scientific_method: item.question.scientific_method,
      expected_duration_minutes: 3,
    }));
}

function createAdaptationReason(
  patterns: string[],
  questionCount: number,
  phase: TransformationPhase
): string {
  if (patterns.length > 0) {
    return `Based on patterns I've noticed: ${patterns.slice(0, 2).join(', ')}`;
  }
  
  return `Tailored for Phase ${phase} growth with ${questionCount} questions`;
}

function getDefaultQuestions(user: User): QuestionSelection {
  // Fallback questions if something goes wrong
  return {
    questions: [
      {
        id: 'default-1',
        question_text: 'How are you feeling today?',
        input_type: 'slider',
        depth_level: 1,
        scientific_method: 'baseline_tracking',
        expected_duration_minutes: 1,
      },
      {
        id: 'default-2',
        question_text: 'What\'s on your mind right now?',
        input_type: 'short_text',
        depth_level: 2,
        scientific_method: 'open_reflection',
        expected_duration_minutes: 3,
      },
    ],
    memoryReferences: [],
    totalEstimatedMinutes: 4,
    adaptationReason: 'Default questions for getting started',
  };
}

export default questionSelector;