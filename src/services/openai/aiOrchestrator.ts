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
  };
}

export const aiOrchestrator = {
  // Main Socratic questioning system
  generateSocraticQuestion: async (
    context: AIContext,
    userResponse?: string
  ): Promise<AIResponse> => {
    const systemPrompt = buildSystemPrompt('socratic_questioner', context);
    
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

    // Add current user response if provided
    if (userResponse) {
      messages.push({ role: 'user', content: userResponse });
    } else {
      // Generate opening question based on phase
      const phaseContext = `Generate an opening Socratic question for someone in ${getPhaseName(context.user.current_phase)}. Consider their current life patterns and transformation readiness.`;
      messages.push({ role: 'user', content: phaseContext });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 300,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content || '';

    return {
      content,
      metadata: {
        ai_system_used: 'socratic_questioner',
        confidence_level: 0.85,
        suggested_follow_ups: await generateFollowUpQuestions(content, context),
      },
    };
  },

  // Life systems analysis and mapping
  analyzeLifeSystems: async (
    context: AIContext,
    analysisType: AnalysisType
  ): Promise<AIResponse> => {
    const systemPrompt = buildSystemPrompt('life_architecture_mapper', context);
    const analysisPrompt = ANALYSIS_PROMPTS[analysisType];

    const userDataSummary = buildUserDataSummary(context);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: `${systemPrompt}\n\n${analysisPrompt}` },
      {
        role: 'user',
        content: `Analyze this user's life systems:\n\n${userDataSummary}`,
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
        ai_system_used: 'life_architecture_mapper',
        confidence_level: 0.9,
        suggested_follow_ups: [],
        ...insights,
      },
    };
  },

  // Root cause and leverage analysis
  identifyLeveragePoints: async (context: AIContext): Promise<AIResponse> => {
    const systemPrompt = buildSystemPrompt('leverage_analyzer', context);
    const userDataSummary = buildUserDataSummary(context);

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Identify the highest-leverage intervention points for this user:\n\n${userDataSummary}\n\nFocus on changes that would solve multiple problems simultaneously and create cascading positive effects.`,
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
        ai_system_used: 'leverage_analyzer',
        confidence_level: 0.88,
        suggested_follow_ups: [],
        leverage_points: leveragePoints,
      },
    };
  },

  // Life design guidance and architecture
  generateLifeDesign: async (
    context: AIContext,
    lifeArea: LifeSystemType,
    specificChallenge?: string
  ): Promise<AIResponse> => {
    const systemPrompt = buildSystemPrompt('life_design_guide', context);
    const lifeSystemPrompt = LIFE_SYSTEM_PROMPTS[lifeArea];

    const challenge = specificChallenge || `Design a comprehensive system for their ${lifeArea} life area`;

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
        ai_system_used: 'life_design_guide',
        confidence_level: 0.87,
        suggested_follow_ups: [
          'How would you implement this system in your current environment?',
          'What would be the first small step to test this approach?',
          'What obstacles might prevent this from working, and how would you design around them?',
        ],
      },
    };
  },

  // Pattern recognition and analysis
  recognizePatterns: async (
    context: AIContext,
    focusArea?: string
  ): Promise<AIResponse> => {
    const systemPrompt = buildSystemPrompt('pattern_recognizer', context);
    const userDataSummary = buildUserDataSummary(context);

    const focus = focusArea || 'all life areas';

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Identify hidden patterns in this user's responses and life systems, focusing on ${focus}:\n\n${userDataSummary}`,
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
        ai_system_used: 'pattern_recognizer',
        confidence_level: 0.82,
        suggested_follow_ups: [],
        patterns_identified: patterns,
      },
    };
  },
};

// Helper functions
function buildSystemPrompt(aiSystem: string, context: AIContext): string {
  const phasePrompt = PHASE_PROMPTS[context.user.current_phase];
  const userContext = buildUserContext(context);

  return `${MASTER_SYSTEM_PROMPT}

${phasePrompt}

## Current User Context
${userContext}

## Instructions
You are currently operating as the ${aiSystem.replace('_', ' ').toUpperCase()} system. Focus on this specific role while maintaining awareness of the user's complete transformation journey.`;
}

function buildUserContext(context: AIContext): string {
  const { user, recentReflections, lifeSystems, patterns } = context;

  let userContext = `- Transformation Phase: ${user.current_phase} (${getPhaseName(user.current_phase)})
- Days in transformation: ${Math.floor((Date.now() - new Date(user.transformation_start_date).getTime()) / (1000 * 60 * 60 * 24))}`;

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
    userContext += `\n- Identified patterns: ${patterns.length}`;
  }

  return userContext;
}

function buildUserDataSummary(context: AIContext): string {
  const { user, recentReflections, lifeSystems, patterns } = context;

  let summary = `User Profile:
- Current Phase: ${getPhaseName(user.current_phase)}
- Transformation Start: ${user.transformation_start_date}`;

  if (recentReflections?.length) {
    summary += `\n\nRecent Reflections:`;
    recentReflections.slice(0, 3).forEach(reflection => {
      summary += `\n- ${reflection.date}: Depth ${reflection.depth_level}/10`;
      if (reflection.responses.length > 0) {
        summary += `\n  Key response: "${reflection.responses[0].response.substring(0, 100)}..."`;
      }
    });
  }

  if (lifeSystems?.length) {
    summary += `\n\nLife Systems Status:`;
    lifeSystems.forEach(system => {
      summary += `\n- ${system.system_type}: ${system.current_state.satisfaction_level}/10`;
    });
  }

  if (patterns?.length) {
    summary += `\n\nIdentified Patterns:`;
    patterns.slice(0, 3).forEach(pattern => {
      summary += `\n- ${pattern.pattern_type}: ${pattern.description}`;
    });
  }

  return summary;
}

function getPhaseName(phase: TransformationPhase): string {
  const phaseNames = {
    1: 'Recognition - The Two Types of People',
    2: 'Understanding - The Leverage Principle',
    3: 'Realization - The Meta-Life Loop',
    4: 'Transformation - Infinite Leverage',
    5: 'Vision - The Life You\'re Capable Of',
    6: 'Reality - The Architected Life',
    7: 'Integration - The Complete Transformation',
  };
  return phaseNames[phase];
}

// Advanced analysis implementations
async function generateFollowUpQuestions(content: string, context: AIContext): Promise<string[]> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'Generate 3 sophisticated follow-up questions that deepen the Socratic dialogue. Focus on assumptions, connections, and alternative perspectives.',
    },
    {
      role: 'user',
      content: `Based on this question/response: "${content}" and user phase ${context.user.current_phase}, generate 3 follow-up questions.`,
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
      'What assumptions might you be making here?',
      'How does this connect to other areas of your life?',
      'What would change if you approached this differently?',
    ];
  }
}

async function extractStructuredInsights(content: string, analysisType: AnalysisType): Promise<any> {
  const extractionPrompt = `Extract structured insights from this analysis response:

"${content}"

Return in this format:
PATTERNS: [list patterns identified]
LEVERAGE: [list leverage points]
CONNECTIONS: [list system connections]`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Extract structured insights from life systems analysis. Be concise and specific.',
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
          content: 'Extract specific leverage points from this analysis. Return as a simple list, one per line.',
        },
        {
          role: 'user',
          content: `Extract the key leverage points from: "${content}"`,
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
          content: 'Extract behavioral, cognitive, and life patterns from this analysis. Return as a simple list, one per line.',
        },
        {
          role: 'user',
          content: `Extract the key patterns from: "${content}"`,
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