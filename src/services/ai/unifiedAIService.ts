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

// Unified interfaces and types
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

export interface AIServiceConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  timeout?: number;
}

export type AISystemType = 
  | 'wisdom_guide'
  | 'pattern_recognizer'
  | 'accountability_guide'
  | 'excellence_coach'
  | 'balance_keeper'
  | 'gratitude_cultivator'
  | 'patience_teacher'
  | 'wisdom_synthesizer'
  | 'life_architect'
  | 'transformation_tracker';

export type ContemplativeState = 'resistant' | 'curious' | 'ready' | 'overwhelmed' | 'breakthrough';

export interface AIRoutingDecision {
  primary_system: AISystemType;
  supporting_systems: AISystemType[];
  contemplation_style: 'gentle' | 'direct' | 'challenging' | 'supportive' | 'architectural';
  depth_level: number;
  timing_strategy: 'immediate' | 'progressive' | 'delayed' | 'conditional';
  confidence: number;
  reasoning: string;
}

// Default configuration
const DEFAULT_CONFIG: AIServiceConfig = {
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  max_tokens: 600,
  timeout: 30000,
};

class UnifiedAIService {
  private openai: OpenAI;
  private config: AIServiceConfig;

  constructor(customConfig?: Partial<AIServiceConfig>) {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
  }

  // Main unified AI interaction method
  async generateResponse(
    context: AIContext,
    userInput: string,
    options: {
      type: 'question' | 'analysis' | 'design' | 'pattern_recognition';
      system?: AISystemType;
      depth_level?: number;
      style?: string;
    }
  ): Promise<AIResponse> {
    // Route to optimal AI system
    const routing = await this.routeToOptimalSystem(context, userInput, options);
    
    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(routing.primary_system, context);
    
    // Prepare messages
    const messages = this.buildMessages(systemPrompt, userInput, context);
    
    // Generate response
    const completion = await this.openai.chat.completions.create({
      model: this.config.model,
      messages,
      max_tokens: this.config.max_tokens,
      temperature: this.config.temperature,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    // Generate follow-up questions
    const followUps = await this.generateFollowUpQuestions(content, context);
    
    return {
      content,
      metadata: {
        ai_system_used: routing.primary_system,
        confidence_level: routing.confidence,
        suggested_follow_ups: followUps,
      },
    };
  }

  // Wisdom-guided questioning (replaces socratic questioning)
  async generateWisdomQuestion(
    context: AIContext,
    userResponse?: string
  ): Promise<AIResponse> {
    const prompt = userResponse 
      ? `Based on this response: "${userResponse}", generate a deeper wisdom-guided question that helps uncover underlying patterns and assumptions.`
      : `Generate an opening wisdom-guided question for someone in ${this.getPhaseName(context.user.current_phase)}.`;

    return this.generateResponse(context, prompt, { type: 'question' });
  }

  // Reflection analysis with wisdom principles
  async analyzeReflection(
    context: AIContext,
    params: {
      response: string;
      questionContext: any;
      evaluationCriteria: Record<string, string>;
    }
  ): Promise<AIResponse> {
    const systemPrompt = `${MASTER_SYSTEM_PROMPT}

Analyze this user reflection through wisdom principles. Evaluate based on:
${Object.entries(params.evaluationCriteria)
  .map(([key, desc]) => `- ${key}: ${desc}`)
  .join('\n')}

Look for depth, patterns, accountability, readiness, and breakthrough moments.`;

    const userPrompt = `Question: "${params.questionContext.question}"
Category: ${params.questionContext.category}
Depth level: ${params.questionContext.depth_level}

User's reflection: "${params.response}"

Provide analysis in JSON format with patterns_identified, system_connections, wisdom_insights, breakthrough_detected, key_insights, and recommended_follow_up.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 600,
      response_format: { type: "json_object" }
    });

    const analysisResult = JSON.parse(completion.choices[0].message.content || '{}');

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
  }

  // Life systems analysis
  async analyzeLifeSystems(
    context: AIContext,
    analysisType: AnalysisType
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt('life_architect', context);
    const analysisPrompt = ANALYSIS_PROMPTS[analysisType];
    const userDataSummary = this.buildUserDataSummary(context);

    const completion = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: 'system', content: `${systemPrompt}\n\n${analysisPrompt}` },
        { role: 'user', content: `Analyze this user's life systems:\n\n${userDataSummary}` },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || '';
    const insights = await this.extractStructuredInsights(content, analysisType);

    return {
      content,
      metadata: {
        ai_system_used: 'life_architect',
        confidence_level: 0.9,
        suggested_follow_ups: [],
        ...insights,
      },
    };
  }

  // Pattern recognition
  async recognizePatterns(
    context: AIContext,
    focusArea?: string
  ): Promise<AIResponse> {
    return this.generateResponse(context, 
      `Identify patterns and cycles in this user's responses, focusing on ${focusArea || 'all life areas'}`,
      { type: 'pattern_recognition', system: 'pattern_recognizer' }
    );
  }

  // Leverage point identification
  async identifyLeveragePoints(context: AIContext): Promise<AIResponse> {
    return this.generateResponse(context,
      'Identify the highest-impact intervention points for this user that would create cascading positive effects',
      { type: 'analysis', system: 'life_architect' }
    );
  }

  // Life design guidance
  async generateLifeDesign(
    context: AIContext,
    lifeArea: LifeSystemType,
    specificChallenge?: string
  ): Promise<AIResponse> {
    const challenge = specificChallenge || `Design a system for their ${lifeArea} life area`;
    
    return this.generateResponse(context, challenge, { 
      type: 'design', 
      system: 'life_architect' 
    });
  }

  // Private helper methods
  private async routeToOptimalSystem(
    context: AIContext,
    userInput: string,
    options: any
  ): Promise<AIRoutingDecision> {
    const phase = context.user.current_phase;
    const contemplativeState = await this.detectContemplativeState(userInput);
    
    // Phase-based routing
    const phaseRouting = this.getPhaseSpecificRouting(phase, contemplativeState);
    
    // Override with specified system if provided
    if (options.system) {
      phaseRouting.primary_system = options.system;
    }

    return phaseRouting;
  }

  private async detectContemplativeState(userInput: string): Promise<ContemplativeState> {
    const indicators = {
      resistant: ['not sure', 'doubt', 'skeptical', 'won\'t work'],
      curious: ['interesting', 'tell me more', 'how', 'why', 'what if'],
      ready: ['let\'s do', 'ready', 'want to start', 'how do I'],
      overwhelmed: ['too much', 'confused', 'don\'t understand', 'complicated'],
      breakthrough: ['realize', 'understand now', 'makes sense', 'see the connection'],
    };

    const inputLower = userInput.toLowerCase();
    
    for (const [state, words] of Object.entries(indicators)) {
      if (words.some(word => inputLower.includes(word))) {
        return state as ContemplativeState;
      }
    }

    return 'curious';
  }

  private getPhaseSpecificRouting(
    phase: TransformationPhase,
    contemplativeState: ContemplativeState
  ): AIRoutingDecision {
    const phaseRouting = {
      1: { primary: 'wisdom_guide' as AISystemType, depth: 6 },
      2: { primary: 'accountability_guide' as AISystemType, depth: 7 },
      3: { primary: 'excellence_coach' as AISystemType, depth: 8 },
      4: { primary: 'wisdom_synthesizer' as AISystemType, depth: 9 },
      5: { primary: 'wisdom_synthesizer' as AISystemType, depth: 9 },
      6: { primary: 'life_architect' as AISystemType, depth: 10 },
      7: { primary: 'wisdom_synthesizer' as AISystemType, depth: 10 },
    };

    const routing = phaseRouting[phase] || phaseRouting[1];
    
    // Adjust for contemplative state
    let depthAdjustment = 0;
    let style: AIRoutingDecision['contemplation_style'] = 'supportive';

    switch (contemplativeState) {
      case 'resistant':
        depthAdjustment = -2;
        style = 'gentle';
        break;
      case 'ready':
        depthAdjustment = 2;
        style = 'direct';
        break;
      case 'overwhelmed':
        depthAdjustment = -3;
        style = 'gentle';
        break;
      case 'breakthrough':
        depthAdjustment = 3;
        style = 'challenging';
        break;
    }

    return {
      primary_system: routing.primary,
      supporting_systems: [],
      contemplation_style: style,
      depth_level: Math.max(1, Math.min(10, routing.depth + depthAdjustment)),
      timing_strategy: 'immediate',
      confidence: 0.8,
      reasoning: `Phase ${phase} routing adjusted for ${contemplativeState} state`,
    };
  }

  private buildSystemPrompt(system: AISystemType, context: AIContext): string {
    const phasePrompt = PHASE_PROMPTS[context.user.current_phase];
    const userContext = this.buildUserContext(context);

    return `${MASTER_SYSTEM_PROMPT}

${phasePrompt}

## Current User Context
${userContext}

## Instructions
You are operating as the ${system.replace('_', ' ').toUpperCase()} system. Focus on this specific role while maintaining awareness of the user's complete transformation journey.`;
  }

  private buildUserContext(context: AIContext): string {
    const { user, recentReflections, lifeSystems, patterns } = context;

    let userContext = `- Transformation Phase: ${user.current_phase} (${this.getPhaseName(user.current_phase)})
- Days in journey: ${Math.floor((Date.now() - new Date(user.transformation_start_date).getTime()) / (1000 * 60 * 60 * 24))}`;

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
      userContext += `\n- Patterns identified: ${patterns.length}`;
    }

    return userContext;
  }

  private buildUserDataSummary(context: AIContext): string {
    const { user, recentReflections, lifeSystems, patterns } = context;

    let summary = `User Profile:
- Current Phase: ${this.getPhaseName(user.current_phase)}
- Journey Start: ${user.transformation_start_date}`;

    if (recentReflections?.length) {
      summary += `\n\nRecent Reflections:`;
      recentReflections.slice(0, 3).forEach(reflection => {
        summary += `\n- ${reflection.date}: Depth ${reflection.depth_level}/10`;
        if (reflection.responses.length > 0) {
          summary += `\n  Key insight: "${reflection.responses[0].response.substring(0, 100)}..."`;
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
      summary += `\n\nPatterns Identified:`;
      patterns.slice(0, 3).forEach(pattern => {
        summary += `\n- ${pattern.pattern_type}: ${pattern.description}`;
      });
    }

    return summary;
  }

  private buildMessages(
    systemPrompt: string, 
    userInput: string, 
    context: AIContext
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
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

    // Add current input
    messages.push({ role: 'user', content: userInput });

    return messages;
  }

  private async generateFollowUpQuestions(content: string, context: AIContext): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Generate 3 sophisticated wisdom-guided follow-up questions that deepen reflection.',
          },
          {
            role: 'user',
            content: `Based on this response: "${content}" and user phase ${context.user.current_phase}, generate 3 follow-up questions.`,
          },
        ],
        max_tokens: 200,
        temperature: 0.8,
      });

      const response = completion.choices[0]?.message?.content || '';
      return response.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      return [
        'What deeper truth might be hidden beneath this insight?',
        'How does this connect to other areas of your life?',
        'What would change if you fully embodied this understanding?',
      ];
    }
  }

  private async extractStructuredInsights(content: string, analysisType: AnalysisType): Promise<any> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Extract structured insights from analysis. Be concise and focus on transformational insights.',
          },
          { role: 'user', content: `Extract patterns, leverage points, and system connections from: "${content}"` },
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      return {
        patterns_identified: this.extractListFromText(response, 'patterns'),
        leverage_points: this.extractListFromText(response, 'leverage'),
        system_connections: this.extractListFromText(response, 'connections'),
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

  private extractListFromText(text: string, type: string): string[] {
    const lines = text.split('\n');
    const relevant = lines.filter(line => 
      line.toLowerCase().includes(type) || 
      line.match(/^[-•*]\s+/)
    );
    
    return relevant
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 5);
  }

  private getPhaseName(phase: TransformationPhase): string {
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

  // Utility methods
  isConfigured(): boolean {
    return !!config.openai.apiKey;
  }

  validateResponse(response: string): boolean {
    return (
      response.length > 10 &&
      response.length < 2000 &&
      !response.toLowerCase().includes('i cannot') &&
      !response.toLowerCase().includes('as an ai')
    );
  }

  calculateDepthScore(response: string): number {
    const depthIndicators = [
      'why', 'what if', 'how might', 'pattern', 'system',
      'underneath', 'root cause', 'leverage', 'design',
      'architecture', 'belief', 'assumption'
    ];

    const score = depthIndicators.reduce((acc, indicator) => {
      const count = (response.toLowerCase().match(new RegExp(indicator, 'g')) || []).length;
      return acc + count;
    }, 0);

    return Math.min(score / 3, 10);
  }
}

// Export singleton instance
export const unifiedAIService = new UnifiedAIService();

// Export class for custom instances
export default UnifiedAIService;