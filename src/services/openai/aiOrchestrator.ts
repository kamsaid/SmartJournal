import OpenAI from 'openai';
import config from '@/constants/config';
import {
  MASTER_SYSTEM_PROMPT,
  PHASE_PROMPTS,
  LIFE_SYSTEM_PROMPTS,
  ANALYSIS_PROMPTS,
} from '@/ai/prompts/masterPrompts';
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

export interface AIContext {
  user: User;
  currentPhase?: any;
  recentReflections?: DailyReflection[];
  lifeSystems?: LifeSystem[];
  patterns?: Pattern[];
  conversationHistory?: any[];
}

export interface AIResponse {
  content: string;
  metadata: {
    ai_system_used: string;
    confidence_level: number;
    suggested_follow_ups: string[];
    patterns_identified?: string[];
    leverage_points?: string[];
    system_connections?: string[];
    wisdom_insights?: Record<string, any>;
    breakthrough_detected?: boolean;
  };
}

export const aiOrchestrator = {
  // Main wisdom-guided questioning system (renamed from generateSocraticQuestion)
  generateWisdomGuidedQuestion: async (
    context: AIContext,
    prompt: string
  ): Promise<AIResponse> => {
    const systemPrompt = buildSystemPrompt('wisdom_guide', context);
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if available
    if (context.conversationHistory) {
      context.conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      });
    }

    // Add current prompt
    messages.push({ role: 'user', content: prompt });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      max_tokens: 250,
      temperature: 0.8,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const content = completion.choices[0]?.message?.content || '';

    return {
      content,
      metadata: {
        ai_system_used: 'wisdom_guide',
        confidence_level: 0.85,
        suggested_follow_ups: await generateFollowUpQuestions(content, context),
      },
    };
  },

  // Legacy method for backward compatibility
  generateSocraticQuestion: async (
    context: AIContext,
    userResponse?: string
  ): Promise<AIResponse> => {
    // Redirect to wisdom-guided approach with appropriate prompt
    const prompt = userResponse || 
      `Generate an opening wisdom-guided question for someone in ${getPhaseName(context.user.current_phase)}. Consider their current life patterns and transformation readiness.`;
    
    return aiOrchestrator.generateWisdomGuidedQuestion(context, prompt);
  },

  // New method for analyzing reflections with wisdom principles
  analyzeReflection: async (
    context: AIContext,
    params: {
      response: string;
      questionContext: any;
      evaluationCriteria: Record<string, string>;
    }
  ): Promise<AIResponse> => {
    const systemPrompt = `${MASTER_SYSTEM_PROMPT}

Analyze this user reflection through the lens of wisdom-guided transformation.
Evaluate based on these criteria:
${Object.entries(params.evaluationCriteria)
  .map(([key, desc]) => `- ${key}: ${desc}`)
  .join('\n')}

Look for:
1. Depth of self-awareness and honest reflection
2. Recognition of personal patterns and themes
3. Accountability and ownership of their journey
4. Readiness for transformation and growth
5. Integration of previous insights
6. Balance between self-compassion and challenge

Identify any breakthrough moments, emerging patterns, or system connections.`;

    const userPrompt = `Question asked: "${params.questionContext.question}"
Category: ${params.questionContext.category}
Depth level: ${params.questionContext.depth_level}

User's reflection:
"${params.response}"

Provide analysis in JSON format with:
- patterns_identified: array of recognized patterns
- system_connections: array of connections across life areas
- wisdom_insights: object with scores for each evaluation criteria (0-1)
- breakthrough_detected: boolean
- key_insights: array of main insights from the response
- recommended_follow_up: suggested direction for continued exploration`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: "json_object" }
      });

      const analysisResult = JSON.parse(response.choices[0].message.content || '{}');

      return {
        content: JSON.stringify(analysisResult),
        metadata: {
          ai_system_used: 'wisdom_reflection_analyzer',
          confidence_level: 0.88,
          suggested_follow_ups: [],
          patterns_identified: analysisResult.patterns_identified || [],
          system_connections: analysisResult.system_connections || [],
          wisdom_insights: analysisResult.wisdom_insights || {},
          breakthrough_detected: analysisResult.breakthrough_detected || false,
        }
      };
    } catch (error) {
      console.error('Error analyzing reflection:', error);
      throw error;
    }
  },

  // Life systems analysis and mapping with wisdom focus
  analyzeLifeSystems: async (
    context: AIContext,
    analysisType: AnalysisType
  ): Promise<AIResponse> => {
    const systemPrompt = buildSystemPrompt('life_wisdom_architect', context);
    const analysisPrompt = ANALYSIS_PROMPTS[analysisType];

    const userDataSummary = buildUserDataSummary(context);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: `${systemPrompt}\n\n${analysisPrompt}` },
      {
        role: 'user',
        content: `Analyze this user's life systems through wisdom principles:\n\n${userDataSummary}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 800,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    // Extract structured insights from the response
    const insights = await extractStructuredInsights(content, analysisType);

    return {
      content,
      metadata: {
        ai_system_used: 'life_wisdom_architect',
        confidence_level: 0.9,
        suggested_follow_ups: [],
        ...insights,
      },
    };
  },

  // Root cause and leverage analysis with wisdom perspective
  identifyLeveragePoints: async (context: AIContext): Promise<AIResponse> => {
    const systemPrompt = buildSystemPrompt('wisdom_leverage_analyzer', context);
    const userDataSummary = buildUserDataSummary(context);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Identify the highest-wisdom intervention points for this user:\n\n${userDataSummary}\n\nFocus on changes that would create cascading positive effects through wisdom application and create sustainable transformation.`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || '';
    const leveragePoints = await extractLeveragePoints(content);

    return {
      content,
      metadata: {
        ai_system_used: 'wisdom_leverage_analyzer',
        confidence_level: 0.88,
        suggested_follow_ups: [],
        leverage_points: leveragePoints,
      },
    };
  },

  // Life design guidance through wisdom architecture
  generateLifeDesign: async (
    context: AIContext,
    lifeArea: LifeSystemType,
    specificChallenge?: string
  ): Promise<AIResponse> => {
    const systemPrompt = buildSystemPrompt('wisdom_life_designer', context);
    const lifeSystemPrompt = LIFE_SYSTEM_PROMPTS[lifeArea];

    const challenge = specificChallenge || `Design a wisdom-based system for their ${lifeArea} life area`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: `${systemPrompt}\n\n${lifeSystemPrompt}` },
      {
        role: 'user',
        content: `${challenge}\n\nUser Context:\n${buildUserDataSummary(context)}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 800,
      temperature: 0.75,
    });

    const content = completion.choices[0]?.message?.content || '';

    return {
      content,
      metadata: {
        ai_system_used: 'wisdom_life_designer',
        confidence_level: 0.87,
        suggested_follow_ups: [
          'How would you implement this wisdom system in your current environment?',
          'What would be the first small step to test this approach?',
          'What obstacles might prevent this from working, and how would you design around them with wisdom?',
        ],
      },
    };
  },

  // Pattern recognition through wisdom lens
  recognizePatterns: async (
    context: AIContext,
    focusArea?: string
  ): Promise<AIResponse> => {
    const systemPrompt = buildSystemPrompt('wisdom_pattern_recognizer', context);
    const userDataSummary = buildUserDataSummary(context);

    const focus = focusArea || 'all life areas';

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Identify wisdom patterns and cycles in this user's responses and life systems, focusing on ${focus}:\n\n${userDataSummary}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 600,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content || '';
    const patterns = await extractPatterns(content);

    return {
      content,
      metadata: {
        ai_system_used: 'wisdom_pattern_recognizer',
        confidence_level: 0.82,
        suggested_follow_ups: [],
        patterns_identified: patterns,
      },
    };
  },
};

// Helper functions - updated with wisdom terminology
function buildSystemPrompt(aiSystem: string, context: AIContext): string {
  const phasePrompt = PHASE_PROMPTS[context.user.current_phase];
  const userContext = buildUserContext(context);

  return `${MASTER_SYSTEM_PROMPT}

${phasePrompt}

## Current User Context
${userContext}

## Instructions
You are currently operating as the ${aiSystem.replace('_', ' ').toUpperCase()} system. Focus on this specific role while maintaining awareness of the user's complete wisdom transformation journey.

Guide them through:
- Deep contemplation and self-discovery
- Personal accountability with compassion
- Excellence pursuit with balance
- Gratitude for hidden blessings
- Patient persistence in growth`;
}

function buildUserContext(context: AIContext): string {
  const { user, recentReflections, lifeSystems, patterns } = context;

  let userContext = `- Transformation Phase: ${user.current_phase} (${getPhaseName(user.current_phase)})
- Days in wisdom journey: ${Math.floor((Date.now() - new Date(user.transformation_start_date).getTime()) / (1000 * 60 * 60 * 24))}`;

  if (recentReflections?.length) {
    userContext += `\n- Recent reflection depth: ${recentReflections[0].depth_level}/10`;
  }

  if (lifeSystems?.length) {
    const avgSatisfaction = lifeSystems.reduce(
      (acc, system) => acc + system.current_state.satisfaction_level,
      0
    ) / lifeSystems.length;
    userContext += `\n- Life systems average satisfaction: ${avgSatisfaction.toFixed(1)}/10`;
  }

  if (patterns?.length) {
    userContext += `\n- Wisdom patterns identified: ${patterns.length}`;
  }

  return userContext;
}

function buildUserDataSummary(context: AIContext): string {
  const { user, recentReflections, lifeSystems, patterns } = context;

  let summary = `User Profile:
- Current Phase: ${getPhaseName(user.current_phase)}
- Wisdom Journey Start: ${user.transformation_start_date}`;

  if (recentReflections?.length) {
    summary += `\n\nRecent Wisdom Reflections:`;
    recentReflections.slice(0, 3).forEach(reflection => {
      summary += `\n- ${reflection.date}: Depth ${reflection.depth_level}/10`;
      if (reflection.responses.length > 0) {
        summary += `\n  Key insight: "${reflection.responses[0].response.substring(0, 100)}..."`;
      }
    });
  }

  if (lifeSystems?.length) {
    summary += `\n\nLife Systems Wisdom Status:`;
    lifeSystems.forEach(system => {
      summary += `\n- ${system.system_type}: ${system.current_state.satisfaction_level}/10`;
    });
  }

  if (patterns?.length) {
    summary += `\n\nWisdom Patterns Identified:`;
    patterns.slice(0, 3).forEach(pattern => {
      summary += `\n- ${pattern.pattern_type}: ${pattern.description}`;
    });
  }

  return summary;
}

function getPhaseName(phase: TransformationPhase): string {
  const phaseNames: Record<TransformationPhase, string> = {
    1: 'Awareness - Building Consciousness',
    2: 'Understanding - Developing Deep Insight', 
    3: 'Transformation - Creating Positive Change',
    4: 'Integration - Embodying New Ways',
    5: 'Mastery - Living Wisdom Daily',
    6: 'Flow - Effortless Integration',
    7: 'Legacy - Wisdom in Service',
  };
  return phaseNames[phase] || 'Wisdom Journey';
}

// Helper function to determine phase stage for prompts
function getPhaseStage(phase: number): string {
  if (phase <= 2) return 'awareness';
  if (phase <= 4) return 'understanding';
  if (phase <= 6) return 'transformation';
  return 'integration';
}

// Advanced analysis implementations - updated with wisdom focus
async function generateFollowUpQuestions(content: string, context: AIContext): Promise<string[]> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'Generate 3 sophisticated wisdom-guided follow-up questions that deepen reflection. Focus on uncovering assumptions, making connections, and revealing alternative perspectives through compassionate inquiry.',
    },
    {
      role: 'user',
      content: `Based on this wisdom question/response: "${content}" and user phase ${context.user.current_phase}, generate 3 follow-up questions that guide deeper self-discovery.`,
    },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 200,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content || '';
    return response.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return [
      'What deeper truth might be hidden beneath this insight?',
      'How does this wisdom connect to other areas of your life?',
      'What would change if you fully embodied this understanding?',
    ];
  }
}

async function extractStructuredInsights(content: string, analysisType: AnalysisType): Promise<any> {
  const extractionPrompt = `Extract structured wisdom insights from this analysis response:

"${content}"

Return in this format:
PATTERNS: [list wisdom patterns identified]
LEVERAGE: [list high-impact leverage points]
CONNECTIONS: [list system connections and relationships]`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Extract structured wisdom insights from life systems analysis. Be concise and focus on transformational insights.',
        },
        { role: 'user', content: extractionPrompt },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Parse the structured response
    const patterns = extractBetweenMarkers(response, 'PATTERNS:', 'LEVERAGE:') || [];
    const leveragePoints = extractBetweenMarkers(response, 'LEVERAGE:', 'CONNECTIONS:') || [];
    const systemConnections = extractBetweenMarkers(response, 'CONNECTIONS:', '') || [];

    return {
      patterns_identified: patterns,
      leverage_points: leveragePoints,
      system_connections: systemConnections,
    };
  } catch (error) {
    console.error('Error extracting structured insights:', error);
    return {
      patterns_identified: [],
      leverage_points: [],
      system_connections: [],
    };
  }
}

async function extractLeveragePoints(content: string): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Extract specific wisdom-based leverage points from this analysis. Return as a simple list, one per line.',
        },
        {
          role: 'user',
          content: `Extract the key wisdom leverage points from: "${content}"`,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content || '';
    return response.split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .slice(0, 5);
  } catch (error) {
    console.error('Error extracting leverage points:', error);
    return [];
  }
}

async function extractPatterns(content: string): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Extract wisdom patterns, behavioral cycles, and transformational themes from this analysis. Return as a simple list, one per line.',
        },
        {
          role: 'user',
          content: `Extract the key wisdom patterns from: "${content}"`,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content || '';
    return response.split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .slice(0, 5);
  } catch (error) {
    console.error('Error extracting patterns:', error);
    return [];
  }
}

// Helper function to parse structured text
function extractBetweenMarkers(text: string, startMarker: string, endMarker: string): string[] {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return [];
  
  const contentStart = startIndex + startMarker.length;
  const endIndex = endMarker ? text.indexOf(endMarker, contentStart) : text.length;
  const content = text.substring(contentStart, endIndex === -1 ? text.length : endIndex);
  
  return content.split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(line => line.length > 0)
    .slice(0, 5);
}

export default aiOrchestrator;