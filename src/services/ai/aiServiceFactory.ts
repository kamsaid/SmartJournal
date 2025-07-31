import UnifiedAIService, { 
  unifiedAIService, 
  AIContext, 
  AIResponse, 
  AIServiceConfig,
  AISystemType,
  ContemplativeState
} from './unifiedAIService';
import { TransformationPhase, LifeSystemType, AnalysisType } from '@/types/database';

// Service factory configuration
export interface AIFactoryConfig {
  default_model?: string;
  default_temperature?: number;
  max_retries?: number;
  timeout?: number;
  cache_responses?: boolean;
  debug_mode?: boolean;
}

// Service request types
export type AIServiceRequest = 
  | { type: 'wisdom_question'; context: AIContext; userResponse?: string }
  | { type: 'reflection_analysis'; context: AIContext; params: ReflectionAnalysisParams }
  | { type: 'life_systems_analysis'; context: AIContext; analysisType: AnalysisType }
  | { type: 'pattern_recognition'; context: AIContext; focusArea?: string }
  | { type: 'leverage_analysis'; context: AIContext }
  | { type: 'life_design'; context: AIContext; lifeArea: LifeSystemType; challenge?: string }
  | { type: 'custom_query'; context: AIContext; query: string; options?: CustomQueryOptions };

export interface ReflectionAnalysisParams {
  response: string;
  questionContext: any;
  evaluationCriteria: Record<string, string>;
}

export interface CustomQueryOptions {
  system?: AISystemType;
  depth_level?: number;
  style?: string;
  max_tokens?: number;
  temperature?: number;
}

// Response caching interface
interface CacheEntry {
  request_hash: string;
  response: AIResponse;
  timestamp: number;
  expiry: number;
}

class AIServiceFactory {
  private service: UnifiedAIService;
  private config: AIFactoryConfig;
  private responseCache: Map<string, CacheEntry> = new Map();
  private retryDelays = [1000, 2000, 4000]; // Exponential backoff

  constructor(config: AIFactoryConfig = {}) {
    this.config = {
      default_model: 'gpt-4-turbo-preview',
      default_temperature: 0.7,
      max_retries: 3,
      timeout: 30000,
      cache_responses: true,
      debug_mode: false,
      ...config,
    };

    this.service = new UnifiedAIService({
      model: this.config.default_model!,
      temperature: this.config.default_temperature!,
      timeout: this.config.timeout,
    });
  }

  // Main factory method - handles all AI service requests
  async processRequest(request: AIServiceRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      if (this.config.cache_responses) {
        const cached = this.getCachedResponse(request);
        if (cached) {
          this.debugLog('Cache hit', { request_type: request.type });
          return cached;
        }
      }

      // Process request with retries
      const response = await this.executeWithRetry(request);
      
      // Cache successful response
      if (this.config.cache_responses && response) {
        this.cacheResponse(request, response);
      }

      const duration = Date.now() - startTime;
      this.debugLog('Request completed', { 
        request_type: request.type, 
        duration_ms: duration,
        ai_system: response.metadata.ai_system_used 
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.debugLog('Request failed', { 
        request_type: request.type, 
        duration_ms: duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Specialized convenience methods
  async generateWisdomQuestion(context: AIContext, userResponse?: string): Promise<AIResponse> {
    return this.processRequest({ type: 'wisdom_question', context, userResponse });
  }

  async analyzeReflection(
    context: AIContext, 
    params: ReflectionAnalysisParams
  ): Promise<AIResponse> {
    return this.processRequest({ type: 'reflection_analysis', context, params });
  }

  async analyzeLifeSystems(
    context: AIContext, 
    analysisType: AnalysisType
  ): Promise<AIResponse> {
    return this.processRequest({ type: 'life_systems_analysis', context, analysisType });
  }

  async recognizePatterns(context: AIContext, focusArea?: string): Promise<AIResponse> {
    return this.processRequest({ type: 'pattern_recognition', context, focusArea });
  }

  async identifyLeveragePoints(context: AIContext): Promise<AIResponse> {
    return this.processRequest({ type: 'leverage_analysis', context });
  }

  async generateLifeDesign(
    context: AIContext, 
    lifeArea: LifeSystemType, 
    challenge?: string
  ): Promise<AIResponse> {
    return this.processRequest({ type: 'life_design', context, lifeArea, challenge });
  }

  async executeCustomQuery(
    context: AIContext,
    query: string,
    options?: CustomQueryOptions
  ): Promise<AIResponse> {
    return this.processRequest({ type: 'custom_query', context, query, options });
  }

  // Batch processing for multiple requests
  async processBatch(requests: AIServiceRequest[]): Promise<AIResponse[]> {
    const promises = requests.map(request => this.processRequest(request));
    return Promise.all(promises);
  }

  // Health check and diagnostics
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    api_configured: boolean;
    cache_size: number;
    response_time_ms?: number;
  }> {
    const startTime = Date.now();
    
    try {
      const isConfigured = this.service.isConfigured();
      
      if (!isConfigured) {
        return {
          status: 'unhealthy',
          api_configured: false,
          cache_size: this.responseCache.size,
        };
      }

      // Test with minimal request
      const testContext: AIContext = {
        user: {
          id: 'test',
          email: 'test@test.com',
          current_phase: 1,
          transformation_start_date: new Date().toISOString(),
          life_systems_data: {
            health: { initialized: false },
            wealth: { initialized: false },
            relationships: { initialized: false },
            growth: { initialized: false },
            purpose: { initialized: false },
            environment: { initialized: false },
          },
          profile_data: {},
          consecutive_completions: 0,
          total_memories: 0,
          ai_readiness_score: 0.5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };

      await this.service.generateResponse(testContext, 'Health check', { type: 'question' });
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 5000 ? 'healthy' : 'degraded',
        api_configured: true,
        cache_size: this.responseCache.size,
        response_time_ms: responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        api_configured: this.service.isConfigured(),
        cache_size: this.responseCache.size,
      };
    }
  }

  // Configuration management
  updateConfig(newConfig: Partial<AIFactoryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Create new service instance if model or key config changed
    if (newConfig.default_model || newConfig.default_temperature) {
      this.service = new UnifiedAIService({
        model: this.config.default_model!,
        temperature: this.config.default_temperature!,
        timeout: this.config.timeout,
      });
    }
  }

  // Cache management
  clearCache(): void {
    this.responseCache.clear();
    this.debugLog('Cache cleared');
  }

  getCacheStats(): {
    size: number;
    hit_rate?: number;
    entries: { request_type: string; timestamp: number; expiry: number }[];
  } {
    const entries = Array.from(this.responseCache.values()).map(entry => ({
      request_type: entry.request_hash.split('_')[0],
      timestamp: entry.timestamp,
      expiry: entry.expiry,
    }));

    return {
      size: this.responseCache.size,
      entries,
    };
  }

  // Private methods
  private async executeWithRetry(request: AIServiceRequest): Promise<AIResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.max_retries!; attempt++) {
      try {
        if (attempt > 0) {
          await this.delay(this.retryDelays[Math.min(attempt - 1, this.retryDelays.length - 1)]);
          this.debugLog('Retrying request', { attempt, request_type: request.type });
        }

        return await this.executeRequest(request);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        this.debugLog('Request attempt failed', { 
          attempt, 
          request_type: request.type,
          error: lastError.message 
        });
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  private async executeRequest(request: AIServiceRequest): Promise<AIResponse> {
    switch (request.type) {
      case 'wisdom_question':
        return this.service.generateWisdomQuestion(request.context, request.userResponse);
      
      case 'reflection_analysis':
        return this.service.analyzeReflection(request.context, request.params);
      
      case 'life_systems_analysis':
        return this.service.analyzeLifeSystems(request.context, request.analysisType);
      
      case 'pattern_recognition':
        return this.service.recognizePatterns(request.context, request.focusArea);
      
      case 'leverage_analysis':
        return this.service.identifyLeveragePoints(request.context);
      
      case 'life_design':
        return this.service.generateLifeDesign(request.context, request.lifeArea, request.challenge);
      
      case 'custom_query':
        return this.service.generateResponse(request.context, request.query, {
          type: 'question',
          system: request.options?.system,
          depth_level: request.options?.depth_level,
          style: request.options?.style,
        });
      
      default:
        throw new Error(`Unknown request type: ${(request as any).type}`);
    }
  }

  private getCachedResponse(request: AIServiceRequest): AIResponse | null {
    const hash = this.generateRequestHash(request);
    const cached = this.responseCache.get(hash);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.response;
    }
    
    if (cached) {
      this.responseCache.delete(hash); // Remove expired entry
    }
    
    return null;
  }

  private cacheResponse(request: AIServiceRequest, response: AIResponse): void {
    const hash = this.generateRequestHash(request);
    const ttl = this.getCacheTTL(request.type);
    
    this.responseCache.set(hash, {
      request_hash: hash,
      response,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    });

    // Clean up old entries periodically
    if (this.responseCache.size > 1000) {
      this.cleanupExpiredEntries();
    }
  }

  private generateRequestHash(request: AIServiceRequest): string {
    // Create a simple hash of the request for caching
    const key = `${request.type}_${JSON.stringify(request).slice(0, 200)}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  }

  private getCacheTTL(requestType: string): number {
    const ttlMap = {
      wisdom_question: 5 * 60 * 1000, // 5 minutes
      reflection_analysis: 30 * 60 * 1000, // 30 minutes
      life_systems_analysis: 60 * 60 * 1000, // 1 hour
      pattern_recognition: 60 * 60 * 1000, // 1 hour
      leverage_analysis: 60 * 60 * 1000, // 1 hour
      life_design: 30 * 60 * 1000, // 30 minutes
      custom_query: 5 * 60 * 1000, // 5 minutes
    };
    
    return ttlMap[requestType as keyof typeof ttlMap] || 5 * 60 * 1000;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.responseCache.entries()) {
      if (now >= entry.expiry) {
        this.responseCache.delete(key);
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private debugLog(message: string, data?: any): void {
    if (this.config.debug_mode) {
      console.log(`[AIServiceFactory] ${message}`, data || '');
    }
  }
}

// Export singleton factory instance
export const aiServiceFactory = new AIServiceFactory({
  cache_responses: true,
  debug_mode: process.env.NODE_ENV === 'development',
});

// Export factory class for custom instances
export default AIServiceFactory;

// Legacy compatibility exports
export const aiOrchestrator = {
  generateWisdomGuidedQuestion: (context: AIContext, prompt: string) =>
    aiServiceFactory.generateWisdomQuestion(context, prompt),
  generateSocraticQuestion: (context: AIContext, userResponse?: string) =>
    aiServiceFactory.generateWisdomQuestion(context, userResponse),
  analyzeReflection: (context: AIContext, params: ReflectionAnalysisParams) =>
    aiServiceFactory.analyzeReflection(context, params),
  analyzeLifeSystems: (context: AIContext, analysisType: AnalysisType) =>
    aiServiceFactory.analyzeLifeSystems(context, analysisType),
  identifyLeveragePoints: (context: AIContext) =>
    aiServiceFactory.identifyLeveragePoints(context),
  generateLifeDesign: (context: AIContext, lifeArea: LifeSystemType, challenge?: string) =>
    aiServiceFactory.generateLifeDesign(context, lifeArea, challenge),
  recognizePatterns: (context: AIContext, focusArea?: string) =>
    aiServiceFactory.recognizePatterns(context, focusArea),
};

// Utility exports
export const aiUtils = {
  isConfigured: () => unifiedAIService.isConfigured(),
  validateResponse: (response: string) => unifiedAIService.validateResponse(response),
  calculateDepthScore: (response: string) => unifiedAIService.calculateDepthScore(response),
};

export const aiPatterns = {
  buildContextPrompt: (basePrompt: string, userContext: any): string => {
    return `${basePrompt}\n\nUser Context: ${JSON.stringify(userContext, null, 2)}`;
  },
  formatResponse: (response: string): string => {
    return response
      .trim()
      .replace(/\n\n+/g, '\n\n')
      .replace(/^["']|["']$/g, '');
  },
  extractInsights: (response: string): string[] => {
    const insightPatterns = [
      /(?:insight|realize|understand|recognize|see that):\s*([^.!?]+)/gi,
      /(?:key|important|crucial|vital):\s*([^.!?]+)/gi,
      /(?:pattern|trend|theme):\s*([^.!?]+)/gi,
    ];

    const insights: string[] = [];
    insightPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        insights.push(...matches.map(match => match.trim()));
      }
    });

    return insights.filter(insight => insight.length > 20);
  },

  // Get service metrics
  getMetrics: () => {
    return {
      service: 'AIServiceFactory',
      cache_size: aiServiceFactory.response_cache.size,
      cache_hits: 0, // Would need to track this
      cache_misses: 0, // Would need to track this
      total_requests: 0, // Would need to track this
      average_response_time: 0, // Would need to track this
      status: 'operational'
    };
  },
};