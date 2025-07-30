// ChallengeGenerator.ts - Daily Challenge System
// Creates meaningful experiments that help users notice patterns and unlock self-awareness

import { DailyChallenge, ChallengeType, UserMemory, User, TransformationPhase } from '@/types/database';
import { aiOrchestrator } from '../openai/aiOrchestrator';
import { generateUUID } from '@/utils/uuid';

export interface ChallengeContext {
  user: User;
  todayResponses: string[];
  recentMemories: UserMemory[];
  patterns: string[];
  currentStruggles: string[];
  growthEdge: string;
}

export interface ChallengeOptions {
  primary: DailyChallenge;
  alternative: DailyChallenge;
  explanation: string;
  whyThisMatters: string;
  expectedInsights: string[];
}

// Challenge templates by type and phase
const CHALLENGE_TEMPLATES = {
  // Great day focused challenges - tied to morning vision
  great_day_focused: {
    1: [
      'Take one specific action that moves you toward your great day vision',
      'Notice when you feel closest to your morning intention throughout the day',
      'Check in with yourself at lunch: "Am I on track for my great day?"',
      'Do one thing that would make your morning self proud',
      'Create a small moment that aligns with what would make today great',
    ],
    2: [
      'Design one part of your day to match your morning vision exactly',
      'Turn your great day vision into 3 specific, actionable steps',
      'When you feel off track, ask: "What would my morning self do here?"',
      'Create a system to remind yourself of your great day intention',
      'Take ownership of making your vision happen, not just hoping it will',
    ],
    3: [
      'Build a bridge between your morning intention and evening reality',
      'Architect your day so your great day vision becomes inevitable',
      'Design environmental cues that keep you aligned with your morning vision',
      'Create feedback loops to course-correct toward your great day',
      'Transform obstacles into opportunities to live your morning intention',
    ],
  },
  
  // Observation challenges - notice patterns
  observation: {
    1: [
      'Notice when you check your phone without intention',
      'Observe what triggers your stress responses today',
      'Pay attention to what energizes vs drains you',
      'Notice your thoughts when facing decisions',
      'Watch for moments when you feel most/least yourself',
    ],
    2: [
      'Track how your energy changes around different people',
      'Notice when you avoid vs approach challenges',
      'Observe the stories you tell yourself about setbacks',
      'Pay attention to what you do when no one is watching',
      'Notice patterns in how you start and end your day',
    ],
    3: [
      'Observe how you respond to unexpected changes',
      'Notice the gap between your values and actions',
      'Track when you feel most aligned with your purpose',
      'Watch for moments when you choose growth over comfort',
      'Observe how you handle being wrong or criticized',
    ],
  },
  
  // Experiment challenges - try something different
  experiment: {
    1: [
      'Ask "What would I do if I weren\'t afraid?" before one decision',
      'Spend 10 minutes doing something that brings you joy',
      'Try saying "I don\'t know" when you actually don\'t know',
      'Take one small action toward something you\'ve been avoiding',
      'Practice saying no to something that doesn\'t align with you',
    ],
    2: [
      'Do one thing today exactly as your best self would do it',
      'Choose the harder but more meaningful option once today',
      'Ask for help with something you usually handle alone',
      'Replace one complaint with a question about what you can control',
      'Act on your first instinct in one low-stakes situation',
    ],
    3: [
      'Design a small system to improve something that frustrates you',
      'Approach one challenge as a design problem, not a personal failing',
      'Take ownership of one outcome you usually blame on circumstances',
      'Create a small ritual that aligns your actions with your values',
      'Practice responding instead of reacting to one trigger today',
    ],
  },

  // Action challenges - concrete steps
  action: {
    1: [
      'Write down three things you\'re grateful for, including why',
      'Have one genuine conversation where you listen more than speak',
      'Complete one task you\'ve been procrastinating on for less than 2 hours',
      'Spend 15 minutes in nature without distractions',
      'Reach out to someone you care about but haven\'t contacted recently',
    ],
    2: [
      'Make one decision based on your values rather than your fears',
      'Share one vulnerability with someone you trust',
      'Take one small step toward a goal you\'ve been putting off',
      'Practice a skill for 20 minutes that would improve your life',
      'Set one boundary that honors your energy and time',
    ],
    3: [
      'Create a simple system to track progress on something important',
      'Replace one reactive habit with a proactive one',
      'Have a conversation that you\'ve been avoiding but need to have',
      'Design one part of your environment to better support your goals',
      'Teach someone else something you\'ve learned recently',
    ],
  },

  // Reflection challenges - deeper awareness
  reflection: {
    1: [
      'Write about a pattern you\'ve noticed in your life lately',
      'Reflect on what your current challenges might be teaching you',
      'Consider what you\'d tell a friend going through your situation',
      'Think about what you\'re not seeing about yourself right now',
      'Reflect on what you\'re avoiding and why it might be important',
    ],
    2: [
      'Write about a belief that might be limiting your growth',
      'Reflect on how your past is influencing your present choices',
      'Consider what success would look like if no one else could see it',
      'Think about what you\'d do if you knew you couldn\'t fail',
      'Reflect on what patterns you\'re ready to outgrow',
    ],
    3: [
      'Design your ideal life from the ground up - what systems enable it?',
      'Reflect on what you\'d change if you could redesign your approach to challenges',
      'Consider what you want to be known for and how you\'re building toward it',
      'Think about what beliefs would serve the person you\'re becoming',
      'Reflect on how you want to respond to life rather than react to it',
    ],
  },
};

export const challengeGenerator = {
  // Generate challenge based on today's check-in responses
  generateDailyChallenge: async (context: ChallengeContext): Promise<ChallengeOptions> => {
    try {
      // Analyze responses to identify growth opportunity
      const growthOpportunity = await identifyGrowthOpportunity(context);
      
      // Select appropriate challenge type and difficulty
      const challengeType = selectChallengeType(context, growthOpportunity);
      const difficulty = calculateDifficulty(context.user);
      
      // Generate personalized challenge
      const primaryChallenge = await generatePersonalizedChallenge(
        context,
        challengeType,
        difficulty,
        growthOpportunity
      );
      
      // Generate alternative option
      const alternativeChallenge = await generateAlternativeChallenge(
        context,
        challengeType,
        difficulty,
        growthOpportunity
      );
      
      // Create explanation and insights
      const explanation = createChallengeExplanation(primaryChallenge, growthOpportunity);
      const whyThisMatters = explainRelevance(primaryChallenge, context);
      const expectedInsights = predictInsights(primaryChallenge, context);
      
      return {
        primary: primaryChallenge,
        alternative: alternativeChallenge,
        explanation,
        whyThisMatters,
        expectedInsights,
      };
    } catch (error) {
      console.error('Error generating challenge:', error);
      return getDefaultChallenge(context.user);
    }
  },

  // Generate alternative challenge if user wants to swap
  generateAlternativeChallenge: async (
    originalChallenge: DailyChallenge,
    context: ChallengeContext
  ): Promise<DailyChallenge> => {
    try {
      // Generate different type of challenge addressing same growth area
      const alternativeType: ChallengeType = 
        originalChallenge.challenge_type === 'experiment' ? 'observation' :
        originalChallenge.challenge_type === 'observation' ? 'action' :
        originalChallenge.challenge_type === 'action' ? 'reflection' :
        'experiment';
      
      return await generatePersonalizedChallenge(
        context,
        alternativeType,
        originalChallenge.difficulty_level,
        originalChallenge.growth_area_focus
      );
    } catch (error) {
      console.error('Error generating alternative challenge:', error);
      return originalChallenge; // Return original if alternative fails
    }
  },

  // Get challenge templates for inspiration
  getChallengeTemplates: (phase: TransformationPhase, type: ChallengeType): string[] => {
    return (CHALLENGE_TEMPLATES as any)[type]?.[Math.min(phase, 3)] || [];
  },

  // Mark challenge as completed
  completeChallenge: async (
    challengeId: string,
    completionNotes: string,
    userId: string
  ): Promise<void> => {
    try {
      // Update challenge in database
      await updateChallengeCompletion(challengeId, completionNotes);
      
      // Analyze completion notes for insights
      await analyzeChallengeCompletion(challengeId, completionNotes, userId);
      
      console.log(`Challenge ${challengeId} completed by user ${userId}`);
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  },

  // Check if user can get new challenge (must complete current one)
  canReceiveNewChallenge: async (userId: string): Promise<boolean> => {
    try {
      const activeChallenge = await getActiveChallenge(userId);
      return !activeChallenge || !!activeChallenge.completed_at;
    } catch (error) {
      console.error('Error checking challenge eligibility:', error);
      return true; // Default to allowing new challenge
    }
  },

  // Generate challenge specifically from morning "great day" vision
  generateGreatDayChallenge: async (
    userId: string,
    greatDayVision: string,
    morningAffirmations: string,
    userPhase: TransformationPhase = 1
  ): Promise<DailyChallenge> => {
    try {
      const templates = CHALLENGE_TEMPLATES.great_day_focused[Math.min(userPhase, 3) as keyof typeof CHALLENGE_TEMPLATES.great_day_focused] || [];
      
      // Select most relevant template or generate custom challenge
      let challengeText: string;
      
      if (greatDayVision.trim().length > 10 && templates.length > 0) {
        // Use template but customize it with their specific vision
        const baseTemplate = templates[Math.floor(Math.random() * templates.length)];
        challengeText = customizeGreatDayTemplate(baseTemplate, greatDayVision);
      } else {
        // Generate AI-powered challenge
        const prompt = `Create a specific, actionable challenge based on this person's vision for a great day:

Vision: "${greatDayVision}"
Affirmations: "${morningAffirmations}"
Phase: ${userPhase}

The challenge should:
- Be doable in one day
- Directly connect to their vision
- Help them take concrete action toward their great day
- Be specific and measurable
- Feel achievable but meaningful

Return just the challenge text, no explanation.`;

        const response = await aiOrchestrator.generateWisdomGuidedQuestion(
          { user: { id: userId, current_phase: userPhase } as any },
          prompt
        );
        
        challengeText = response.content.trim().replace(/['"]/g, '');
      }

      return {
        id: generateUUID(),
        user_id: userId,
        challenge_text: challengeText,
        challenge_type: 'great_day_focused',
        assigned_date: new Date().toISOString().split('T')[0],
        swap_count: 0,
        difficulty_level: Math.min(userPhase + 1, 3),
        growth_area_focus: 'great-day-realization',
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating great day challenge:', error);
      
      // Return fallback challenge
      return {
        id: generateUUID(),
        user_id: userId,
        challenge_text: `Take one specific action today that brings you closer to: "${greatDayVision.slice(0, 50)}${greatDayVision.length > 50 ? '...' : ''}"`,
        challenge_type: 'great_day_focused',
        assigned_date: new Date().toISOString().split('T')[0],
        swap_count: 0,
        difficulty_level: 2,
        growth_area_focus: 'great-day-realization',
        created_at: new Date().toISOString(),
      };
    }
  },
};

// Helper functions

async function identifyGrowthOpportunity(context: ChallengeContext): Promise<string> {
  try {
    const prompt = `Based on this user's responses and patterns, identify their current growth opportunity:

Today's responses: ${context.todayResponses.join(' | ')}
Recent patterns: ${context.patterns.join(', ')}
Current struggles: ${context.currentStruggles.join(', ')}
Phase: ${context.user.current_phase}

What is the most important area for them to focus on right now? Return just the focus area (e.g., "self-awareness", "emotional regulation", "decision-making", "boundaries", etc.)`;

    const response = await aiOrchestrator.generateWisdomGuidedQuestion(
      { user: context.user },
      prompt
    );

    return response.content.trim().toLowerCase().replace(/['"]/g, '');
  } catch (error) {
    console.error('Error identifying growth opportunity:', error);
    return 'self-awareness'; // Default focus area
  }
}

function selectChallengeType(context: ChallengeContext, growthOpportunity: string): ChallengeType {
  // Map growth opportunities to challenge types
  const typeMapping: Record<string, ChallengeType[]> = {
    'self-awareness': ['observation', 'reflection'],
    'emotional-regulation': ['experiment', 'observation'],
    'decision-making': ['experiment', 'action'],
    'boundaries': ['action', 'experiment'],
    'relationships': ['action', 'experiment'],
    'patterns': ['observation', 'reflection'],
    'habits': ['experiment', 'action'],
    'mindset': ['reflection', 'experiment'],
    'great-day-realization': ['great_day_focused', 'action'],
    'vision-alignment': ['great_day_focused', 'experiment'],
  };

  const possibleTypes = typeMapping[growthOpportunity] || ['observation', 'experiment'];
  
  // Consider user's phase for type selection
  if (context.user.current_phase === 1) {
    return possibleTypes.includes('observation') ? 'observation' : possibleTypes[0];
  } else if (context.user.current_phase >= 3) {
    return possibleTypes.includes('action') ? 'action' : possibleTypes[0];
  }
  
  return possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
}

function calculateDifficulty(user: User): number {
  // Base difficulty on consecutive completions and phase
  const baseDifficulty = Math.min(user.current_phase, 3);
  const streakBonus = Math.min(Math.floor(user.consecutive_completions / 7), 2);
  return Math.min(baseDifficulty + streakBonus, 5);
}

async function generatePersonalizedChallenge(
  context: ChallengeContext,
  type: ChallengeType,
  difficulty: number,
  growthArea: string
): Promise<DailyChallenge> {
  try {
    const templates = (CHALLENGE_TEMPLATES as any)[type]?.[Math.min(context.user.current_phase, 3)] || [];
    const relevantTemplates = templates.filter((template: string) => 
      template.toLowerCase().includes(growthArea.toLowerCase()) ||
      context.patterns.some(pattern => 
        template.toLowerCase().includes(pattern.toLowerCase())
      )
    );

    let challengeText: string;
    
    if (relevantTemplates.length > 0) {
      // Use relevant template
      challengeText = relevantTemplates[Math.floor(Math.random() * relevantTemplates.length)];
    } else {
      // Generate AI-powered personalized challenge
      const prompt = `Create a personalized ${type} challenge for someone working on ${growthArea}.

Their patterns: ${context.patterns.join(', ')}
Their phase: ${context.user.current_phase}
Difficulty: ${difficulty}/5

The challenge should:
- Be doable in one day
- Help them notice patterns or try something new
- Connect to their specific situation
- Be specific and actionable

Return just the challenge text, no explanation.`;

      const response = await aiOrchestrator.generateWisdomGuidedQuestion(
        { user: context.user },
        prompt
      );
      
      challengeText = response.content.trim().replace(/['"]/g, '');
    }

    return {
      id: generateUUID(),
      user_id: context.user.id,
      challenge_text: challengeText,
      challenge_type: type,
      assigned_date: new Date().toISOString().split('T')[0],
      swap_count: 0,
      difficulty_level: difficulty,
      growth_area_focus: growthArea,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error generating personalized challenge:', error);
    return getDefaultChallenge(context.user).primary;
  }
}

async function generateAlternativeChallenge(
  context: ChallengeContext,
  type: ChallengeType,
  difficulty: number,
  growthArea: string
): Promise<DailyChallenge> {
  // Generate a different challenge of the same type
  const templates = (CHALLENGE_TEMPLATES as any)[type]?.[Math.min(context.user.current_phase, 3)] || [];
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

  return {
    id: generateUUID(),
    user_id: context.user.id,
    challenge_text: randomTemplate || 'Notice one pattern in your behavior today',
    challenge_type: type,
    assigned_date: new Date().toISOString().split('T')[0],
    swap_count: 0,
    difficulty_level: difficulty,
    growth_area_focus: growthArea,
    created_at: new Date().toISOString(),
  };
}

function createChallengeExplanation(challenge: DailyChallenge, growthArea: string): string {
  const typeExplanations: Record<ChallengeType, string> = {
    observation: 'Today\'s challenge is about noticing patterns in your daily life.',
    experiment: 'Today\'s challenge invites you to try something different.',
    action: 'Today\'s challenge focuses on taking a concrete step forward.',
    reflection: 'Today\'s challenge encourages deeper self-reflection.',
    great_day_focused: 'Today\'s challenge connects your morning vision to concrete action.',
  };

  return `${typeExplanations[challenge.challenge_type]} This connects to your growth in ${growthArea}.`;
}

function explainRelevance(challenge: DailyChallenge, context: ChallengeContext): string {
  if (context.patterns.length > 0) {
    return `This challenge addresses patterns I've noticed in our conversations: ${context.patterns[0]}. Small experiments like this help build self-awareness.`;
  }
  
  return `This challenge is designed to help you develop greater awareness and intentionality in your daily life.`;
}

function predictInsights(challenge: DailyChallenge, context: ChallengeContext): string[] {
  const insightMap: Record<ChallengeType, string[]> = {
    observation: [
      'Recognition of unconscious patterns',
      'Awareness of triggers and responses',
      'Understanding of personal rhythms',
    ],
    experiment: [
      'Discovery of new possibilities',
      'Recognition of limiting beliefs',
      'Experience of personal agency',
    ],
    action: [
      'Sense of forward momentum',
      'Clarity about values and priorities',
      'Confidence in decision-making',
    ],
    reflection: [
      'Deeper self-understanding',
      'Clarity about personal patterns',
      'Insights about growth opportunities',
    ],
    great_day_focused: [
      'Alignment between intention and action',
      'Understanding of what truly matters to you',
      'Experience of living with purpose',
      'Recognition of personal power in creating your reality',
    ],
  };

  return insightMap[challenge.challenge_type] || ['Greater self-awareness'];
}

function getDefaultChallenge(user: User): ChallengeOptions {
  const defaultChallenge: DailyChallenge = {
    id: generateUUID(),
    user_id: user.id,
    challenge_text: 'Notice one moment today when you feel most like yourself',
    challenge_type: 'observation',
    assigned_date: new Date().toISOString().split('T')[0],
    swap_count: 0,
    difficulty_level: 2,
    growth_area_focus: 'self-awareness',
    created_at: new Date().toISOString(),
  };

  return {
    primary: defaultChallenge,
    alternative: {
      ...defaultChallenge,
      id: generateUUID(),
      challenge_text: 'Take one small action toward something you care about',
      challenge_type: 'action',
    },
    explanation: 'A gentle challenge to build self-awareness',
    whyThisMatters: 'Self-awareness is the foundation of all personal growth',
    expectedInsights: ['Recognition of authentic moments', 'Understanding of personal values'],
  };
}

function customizeGreatDayTemplate(template: string, greatDayVision: string): string {
  // Extract key words from their vision
  const visionWords = greatDayVision.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 3);

  // Add their vision context to the template
  const visionPreview = greatDayVision.slice(0, 60) + (greatDayVision.length > 60 ? '...' : '');
  
  return `${template} (Your vision: "${visionPreview}")`;
}

// Database interaction placeholders
async function updateChallengeCompletion(challengeId: string, notes: string): Promise<void> {
  // TODO: Implement Supabase update
  console.log(`Updating challenge ${challengeId} with completion notes`);
}

async function analyzeChallengeCompletion(challengeId: string, notes: string, userId: string): Promise<void> {
  // TODO: Analyze completion notes for insights and store in memory
  console.log(`Analyzing completion for challenge ${challengeId}`);
}

async function getActiveChallenge(userId: string): Promise<DailyChallenge | null> {
  // TODO: Implement Supabase query
  return null;
}

export default challengeGenerator;