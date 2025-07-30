import OpenAI from 'openai';
import config from '@/constants/config';
import { AIContext, AIResponse } from './aiOrchestrator';
import {
  User,
  DailyReflection,
  Pattern,
  LifeSystem,
  TransformationPhase,
} from '@/types/database';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Wisdom-guided system definitions aligned with transformation journey
export const WISDOM_SYSTEMS = {
  WISDOM_GUIDE: {
    name: 'wisdom_guide',
    description: 'Primary guide for reflective questioning and transformation',
    capabilities: ['contemplation_guidance', 'insight_synthesis', 'depth_navigation'],
  },
  PATTERN_RECOGNIZER: {
    name: 'pattern_recognizer', 
    description: 'Identifies recurring themes and hidden connections through wisdom lens',
    capabilities: ['pattern_analysis', 'wisdom_pattern_extraction', 'cycle_detection'],
  },
  ACCOUNTABILITY_GUIDE: {
    name: 'accountability_guide',
    description: 'Helps users take ownership and recognize their power to choose',
    capabilities: ['responsibility_clarity', 'choice_awareness', 'empowerment_guidance'],
  },
  EXCELLENCE_COACH: {
    name: 'excellence_coach',
    description: 'Guides toward highest potential through balanced pursuit of excellence',
    capabilities: ['potential_activation', 'standard_elevation', 'balanced_growth'],
  },
  BALANCE_KEEPER: {
    name: 'balance_keeper',
    description: 'Maintains equilibrium between effort and acceptance in transformation',
    capabilities: ['balance_assessment', 'integration_planning', 'sustainable_growth'],
  },
  GRATITUDE_CULTIVATOR: {
    name: 'gratitude_cultivator',
    description: 'Reveals hidden blessings and existing strengths',
    capabilities: ['blessing_recognition', 'strength_awareness', 'abundance_perspective'],
  },
  PATIENCE_TEACHER: {
    name: 'patience_teacher',
    description: 'Builds resilience through patient persistence and trust in timing',
    capabilities: ['patience_development', 'process_appreciation', 'resilience_building'],
  },
  WISDOM_SYNTHESIZER: {
    name: 'wisdom_synthesizer',
    description: 'Connects insights into coherent life wisdom',
    capabilities: ['insight_integration', 'wisdom_articulation', 'teaching_preparation'],
  },
  LIFE_ARCHITECT: {
    name: 'life_architect',
    description: 'Examines life as interconnected wisdom systems',
    capabilities: ['system_analysis', 'leverage_identification', 'holistic_design'],
  },
  TRANSFORMATION_TRACKER: {
    name: 'transformation_tracker',
    description: 'Monitors wisdom growth and celebrates advancement',
    capabilities: ['progress_measurement', 'milestone_recognition', 'momentum_building'],
  },
};

export interface WisdomRouterContext {
  user_state: {
    current_phase: TransformationPhase;
    phase_progress: number; // 0-1 within current phase
    days_in_transformation: number;
    wisdom_engagement_level: number; // 0-10
    recent_breakthrough: boolean;
    contemplative_state: 'resistant' | 'curious' | 'ready' | 'overwhelmed' | 'breakthrough';
  };
  conversation_context: {
    session_depth: number; // How deep is current conversation
    wisdom_focus: string;
    user_intention: 'exploration' | 'understanding' | 'transformation' | 'integration';
    energy_level: 'low' | 'medium' | 'high';
  };
  wisdom_patterns: {
    preferred_wisdom_systems: string[];
    effective_contemplation_styles: string[];
    breakthrough_triggers: string[];
    resistance_patterns: string[];
  };
}

export interface WisdomRoutingDecision {
  primary_wisdom_system: string;
  supporting_systems: string[];
  contemplation_style: 'gentle' | 'direct' | 'challenging' | 'supportive' | 'architectural';
  wisdom_depth_level: number; // 1-10
  timing_strategy: 'immediate' | 'progressive' | 'delayed' | 'conditional';
  expected_outcomes: string[];
  confidence: number;
  reasoning: string;
}

export interface AdaptiveWisdomRouting {
  real_time_adjustments: boolean;
  fallback_systems: string[];
  escalation_triggers: string[];
  success_indicators: string[];
}

// Phase-specific wisdom routing strategies
const WISDOM_PHASE_ROUTING = {
  1: { // Awareness - Building Consciousness
    primary_systems: ['wisdom_guide', 'pattern_recognizer'],
    secondary_systems: ['gratitude_cultivator', 'life_architect'],
    approach: 'gentle_awakening',
    depth_limit: 6,
    focus: 'contemplation_and_awareness',
  },
  2: { // Understanding - Developing Deep Insight
    primary_systems: ['accountability_guide', 'wisdom_guide'],
    secondary_systems: ['pattern_recognizer', 'balance_keeper'],
    approach: 'understanding_deepening',
    depth_limit: 7,
    focus: 'accountability_and_insight',
  },
  3: { // Transformation - Creating Positive Change
    primary_systems: ['excellence_coach', 'accountability_guide'],
    secondary_systems: ['balance_keeper', 'transformation_tracker'],
    approach: 'excellence_pursuit',
    depth_limit: 8,
    focus: 'aligned_action',
  },
  4: { // Integration - Embodying New Ways
    primary_systems: ['wisdom_synthesizer', 'balance_keeper'],
    secondary_systems: ['excellence_coach', 'patience_teacher'],
    approach: 'wisdom_embodiment',
    depth_limit: 9,
    focus: 'integration_mastery',
  },
  5: { // Mastery - Living Wisdom Daily
    primary_systems: ['wisdom_synthesizer', 'life_architect'],
    secondary_systems: ['patience_teacher', 'transformation_tracker'],
    approach: 'wisdom_mastery',
    depth_limit: 9,
    focus: 'natural_wisdom',
  },
  6: { // Flow - Effortless Integration
    primary_systems: ['life_architect', 'wisdom_synthesizer'],
    secondary_systems: ['balance_keeper', 'gratitude_cultivator'],
    approach: 'effortless_flow',
    depth_limit: 10,
    focus: 'natural_integration',
  },
  7: { // Legacy - Wisdom in Service
    primary_systems: ['wisdom_synthesizer', 'patience_teacher'],
    secondary_systems: ['life_architect', 'transformation_tracker'],
    approach: 'wisdom_service',
    depth_limit: 10,
    focus: 'legacy_creation',
  },
};

export const wisdomAwareRouter = {
  // Main intelligent wisdom routing function
  routeBasedOnWisdomContext: async (
    aiContext: AIContext,
    userInput: string,
    conversationHistory?: any[]
  ): Promise<WisdomRoutingDecision> => {
    // Build comprehensive wisdom router context
    const wisdomContext = await buildWisdomRouterContext(aiContext, userInput, conversationHistory);
    
    // Analyze user's current wisdom needs and state
    const wisdomNeedsAnalysis = await analyzeUserWisdomNeeds(userInput, wisdomContext);
    
    // Determine optimal wisdom system routing
    const wisdomRoutingDecision = await determineOptimalWisdomRouting(wisdomContext, wisdomNeedsAnalysis);
    
    // Validate routing decision against user wisdom patterns
    const validatedWisdomRouting = await validateWisdomRoutingDecision(wisdomRoutingDecision, wisdomContext);
    
    return validatedWisdomRouting;
  },

  // Phase-specific wisdom routing strategies
  getPhaseSpecificWisdomRouting: (
    phase: TransformationPhase,
    userState: any,
    needsType: string
  ): WisdomRoutingDecision => {
    const wisdomStrategy = WISDOM_PHASE_ROUTING[phase] || WISDOM_PHASE_ROUTING[1];

    return {
      primary_wisdom_system: wisdomStrategy.primary_systems[0],
      supporting_systems: wisdomStrategy.primary_systems.slice(1),
      contemplation_style: mapWisdomApproachToStyle(wisdomStrategy.approach),
      wisdom_depth_level: Math.min(wisdomStrategy.depth_limit, userState.wisdom_engagement_level + 2),
      timing_strategy: determineWisdomTimingForPhase(phase, userState),
      expected_outcomes: getPhaseWisdomExpectedOutcomes(phase),
      confidence: 0.8,
      reasoning: `Phase ${phase} wisdom-guided routing: ${wisdomStrategy.focus}`,
    };
  },

  // Contemplative state aware routing
  adjustForContemplativeState: (
    baseRouting: WisdomRoutingDecision,
    contemplativeState: string,
    context: WisdomRouterContext
  ): WisdomRoutingDecision => {
    const contemplativeAdjustments = {
      resistant: {
        style_override: 'gentle',
        depth_reduction: -2,
        system_preference: 'wisdom_guide', // Questions vs statements
        timing_adjustment: 'delayed',
      },
      curious: {
        style_override: 'supportive',
        depth_boost: +1,
        system_preference: 'keep_current',
        timing_adjustment: 'immediate',
      },
      ready: {
        style_override: 'direct',
        depth_boost: +2,
        system_preference: 'excellence_coach',
        timing_adjustment: 'immediate',
      },
      overwhelmed: {
        style_override: 'gentle',
        depth_reduction: -3,
        system_preference: 'gratitude_cultivator', // Simpler, positive insights
        timing_adjustment: 'progressive',
      },
      breakthrough: {
        style_override: 'challenging',
        depth_boost: +3,
        system_preference: 'wisdom_synthesizer',
        timing_adjustment: 'immediate',
      },
    };

    const adjustment = contemplativeAdjustments[contemplativeState as keyof typeof contemplativeAdjustments];
    if (!adjustment) return baseRouting;

    const depthChange = 'depth_boost' in adjustment ? adjustment.depth_boost : 
                       'depth_reduction' in adjustment ? adjustment.depth_reduction : 0;
    
    return {
      ...baseRouting,
      contemplation_style: adjustment.style_override as any,
      wisdom_depth_level: Math.max(1, Math.min(10, baseRouting.wisdom_depth_level + depthChange)),
      primary_wisdom_system: adjustment.system_preference === 'keep_current' ? 
        baseRouting.primary_wisdom_system : adjustment.system_preference,
      timing_strategy: adjustment.timing_adjustment as any,
      reasoning: `${baseRouting.reasoning} + contemplative state adjustment for ${contemplativeState}`,
    };
  },

  // Real-time wisdom routing adaptation
  adaptWisdomRoutingRealTime: async (
    currentRouting: WisdomRoutingDecision,
    userResponse: string,
    context: WisdomRouterContext
  ): Promise<WisdomRoutingDecision> => {
    // Analyze user response for wisdom routing cues
    const responseAnalysis = await analyzeUserResponseForWisdomRouting(userResponse, context);
    
    // Check if wisdom routing adjustment is needed
    if (responseAnalysis.requires_adjustment) {
      const adjustedRouting = await adjustWisdomRoutingBasedOnResponse(
        currentRouting,
        responseAnalysis,
        context
      );
      return adjustedRouting;
    }

    return currentRouting;
  },

  // Learn from wisdom routing effectiveness
  updateWisdomRoutingPreferences: async (
    routingDecision: WisdomRoutingDecision,
    userFeedback: any,
    outcomes: any,
    context: WisdomRouterContext
  ): Promise<{
    effectiveness_score: number;
    preference_updates: any;
    wisdom_insights: string[];
  }> => {
    const effectiveness = calculateWisdomRoutingEffectiveness(routingDecision, userFeedback, outcomes);
    const updates = generateWisdomPreferenceUpdates(effectiveness, routingDecision, context);
    
    return {
      effectiveness_score: effectiveness.score,
      preference_updates: updates,
      wisdom_insights: effectiveness.insights,
    };
  },
};

// Helper functions for wisdom-aware routing

async function buildWisdomRouterContext(
  aiContext: AIContext,
  userInput: string,
  conversationHistory?: any[]
): Promise<WisdomRouterContext> {
  const { user, recentReflections, patterns } = aiContext;
  
  // Calculate user state metrics
  const daysSinceStart = Math.floor(
    (Date.now() - new Date(user.transformation_start_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const avgDepth = recentReflections?.length 
    ? recentReflections.reduce((acc, r) => acc + r.depth_level, 0) / recentReflections.length
    : 3;

  // Detect contemplative state from user input
  const contemplativeState = await detectContemplativeState(userInput, aiContext);
  
  // Analyze conversation context
  const conversationContext = await analyzeWisdomConversationContext(userInput, conversationHistory);
  
  // Extract wisdom patterns
  const wisdomPatterns = await extractWisdomPatterns(aiContext);

  return {
    user_state: {
      current_phase: user.current_phase,
      phase_progress: calculatePhaseProgress(user, recentReflections),
      days_in_transformation: daysSinceStart,
      wisdom_engagement_level: avgDepth,
      recent_breakthrough: checkRecentBreakthrough(recentReflections),
      contemplative_state: contemplativeState,
    },
    conversation_context: conversationContext,
    wisdom_patterns: wisdomPatterns,
  };
}

async function analyzeUserWisdomNeeds(userInput: string, context: WisdomRouterContext): Promise<any> {
  const wisdomNeedsAnalysisPrompt = `Analyze user wisdom needs from this input:

Input: "${userInput}"
User State: ${JSON.stringify(context.user_state)}
Conversation Context: ${JSON.stringify(context.conversation_context)}

Determine through wisdom lens:
1. Primary wisdom need: contemplation, accountability, excellence, balance, gratitude, patience
2. Urgency level (1-10)
3. Complexity level (1-10)
4. Contemplative support needed (1-10)
5. Readiness for deep wisdom work (1-10)
6. Specific wisdom focus areas

Return as JSON with these fields.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a wisdom needs analysis specialist for AI routing systems focused on transformation.',
      },
      { role: 'user', content: wisdomNeedsAnalysisPrompt },
    ],
    max_tokens: 300,
    temperature: 0.4,
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch {
    return {
      primary_wisdom_need: 'contemplation',
      urgency: 5,
      complexity: 5,
      contemplative_support: 5,
      deep_wisdom_readiness: 5,
      wisdom_focus_areas: ['general'],
    };
  }
}

async function determineOptimalWisdomRouting(
  context: WisdomRouterContext,
  needsAnalysis: any
): Promise<WisdomRoutingDecision> {
  const phaseRouting = wisdomAwareRouter.getPhaseSpecificWisdomRouting(
    context.user_state.current_phase,
    context.user_state,
    needsAnalysis.primary_wisdom_need
  );

  // Adjust for contemplative state
  const contemplativelyAdjusted = wisdomAwareRouter.adjustForContemplativeState(
    phaseRouting,
    context.user_state.contemplative_state,
    context
  );

  // Final optimization based on wisdom needs analysis
  return optimizeWisdomRoutingForNeeds(contemplativelyAdjusted, needsAnalysis, context);
}

async function validateWisdomRoutingDecision(
  routing: WisdomRoutingDecision,
  context: WisdomRouterContext
): Promise<WisdomRoutingDecision> {
  // Check against wisdom patterns effectiveness
  const wisdomMatch = findWisdomPatternMatch(routing, context.wisdom_patterns);
  
  if (wisdomMatch && wisdomMatch.effectiveness < 0.6) {
    // Suggest alternative routing based on wisdom pattern data
    return adjustBasedOnWisdomHistory(routing, context.wisdom_patterns);
  }

  return routing;
}

async function detectContemplativeState(userInput: string, context: AIContext): Promise<WisdomRouterContext['user_state']['contemplative_state']> {
  const contemplativeIndicators = {
    resistant: ['not sure', 'doubt', 'skeptical', 'won\'t work', 'tried before'],
    curious: ['interesting', 'tell me more', 'how', 'why', 'what if'],
    ready: ['let\'s do', 'ready', 'want to start', 'how do I', 'implement'],
    overwhelmed: ['too much', 'confused', 'don\'t understand', 'complicated', 'stressed'],
    breakthrough: ['realize', 'understand now', 'makes sense', 'see the connection', 'aha'],
  };

  const inputLower = userInput.toLowerCase();
  
  for (const [state, indicators] of Object.entries(contemplativeIndicators)) {
    if (indicators.some(indicator => inputLower.includes(indicator))) {
      return state as WisdomRouterContext['user_state']['contemplative_state'];
    }
  }

  return 'curious'; // Default contemplative state
}

async function analyzeWisdomConversationContext(
  userInput: string,
  conversationHistory?: any[]
): Promise<any> {
  const sessionDepth = conversationHistory?.length || 1;
  
  // Wisdom topic extraction
  const wisdomTopics = ['health', 'wealth', 'relationships', 'growth', 'purpose', 'environment'];
  const detectedWisdomTopic = wisdomTopics.find(topic => 
    userInput.toLowerCase().includes(topic)
  ) || 'general';

  // Determine user intention through wisdom lens
  const wisdomIntentionMap = {
    exploration: ['explore', 'understand', 'learn about', 'what is'],
    understanding: ['why', 'how', 'explain', 'meaning', 'concept'],
    transformation: ['change', 'transform', 'improve', 'grow', 'become'],
    integration: ['implement', 'practice', 'maintain', 'sustain', 'embody'],
  };

  let userIntention = 'exploration';
  const inputLower = userInput.toLowerCase();
  
  for (const [intention, keywords] of Object.entries(wisdomIntentionMap)) {
    if (keywords.some(keyword => inputLower.includes(keyword))) {
      userIntention = intention;
      break;
    }
  }

  return {
    session_depth: sessionDepth,
    wisdom_focus: detectedWisdomTopic,
    user_intention: userIntention,
    energy_level: sessionDepth < 3 ? 'high' : sessionDepth < 6 ? 'medium' : 'low',
  };
}

async function extractWisdomPatterns(context: AIContext): Promise<any> {
  // This would ideally analyze historical wisdom interaction data
  // For now, return defaults based on current patterns
  return {
    preferred_wisdom_systems: ['wisdom_guide'], // Would be learned from data
    effective_contemplation_styles: ['supportive'],
    breakthrough_triggers: ['challenging_assumptions'],
    resistance_patterns: ['complex_concepts'],
  };
}

function calculatePhaseProgress(user: User, recentReflections?: DailyReflection[]): number {
  // Calculate progress within current phase based on reflection depth and consistency
  const avgDepth = recentReflections?.length 
    ? recentReflections.reduce((acc, r) => acc + r.depth_level, 0) / recentReflections.length
    : 3;
  
  const daysSinceStart = Math.floor(
    (Date.now() - new Date(user.transformation_start_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Simple progress calculation - would be more sophisticated in practice
  return Math.min(1, (avgDepth / 10) * (daysSinceStart / 30));
}

function checkRecentBreakthrough(recentReflections?: DailyReflection[]): boolean {
  if (!recentReflections?.length) return false;
  
  // Check if recent reflections show significant depth increase
  const recent = recentReflections.slice(0, 3);
  const earlier = recentReflections.slice(3, 6);
  
  if (earlier.length === 0) return false;
  
  const recentAvg = recent.reduce((acc, r) => acc + r.depth_level, 0) / recent.length;
  const earlierAvg = earlier.reduce((acc, r) => acc + r.depth_level, 0) / earlier.length;
  
  return recentAvg > earlierAvg + 2; // Significant jump in depth
}

function mapWisdomApproachToStyle(approach: string): any {
  const wisdomStyleMap = {
    gentle_awakening: 'gentle',
    understanding_deepening: 'supportive',
    excellence_pursuit: 'challenging',
    wisdom_embodiment: 'architectural',
    wisdom_mastery: 'architectural',
    effortless_flow: 'supportive',
    wisdom_service: 'architectural',
  };
  
  return wisdomStyleMap[approach as keyof typeof wisdomStyleMap] || 'supportive';
}

function determineWisdomTimingForPhase(phase: TransformationPhase, userState: any): any {
  if (phase <= 2) return 'progressive'; // Early phases need gradual introduction
  if (phase <= 4) return 'immediate'; // Middle phases can handle direct approach
  if (userState.recent_breakthrough) return 'immediate'; // Capitalize on breakthroughs
  return 'conditional'; // Advanced phases depend on readiness
}

function getPhaseWisdomExpectedOutcomes(phase: TransformationPhase): string[] {
  const phaseWisdomOutcomes = {
    1: ['contemplation_awareness', 'pattern_recognition'],
    2: ['accountability_understanding', 'deeper_insight'],
    3: ['excellence_pursuit', 'aligned_action'],
    4: ['wisdom_integration', 'embodied_transformation'],
    5: ['natural_wisdom', 'effortless_application'],
    6: ['integrated_flow', 'sustained_transformation'],
    7: ['wisdom_service', 'legacy_creation'],
  };
  
  return phaseWisdomOutcomes[phase] || ['general_wisdom_growth'];
}

function optimizeWisdomRoutingForNeeds(
  routing: WisdomRoutingDecision,
  needsAnalysis: any,
  context: WisdomRouterContext
): WisdomRoutingDecision {
  const optimized = { ...routing };
  
  // Adjust for urgency
  if (needsAnalysis.urgency > 8) {
    optimized.timing_strategy = 'immediate';
    optimized.primary_wisdom_system = 'accountability_guide'; // Quick empowerment solutions
  }
  
  // Adjust for complexity
  if (needsAnalysis.complexity > 8 && context.user_state.wisdom_engagement_level < 7) {
    optimized.wisdom_depth_level = Math.max(1, optimized.wisdom_depth_level - 2); // Reduce complexity
    optimized.contemplation_style = 'gentle';
  }
  
  // Adjust for contemplative support needs
  if (needsAnalysis.contemplative_support > 7) {
    optimized.contemplation_style = 'supportive';
    optimized.supporting_systems = ['gratitude_cultivator', ...optimized.supporting_systems];
  }
  
  return optimized;
}

function findWisdomPatternMatch(routing: WisdomRoutingDecision, patterns: any): any {
  // Simplified wisdom pattern matching - would be more sophisticated with real data
  const isPreferredSystem = patterns.preferred_wisdom_systems.includes(routing.primary_wisdom_system);
  const isEffectiveStyle = patterns.effective_contemplation_styles.includes(routing.contemplation_style);
  
  if (isPreferredSystem && isEffectiveStyle) {
    return { effectiveness: 0.8 };
  } else if (isPreferredSystem || isEffectiveStyle) {
    return { effectiveness: 0.6 };
  }
  
  return { effectiveness: 0.4 };
}

function adjustBasedOnWisdomHistory(routing: WisdomRoutingDecision, patterns: any): WisdomRoutingDecision {
  return {
    ...routing,
    primary_wisdom_system: patterns.preferred_wisdom_systems[0] || routing.primary_wisdom_system,
    contemplation_style: patterns.effective_contemplation_styles[0] || routing.contemplation_style,
    reasoning: `${routing.reasoning} + wisdom pattern effectiveness adjustment`,
  };
}

async function analyzeUserResponseForWisdomRouting(userResponse: string, context: WisdomRouterContext): Promise<any> {
  // Analyze if user response indicates wisdom routing should change
  const wisdomAdjustmentIndicators = {
    too_complex: ['confused', 'don\'t understand', 'too complicated'],
    too_simple: ['already know', 'obvious', 'tell me more'],
    wrong_approach: ['not helpful', 'different approach', 'not what I need'],
    contemplative_mismatch: ['too pushy', 'too gentle', 'not supportive enough'],
  };
  
  const responseLower = userResponse.toLowerCase();
  
  for (const [issue, indicators] of Object.entries(wisdomAdjustmentIndicators)) {
    if (indicators.some(indicator => responseLower.includes(indicator))) {
      return {
        requires_adjustment: true,
        issue_type: issue,
        suggested_adjustment: getWisdomAdjustmentForIssue(issue),
      };
    }
  }
  
  return { requires_adjustment: false };
}

function getWisdomAdjustmentForIssue(issueType: string): any {
  const wisdomAdjustments = {
    too_complex: { depth_change: -2, style_change: 'gentle' },
    too_simple: { depth_change: +2, style_change: 'challenging' },
    wrong_approach: { system_change: 'wisdom_guide' },
    contemplative_mismatch: { style_change: 'supportive' },
  };
  
  return wisdomAdjustments[issueType as keyof typeof wisdomAdjustments] || {};
}

async function adjustWisdomRoutingBasedOnResponse(
  currentRouting: WisdomRoutingDecision,
  responseAnalysis: any,
  context: WisdomRouterContext
): Promise<WisdomRoutingDecision> {
  const adjustment = responseAnalysis.suggested_adjustment;
  const adjusted = { ...currentRouting };
  
  if (adjustment.depth_change) {
    adjusted.wisdom_depth_level = Math.max(1, Math.min(10, adjusted.wisdom_depth_level + adjustment.depth_change));
  }
  
  if (adjustment.style_change) {
    adjusted.contemplation_style = adjustment.style_change;
  }
  
  if (adjustment.system_change) {
    adjusted.primary_wisdom_system = adjustment.system_change;
  }
  
  adjusted.reasoning += ` + real-time wisdom adjustment for ${responseAnalysis.issue_type}`;
  
  return adjusted;
}

function calculateWisdomRoutingEffectiveness(routing: WisdomRoutingDecision, userFeedback: any, outcomes: any): any {
  // Calculate effectiveness score based on user feedback and transformation outcomes
  let score = 0.5; // Base score
  
  if (userFeedback?.wisdom_helpful) score += 0.3;
  if (userFeedback?.appropriate_contemplation_depth) score += 0.2;
  if (outcomes?.breakthrough_achieved) score += 0.3;
  if (outcomes?.user_engaged) score += 0.2;
  
  return {
    score: Math.min(1, score),
    insights: [
      `Wisdom routing effectiveness: ${(score * 100).toFixed(0)}%`,
      `Primary wisdom system used: ${routing.primary_wisdom_system}`,
      `Contemplation style: ${routing.contemplation_style}`,
    ],
  };
}

function generateWisdomPreferenceUpdates(effectiveness: any, routing: WisdomRoutingDecision, context: WisdomRouterContext): any {
  const updates: any = {};
  
  if (effectiveness.score > 0.8) {
    // Successful wisdom routing - reinforce preferences
    updates.preferred_wisdom_systems = [routing.primary_wisdom_system];
    updates.effective_contemplation_styles = [routing.contemplation_style];
  } else if (effectiveness.score < 0.4) {
    // Poor wisdom routing - avoid in similar contexts
    updates.avoid_wisdom_systems = [routing.primary_wisdom_system];
    updates.avoid_contemplation_styles = [routing.contemplation_style];
  }
  
  return updates;
}

export default wisdomAwareRouter;