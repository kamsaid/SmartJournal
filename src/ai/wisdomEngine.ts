// wisdomEngine.ts - Wisdom-Guided Reflection Engine (Updated to match your architecture)

import { aiOrchestrator, AIContext } from '@/services/openai';
import { generateUUID } from '@/utils/uuid';
import {
  User,
  DailyReflection,
  WisdomConversation,
  TransformationPhase,
  LifeSystemType,
} from '@/types/database';

export interface QuestionContext {
  user: User;
  currentPhase: any;
  conversationHistory?: WisdomConversation[];
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
    cognitive_approach: 'contemplation' | 'accountability' | 'excellence' | 'balance' | 'gratitude' | 'patience';
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

// Core reflection categories with scientific methods and depth progression
const REFLECTION_CATEGORIES = {
  // Scientific Method Categories
  narrative_concrete: {
    description: 'Open-ended concrete questions that elicit specific examples and narratives',
    scientific_method: 'open_ended_concrete',
    psychological_principle: 'Narrative thinking and specific examples vs abstract patterns',
    sample_questions: [
      'When do you feel most you?',
      'Which moment lit you up this week?',
      'When was the last time you felt stuck?',
      'What legacy will today\'s small act leave?'
    ]
  },
  belief_testing: {
    description: 'CBT Socratic questioning that challenges assumptions with evidence',
    scientific_method: 'CBT_socratic',
    psychological_principle: 'Cognitive restructuring through evidence-based belief testing',
    sample_questions: [
      'What story am I rehearsing right now?',
      'What evidence contradicts that thought?',
      'Who taught me this belief—do I still agree?',
      'If a friend said this, what would I say?'
    ]
  },
  agency_building: {
    description: 'Motivational interviewing focused on choice, empowerment and action',
    scientific_method: 'motivational_interviewing',
    psychological_principle: 'Building sense of agency and personal control',
    sample_questions: [
      'If you chose to act, what first step feels smallest?',
      'Which strength counters this limit?',
      'What tiny action can you repeat tomorrow?',
      'What will you stop, start, or continue tonight?'
    ]
  },
  time_mortality: {
    description: 'Stoic mortality awareness creating healthy urgency and perspective',
    scientific_method: 'stoic_time_consciousness',
    psychological_principle: 'Time scarcity and mortality salience for motivation',
    sample_questions: [
      'If not now, when?',
      'What would 80-year-old you thank you for?',
      'Which dream expires if you wait a year?',
      'If this were your last week, what matters?'
    ]
  },
  root_cause: {
    description: '5-Why methodology for systematic drilling to underlying causes',
    scientific_method: 'five_why_analysis',
    psychological_principle: 'Root cause analysis vs surface symptom treatment',
    sample_questions: [
      'Why does this matter to me right now?',
      'What triggered it—event, thought, or memory?',
      'What need is underneath this feeling?',
      'Why does this bother me?' // Can be repeated iteratively
    ]
  },
  
  // Legacy categories (updated)
  contemplation: {
    description: 'Deep reflection that uncovers hidden truths and patterns',
    scientific_method: 'reflective_inquiry',
    psychological_principle: 'Metacognitive awareness and insight development',
    depth_progression: [
      'Surface observations about current situation',
      'Deeper patterns and recurring themes', 
      'Core beliefs and life philosophies',
      'Fundamental truths about identity and purpose',
    ],
    sample_questions: [
      'What patterns do you notice repeating in your life?',
      'If you observed your life from outside, what wisdom would you offer yourself?',
      'What truth have you been avoiding that could transform everything?',
      'When you quiet all noise, what does your inner wisdom tell you?'
    ]
  },
  accountability: {
    description: 'Honest assessment of personal responsibility and power',
    scientific_method: 'responsibility_focused_inquiry',
    psychological_principle: 'Locus of control and personal agency development',
    depth_progression: [
      'Acknowledging role in current circumstances',
      'Understanding choices that created patterns',
      'Recognizing power to change reality',
      'Full ownership of life architecture',
    ],
    sample_questions: [
      'How have your choices contributed to this situation?',
      'What would change if you took full responsibility here?',
      'Where might you be giving away your power?',
      'If you couldn\'t blame anything external, what would you do?'
    ]
  },
  excellence: {
    description: 'Pursuit of highest potential and continuous improvement',
    scientific_method: 'growth_oriented_inquiry',
    psychological_principle: 'Growth mindset and continuous improvement motivation',
    depth_progression: [
      'Identifying areas of comfort and mediocrity',
      'Envisioning elevated standards and possibilities',
      'Designing systems for sustainable excellence',
      'Embodying excellence as identity',
    ],
    sample_questions: [
      'What would the best version of yourself do here?',
      'Where are you settling for "good enough"?',
      'What small improvement, made consistently, would transform this?',
      'How can you pursue excellence while maintaining self-compassion?'
    ]
  },
  balance: {
    description: 'Finding equilibrium between effort and acceptance',
    depth_progression: [
      'Recognizing imbalance and extremes',
      'Understanding when to push vs accept',
      'Creating sustainable rhythms',
      'Living in dynamic equilibrium',
    ],
    sample_questions: [
      'What needs your active effort vs patient acceptance?',
      'How can you work toward change while finding peace now?',
      'Where might pushing harder be holding you back?',
      'What would trusting the process while taking action look like?'
    ]
  },
  gratitude: {
    description: 'Recognizing hidden blessings and existing strengths',
    depth_progression: [
      'Appreciating obvious blessings',
      'Finding gifts in challenges',
      'Recognizing growth through adversity',
      'Deep appreciation for life\'s design',
    ],
    sample_questions: [
      'What strengths has this challenge revealed in you?',
      'What aspects of this situation are you taking for granted?',
      'How has this difficulty prepared you for something greater?',
      'What unexpected gifts have emerged from this experience?'
    ]
  },
  patience: {
    description: 'Building resilience through patient persistence',
    depth_progression: [
      'Accepting current timeline',
      'Finding peace in the process',
      'Understanding divine timing',
      'Mastering patient persistence',
    ],
    sample_questions: [
      'What would patience look like in this situation?',
      'How might this be preparing you for future success?',
      'What can you learn from the waiting itself?',
      'How can you be persistent without being forceful?'
    ]
  },
};

export const wisdomEngine = {
  // Generate a contextually appropriate wisdom-guided question
  generateQuestion: async (context: QuestionContext): Promise<GeneratedQuestion> => {
    const questionType = determineQuestionType(context);
    const category = selectReflectionCategory(context, questionType);
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

    // Generate question using AI orchestrator with wisdom-guided prompt
    const aiResponse = await aiOrchestrator.generateWisdomGuidedQuestion(
      aiContext,
      buildWisdomQuestionPrompt(context, category, targetDepth)
    );

    const question: GeneratedQuestion = {
      id: generateUUID(),
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

  // Process user response and extract wisdom insights
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
      breakthrough_indicators: identifyBreakthroughIndicators(userResponse, question, analysisResponse),
      patterns_revealed: analysisResponse.metadata?.patterns_identified || [],
      system_connections: analysisResponse.metadata?.system_connections || [],
    };
  },

  // Generate follow-up question based on response
  generateFollowUp: async (
    previousQuestion: GeneratedQuestion,
    response: QuestionResponse,
    context: QuestionContext
  ): Promise<GeneratedQuestion> => {
    // Determine follow-up strategy based on response quality
    const shouldDeepen = shouldDeepenCurrentLine(response, context);
    const shouldShift = shouldShiftFocus(response, context);
    const shouldConnect = shouldMakeConnections(response, context);

    if (shouldDeepen) {
      return wisdomEngine.generateDeepeningQuestion(previousQuestion, response, context);
    } else if (shouldShift) {
      return wisdomEngine.generateShiftingQuestion(response, context);
    } else if (shouldConnect) {
      return wisdomEngine.generateConnectingQuestion(response, context);
    } else {
      return wisdomEngine.generateIntegratingQuestion(response, context);
    }
  },

  // Generate a deepening question on the same wisdom theme
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

    const prompt = `Based on this reflection: "${response.response}"
    
Generate a deeper wisdom-guided follow-up question that:
- Explores the same theme with greater depth
- Encourages honest self-examination without judgment
- Reveals hidden patterns or beliefs compassionately
- Connects to their journey of transformation
- Maintains balance between challenge and support

Current reflection category: ${previousQuestion.category}
Previous depth: ${previousQuestion.depth_level}
Target depth: ${newContext.currentDepthLevel}

The question should guide them toward profound self-discovery.`;

    const aiResponse = await aiOrchestrator.generateWisdomGuidedQuestion(aiContext, prompt);

    return {
      id: generateUUID(),
      question: aiResponse.content,
      category: previousQuestion.category,
      depth_level: newContext.currentDepthLevel,
      expected_insights: generateExpectedInsights(previousQuestion.category, newContext.currentDepthLevel, context),
      follow_up_triggers: ['emotional breakthrough', 'pattern recognition', 'resistance point'],
      phase_progression_indicators: ['depth of insight', 'self-accountability', 'transformation readiness'],
      metadata: {
        question_type: 'deepening',
        target_revelation: `Deeper wisdom in ${previousQuestion.metadata.target_revelation}`,
        cognitive_approach: previousQuestion.metadata.cognitive_approach,
        estimated_breakthrough_potential: calculateBreakthroughPotential(context, newContext.currentDepthLevel),
      },
    };
  },

  // Generate a question that shifts to a complementary wisdom area
  generateShiftingQuestion: async (
    response: QuestionResponse,
    context: QuestionContext
  ): Promise<GeneratedQuestion> => {
    const newCategory = selectComplementaryCategory(context, response);
    
    const newContext = {
      ...context,
      currentDepthLevel: Math.max(context.currentDepthLevel - 1, 3), // Don't go too shallow
    };

    const aiContext: AIContext = {
      user: context.user,
      currentPhase: context.currentPhase,
    };

    const prompt = `Based on these insights: ${response.patterns_revealed.join(', ')}

Generate a wisdom-guided question that shifts focus to ${newCategory}:
- Build on their current understanding
- Explore from a fresh angle
- Maintain transformational momentum
- Connect to their larger journey

The shift should feel natural and enriching, not jarring.`;

    const aiResponse = await aiOrchestrator.generateWisdomGuidedQuestion(aiContext, prompt);

    return {
      id: generateUUID(),
      question: aiResponse.content,
      category: newCategory,
      depth_level: newContext.currentDepthLevel,
      expected_insights: generateExpectedInsights(newCategory, newContext.currentDepthLevel, context),
      follow_up_triggers: generateFollowUpTriggers(newCategory, context),
      phase_progression_indicators: generatePhaseProgressionIndicators(context),
      metadata: {
        question_type: 'connecting',
        target_revelation: `New perspective through ${newCategory}`,
        cognitive_approach: newCategory as any,
        estimated_breakthrough_potential: 0.7,
      },
    };
  },

  // Generate a question that connects insights across life domains
  generateConnectingQuestion: async (
    response: QuestionResponse,
    context: QuestionContext
  ): Promise<GeneratedQuestion> => {
    const aiContext: AIContext = {
      user: context.user,
      currentPhase: context.currentPhase,
    };

    const connectingPrompt = `Based on these revealed patterns: ${response.patterns_revealed.join(', ')}

Generate a wisdom-guided question that helps them see connections between:
- Different areas of their life
- Past experiences and current patterns
- Their challenges and hidden opportunities
- Personal growth and life system design

Focus on revealing the interconnected nature of their transformation.`;

    const aiResponse = await aiOrchestrator.generateWisdomGuidedQuestion(aiContext, connectingPrompt);

    return {
      id: generateUUID(),
      question: aiResponse.content,
      category: 'balance', // Connections often relate to balance
      depth_level: context.currentDepthLevel,
      expected_insights: ['System interconnections', 'Holistic patterns', 'Leverage opportunities'],
      follow_up_triggers: ['systemic insight', 'integration readiness'],
      phase_progression_indicators: ['systems thinking', 'holistic awareness'],
      metadata: {
        question_type: 'connecting',
        target_revelation: 'Life system connections and balance',
        cognitive_approach: 'balance',
        estimated_breakthrough_potential: 0.8,
      },
    };
  },

  // Generate a question that helps integrate insights into action
  generateIntegratingQuestion: async (
    response: QuestionResponse,
    context: QuestionContext
  ): Promise<GeneratedQuestion> => {
    const aiContext: AIContext = {
      user: context.user,
      currentPhase: context.currentPhase,
    };

    const integratingPrompt = `Based on their journey and insights: ${response.patterns_revealed.join(', ')}

Generate a wisdom-guided question that helps them:
- Transform insight into aligned action
- Design sustainable changes
- Integrate new understanding into daily life
- Maintain balance while pursuing excellence

The question should bridge reflection and embodiment.`;

    const aiResponse = await aiOrchestrator.generateWisdomGuidedQuestion(aiContext, integratingPrompt);

    return {
      id: generateUUID(),
      question: aiResponse.content,
      category: 'excellence',
      depth_level: context.currentDepthLevel,
      expected_insights: ['Action steps', 'Integration strategies', 'Sustainable practices'],
      follow_up_triggers: ['commitment', 'implementation planning'],
      phase_progression_indicators: ['readiness for action', 'integration capacity'],
      metadata: {
        question_type: 'integrating',
        target_revelation: 'Wisdom in action',
        cognitive_approach: 'excellence',
        estimated_breakthrough_potential: 0.9,
      },
    };
  },

  // Track conversation progress and identify transformation moments
  assessConversationProgress: (
    questions: GeneratedQuestion[],
    responses: QuestionResponse[],
    context: QuestionContext
  ) => {
    const avgDepth = responses.reduce((acc, r) => acc + r.reflection_depth, 0) / responses.length;
    const avgResonance = responses.reduce((acc, r) => acc + r.emotional_resonance, 0) / responses.length;
    const totalBreakthroughs = responses.reduce((acc, r) => acc + r.breakthrough_indicators.length, 0);
    const totalPatterns = responses.reduce((acc, r) => acc + r.patterns_revealed.length, 0);

    // Wisdom-specific metrics
    const wisdomMetrics = assessWisdomDevelopment(responses);
    const transformationReadiness = assessTransformationReadiness(responses, context);

    const progressMetrics = {
      average_depth: avgDepth,
      average_emotional_resonance: avgResonance,
      breakthrough_count: totalBreakthroughs,
      patterns_discovered: totalPatterns,
      wisdom_metrics: wisdomMetrics,
      conversation_momentum: calculateConversationMomentum(responses),
      phase_progression_likelihood: assessPhaseProgression(responses, context),
      transformation_readiness: transformationReadiness,
      recommended_next_action: determineNextAction(responses, context, wisdomMetrics),
    };

    return progressMetrics;
  },
};

// Helper functions adapted for wisdom-guided approach
function determineQuestionType(context: QuestionContext): GeneratedQuestion['metadata']['question_type'] {
  if (!context.conversationHistory || context.conversationHistory.length === 0) return 'opening';
  if (context.currentDepthLevel >= 8) return 'transforming';
  if (context.currentDepthLevel >= 6) return 'integrating';
  if (context.currentDepthLevel >= 4) return 'connecting';
  return 'deepening';
}

function selectReflectionCategory(context: QuestionContext, questionType: string): string {
  const phase = context.user.current_phase;
  const recentCategories = getRecentCategories(context);
  
  // Phase-aligned category selection with wisdom principles
  const phaseCategories: Record<number, string[]> = {
    1: ['contemplation', 'gratitude'],
    2: ['contemplation', 'accountability'],
    3: ['accountability', 'contemplation'],
    4: ['accountability', 'excellence'],
    5: ['excellence', 'balance'],
    6: ['balance', 'excellence'],
    7: ['balance', 'patience'],
    8: ['patience', 'gratitude'],
  };

  const preferredCategories = phaseCategories[Math.min(phase, 8)] || ['contemplation'];
  
  // Avoid repeating recent categories too much
  const availableCategories = preferredCategories.filter((cat: string) => 
    !recentCategories[cat] || recentCategories[cat] < 2
  );
  
  if (availableCategories.length === 0) {
    // If all preferred categories were recently used, choose any less-used category
    const allCategories = Object.keys(REFLECTION_CATEGORIES);
    const leastUsed = allCategories.reduce((least, cat) => 
      (recentCategories[cat] || 0) < (recentCategories[least] || 0) ? cat : least
    );
    return leastUsed;
  }
  
  return availableCategories[Math.floor(Math.random() * availableCategories.length)];
}

function getRecentCategories(context: QuestionContext): Record<string, number> {
  const recent: Record<string, number> = {};
  const recentQuestions = context.conversationHistory?.slice(-5) || [];
  
  recentQuestions.forEach(conv => {
    // Extract category from conversation if available
    // This would need to be stored in your conversation structure
    const category = (conv as any).metadata?.category;
    if (category) {
      recent[category] = (recent[category] || 0) + 1;
    }
  });
  
  return recent;
}

function selectComplementaryCategory(context: QuestionContext, response: QuestionResponse): string {
  const currentCategory = (context.conversationHistory?.[context.conversationHistory.length - 1] as any)?.metadata?.category || 'contemplation';
  
  // Wisdom-guided category progressions
  const progressions: Record<string, string[]> = {
    contemplation: ['accountability', 'excellence'],
    accountability: ['excellence', 'balance'],
    excellence: ['balance', 'patience'],
    balance: ['gratitude', 'contemplation'],
    gratitude: ['patience', 'contemplation'],
    patience: ['contemplation', 'accountability'],
  };
  
  const options = progressions[currentCategory] || ['contemplation'];
  return options[Math.floor(Math.random() * options.length)];
}

function calculateTargetDepth(context: QuestionContext): number {
  const baseDepth = Math.min(context.currentDepthLevel + 1, 10);
  const phaseAdjustment = Math.floor(context.user.current_phase / 2);
  return Math.min(baseDepth + phaseAdjustment, 10);
}

function buildWisdomQuestionPrompt(context: QuestionContext, category: string, depth: number): string {
  const categoryData = (REFLECTION_CATEGORIES as any)[category];
  const depthDescription = categoryData?.depth_progression[Math.min(depth - 1, 3)] || 'Deep reflection';
  
  return `Generate a wisdom-guided reflective question with these parameters:
- Category: ${category} - ${categoryData?.description || 'Wisdom-guided reflection'}
- Target depth: ${depth}/10 - Focus on: ${depthDescription}
- User phase: ${context.user.current_phase}
- Focus area: ${context.focusArea || 'holistic life transformation'}

Sample questions for inspiration:
${categoryData?.sample_questions?.slice(0, 2).join('\n') || 'What patterns do you notice in your life?'}

The question should:
- Guide toward self-discovery without preaching
- Challenge with compassion and wisdom
- Connect to their transformation journey
- Feel personally relevant and timely
- Inspire honest reflection and growth`;
}

function generateExpectedInsights(category: string, depth: number, context: QuestionContext): string[] {
  const categoryInsights: Record<string, string[]> = {
    contemplation: ['Hidden patterns', 'Core truths', 'Life themes', 'Inner wisdom'],
    accountability: ['Personal power', 'Choice awareness', 'Responsibility clarity', 'Agency recognition'],
    excellence: ['Growth opportunities', 'Standard elevation', 'Potential glimpses', 'Excellence pathways'],
    balance: ['Integration needs', 'Equilibrium points', 'Sustainable rhythms', 'Harmony insights'],
    gratitude: ['Hidden blessings', 'Strength recognition', 'Growth gifts', 'Abundance awareness'],
    patience: ['Process wisdom', 'Timing insights', 'Persistence power', 'Journey appreciation'],
  };
  
  const insights = categoryInsights[category] || ['Self-discovery'];
  const depthAdjusted = insights.map((insight: string) => `${insight} (depth ${depth})`);
  
  return depthAdjusted.slice(0, Math.min(depth, 4));
}

function generateFollowUpTriggers(category: string, context: QuestionContext): string[] {
  return [
    'Emotional resonance',
    'Pattern recognition',
    'Resistance or avoidance',
    'Breakthrough moment',
    'Integration readiness',
    'Curiosity spike',
  ];
}

function generatePhaseProgressionIndicators(context: QuestionContext): string[] {
  const phase = context.user.current_phase;
  
  const indicators: Record<number, string[]> = {
    1: ['Awareness building', 'Pattern noticing', 'Curiosity awakening'],
    2: ['Self-honesty deepening', 'Accountability acceptance', 'Pattern mapping'],
    3: ['Transformation readiness', 'Action orientation', 'Systems thinking'],
    4: ['Integration capacity', 'Wisdom embodiment', 'Teaching readiness'],
  };
  
  const phaseGroup = Math.min(Math.ceil(phase / 2), 4);
  return indicators[phaseGroup] || indicators[1];
}

function determineTargetRevelation(category: string, context: QuestionContext): string {
  const revelations: Record<string, string> = {
    contemplation: 'Deep truth about life patterns and meaning',
    accountability: 'Personal power and choice in creating reality',
    excellence: 'Untapped potential and growth possibilities',
    balance: 'Sustainable path between effort and acceptance',
    gratitude: 'Hidden resources and existing strengths',
    patience: 'Power of process and perfect timing',
  };
  
  return revelations[category] || 'Transformative self-understanding';
}

function calculateBreakthroughPotential(context: QuestionContext, depth: number): number {
  const depthFactor = depth / 10;
  const phaseFactor = context.user.current_phase / 8;
  const momentumFactor = context.discoveredPatterns?.length ? 0.2 : 0;
  
  return Math.min(depthFactor * 0.5 + phaseFactor * 0.3 + momentumFactor, 1);
}

function analyzeReflectionDepth(response: string, questionDepth: number): number {
  // Enhanced depth analysis for wisdom-guided responses
  const depthMarkers = {
    surface: ['think', 'maybe', 'probably', 'sometimes'],
    moderate: ['realize', 'understand', 'see', 'notice'],
    deep: ['profound', 'core', 'fundamental', 'always', 'never'],
    transformative: ['truth', 'essence', 'being', 'soul', 'purpose'],
  };
  
  let depthScore = 0;
  const lowerResponse = response.toLowerCase();
  
  Object.entries(depthMarkers).forEach(([level, markers], index) => {
    const matchCount = markers.filter(marker => lowerResponse.includes(marker)).length;
    depthScore += matchCount * (index + 1) * 0.5;
  });
  
  // Length and complexity bonus
  const lengthBonus = Math.min(response.length / 500, 1) * 2;
  const complexityBonus = (response.match(/[,;:]/g) || []).length * 0.2;
  
  return Math.min(depthScore + lengthBonus + complexityBonus, 10);
}

function analyzeEmotionalResonance(response: string): number {
  const emotionalMarkers = {
    mild: ['feel', 'think', 'seems'],
    moderate: ['emotional', 'touching', 'moving', 'important'],
    strong: ['powerful', 'profound', 'deeply', 'incredibly'],
    transformative: ['life-changing', 'breakthrough', 'revelation', 'transformed'],
  };
  
  let resonanceScore = 0;
  const lowerResponse = response.toLowerCase();
  
  Object.entries(emotionalMarkers).forEach(([level, markers], index) => {
    const matchCount = markers.filter(marker => lowerResponse.includes(marker)).length;
    resonanceScore += matchCount * (index + 1) * 0.6;
  });
  
  // Exclamation points and personal pronouns indicate emotional engagement
  const exclamationBonus = (response.match(/!/g) || []).length * 0.5;
  const personalBonus = (response.match(/\b(I|me|my|myself)\b/gi) || []).length * 0.1;
  
  return Math.min(resonanceScore + exclamationBonus + personalBonus, 10);
}

function identifyBreakthroughIndicators(
  response: string, 
  question: GeneratedQuestion,
  analysisResponse: any
): string[] {
  const indicators = [];
  const lowerResponse = response.toLowerCase();
  
  // Wisdom-specific breakthrough indicators
  if (lowerResponse.includes('never realized') || lowerResponse.includes('never thought')) {
    indicators.push('new_perspective');
  }
  if (lowerResponse.includes('now i see') || lowerResponse.includes('finally understand')) {
    indicators.push('clarity_moment');
  }
  if (lowerResponse.includes('responsible') || lowerResponse.includes('my choice')) {
    indicators.push('accountability_shift');
  }
  if (lowerResponse.includes('grateful') || lowerResponse.includes('appreciate')) {
    indicators.push('gratitude_awakening');
  }
  if (lowerResponse.includes('patient') || lowerResponse.includes('trust the process')) {
    indicators.push('patience_development');
  }
  if (lowerResponse.includes('wow') || lowerResponse.includes('amazing') || lowerResponse.includes('profound')) {
    indicators.push('emotional_breakthrough');
  }
  
  // Add AI-detected breakthroughs
  if (analysisResponse?.breakthroughDetected) {
    indicators.push('ai_detected_breakthrough');
  }
  
  return [...new Set(indicators)]; // Remove duplicates
}

function shouldDeepenCurrentLine(response: QuestionResponse, context: QuestionContext): boolean {
  return response.reflection_depth >= 6 && 
         response.emotional_resonance >= 5 && 
         context.currentDepthLevel < 8 &&
         response.breakthrough_indicators.length > 0;
}

function shouldShiftFocus(response: QuestionResponse, context: QuestionContext): boolean {
  return response.reflection_depth < 4 || 
         context.currentDepthLevel >= 8 ||
         (response.patterns_revealed.length === 0 && context.currentDepthLevel > 3);
}

function shouldMakeConnections(response: QuestionResponse, context: QuestionContext): boolean {
  return response.patterns_revealed.length >= 2 &&
         response.system_connections.length > 0 &&
         context.currentDepthLevel >= 4;
}

function calculateConversationMomentum(responses: QuestionResponse[]): number {
  if (responses.length < 2) return 0.5;
  
  const recentResponses = responses.slice(-3);
  
  // Calculate depth trend
  const depthTrend = recentResponses.reduce((acc, r, i) => {
    if (i === 0) return 0;
    return acc + (r.reflection_depth - recentResponses[i-1].reflection_depth);
  }, 0) / (recentResponses.length - 1);
  
  // Calculate breakthrough momentum
  const recentBreakthroughs = recentResponses.reduce((acc, r) => 
    acc + r.breakthrough_indicators.length, 0
  );
  
  const momentum = 0.5 + (depthTrend / 10) + (recentBreakthroughs * 0.1);
  return Math.max(0, Math.min(1, momentum));
}

function assessPhaseProgression(responses: QuestionResponse[], context: QuestionContext): number {
  const totalBreakthroughs = responses.reduce((acc, r) => acc + r.breakthrough_indicators.length, 0);
  const avgDepth = responses.reduce((acc, r) => acc + r.reflection_depth, 0) / responses.length;
  const patternCount = new Set(responses.flatMap(r => r.patterns_revealed)).size;
  
  const progressionScore = (totalBreakthroughs * 0.3) + 
                          (avgDepth * 0.05) + 
                          (patternCount * 0.1);
  
  return Math.min(progressionScore, 1);
}

function assessWisdomDevelopment(responses: QuestionResponse[]): Record<string, number> {
  const wisdomIndicators: Record<string, number> = {
    self_awareness: 0,
    accountability: 0,
    pattern_recognition: 0,
    integration: 0,
    compassion: 0,
    patience: 0,
  };
  
  responses.forEach(response => {
    // Assess each wisdom dimension based on response indicators
    if (response.breakthrough_indicators.includes('new_perspective')) {
      wisdomIndicators.self_awareness += 0.2;
    }
    if (response.breakthrough_indicators.includes('accountability_shift')) {
      wisdomIndicators.accountability += 0.3;
    }
    if (response.patterns_revealed.length > 0) {
      wisdomIndicators.pattern_recognition += 0.1 * response.patterns_revealed.length;
    }
    if (response.system_connections.length > 0) {
      wisdomIndicators.integration += 0.15 * response.system_connections.length;
    }
    if (response.breakthrough_indicators.includes('gratitude_awakening')) {
      wisdomIndicators.compassion += 0.2;
    }
    if (response.breakthrough_indicators.includes('patience_development')) {
      wisdomIndicators.patience += 0.25;
    }
  });
  
  // Normalize scores to 0-1 range
  Object.keys(wisdomIndicators).forEach((key: string) => {
    wisdomIndicators[key] = Math.min(wisdomIndicators[key] / responses.length, 1);
  });
  
  return wisdomIndicators;
}

function assessTransformationReadiness(responses: QuestionResponse[], context: QuestionContext): number {
  const wisdomMetrics = assessWisdomDevelopment(responses);
  const avgWisdom = Object.values(wisdomMetrics).reduce((a, b) => a + b, 0) / Object.keys(wisdomMetrics).length;
  
  const depthFactor = responses.reduce((acc, r) => acc + r.reflection_depth, 0) / (responses.length * 10);
  const breakthroughFactor = responses.reduce((acc, r) => acc + r.breakthrough_indicators.length, 0) / (responses.length * 3);
  const phaseFactor = context.user.current_phase / 8;
  
  return (avgWisdom * 0.4) + (depthFactor * 0.3) + (breakthroughFactor * 0.2) + (phaseFactor * 0.1);
}

function determineNextAction(
  responses: QuestionResponse[], 
  context: QuestionContext,
  wisdomMetrics: Record<string, number>
): string {
  const lastResponse = responses[responses.length - 1];
  
  if (!lastResponse) return 'begin_reflection';
  
  // Wisdom-guided next actions
  if (lastResponse.breakthrough_indicators.length > 1) {
    return 'capture_and_integrate_breakthrough';
  }
  
  if (lastResponse.reflection_depth >= 8 && wisdomMetrics.integration > 0.7) {
    return 'design_implementation_plan';
  }
  
  if (lastResponse.reflection_depth < 4 && responses.length > 2) {
    return 'gentle_deepening_with_support';
  }
  
  if (wisdomMetrics.accountability < 0.3 && context.user.current_phase >= 3) {
    return 'explore_personal_responsibility';
  }
  
  if (wisdomMetrics.patience < 0.3 && lastResponse.emotional_resonance > 7) {
    return 'cultivate_patient_persistence';
  }
  
  if (wisdomMetrics.pattern_recognition > 0.7 && wisdomMetrics.integration < 0.5) {
    return 'connect_insights_to_action';
  }
  
  return 'continue_wisdom_exploration';
}

export default wisdomEngine;