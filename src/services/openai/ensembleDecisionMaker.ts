import OpenAI from 'openai';
import config from '@/constants/config';
import { advancedOrchestrator, EnsembleResponse } from './advancedOrchestrator';
import { AIContext, AIResponse } from './aiOrchestrator';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface EnsembleDecision {
  final_response: AIResponse;
  confidence_metrics: {
    overall_confidence: number;
    ai_system_agreement: number;
    response_coherence: number;
    contextual_relevance: number;
    user_phase_alignment: number;
  };
  decision_process: {
    systems_consulted: string[];
    consensus_achieved: boolean;
    conflicting_viewpoints: string[];
    resolution_method: 'consensus' | 'weighted_vote' | 'expert_override' | 'user_choice';
  };
  alternative_options: AIResponse[];
  recommendation_strength: 'strong' | 'moderate' | 'weak' | 'requires_user_input';
}

export interface ValidationCriteria {
  phase_appropriateness: number;
  emotional_sensitivity: number;
  systems_thinking_level: number;
  actionability: number;
  breakthrough_potential: number;
}

export const ensembleDecisionMaker = {
  // Main ensemble decision-making process
  makeEnsembleDecision: async (
    context: AIContext,
    userInput: string,
    requestType: 'question' | 'analysis' | 'design' | 'pattern_recognition'
  ): Promise<EnsembleDecision> => {
    // Get multi-system coordinated response
    const ensembleResponse = await advancedOrchestrator.coordinateMultiSystemResponse(
      context,
      userInput,
      requestType
    );

    // Validate responses against user context
    const validationResults = await validateResponsesAgainstContext(
      [ensembleResponse.primary_response, ...ensembleResponse.alternative_perspectives],
      context
    );

    // Analyze inter-AI agreement and conflicts
    const agreementAnalysis = await analyzeAIAgreement(
      [ensembleResponse.primary_response, ...ensembleResponse.alternative_perspectives],
      context
    );

    // Generate confidence metrics
    const confidenceMetrics = calculateConfidenceMetrics(
      ensembleResponse,
      validationResults,
      agreementAnalysis
    );

    // Determine final decision process
    const decisionProcess = determineDecisionProcess(
      ensembleResponse,
      agreementAnalysis,
      confidenceMetrics
    );

    // Select or synthesize final response
    const finalResponse = await selectFinalResponse(
      ensembleResponse,
      decisionProcess,
      context
    );

    return {
      final_response: finalResponse,
      confidence_metrics: confidenceMetrics,
      decision_process: decisionProcess,
      alternative_options: ensembleResponse.alternative_perspectives,
      recommendation_strength: determineRecommendationStrength(confidenceMetrics),
    };
  },

  // Advanced validation against user context and readiness
  validateResponseQuality: async (
    response: AIResponse,
    context: AIContext
  ): Promise<ValidationCriteria> => {
    const validationPrompt = `Validate this AI response against user context and readiness:

Response: "${response.content}"
AI System: ${response.metadata.ai_system_used}
User Phase: ${context.user.current_phase}
User Context: ${JSON.stringify(context, null, 2).substring(0, 400)}...

Rate each criterion (0-10):
1. Phase Appropriateness: Does this match the user's transformation phase needs?
2. Emotional Sensitivity: Is this emotionally appropriate for the user's current state?
3. Systems Thinking Level: Does this match the user's systems thinking development?
4. Actionability: Can the user realistically act on this guidance?
5. Breakthrough Potential: How likely is this to create meaningful insights?

Return as JSON with numeric scores for each criterion.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a response validation specialist for AI-human interactions in transformational contexts.',
        },
        { role: 'user', content: validationPrompt },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    try {
      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        phase_appropriateness: result.phase_appropriateness || 5,
        emotional_sensitivity: result.emotional_sensitivity || 5,
        systems_thinking_level: result.systems_thinking_level || 5,
        actionability: result.actionability || 5,
        breakthrough_potential: result.breakthrough_potential || 5,
      };
    } catch {
      return {
        phase_appropriateness: 5,
        emotional_sensitivity: 5,
        systems_thinking_level: 5,
        actionability: 5,
        breakthrough_potential: 5,
      };
    }
  },

  // Conflict resolution between AI systems
  resolveAIConflicts: async (
    conflictingResponses: AIResponse[],
    context: AIContext
  ): Promise<{
    resolution_method: string;
    synthesized_response?: AIResponse;
    user_choice_required: boolean;
    conflict_analysis: string;
  }> => {
    const conflictAnalysisPrompt = `Analyze conflicts between these AI system responses:

${conflictingResponses.map((r, i) => `
Response ${i + 1} (${r.metadata.ai_system_used}):
"${r.content.substring(0, 300)}..."
Confidence: ${r.metadata.confidence_level}
`).join('\n')}

User Phase: ${context.user.current_phase}

Analyze:
1. Nature of the conflicts (perspective, approach, timing, depth)
2. Which response(s) best serve the user's current needs
3. Possibility of synthesis
4. Whether user input is needed for resolution

Provide analysis and recommend resolution approach.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI conflict resolution specialist focused on optimal user outcomes.',
        },
        { role: 'user', content: conflictAnalysisPrompt },
      ],
      max_tokens: 500,
      temperature: 0.4,
    });

    const analysis = completion.choices[0]?.message?.content || '';
    
    // Determine if synthesis is possible
    const canSynthesize = analysis.toLowerCase().includes('synthesis') || 
                         analysis.toLowerCase().includes('combine');
    
    const needsUserInput = analysis.toLowerCase().includes('user input') ||
                          analysis.toLowerCase().includes('user choice');

    const resolution: any = {
      resolution_method: needsUserInput ? 'user_choice' : 
                        canSynthesize ? 'synthesis' : 'expert_selection',
      user_choice_required: needsUserInput,
      conflict_analysis: analysis,
    };

    // Attempt synthesis if recommended
    if (canSynthesize && !needsUserInput) {
      const synthesizedResponse = await synthesizeResponses(conflictingResponses, context);
      resolution.synthesized_response = synthesizedResponse;
    }

    return resolution;
  },

  // Meta-analysis of ensemble performance
  analyzeEnsemblePerformance: async (
    decisions: EnsembleDecision[],
    userFeedback?: any[]
  ): Promise<{
    overall_accuracy: number;
    ai_system_effectiveness: { [key: string]: number };
    improvement_recommendations: string[];
    pattern_insights: string[];
  }> => {
    if (decisions.length === 0) {
      return {
        overall_accuracy: 0,
        ai_system_effectiveness: {},
        improvement_recommendations: ['Insufficient data for analysis'],
        pattern_insights: ['Need more ensemble decisions to analyze patterns'],
      };
    }

    const performanceAnalysis = await analyzeDecisionPatterns(decisions, userFeedback);
    return performanceAnalysis;
  },
};

// Helper functions for ensemble decision-making

async function validateResponsesAgainstContext(
  responses: AIResponse[],
  context: AIContext
): Promise<ValidationCriteria[]> {
  const validationPromises = responses.map(response => 
    ensembleDecisionMaker.validateResponseQuality(response, context)
  );
  
  return Promise.all(validationPromises);
}

async function analyzeAIAgreement(
  responses: AIResponse[],
  context: AIContext
): Promise<{
  agreement_level: number;
  consensus_points: string[];
  conflict_points: string[];
  dominant_perspective: string;
}> {
  const agreementPrompt = `Analyze agreement/disagreement between these AI responses:

${responses.map((r, i) => `
Response ${i + 1} (${r.metadata.ai_system_used}):
"${r.content.substring(0, 200)}..."
`).join('\n')}

Identify:
1. Points of agreement/consensus
2. Points of conflict/disagreement  
3. Overall agreement level (0-1)
4. Dominant perspective if any

Return as JSON with these fields.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an AI response agreement analyzer.',
      },
      { role: 'user', content: agreementPrompt },
    ],
    max_tokens: 400,
    temperature: 0.3,
  });

  try {
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return {
      agreement_level: result.agreement_level || 0.5,
      consensus_points: result.consensus_points || [],
      conflict_points: result.conflict_points || [],
      dominant_perspective: result.dominant_perspective || 'none',
    };
  } catch {
    return {
      agreement_level: 0.5,
      consensus_points: [],
      conflict_points: [],
      dominant_perspective: 'none',
    };
  }
}

function calculateConfidenceMetrics(
  ensembleResponse: EnsembleResponse,
  validationResults: ValidationCriteria[],
  agreementAnalysis: any
): any {
  const avgValidation = validationResults.reduce((acc, val) => {
    return {
      phase_appropriateness: acc.phase_appropriateness + val.phase_appropriateness,
      emotional_sensitivity: acc.emotional_sensitivity + val.emotional_sensitivity,
      systems_thinking_level: acc.systems_thinking_level + val.systems_thinking_level,
      actionability: acc.actionability + val.actionability,
      breakthrough_potential: acc.breakthrough_potential + val.breakthrough_potential,
    };
  }, {
    phase_appropriateness: 0,
    emotional_sensitivity: 0,
    systems_thinking_level: 0,
    actionability: 0,
    breakthrough_potential: 0,
  });

  const validationCount = validationResults.length || 1;
  const normalizedValidation = {
    phase_appropriateness: avgValidation.phase_appropriateness / validationCount / 10,
    emotional_sensitivity: avgValidation.emotional_sensitivity / validationCount / 10,
    systems_thinking_level: avgValidation.systems_thinking_level / validationCount / 10,
    actionability: avgValidation.actionability / validationCount / 10,
    breakthrough_potential: avgValidation.breakthrough_potential / validationCount / 10,
  };

  return {
    overall_confidence: (
      ensembleResponse.confidence_score +
      agreementAnalysis.agreement_level +
      Object.values(normalizedValidation).reduce((a: number, b: number) => a + b, 0) / 5
    ) / 3,
    ai_system_agreement: agreementAnalysis.agreement_level,
    response_coherence: ensembleResponse.consensus_level,
    contextual_relevance: (normalizedValidation.phase_appropriateness + normalizedValidation.emotional_sensitivity) / 2,
    user_phase_alignment: normalizedValidation.phase_appropriateness,
  };
}

function determineDecisionProcess(
  ensembleResponse: EnsembleResponse,
  agreementAnalysis: any,
  confidenceMetrics: any
): any {
  const hasHighAgreement = agreementAnalysis.agreement_level > 0.8;
  const hasHighConfidence = confidenceMetrics.overall_confidence > 0.8;
  const hasConflicts = agreementAnalysis.conflict_points.length > 0;

  let resolutionMethod: 'consensus' | 'weighted_vote' | 'expert_override' | 'user_choice';

  if (hasHighAgreement && hasHighConfidence) {
    resolutionMethod = 'consensus';
  } else if (hasConflicts && confidenceMetrics.overall_confidence < 0.6) {
    resolutionMethod = 'user_choice';
  } else if (hasConflicts) {
    resolutionMethod = 'expert_override';
  } else {
    resolutionMethod = 'weighted_vote';
  }

  return {
    systems_consulted: [ensembleResponse.primary_response.metadata.ai_system_used]
      .concat(ensembleResponse.alternative_perspectives.map(r => r.metadata.ai_system_used)),
    consensus_achieved: hasHighAgreement,
    conflicting_viewpoints: agreementAnalysis.conflict_points,
    resolution_method: resolutionMethod,
  };
}

async function selectFinalResponse(
  ensembleResponse: EnsembleResponse,
  decisionProcess: any,
  context: AIContext
): Promise<AIResponse> {
  if (decisionProcess.resolution_method === 'consensus') {
    return ensembleResponse.primary_response;
  }

  if (decisionProcess.resolution_method === 'synthesis' || 
      (decisionProcess.conflicting_viewpoints.length > 0 && decisionProcess.resolution_method === 'weighted_vote')) {
    return await synthesizeResponses(
      [ensembleResponse.primary_response, ...ensembleResponse.alternative_perspectives],
      context
    );
  }

  // For expert override or weighted vote, select highest confidence response
  const allResponses = [ensembleResponse.primary_response, ...ensembleResponse.alternative_perspectives];
  return allResponses.reduce((best, current) => 
    current.metadata.confidence_level > best.metadata.confidence_level ? current : best
  );
}

async function synthesizeResponses(
  responses: AIResponse[],
  context: AIContext
): Promise<AIResponse> {
  const synthesisPrompt = `Synthesize these AI responses into a coherent, optimal response:

${responses.map((r, i) => `
Response ${i + 1} (${r.metadata.ai_system_used}):
"${r.content}"
`).join('\n')}

User Context: Phase ${context.user.current_phase}

Create a synthesized response that:
1. Incorporates the best insights from each response
2. Resolves any conflicts intelligently
3. Maintains coherence and flow
4. Optimizes for the user's transformation phase
5. Preserves the most valuable guidance

Return only the synthesized response content.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a response synthesis specialist creating optimal AI-human interactions.',
      },
      { role: 'user', content: synthesisPrompt },
    ],
    max_tokens: 600,
    temperature: 0.6,
  });

  const synthesizedContent = completion.choices[0]?.message?.content || responses[0].content;

  return {
    content: synthesizedContent,
    metadata: {
      ai_system_used: 'ensemble_synthesized',
      confidence_level: Math.max(...responses.map(r => r.metadata.confidence_level)),
      suggested_follow_ups: responses.flatMap(r => r.metadata.suggested_follow_ups || []).slice(0, 3),
      patterns_identified: responses.flatMap(r => r.metadata.patterns_identified || []),
      leverage_points: responses.flatMap(r => r.metadata.leverage_points || []),
      system_connections: responses.flatMap(r => r.metadata.system_connections || []),
    },
  };
}

function determineRecommendationStrength(confidenceMetrics: any): 'strong' | 'moderate' | 'weak' | 'requires_user_input' {
  const { overall_confidence, ai_system_agreement, contextual_relevance } = confidenceMetrics;
  
  const avgScore = (overall_confidence + ai_system_agreement + contextual_relevance) / 3;
  
  if (avgScore > 0.85) return 'strong';
  if (avgScore > 0.7) return 'moderate';
  if (avgScore > 0.5) return 'weak';
  return 'requires_user_input';
}

async function analyzeDecisionPatterns(
  decisions: EnsembleDecision[],
  userFeedback?: any[]
): Promise<{
  overall_accuracy: number;
  ai_system_effectiveness: { [key: string]: number };
  improvement_recommendations: string[];
  pattern_insights: string[];
}> {
  const systemPerformance: { [key: string]: number[] } = {};
  
  decisions.forEach(decision => {
    const systemUsed = decision.final_response.metadata.ai_system_used;
    if (!systemPerformance[systemUsed]) {
      systemPerformance[systemUsed] = [];
    }
    systemPerformance[systemUsed].push(decision.confidence_metrics.overall_confidence);
  });

  const aiSystemEffectiveness: { [key: string]: number } = {};
  Object.entries(systemPerformance).forEach(([system, scores]) => {
    aiSystemEffectiveness[system] = scores.reduce((a, b) => a + b, 0) / scores.length;
  });

  const overallAccuracy = decisions.reduce((acc, decision) => 
    acc + decision.confidence_metrics.overall_confidence, 0
  ) / decisions.length;

  return {
    overall_accuracy: overallAccuracy,
    ai_system_effectiveness: aiSystemEffectiveness,
    improvement_recommendations: [
      'Continue monitoring ensemble performance',
      'Adjust AI system weights based on effectiveness scores',
      'Collect more user feedback for accuracy assessment',
    ],
    pattern_insights: [
      `Average ensemble confidence: ${overallAccuracy.toFixed(2)}`,
      `Most effective AI system: ${Object.entries(aiSystemEffectiveness)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none'}`,
    ],
  };
}

export default ensembleDecisionMaker;