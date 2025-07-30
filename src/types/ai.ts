// Standardized AI Types for Life Systems Architect
// This file consolidates all AI-related types across the application

import { TransformationPhase, LifeSystemType, AnalysisType, User, DailyReflection, Pattern, LifeSystem } from './database';

// Base AI Interfaces
export interface AIContext {
  user: User;
  currentPhase?: TransformationPhase;
  recentReflections?: DailyReflection[];
  lifeSystems?: LifeSystem[];
  patterns?: Pattern[];
  conversationHistory?: ConversationMessage[];
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Standardized AI Response Structure
export interface AIResponse {
  content: string;
  metadata: AIResponseMetadata;
  reasoning?: string;
  alternatives?: string[];
}

export interface AIResponseMetadata {
  ai_system_used: AISystemType;
  confidence_level: number;
  processing_time_ms?: number;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  suggested_follow_ups: string[];
  patterns_identified?: string[];
  leverage_points?: string[];
  system_connections?: string[];
  wisdom_insights?: WisdomInsights;
  breakthrough_detected?: boolean;
  depth_score?: number;
  emotional_resonance?: number;
  quality_score?: number;
}

// AI System Types
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
  | 'transformation_tracker'
  | 'ensemble_synthesized'
  | 'wisdom_reflection_analyzer'
  | 'wisdom_life_designer'
  | 'wisdom_pattern_recognizer'
  | 'wisdom_leverage_analyzer';

// Contemplative and Emotional States
export type ContemplativeState = 
  | 'resistant' 
  | 'curious' 
  | 'ready' 
  | 'overwhelmed' 
  | 'breakthrough'
  | 'reflective'
  | 'energized'
  | 'blocked';

export type EmotionalResonance = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'breakthrough';

// AI Interaction Styles
export type InteractionStyle = 
  | 'gentle'
  | 'direct'
  | 'challenging'
  | 'supportive'
  | 'architectural'
  | 'socratic'
  | 'coaching'
  | 'exploratory';

export type TimingStrategy = 
  | 'immediate'
  | 'progressive'
  | 'delayed'
  | 'conditional'
  | 'adaptive';

// Wisdom-Specific Types
export interface WisdomInsights {
  depth_awareness?: number; // 0-1 scale
  pattern_recognition?: number;
  self_accountability?: number;
  systems_thinking?: number;
  emotional_intelligence?: number;
  action_readiness?: number;
  breakthrough_potential?: number;
  wisdom_integration?: number;
}

export interface WisdomGuidance {
  primary_wisdom_principle: string;
  supporting_principles: string[];
  practical_applications: string[];
  reflection_prompts: string[];
  integration_suggestions: string[];
}

// AI Routing and Decision Making
export interface AIRoutingDecision {
  primary_system: AISystemType;
  supporting_systems: AISystemType[];
  interaction_style: InteractionStyle;
  depth_level: number; // 1-10
  timing_strategy: TimingStrategy;
  confidence: number; // 0-1
  reasoning: string;
  expected_outcomes: string[];
  fallback_systems?: AISystemType[];
}

export interface AIRoutingContext {
  user_state: {
    current_phase: TransformationPhase;
    phase_progress: number; // 0-1
    days_in_transformation: number;
    engagement_level: number; // 0-10
    recent_breakthrough: boolean;
    contemplative_state: ContemplativeState;
    emotional_state?: string;
    energy_level: 'low' | 'medium' | 'high';
  };
  conversation_context: {
    session_depth: number;
    focus_area: string;
    user_intention: 'exploration' | 'understanding' | 'transformation' | 'integration';
    previous_responses: string[];
    response_quality_trend: number;
  };
  patterns_context: {
    identified_patterns: string[];
    pattern_strength: number; // 0-1
    breakthrough_triggers: string[];
    resistance_patterns: string[];
    effective_approaches: string[];
  };
}

// Specialized Request Types
export interface QuestionGenerationRequest {
  context: AIContext;
  question_type: 'opening' | 'follow_up' | 'breakthrough' | 'integration' | 'challenge';
  depth_level?: number;
  focus_area?: LifeSystemType;
  build_on_response?: string;
  scientific_method?: 'cbt' | 'motivational_interviewing' | 'stoic' | 'five_why' | 'narrative';
}

export interface ReflectionAnalysisRequest {
  context: AIContext;
  user_response: string;
  question_context: {
    question: string;
    category: string;
    depth_level: number;
    scientific_method?: string;
  };
  evaluation_criteria: Record<string, string>;
  analysis_depth: 'surface' | 'moderate' | 'deep' | 'breakthrough';
}

export interface PatternAnalysisRequest {
  context: AIContext;
  focus_area?: LifeSystemType | 'all';
  analysis_type: 'behavioral' | 'cognitive' | 'emotional' | 'systemic' | 'comprehensive';
  time_frame?: 'recent' | 'medium_term' | 'long_term' | 'all';
  pattern_sensitivity: number; // 0-1, how subtle patterns to detect
}

export interface LifeDesignRequest {
  context: AIContext;
  life_area: LifeSystemType;
  design_type: 'current_analysis' | 'future_vision' | 'transition_plan' | 'system_architecture';
  specific_challenge?: string;
  constraints?: string[];
  success_metrics?: string[];
}

// Response Validation and Quality
export interface ResponseValidation {
  is_valid: boolean;
  quality_score: number; // 0-1
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'length' | 'clarity' | 'relevance' | 'depth' | 'appropriateness' | 'safety';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion?: string;
}

export interface ValidationCriteria {
  phase_appropriateness: number; // 0-10
  emotional_sensitivity: number; // 0-10
  systems_thinking_level: number; // 0-10
  actionability: number; // 0-10
  breakthrough_potential: number; // 0-10
  wisdom_depth: number; // 0-10
  practical_value: number; // 0-10
}

// Ensemble Decision Making
export interface EnsembleDecision {
  final_response: AIResponse;
  confidence_metrics: ConfidenceMetrics;
  decision_process: DecisionProcess;
  alternative_options: AIResponse[];
  recommendation_strength: 'strong' | 'moderate' | 'weak' | 'requires_user_input';
  consensus_level: number; // 0-1
}

export interface ConfidenceMetrics {
  overall_confidence: number; // 0-1
  ai_system_agreement: number; // 0-1
  response_coherence: number; // 0-1
  contextual_relevance: number; // 0-1
  user_phase_alignment: number; // 0-1
  wisdom_authenticity: number; // 0-1
}

export interface DecisionProcess {
  systems_consulted: AISystemType[];
  consensus_achieved: boolean;
  conflicting_viewpoints: string[];
  resolution_method: 'consensus' | 'weighted_vote' | 'expert_override' | 'user_choice' | 'synthesis';
  decision_factors: string[];
  alternative_paths: string[];
}

// Performance and Analytics
export interface AIPerformanceMetrics {
  response_time_ms: number;
  token_efficiency: number; // output quality / tokens used
  user_satisfaction: number; // 0-1 if available
  breakthrough_rate: number; // breakthroughs / total interactions
  depth_progression: number; // average depth increase over time
  pattern_recognition_accuracy: number; // 0-1
  wisdom_integration_score: number; // 0-1
}

export interface AISystemEffectiveness {
  system_type: AISystemType;
  usage_count: number;
  average_confidence: number;
  user_feedback_score: number; // 0-1
  breakthrough_contribution: number; // 0-1
  optimal_contexts: string[];
  improvement_areas: string[];
}

// Configuration and Customization
export interface AIServiceConfiguration {
  model: string;
  temperature: number;
  max_tokens: number;
  timeout_ms: number;
  retry_attempts: number;
  cache_enabled: boolean;
  debug_mode: boolean;
  quality_threshold: number; // 0-1, minimum acceptable quality
  wisdom_emphasis: number; // 0-1, how much to emphasize wisdom principles
  personalization_level: number; // 0-1, how much to personalize responses
}

export interface UserAIPreferences {
  user_id: string;
  preferred_systems: AISystemType[];
  effective_styles: InteractionStyle[];
  optimal_depth_range: [number, number]; // [min, max] depth levels
  breakthrough_triggers: string[];
  resistance_patterns: string[];
  response_length_preference: 'concise' | 'moderate' | 'detailed';
  interaction_pace: 'slow' | 'moderate' | 'fast';
  challenge_tolerance: number; // 0-1
  support_needs: number; // 0-1
}

// Error and Exception Types
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class AIValidationError extends AIServiceError {
  constructor(message: string, public validation_issues: ValidationIssue[]) {
    super(message, 'VALIDATION_ERROR', { validation_issues }, false);
    this.name = 'AIValidationError';
  }
}

export class AIRateLimitError extends AIServiceError {
  constructor(message: string, public retry_after_ms: number) {
    super(message, 'RATE_LIMIT_ERROR', { retry_after_ms }, true);
    this.name = 'AIRateLimitError';
  }
}

export class AIModelError extends AIServiceError {
  constructor(message: string, public model_error: any) {
    super(message, 'MODEL_ERROR', { model_error }, true);
    this.name = 'AIModelError';
  }
}

// Utility Types
export type AIResult<T> = {
  success: true;
  data: T;
  metadata?: AIResponseMetadata;
} | {
  success: false;
  error: AIServiceError;
  partial_data?: Partial<T>;
};

export interface AIBatchRequest<T> {
  requests: T[];
  batch_id: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  max_parallel: number;
  fail_fast: boolean;
}

export interface AIBatchResponse<T> {
  batch_id: string;
  results: AIResult<T>[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    processing_time_ms: number;
  };
}

// Factory and Service Types
export type AIRequestType = 
  | 'wisdom_question'
  | 'reflection_analysis'
  | 'life_systems_analysis'
  | 'pattern_recognition'
  | 'leverage_analysis'
  | 'life_design'
  | 'custom_query'
  | 'batch_processing';

export interface AIServiceFactory {
  createService(config?: Partial<AIServiceConfiguration>): AIService;
  getService(name: string): AIService | null;
  registerService(name: string, service: AIService): void;
  healthCheck(): Promise<ServiceHealthStatus>;
}

export interface AIService {
  processRequest(request: any): Promise<AIResponse>;
  validateResponse(response: AIResponse): Promise<ResponseValidation>;
  getCapabilities(): string[];
  isHealthy(): Promise<boolean>;
}

export interface ServiceHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      response_time_ms?: number;
      error_rate?: number;
      last_error?: string;
    };
  };
  overall_metrics: {
    average_response_time: number;
    success_rate: number;
    cache_hit_rate: number;
  };
}

// Service Result and Metrics (moved from base service for better organization)
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  metadata?: {
    execution_time_ms: number;
    cache_hit: boolean;
    retry_count: number;
    timestamp: string;
  };
}

export interface ServiceMetrics {
  calls_total: number;
  calls_successful: number;
  calls_failed: number;
  average_response_time_ms: number;
  last_error?: string;
  last_success_at?: string;
  last_failure_at?: string;
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public service: string,
    public retryable: boolean = false,
    public context?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Re-export commonly used database types for convenience
export type { 
  TransformationPhase, 
  LifeSystemType, 
  AnalysisType,
  User,
  DailyReflection,
  Pattern,
  LifeSystem 
} from './database';