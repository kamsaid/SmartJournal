// AI Services Barrel Export
// Clean interface for all AI-related services

// Import services first
import { unifiedAIService } from './unifiedAIService';
import { aiServiceFactory } from './aiServiceFactory';
import AIServiceFactory from './aiServiceFactory';

// Core AI Services
export { default as UnifiedAIService, unifiedAIService } from './unifiedAIService';
export { default as AIServiceFactory, aiServiceFactory } from './aiServiceFactory';

// Types and Interfaces
export type {
  AIContext,
  AIResponse,
  AIServiceConfig,
  AISystemType,
  ContemplativeState,
  AIRoutingDecision,
} from './unifiedAIService';

export type {
  AIFactoryConfig,
  AIServiceRequest,
  ReflectionAnalysisParams,
  CustomQueryOptions,
} from './aiServiceFactory';

// Legacy Compatibility Exports
export {
  aiOrchestrator,
  aiUtils,
  aiPatterns,
} from './aiServiceFactory';

// Re-export AI types for convenience
export type {
  AIContext as Context,
  AIResponse as Response,
  AISystemType as SystemType,
  ContemplativeState as State,
} from '@/types/ai';

// Services already imported above

// Utility functions
export const AIServiceUtils = {
  // Check if AI services are properly configured
  isConfigured: () => unifiedAIService.isConfigured(),
  
  // Validate AI response quality
  validateResponse: (response: string) => unifiedAIService.validateResponse(response),
  
  // Calculate depth score of response
  calculateDepthScore: (response: string) => unifiedAIService.calculateDepthScore(response),
  
  // Health check for AI services
  healthCheck: () => aiServiceFactory.healthCheck(),
  
  // Get AI service metrics
  getMetrics: () => aiServiceFactory.getMetrics(),
  
  // Clear AI service caches
  clearCaches: () => aiServiceFactory.clearCache(),
};

// AI Service Presets for common use cases
export const AIServicePresets = {
  // Wisdom questioning preset
  wisdomQuestioning: {
    type: 'wisdom_question' as const,
    config: {
      model: 'gpt-4-turbo-preview',
      temperature: 0.8,
      max_tokens: 250,
    },
  },
  
  // Reflection analysis preset
  reflectionAnalysis: {
    type: 'reflection_analysis' as const,
    config: {
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      max_tokens: 600,
    },
  },
  
  // Pattern recognition preset
  patternRecognition: {
    type: 'pattern_recognition' as const,
    config: {
      model: 'gpt-4',
      temperature: 0.8,
      max_tokens: 600,
    },
  },
  
  // Life design preset
  lifeDesign: {
    type: 'life_design' as const,
    config: {
      model: 'gpt-4',
      temperature: 0.75,
      max_tokens: 800,
    },
  },
};

// AIServiceFactory class already imported above

// Factory function for creating AI service instances with presets
export function createAIService(preset: keyof typeof AIServicePresets, customConfig?: any) {
  const presetConfig = AIServicePresets[preset];
  return new AIServiceFactory({
    default_model: presetConfig.config.model,
    default_temperature: presetConfig.config.temperature,
    ...customConfig,
  });
}

// Batch processing utility
export async function processBatchAIRequests(requests: any[]) {
  return aiServiceFactory.processBatch(requests);
}

// Default export for convenience
export default {
  unifiedAIService,
  aiServiceFactory,
  utils: AIServiceUtils,
  presets: AIServicePresets,
  createService: createAIService,
  processBatch: processBatchAIRequests,
};