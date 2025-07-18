import OpenAI from 'openai';
import config from '@/constants/config';
import { aiOrchestrator, AIContext, AIResponse } from './aiOrchestrator';
import {
  User,
  DailyReflection,
  Pattern,
  LifeSystem,
  TransformationPhase,
  LifeSystemType,
  AnalysisType,
} from '@/types/database';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface EnsembleResponse {
  primary_response: AIResponse;
  confidence_score: number;
  consensus_level: number;
  alternative_perspectives: AIResponse[];
  recommended_action: 'accept' | 'request_clarification' | 'explore_alternatives';
  reasoning: string;
}

export interface ContextRoute {
  ai_system: string;
  priority: number;
  reasoning: string;
  expected_outcomes: string[];
}

export interface OrchestrationStrategy {
  phase_1_2: ContextRoute[];
  phase_3_4: ContextRoute[];
  phase_5_6: ContextRoute[];
  phase_7: ContextRoute[];
  crisis_mode: ContextRoute[];
}

export const advancedOrchestrator = {
  // Enhanced multi-system coordination with ensemble decision-making
  async coordinateMultiSystemResponse(
    context: AIContext,
    userInput: string,
    requestType: 'question' | 'analysis' | 'design' | 'pattern_recognition'
  ): Promise<EnsembleResponse> {
    // Determine optimal AI system routing based on context
    const routing = await this.routeToOptimalAI(context, userInput);
    
    // Generate responses from multiple AI systems
    const responses = await Promise.all(
      routing.map((route: ContextRoute) => executeSystemResponse(route.ai_system, context, userInput, requestType))
    );

    // Analyze ensemble and generate consensus
    const ensembleAnalysis = await analyzeEnsembleResponses(responses, context);
    
    // Determine primary response and confidence
    const primaryResponse = selectPrimaryResponse(responses, ensembleAnalysis);
    
    return {
      primary_response: primaryResponse,
      confidence_score: ensembleAnalysis.confidence_score,
      consensus_level: ensembleAnalysis.consensus_level,
      alternative_perspectives: responses.filter((r: AIResponse) => r !== primaryResponse),
      recommended_action: ensembleAnalysis.recommended_action,
      reasoning: ensembleAnalysis.reasoning,
    };
  },

  // Context-aware AI routing system
  async routeToOptimalAI(
    context: AIContext,
    userInput: string
  ): Promise<ContextRoute[]> {
    const routingAnalysis = await analyzeContextForRouting(context, userInput);
    const phase = context.user.current_phase;
    const userReadiness = assessUserReadiness(context);
    
    // Define routing strategies based on transformation phase
    const strategies: OrchestrationStrategy = {
      phase_1_2: [
        {
          ai_system: 'socratic_questioner',
          priority: 1,
          reasoning: 'Early phases need awareness-building questions',
          expected_outcomes: ['pattern_recognition', 'assumption_challenging'],
        },
        {
          ai_system: 'pattern_recognizer',
          priority: 2,
          reasoning: 'Identify initial life patterns for recognition phase',
          expected_outcomes: ['behavioral_patterns', 'cognitive_patterns'],
        },
      ],
      phase_3_4: [
        {
          ai_system: 'leverage_analyzer',
          priority: 1,
          reasoning: 'Mid phases focus on identifying leverage points',
          expected_outcomes: ['leverage_identification', 'system_design_opportunities'],
        },
        {
          ai_system: 'life_architecture_mapper',
          priority: 2,
          reasoning: 'Begin mapping life systems architecture',
          expected_outcomes: ['system_mapping', 'interconnection_analysis'],
        },
        {
          ai_system: 'socratic_questioner',
          priority: 3,
          reasoning: 'Continue deepening understanding through questions',
          expected_outcomes: ['deeper_insights', 'perspective_shifts'],
        },
      ],
      phase_5_6: [
        {
          ai_system: 'life_design_guide',
          priority: 1,
          reasoning: 'Advanced phases focus on architectural design',
          expected_outcomes: ['system_architecture', 'implementation_planning'],
        },
        {
          ai_system: 'leverage_analyzer',
          priority: 2,
          reasoning: 'Identify compound leverage opportunities',
          expected_outcomes: ['compound_leverage', 'optimization_strategies'],
        },
        {
          ai_system: 'life_architecture_mapper',
          priority: 3,
          reasoning: 'Advanced system interconnection analysis',
          expected_outcomes: ['complex_mapping', 'cascade_analysis'],
        },
      ],
      phase_7: [
        {
          ai_system: 'integration_specialist',
          priority: 1,
          reasoning: 'Final phase requires integration of all systems',
          expected_outcomes: ['system_integration', 'mastery_consolidation'],
        },
        {
          ai_system: 'life_design_guide',
          priority: 2,
          reasoning: 'Continuous architectural refinement',
          expected_outcomes: ['architectural_mastery', 'system_optimization'],
        },
      ],
      crisis_mode: [
        {
          ai_system: 'leverage_analyzer',
          priority: 1,
          reasoning: 'Crisis requires immediate high-leverage interventions',
          expected_outcomes: ['immediate_leverage', 'crisis_resolution'],
        },
        {
          ai_system: 'life_design_guide',
          priority: 2,
          reasoning: 'Design quick architectural solutions',
          expected_outcomes: ['rapid_system_design', 'emergency_architecture'],
        },
      ],
    };

    // Select strategy based on phase and crisis detection
    const isCrisis = detectCrisisMode(context, userInput);
    let strategy: ContextRoute[];
    
    if (isCrisis) {
      strategy = strategies.crisis_mode;
    } else if (phase <= 2) {
      strategy = strategies.phase_1_2;
    } else if (phase <= 4) {
      strategy = strategies.phase_3_4;
    } else if (phase <= 6) {
      strategy = strategies.phase_5_6;
    } else {
      strategy = strategies.phase_7;
    }

    // Adjust routing based on user readiness and specific context
    return adjustRoutingForContext(strategy, routingAnalysis, userReadiness);
  },

  // Progressive insight revelation with readiness assessment
  async revealInsightsProgressively(
    context: AIContext,
    availableInsights: string[],
    userResponse: string
  ): Promise<{
    insights_to_reveal: string[];
    insights_to_delay: string[];
    readiness_assessment: any;
    revelation_strategy: string;
  }> {
    const readinessAssessment = await assessInsightReadiness(context, userResponse);
    
    const revelationAnalysis = await analyzeInsightRevealation(
      availableInsights,
      readinessAssessment,
      context
    );

    return {
      insights_to_reveal: revelationAnalysis.ready_insights,
      insights_to_delay: revelationAnalysis.delayed_insights,
      readiness_assessment: readinessAssessment,
      revelation_strategy: revelationAnalysis.strategy,
    };
  },

  // Enhanced memory consolidation and retrieval
  async consolidateConversationMemory(
    context: AIContext,
    newInsights: any[],
    conversationSummary: string
  ): Promise<{
    consolidated_memories: any[];
    key_patterns: string[];
    breakthrough_moments: any[];
    context_connections: string[];
  }> {
    const memoryAnalysis = await analyzeMemoryConsolidation(
      context,
      newInsights,
      conversationSummary
    );

    return memoryAnalysis;
  },
};

// Helper functions for advanced orchestration

async function executeSystemResponse(
  aiSystem: string,
  context: AIContext,
  userInput: string,
  requestType: string
): Promise<AIResponse> {
  switch (aiSystem) {
    case 'socratic_questioner':
      return await aiOrchestrator.generateSocraticQuestion(context, userInput);
    
    case 'life_architecture_mapper':
      return await aiOrchestrator.analyzeLifeSystems(context, 'interconnection_analysis' as AnalysisType);
    
    case 'leverage_analyzer':
      return await aiOrchestrator.identifyLeveragePoints(context);
    
    case 'life_design_guide':
      return await aiOrchestrator.generateLifeDesign(context, 'growth' as LifeSystemType);
    
    case 'pattern_recognizer':
      return await aiOrchestrator.recognizePatterns(context);
    
    case 'integration_specialist':
      return await generateIntegrationResponse(context, userInput);
    
    default:
      return await aiOrchestrator.generateSocraticQuestion(context, userInput);
  }
}

async function analyzeEnsembleResponses(
  responses: AIResponse[],
  context: AIContext
): Promise<{
  confidence_score: number;
  consensus_level: number;
  recommended_action: 'accept' | 'request_clarification' | 'explore_alternatives';
  reasoning: string;
}> {
  const analysisPrompt = `Analyze these ${responses.length} AI system responses for ensemble decision-making:

${responses.map((r, i) => `Response ${i + 1} (${r.metadata.ai_system_used}):
Confidence: ${r.metadata.confidence_level}
Content: "${r.content.substring(0, 200)}..."
`).join('\n')}

Assess:
1. Overall confidence score (0-1)
2. Consensus level between responses (0-1)
3. Recommended action: accept, request_clarification, or explore_alternatives
4. Reasoning for the assessment

Return in format:
CONFIDENCE: [score]
CONSENSUS: [score] 
ACTION: [action]
REASONING: [detailed reasoning]`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an ensemble AI coordinator analyzing multiple AI responses for optimal decision-making.',
      },
      { role: 'user', content: analysisPrompt },
    ],
    max_tokens: 400,
    temperature: 0.3,
  });

  const response = completion.choices[0]?.message?.content || '';
  
  return {
    confidence_score: parseFloat(extractValue(response, 'CONFIDENCE:', 'CONSENSUS:')) || 0.7,
    consensus_level: parseFloat(extractValue(response, 'CONSENSUS:', 'ACTION:')) || 0.6,
    recommended_action: (extractValue(response, 'ACTION:', 'REASONING:') as any) || 'accept',
    reasoning: extractValue(response, 'REASONING:', '') || 'Ensemble analysis completed',
  };
}

function selectPrimaryResponse(responses: AIResponse[], analysis: any): AIResponse {
  // Select highest confidence response that aligns with consensus
  return responses.reduce((best, current) => {
    const bestScore = best.metadata.confidence_level;
    const currentScore = current.metadata.confidence_level;
    return currentScore > bestScore ? current : best;
  });
}

async function analyzeContextForRouting(context: AIContext, userInput: string): Promise<any> {
  const routingPrompt = `Analyze this user input for optimal AI system routing:

User Input: "${userInput}"
User Phase: ${context.user.current_phase}
Context: ${JSON.stringify(context, null, 2).substring(0, 500)}...

Determine:
1. Primary need type: question, analysis, design, pattern_recognition
2. Emotional state indicators
3. Readiness for deep insights
4. Urgency level
5. Complexity level

Return as JSON with these fields.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a context analysis specialist for AI system routing.',
      },
      { role: 'user', content: routingPrompt },
    ],
    max_tokens: 300,
    temperature: 0.4,
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch {
    return {
      primary_need: 'question',
      emotional_state: 'neutral',
      insight_readiness: 'medium',
      urgency: 'normal',
      complexity: 'medium',
    };
  }
}

function assessUserReadiness(context: AIContext): any {
  const { user, recentReflections } = context;
  
  const daysSinceStart = Math.floor(
    (Date.now() - new Date(user.transformation_start_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const avgDepth = recentReflections?.length 
    ? recentReflections.reduce((acc, r) => acc + r.depth_level, 0) / recentReflections.length
    : 3;

  return {
    experience_level: Math.min(daysSinceStart / 30, 10), // 0-10 based on months
    engagement_depth: avgDepth,
    phase_progress: user.current_phase,
    consistency: recentReflections?.length || 0,
  };
}

function detectCrisisMode(context: AIContext, userInput: string): boolean {
  const crisisIndicators = [
    'urgent', 'crisis', 'emergency', 'stuck', 'desperate', 'failing',
    'can\'t continue', 'giving up', 'not working', 'breaking down'
  ];
  
  return crisisIndicators.some(indicator => 
    userInput.toLowerCase().includes(indicator)
  );
}

function adjustRoutingForContext(
  strategy: ContextRoute[],
  routingAnalysis: any,
  userReadiness: any
): ContextRoute[] {
  return strategy.map(route => ({
    ...route,
    priority: adjustPriorityForContext(route.priority, routingAnalysis, userReadiness),
  })).sort((a, b) => a.priority - b.priority);
}

function adjustPriorityForContext(
  basePriority: number,
  routingAnalysis: any,
  userReadiness: any
): number {
  let adjustedPriority = basePriority;
  
  // Adjust for urgency
  if (routingAnalysis.urgency === 'high') {
    adjustedPriority -= 0.5;
  }
  
  // Adjust for readiness level
  if (userReadiness.engagement_depth > 7) {
    adjustedPriority -= 0.3; // Higher readiness = higher priority for complex systems
  }
  
  return Math.max(1, adjustedPriority);
}

async function assessInsightReadiness(context: AIContext, userResponse: string): Promise<any> {
  const readinessPrompt = `Assess user's readiness for deep insights based on their response:

Response: "${userResponse}"
User Phase: ${context.user.current_phase}

Assess readiness levels (0-10) for:
1. Challenging beliefs
2. Complex systems thinking
3. Personal responsibility acceptance
4. Emotional processing capacity
5. Implementation readiness

Return as JSON with these numeric fields.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an insight readiness assessment specialist.',
      },
      { role: 'user', content: readinessPrompt },
    ],
    max_tokens: 200,
    temperature: 0.3,
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch {
    return {
      challenging_beliefs: 5,
      systems_thinking: 5,
      personal_responsibility: 5,
      emotional_processing: 5,
      implementation_readiness: 5,
    };
  }
}

async function analyzeInsightRevealation(
  insights: string[],
  readiness: any,
  context: AIContext
): Promise<{
  ready_insights: string[];
  delayed_insights: string[];
  strategy: string;
}> {
  const minReadiness = Math.min(...Object.values(readiness).map(Number));
  const readyThreshold = Math.max(context.user.current_phase * 1.2, 4);
  
  const readyInsights = insights.filter((_, i) => i < Math.floor(minReadiness / 2));
  const delayedInsights = insights.filter((_, i) => i >= Math.floor(minReadiness / 2));
  
  return {
    ready_insights: readyInsights,
    delayed_insights: delayedInsights,
    strategy: minReadiness > readyThreshold ? 'progressive_deep' : 'gradual_surface',
  };
}

async function analyzeMemoryConsolidation(
  context: AIContext,
  newInsights: any[],
  conversationSummary: string
): Promise<any> {
  const consolidationPrompt = `Consolidate conversation memory and insights:

New Insights: ${JSON.stringify(newInsights, null, 2)}
Conversation Summary: "${conversationSummary}"
User Context: Phase ${context.user.current_phase}

Identify:
1. Key patterns emerging
2. Breakthrough moments
3. Important context connections
4. Consolidated memories to store

Return as JSON with arrays for each category.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a memory consolidation specialist for AI conversation systems.',
      },
      { role: 'user', content: consolidationPrompt },
    ],
    max_tokens: 400,
    temperature: 0.4,
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch {
    return {
      consolidated_memories: [],
      key_patterns: [],
      breakthrough_moments: [],
      context_connections: [],
    };
  }
}

async function generateIntegrationResponse(context: AIContext, userInput: string): Promise<AIResponse> {
  const integrationPrompt = `You are the Integration Specialist AI system. Your role is to help users in Phase 7 integrate all their life systems mastery.

User Input: "${userInput}"
User Context: ${JSON.stringify(context, null, 2).substring(0, 300)}...

Focus on:
- Synthesizing learnings across all life systems
- Identifying integration opportunities
- Consolidating architectural thinking skills
- Supporting mastery development

Provide an integration-focused response that ties together multiple systems and promotes holistic life architecture.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: integrationPrompt },
      { role: 'user', content: userInput },
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content || '';

  return {
    content,
    metadata: {
      ai_system_used: 'integration_specialist',
      confidence_level: 0.88,
      suggested_follow_ups: [
        'How do these integrated systems reinforce each other?',
        'What would be the next level of architectural sophistication?',
        'How can you teach these principles to others?',
      ],
    },
  };
}

// Utility function for parsing structured responses
function extractValue(text: string, startMarker: string, endMarker: string): string {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return '';
  
  const contentStart = startIndex + startMarker.length;
  const endIndex = endMarker ? text.indexOf(endMarker, contentStart) : text.length;
  
  return text.substring(contentStart, endIndex === -1 ? text.length : endIndex).trim();
}

export default advancedOrchestrator;