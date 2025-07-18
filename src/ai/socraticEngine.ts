import { aiOrchestrator, AIContext } from '@/services/openai';
import {
  User,
  DailyReflection,
  SocraticConversation,
  TransformationPhase,
  LifeSystemType,
} from '@/types/database';

export interface QuestionContext {
  user: User;
  currentPhase: any;
  conversationHistory?: SocraticConversation[];
  recentReflections?: DailyReflection[];
  discoveredPatterns?: string[];
  currentDepthLevel: number;
  focusArea?: LifeSystemType;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  category: string;
  depth_level: number;
  expected_insights: string[];
  follow_up_triggers: string[];
  phase_progression_indicators: string[];
  metadata: {
    question_type: 'opening' | 'deepening' | 'connecting' | 'transforming' | 'integrating';
    target_revelation: string;
    cognitive_approach: 'assumption_challenging' | 'pattern_revealing' | 'system_connecting' | 'leverage_identifying';
    estimated_breakthrough_potential: number;
  };
}

export interface QuestionResponse {
  response: string;
  reflection_depth: number;
  emotional_resonance: number;
  breakthrough_indicators: string[];
  patterns_revealed: string[];
  system_connections: string[];
}

// Core question generation categories with depth progression
const QUESTION_CATEGORIES = {
  assumption_challenging: {
    description: 'Questions that reveal and challenge hidden assumptions',
    depth_progression: [
      'Surface assumptions about current situation',
      'Deeper beliefs about themselves and their capabilities', 
      'Fundamental assumptions about how life works',
      'Core identity and reality assumptions',
    ],
  },
  pattern_revealing: {
    description: 'Questions that help users see their unconscious patterns',
    depth_progression: [
      'Recent behavioral patterns',
      'Historical life patterns and themes',
      'Cross-domain pattern connections',
      'Meta-patterns and pattern patterns',
    ],
  },
  system_connecting: {
    description: 'Questions that reveal connections between life areas',
    depth_progression: [
      'Direct cause-effect relationships',
      'Indirect influences and correlations',
      'System-level interdependencies',
      'Emergent properties of life systems',
    ],
  },
  leverage_identifying: {
    description: 'Questions that identify high-impact intervention points',
    depth_progression: [
      'Obvious leverage points and quick wins',
      'Hidden leverage points with compound effects',
      'System-level leverage through design',
      'Meta-leverage through thinking transformation',
    ],
  },
  vision_expanding: {
    description: 'Questions that expand what they believe is possible',
    depth_progression: [
      'Near-term possibility expansion',
      'Long-term vision and potential',
      'Seemingly impossible but systematic outcomes',
      'Identity-level transformation possibilities',
    ],
  },
};

export const socraticEngine = {
  // Generate a contextually appropriate question
  generateQuestion: async (context: QuestionContext): Promise<GeneratedQuestion> => {
    const questionType = determineQuestionType(context);
    const category = selectQuestionCategory(context, questionType);
    const targetDepth = calculateTargetDepth(context);

    // Build AI context for question generation
    const aiContext: AIContext = {
      user: context.user,
      currentPhase: context.currentPhase,
      recentReflections: context.recentReflections,
      conversationHistory: context.conversationHistory?.map(conv => ({
        role: 'conversation',
        content: conv.conversation_thread.map(msg => msg.content).join('\n'),
      })),
    };

    // Generate question using AI orchestrator
    const aiResponse = await aiOrchestrator.generateSocraticQuestion(
      aiContext,
      buildQuestionGenerationPrompt(context, category, targetDepth)
    );

    const question: GeneratedQuestion = {
      id: crypto.randomUUID(),
      question: aiResponse.content,
      category,
      depth_level: targetDepth,
      expected_insights: generateExpectedInsights(category, targetDepth, context),
      follow_up_triggers: generateFollowUpTriggers(category, context),
      phase_progression_indicators: generatePhaseProgressionIndicators(context),
      metadata: {
        question_type: questionType,
        target_revelation: determineTargetRevelation(category, context),
        cognitive_approach: category as any,
        estimated_breakthrough_potential: calculateBreakthroughPotential(context, targetDepth),
      },
    };

    return question;
  },

  // Process user response and extract insights
  processResponse: async (
    question: GeneratedQuestion,
    userResponse: string,
    context: QuestionContext
  ): Promise<QuestionResponse> => {
    // Analyze response depth and emotional resonance
    const reflectionDepth = analyzeReflectionDepth(userResponse, question.depth_level);
    const emotionalResonance = analyzeEmotionalResonance(userResponse);

    // Use AI to identify breakthrough indicators and patterns
    const aiContext: AIContext = {
      user: context.user,
      currentPhase: context.currentPhase,
    };

    const analysisResponse = await aiOrchestrator.recognizePatterns(aiContext, userResponse);

    return {
      response: userResponse,
      reflection_depth: reflectionDepth,
      emotional_resonance: emotionalResonance,
      breakthrough_indicators: identifyBreakthroughIndicators(userResponse, question),
      patterns_revealed: analysisResponse.metadata.patterns_identified || [],
      system_connections: analysisResponse.metadata.system_connections || [],
    };
  },

  // Generate follow-up question based on response
  generateFollowUp: async (
    previousQuestion: GeneratedQuestion,
    response: QuestionResponse,
    context: QuestionContext
  ): Promise<GeneratedQuestion> => {
    // Determine if we should go deeper or shift focus
    const shouldDeepen = shouldDeepenCurrentLine(response, context);
    const shouldShift = shouldShiftFocus(response, context);

    if (shouldDeepen) {
      return socraticEngine.generateDeepeningQuestion(previousQuestion, response, context);
    } else if (shouldShift) {
      return socraticEngine.generateShiftingQuestion(response, context);
    } else {
      return socraticEngine.generateConnectingQuestion(response, context);
    }
  },

  // Generate a deepening question on the same topic
  generateDeepeningQuestion: async (
    previousQuestion: GeneratedQuestion,
    response: QuestionResponse,
    context: QuestionContext
  ): Promise<GeneratedQuestion> => {
    const newContext = {
      ...context,
      currentDepthLevel: Math.min(previousQuestion.depth_level + 1, 10),
    };

    const aiContext: AIContext = {
      user: context.user,
      currentPhase: context.currentPhase,
    };

    const prompt = `Based on this response: "${response.response}"
    
Generate a deeper follow-up question that:
- Goes one level deeper into the same theme
- Challenges the assumptions revealed in their response
- Helps them see patterns they might not have noticed
- Connects to other areas of their life if relevant

Previous question depth: ${previousQuestion.depth_level}
Target depth: ${newContext.currentDepthLevel}`;

    const aiResponse = await aiOrchestrator.generateSocraticQuestion(aiContext, prompt);

    return {
      id: crypto.randomUUID(),
      question: aiResponse.content,
      category: previousQuestion.category,
      depth_level: newContext.currentDepthLevel,
      expected_insights: generateExpectedInsights(previousQuestion.category, newContext.currentDepthLevel, context),
      follow_up_triggers: [],
      phase_progression_indicators: [],
      metadata: {
        question_type: 'deepening',
        target_revelation: `Deeper insight into ${previousQuestion.metadata.target_revelation}`,
        cognitive_approach: previousQuestion.metadata.cognitive_approach,
        estimated_breakthrough_potential: calculateBreakthroughPotential(context, newContext.currentDepthLevel),
      },
    };
  },

  // Generate a question that shifts focus to a different area
  generateShiftingQuestion: async (
    response: QuestionResponse,
    context: QuestionContext
  ): Promise<GeneratedQuestion> => {
    const newCategory = selectAlternativeCategory(context);
    
    const newContext = {
      ...context,
      currentDepthLevel: Math.max(context.currentDepthLevel - 1, 1),
    };

    return socraticEngine.generateQuestion(newContext);
  },

  // Generate a question that connects insights across domains
  generateConnectingQuestion: async (
    response: QuestionResponse,
    context: QuestionContext
  ): Promise<GeneratedQuestion> => {
    const aiContext: AIContext = {
      user: context.user,
      currentPhase: context.currentPhase,
    };

    const connectingPrompt = `Based on these insights: ${response.patterns_revealed.join(', ')}

Generate a question that helps them see connections between:
- Different areas of their life
- Past and present patterns
- Current challenges and opportunities
- Their responses and their life systems

Focus on revealing system-level connections they haven't considered.`;

    const aiResponse = await aiOrchestrator.generateSocraticQuestion(aiContext, connectingPrompt);

    return {
      id: crypto.randomUUID(),
      question: aiResponse.content,
      category: 'system_connecting',
      depth_level: context.currentDepthLevel,
      expected_insights: ['System interconnections', 'Cross-domain patterns', 'Leverage opportunities'],
      follow_up_triggers: [],
      phase_progression_indicators: [],
      metadata: {
        question_type: 'connecting',
        target_revelation: 'System-level connections and patterns',
        cognitive_approach: 'system_connecting',
        estimated_breakthrough_potential: 0.7,
      },
    };
  },

  // Track conversation progress and identify breakthrough moments
  assessConversationProgress: (
    questions: GeneratedQuestion[],
    responses: QuestionResponse[],
    context: QuestionContext
  ) => {
    const avgDepth = responses.reduce((acc, r) => acc + r.reflection_depth, 0) / responses.length;
    const avgResonance = responses.reduce((acc, r) => acc + r.emotional_resonance, 0) / responses.length;
    const totalBreakthroughs = responses.reduce((acc, r) => acc + r.breakthrough_indicators.length, 0);
    const totalPatterns = responses.reduce((acc, r) => acc + r.patterns_revealed.length, 0);

    const progressMetrics = {
      average_depth: avgDepth,
      average_emotional_resonance: avgResonance,
      breakthrough_count: totalBreakthroughs,
      patterns_discovered: totalPatterns,
      conversation_momentum: calculateConversationMomentum(responses),
      phase_progression_likelihood: assessPhaseProgression(responses, context),
      recommended_next_action: determineNextAction(responses, context),
    };

    return progressMetrics;
  },
};

// Helper functions
function determineQuestionType(context: QuestionContext): GeneratedQuestion['metadata']['question_type'] {
  if (context.conversationHistory?.length === 0) return 'opening';
  if (context.currentDepthLevel >= 7) return 'transforming';
  if (context.currentDepthLevel >= 5) return 'integrating';
  if (context.currentDepthLevel >= 3) return 'connecting';
  return 'deepening';
}

function selectQuestionCategory(context: QuestionContext, questionType: string): string {
  // Logic to select appropriate category based on phase, patterns, and conversation history
  const phase = context.user.current_phase;
  
  if (phase <= 2) return 'assumption_challenging';
  if (phase <= 4) return 'pattern_revealing';
  if (phase <= 6) return 'system_connecting';
  return 'leverage_identifying';
}

function calculateTargetDepth(context: QuestionContext): number {
  const baseDepth = Math.min(context.currentDepthLevel + 1, 10);
  const phaseAdjustment = Math.floor(context.user.current_phase / 2);
  return Math.min(baseDepth + phaseAdjustment, 10);
}

function buildQuestionGenerationPrompt(context: QuestionContext, category: string, depth: number): string {
  return `Generate a Socratic question with these parameters:
- Category: ${category}
- Target depth: ${depth}/10
- User phase: ${context.user.current_phase}
- Focus area: ${context.focusArea || 'general life architecture'}

The question should reveal insights they cannot currently see and move them toward systems thinking.`;
}

function generateExpectedInsights(category: string, depth: number, context: QuestionContext): string[] {
  // Generate expected insights based on category and depth
  return [`Insight related to ${category} at depth ${depth}`];
}

function generateFollowUpTriggers(category: string, context: QuestionContext): string[] {
  return ['Emotional response', 'Resistance', 'Confusion', 'Excitement'];
}

function generatePhaseProgressionIndicators(context: QuestionContext): string[] {
  return [`Phase ${context.user.current_phase} progression signals`];
}

function determineTargetRevelation(category: string, context: QuestionContext): string {
  return `${category} revelation for phase ${context.user.current_phase}`;
}

function calculateBreakthroughPotential(context: QuestionContext, depth: number): number {
  return Math.min(depth / 10 * (context.user.current_phase / 7), 1);
}

function analyzeReflectionDepth(response: string, questionDepth: number): number {
  // Analyze linguistic markers of depth
  const depthMarkers = ['because', 'realize', 'understand', 'pattern', 'always', 'never', 'tend to'];
  const markerCount = depthMarkers.filter(marker => 
    response.toLowerCase().includes(marker)
  ).length;
  
  return Math.min((markerCount / depthMarkers.length) * 10, 10);
}

function analyzeEmotionalResonance(response: string): number {
  // Analyze emotional language and intensity
  const emotionalMarkers = ['feel', 'emotional', 'surprising', 'difficult', 'powerful', 'resonates'];
  const markerCount = emotionalMarkers.filter(marker =>
    response.toLowerCase().includes(marker)
  ).length;
  
  return Math.min((markerCount / emotionalMarkers.length) * 10, 10);
}

function identifyBreakthroughIndicators(response: string, question: GeneratedQuestion): string[] {
  const indicators = [];
  if (response.toLowerCase().includes('never thought')) indicators.push('new_perspective');
  if (response.toLowerCase().includes('realize')) indicators.push('insight_moment');
  if (response.toLowerCase().includes('wow') || response.toLowerCase().includes('amazing')) indicators.push('emotional_breakthrough');
  return indicators;
}

function shouldDeepenCurrentLine(response: QuestionResponse, context: QuestionContext): boolean {
  return response.reflection_depth >= 6 && response.emotional_resonance >= 5 && context.currentDepthLevel < 8;
}

function shouldShiftFocus(response: QuestionResponse, context: QuestionContext): boolean {
  return response.reflection_depth < 4 || context.currentDepthLevel >= 8;
}

function selectAlternativeCategory(context: QuestionContext): string {
  const categories = Object.keys(QUESTION_CATEGORIES);
  return categories[Math.floor(Math.random() * categories.length)];
}

function calculateConversationMomentum(responses: QuestionResponse[]): number {
  if (responses.length < 2) return 0.5;
  
  const recentResponses = responses.slice(-3);
  const avgDepthTrend = recentResponses.reduce((acc, r, i) => {
    if (i === 0) return 0;
    return acc + (r.reflection_depth - recentResponses[i-1].reflection_depth);
  }, 0) / (recentResponses.length - 1);
  
  return Math.max(0, Math.min(1, 0.5 + avgDepthTrend / 10));
}

function assessPhaseProgression(responses: QuestionResponse[], context: QuestionContext): number {
  const breakthroughCount = responses.reduce((acc, r) => acc + r.breakthrough_indicators.length, 0);
  const avgDepth = responses.reduce((acc, r) => acc + r.reflection_depth, 0) / responses.length;
  
  return Math.min((breakthroughCount * 0.3 + avgDepth * 0.1), 1);
}

function determineNextAction(responses: QuestionResponse[], context: QuestionContext): string {
  const lastResponse = responses[responses.length - 1];
  
  if (lastResponse?.breakthrough_indicators.length > 0) return 'capture_breakthrough';
  if (lastResponse?.reflection_depth >= 8) return 'integrate_insight';
  if (lastResponse?.reflection_depth < 4) return 'encourage_deeper_reflection';
  return 'continue_exploration';
}

export default socraticEngine;