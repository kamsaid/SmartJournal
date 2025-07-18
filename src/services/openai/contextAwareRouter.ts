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

export interface RouterContext {
  user_state: {
    current_phase: TransformationPhase;
    phase_progress: number; // 0-1 within current phase
    days_in_transformation: number;
    engagement_level: number; // 0-10
    recent_breakthrough: boolean;
    emotional_state: 'resistant' | 'curious' | 'ready' | 'overwhelmed' | 'breakthrough';
  };
  conversation_context: {
    session_depth: number; // How deep is current conversation
    topic_focus: string;
    user_intention: 'exploration' | 'problem_solving' | 'understanding' | 'implementation';
    energy_level: 'low' | 'medium' | 'high';
  };
  historical_patterns: {
    preferred_ai_systems: string[];
    effective_interaction_styles: string[];
    breakthrough_triggers: string[];
    resistance_patterns: string[];
  };
}

export interface RoutingDecision {
  primary_ai_system: string;
  supporting_systems: string[];
  interaction_style: 'gentle' | 'direct' | 'challenging' | 'supportive' | 'architectural';
  depth_level: number; // 1-10
  timing_strategy: 'immediate' | 'progressive' | 'delayed' | 'conditional';
  expected_outcomes: string[];
  confidence: number;
  reasoning: string;
}

export interface AdaptiveRouting {
  real_time_adjustments: boolean;
  fallback_systems: string[];
  escalation_triggers: string[];
  success_indicators: string[];
}

export const contextAwareRouter = {
  // Main intelligent routing function
  routeBasedOnContext: async (
    aiContext: AIContext,
    userInput: string,
    conversationHistory?: any[]
  ): Promise<RoutingDecision> => {
    // Build comprehensive router context
    const routerContext = await buildRouterContext(aiContext, userInput, conversationHistory);
    
    // Analyze user's current needs and state
    const needsAnalysis = await analyzeUserNeeds(userInput, routerContext);
    
    // Determine optimal AI system routing
    const routingDecision = await determineOptimalRouting(routerContext, needsAnalysis);
    
    // Validate routing decision against user patterns
    const validatedRouting = await validateRoutingDecision(routingDecision, routerContext);
    
    return validatedRouting;
  },

  // Phase-specific routing strategies
  getPhaseSpecificRouting: (
    phase: TransformationPhase,
    userState: any,
    needsType: string
  ): RoutingDecision => {
    const phaseStrategies = {
      1: { // Recognition - The Two Types of People
        primary_systems: ['socratic_questioner', 'pattern_recognizer'],
        approach: 'gentle_awakening',
        depth_limit: 6,
        focus: 'awareness_building',
      },
      2: { // Understanding - The Leverage Principle  
        primary_systems: ['leverage_analyzer', 'socratic_questioner'],
        approach: 'concept_introduction',
        depth_limit: 7,
        focus: 'leverage_recognition',
      },
      3: { // Realization - The Meta-Life Loop
        primary_systems: ['life_architecture_mapper', 'pattern_recognizer'],
        approach: 'systems_introduction',
        depth_limit: 8,
        focus: 'meta_thinking',
      },
      4: { // Transformation - Infinite Leverage
        primary_systems: ['life_design_guide', 'leverage_analyzer'],
        approach: 'architectural_thinking',
        depth_limit: 9,
        focus: 'system_design',
      },
      5: { // Vision - The Life You're Capable Of
        primary_systems: ['vision_architect', 'life_design_guide'],
        approach: 'possibility_expansion',
        depth_limit: 9,
        focus: 'vision_creation',
      },
      6: { // Reality - The Architected Life
        primary_systems: ['implementation_guide', 'life_architecture_mapper'],
        approach: 'practical_implementation',
        depth_limit: 10,
        focus: 'execution_mastery',
      },
      7: { // Integration - The Complete Transformation
        primary_systems: ['integration_specialist', 'mastery_guide'],
        approach: 'mastery_consolidation',
        depth_limit: 10,
        focus: 'teaching_others',
      },
    };

    const strategy = phaseStrategies[phase] || phaseStrategies[1];
    
    return {
      primary_ai_system: strategy.primary_systems[0],
      supporting_systems: strategy.primary_systems.slice(1),
      interaction_style: mapApproachToStyle(strategy.approach),
      depth_level: Math.min(strategy.depth_limit, userState.engagement_level + 2),
      timing_strategy: determineTimingForPhase(phase, userState),
      expected_outcomes: getPhaseExpectedOutcomes(phase),
      confidence: 0.8,
      reasoning: `Phase ${phase} optimized routing: ${strategy.focus}`,
    };
  },

  // Emotional state aware routing
  adjustForEmotionalState: (
    baseRouting: RoutingDecision,
    emotionalState: string,
    context: RouterContext
  ): RoutingDecision => {
    const emotionalAdjustments = {
      resistant: {
        style_override: 'gentle',
        depth_reduction: -2,
        system_preference: 'socratic_questioner', // Questions vs statements
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
        system_preference: 'life_design_guide',
        timing_adjustment: 'immediate',
      },
      overwhelmed: {
        style_override: 'gentle',
        depth_reduction: -3,
        system_preference: 'pattern_recognizer', // Simpler insights
        timing_adjustment: 'progressive',
      },
      breakthrough: {
        style_override: 'challenging',
        depth_boost: +3,
        system_preference: 'leverage_analyzer',
        timing_adjustment: 'immediate',
      },
    };

    const adjustment = emotionalAdjustments[emotionalState as keyof typeof emotionalAdjustments];
    if (!adjustment) return baseRouting;

    const depthChange = 'depth_boost' in adjustment ? adjustment.depth_boost : 
                       'depth_reduction' in adjustment ? adjustment.depth_reduction : 0;
    
    return {
      ...baseRouting,
      interaction_style: adjustment.style_override as any,
      depth_level: Math.max(1, Math.min(10, baseRouting.depth_level + depthChange)),
      primary_ai_system: adjustment.system_preference === 'keep_current' ? 
        baseRouting.primary_ai_system : adjustment.system_preference,
      timing_strategy: adjustment.timing_adjustment as any,
      reasoning: `${baseRouting.reasoning} + emotional state adjustment for ${emotionalState}`,
    };
  },

  // Real-time routing adaptation
  adaptRoutingRealTime: async (
    currentRouting: RoutingDecision,
    userResponse: string,
    context: RouterContext
  ): Promise<RoutingDecision> => {
    // Analyze user response for routing cues
    const responseAnalysis = await analyzeUserResponseForRouting(userResponse, context);
    
    // Check if routing adjustment is needed
    if (responseAnalysis.requires_adjustment) {
      const adjustedRouting = await adjustRoutingBasedOnResponse(
        currentRouting,
        responseAnalysis,
        context
      );
      return adjustedRouting;
    }

    return currentRouting;
  },

  // Learn from routing effectiveness
  updateRoutingPreferences: async (
    routingDecision: RoutingDecision,
    userFeedback: any,
    outcomes: any,
    context: RouterContext
  ): Promise<{
    effectiveness_score: number;
    preference_updates: any;
    pattern_insights: string[];
  }> => {
    const effectiveness = calculateRoutingEffectiveness(routingDecision, userFeedback, outcomes);
    const updates = generatePreferenceUpdates(effectiveness, routingDecision, context);
    
    return {
      effectiveness_score: effectiveness.score,
      preference_updates: updates,
      pattern_insights: effectiveness.insights,
    };
  },
};

// Helper functions for context-aware routing

async function buildRouterContext(
  aiContext: AIContext,
  userInput: string,
  conversationHistory?: any[]
): Promise<RouterContext> {
  const { user, recentReflections, patterns } = aiContext;
  
  // Calculate user state metrics
  const daysSinceStart = Math.floor(
    (Date.now() - new Date(user.transformation_start_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const avgDepth = recentReflections?.length 
    ? recentReflections.reduce((acc, r) => acc + r.depth_level, 0) / recentReflections.length
    : 3;

  // Detect emotional state from user input
  const emotionalState = await detectEmotionalState(userInput, aiContext);
  
  // Analyze conversation context
  const conversationContext = await analyzeConversationContext(userInput, conversationHistory);
  
  // Extract historical patterns
  const historicalPatterns = await extractHistoricalPatterns(aiContext);

  return {
    user_state: {
      current_phase: user.current_phase,
      phase_progress: calculatePhaseProgress(user, recentReflections),
      days_in_transformation: daysSinceStart,
      engagement_level: avgDepth,
      recent_breakthrough: checkRecentBreakthrough(recentReflections),
      emotional_state: emotionalState,
    },
    conversation_context: conversationContext,
    historical_patterns: historicalPatterns,
  };
}

async function analyzeUserNeeds(userInput: string, context: RouterContext): Promise<any> {
  const needsAnalysisPrompt = `Analyze user needs from this input:

Input: "${userInput}"
User State: ${JSON.stringify(context.user_state)}
Conversation Context: ${JSON.stringify(context.conversation_context)}

Determine:
1. Primary need type: question, analysis, design, support, challenge
2. Urgency level (1-10)
3. Complexity level (1-10)
4. Emotional support needed (1-10)
5. Readiness for deep work (1-10)
6. Specific focus areas

Return as JSON with these fields.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a user needs analysis specialist for AI routing systems.',
      },
      { role: 'user', content: needsAnalysisPrompt },
    ],
    max_tokens: 300,
    temperature: 0.4,
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch {
    return {
      primary_need: 'question',
      urgency: 5,
      complexity: 5,
      emotional_support: 5,
      deep_work_readiness: 5,
      focus_areas: ['general'],
    };
  }
}

async function determineOptimalRouting(
  context: RouterContext,
  needsAnalysis: any
): Promise<RoutingDecision> {
  const phaseRouting = contextAwareRouter.getPhaseSpecificRouting(
    context.user_state.current_phase,
    context.user_state,
    needsAnalysis.primary_need
  );

  // Adjust for emotional state
  const emotionallyAdjusted = contextAwareRouter.adjustForEmotionalState(
    phaseRouting,
    context.user_state.emotional_state,
    context
  );

  // Final optimization based on needs analysis
  return optimizeRoutingForNeeds(emotionallyAdjusted, needsAnalysis, context);
}

async function validateRoutingDecision(
  routing: RoutingDecision,
  context: RouterContext
): Promise<RoutingDecision> {
  // Check against historical effectiveness
  const historicalMatch = findHistoricalMatch(routing, context.historical_patterns);
  
  if (historicalMatch && historicalMatch.effectiveness < 0.6) {
    // Suggest alternative routing based on historical data
    return adjustBasedOnHistory(routing, context.historical_patterns);
  }

  return routing;
}

async function detectEmotionalState(userInput: string, context: AIContext): Promise<RouterContext['user_state']['emotional_state']> {
  const emotionalIndicators = {
    resistant: ['not sure', 'doubt', 'skeptical', 'won\'t work', 'tried before'],
    curious: ['interesting', 'tell me more', 'how', 'why', 'what if'],
    ready: ['let\'s do', 'ready', 'want to start', 'how do I', 'implement'],
    overwhelmed: ['too much', 'confused', 'don\'t understand', 'complicated', 'stressed'],
    breakthrough: ['realize', 'understand now', 'makes sense', 'see the connection', 'aha'],
  };

  const inputLower = userInput.toLowerCase();
  
  for (const [state, indicators] of Object.entries(emotionalIndicators)) {
    if (indicators.some(indicator => inputLower.includes(indicator))) {
      return state as RouterContext['user_state']['emotional_state'];
    }
  }

  return 'curious' as RouterContext['user_state']['emotional_state']; // Default state
}

async function analyzeConversationContext(
  userInput: string,
  conversationHistory?: any[]
): Promise<any> {
  const sessionDepth = conversationHistory?.length || 1;
  
  // Simple topic extraction
  const topicKeywords = ['health', 'wealth', 'relationships', 'growth', 'purpose', 'environment'];
  const detectedTopic = topicKeywords.find(topic => 
    userInput.toLowerCase().includes(topic)
  ) || 'general';

  // Determine user intention
  const intentionMap = {
    exploration: ['explore', 'understand', 'learn about', 'what is'],
    problem_solving: ['problem', 'issue', 'stuck', 'help with', 'fix'],
    understanding: ['why', 'how', 'explain', 'meaning', 'concept'],
    implementation: ['do', 'implement', 'start', 'action', 'steps'],
  };

  let userIntention = 'exploration';
  const inputLower = userInput.toLowerCase();
  
  for (const [intention, keywords] of Object.entries(intentionMap)) {
    if (keywords.some(keyword => inputLower.includes(keyword))) {
      userIntention = intention;
      break;
    }
  }

  return {
    session_depth: sessionDepth,
    topic_focus: detectedTopic,
    user_intention: userIntention,
    energy_level: sessionDepth < 3 ? 'high' : sessionDepth < 6 ? 'medium' : 'low',
  };
}

async function extractHistoricalPatterns(context: AIContext): Promise<any> {
  // This would ideally analyze historical interaction data
  // For now, return defaults based on current patterns
  return {
    preferred_ai_systems: ['socratic_questioner'], // Would be learned from data
    effective_interaction_styles: ['supportive'],
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

function mapApproachToStyle(approach: string): any {
  const styleMap = {
    gentle_awakening: 'gentle',
    concept_introduction: 'supportive',
    systems_introduction: 'direct',
    architectural_thinking: 'challenging',
    possibility_expansion: 'architectural',
    practical_implementation: 'direct',
    mastery_consolidation: 'architectural',
  };
  
  return styleMap[approach as keyof typeof styleMap] || 'supportive';
}

function determineTimingForPhase(phase: TransformationPhase, userState: any): any {
  if (phase <= 2) return 'progressive'; // Early phases need gradual introduction
  if (phase <= 4) return 'immediate'; // Middle phases can handle direct approach
  if (userState.recent_breakthrough) return 'immediate'; // Capitalize on breakthroughs
  return 'conditional'; // Advanced phases depend on readiness
}

function getPhaseExpectedOutcomes(phase: TransformationPhase): string[] {
  const phaseOutcomes = {
    1: ['pattern_awareness', 'recognition_of_two_types'],
    2: ['leverage_understanding', 'systems_vs_goals_clarity'],
    3: ['meta_thinking_development', 'root_cause_focus'],
    4: ['system_design_skills', 'architectural_thinking'],
    5: ['vision_clarity', 'possibility_expansion'],
    6: ['implementation_mastery', 'daily_architecture'],
    7: ['integration_completion', 'teaching_ability'],
  };
  
  return phaseOutcomes[phase] || ['general_growth'];
}

function optimizeRoutingForNeeds(
  routing: RoutingDecision,
  needsAnalysis: any,
  context: RouterContext
): RoutingDecision {
  const optimized = { ...routing };
  
  // Adjust for urgency
  if (needsAnalysis.urgency > 8) {
    optimized.timing_strategy = 'immediate';
    optimized.primary_ai_system = 'leverage_analyzer'; // Quick high-impact solutions
  }
  
  // Adjust for complexity
  if (needsAnalysis.complexity > 8 && context.user_state.engagement_level < 7) {
    optimized.depth_level = Math.max(1, optimized.depth_level - 2); // Reduce complexity
    optimized.interaction_style = 'gentle';
  }
  
  // Adjust for emotional support needs
  if (needsAnalysis.emotional_support > 7) {
    optimized.interaction_style = 'supportive';
    optimized.supporting_systems = ['empathy_specialist', ...optimized.supporting_systems];
  }
  
  return optimized;
}

function findHistoricalMatch(routing: RoutingDecision, patterns: any): any {
  // Simplified historical matching - would be more sophisticated with real data
  const isPreferredSystem = patterns.preferred_ai_systems.includes(routing.primary_ai_system);
  const isEffectiveStyle = patterns.effective_interaction_styles.includes(routing.interaction_style);
  
  if (isPreferredSystem && isEffectiveStyle) {
    return { effectiveness: 0.8 };
  } else if (isPreferredSystem || isEffectiveStyle) {
    return { effectiveness: 0.6 };
  }
  
  return { effectiveness: 0.4 };
}

function adjustBasedOnHistory(routing: RoutingDecision, patterns: any): RoutingDecision {
  return {
    ...routing,
    primary_ai_system: patterns.preferred_ai_systems[0] || routing.primary_ai_system,
    interaction_style: patterns.effective_interaction_styles[0] || routing.interaction_style,
    reasoning: `${routing.reasoning} + historical effectiveness adjustment`,
  };
}

async function analyzeUserResponseForRouting(userResponse: string, context: RouterContext): Promise<any> {
  // Analyze if user response indicates routing should change
  const adjustmentIndicators = {
    too_complex: ['confused', 'don\'t understand', 'too complicated'],
    too_simple: ['already know', 'obvious', 'tell me more'],
    wrong_approach: ['not helpful', 'different approach', 'not what I need'],
    emotional_mismatch: ['too pushy', 'too gentle', 'not supportive enough'],
  };
  
  const responseLower = userResponse.toLowerCase();
  
  for (const [issue, indicators] of Object.entries(adjustmentIndicators)) {
    if (indicators.some(indicator => responseLower.includes(indicator))) {
      return {
        requires_adjustment: true,
        issue_type: issue,
        suggested_adjustment: getAdjustmentForIssue(issue),
      };
    }
  }
  
  return { requires_adjustment: false };
}

function getAdjustmentForIssue(issueType: string): any {
  const adjustments = {
    too_complex: { depth_change: -2, style_change: 'gentle' },
    too_simple: { depth_change: +2, style_change: 'challenging' },
    wrong_approach: { system_change: 'socratic_questioner' },
    emotional_mismatch: { style_change: 'supportive' },
  };
  
  return adjustments[issueType as keyof typeof adjustments] || {};
}

async function adjustRoutingBasedOnResponse(
  currentRouting: RoutingDecision,
  responseAnalysis: any,
  context: RouterContext
): Promise<RoutingDecision> {
  const adjustment = responseAnalysis.suggested_adjustment;
  const adjusted = { ...currentRouting };
  
  if (adjustment.depth_change) {
    adjusted.depth_level = Math.max(1, Math.min(10, adjusted.depth_level + adjustment.depth_change));
  }
  
  if (adjustment.style_change) {
    adjusted.interaction_style = adjustment.style_change;
  }
  
  if (adjustment.system_change) {
    adjusted.primary_ai_system = adjustment.system_change;
  }
  
  adjusted.reasoning += ` + real-time adjustment for ${responseAnalysis.issue_type}`;
  
  return adjusted;
}

function calculateRoutingEffectiveness(routing: RoutingDecision, userFeedback: any, outcomes: any): any {
  // Calculate effectiveness score based on user feedback and outcomes
  let score = 0.5; // Base score
  
  if (userFeedback?.helpful) score += 0.3;
  if (userFeedback?.appropriate_depth) score += 0.2;
  if (outcomes?.breakthrough_achieved) score += 0.3;
  if (outcomes?.user_engaged) score += 0.2;
  
  return {
    score: Math.min(1, score),
    insights: [
      `Routing effectiveness: ${(score * 100).toFixed(0)}%`,
      `AI system used: ${routing.primary_ai_system}`,
      `Interaction style: ${routing.interaction_style}`,
    ],
  };
}

function generatePreferenceUpdates(effectiveness: any, routing: RoutingDecision, context: RouterContext): any {
  const updates: any = {};
  
  if (effectiveness.score > 0.8) {
    // Successful routing - reinforce preferences
    updates.preferred_ai_systems = [routing.primary_ai_system];
    updates.effective_interaction_styles = [routing.interaction_style];
  } else if (effectiveness.score < 0.4) {
    // Poor routing - avoid in similar contexts
    updates.avoid_ai_systems = [routing.primary_ai_system];
    updates.avoid_interaction_styles = [routing.interaction_style];
  }
  
  return updates;
}

export default contextAwareRouter;