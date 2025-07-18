// Core Life Systems Architect Database Types

export type TransformationPhase = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type LifeSystemType = 
  | 'health' 
  | 'wealth' 
  | 'relationships' 
  | 'growth' 
  | 'purpose' 
  | 'environment';

export type PatternType = 
  | 'behavioral' 
  | 'cognitive' 
  | 'emotional' 
  | 'systemic' 
  | 'relational';

export type AnalysisType = 
  | 'leverage_analysis' 
  | 'pattern_recognition' 
  | 'system_mapping' 
  | 'root_cause_analysis' 
  | 'architectural_design';

// Core User Journey Tracking
export interface User {
  id: string;
  email: string;
  current_phase: TransformationPhase;
  transformation_start_date: string;
  life_systems_data: Record<LifeSystemType, any>;
  profile_data: {
    name?: string;
    age?: number;
    timezone?: string;
    preferences?: Record<string, any>;
  };
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  user_id: string;
  phase_number: TransformationPhase;
  start_date: string;
  insights: string[];
  breakthroughs: string[];
  completion_status: 'not_started' | 'in_progress' | 'completed';
  completion_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyReflection {
  id: string;
  user_id: string;
  date: string;
  questions: {
    id: string;
    question: string;
    category: string;
    depth_level: number;
  }[];
  responses: {
    question_id: string;
    response: string;
    reflection_depth: number;
    emotional_resonance: number;
  }[];
  ai_analysis: {
    patterns_identified: string[];
    leverage_points: string[];
    system_connections: string[];
    next_questions: string[];
  };
  depth_level: number;
  created_at: string;
  updated_at: string;
}

// Life Systems Framework
export interface LifeSystem {
  id: string;
  user_id: string;
  system_type: LifeSystemType;
  current_state: {
    description: string;
    satisfaction_level: number;
    key_metrics: Record<string, any>;
    last_assessment: string;
  };
  target_state: {
    vision: string;
    specific_goals: string[];
    timeline: string;
    success_metrics: Record<string, any>;
  };
  interventions: {
    id: string;
    name: string;
    description: string;
    implementation_status: 'planned' | 'active' | 'completed' | 'paused';
    impact_rating: number;
    start_date?: string;
    completion_date?: string;
  }[];
  last_updated: string;
  created_at: string;
}

export interface Pattern {
  id: string;
  user_id: string;
  pattern_type: PatternType;
  description: string;
  first_identified: string;
  impact_areas: LifeSystemType[];
  transformation_potential: number;
  examples: string[];
  root_causes: string[];
  intervention_ideas: string[];
  status: 'identified' | 'being_addressed' | 'transformed' | 'monitoring';
  created_at: string;
  updated_at: string;
}

export interface LeveragePoint {
  id: string;
  user_id: string;
  intervention: string;
  potential_impact: number;
  implementation_status: 'identified' | 'planned' | 'in_progress' | 'completed';
  system_connections: LifeSystemType[];
  effort_required: number;
  timeline_estimate: string;
  dependencies: string[];
  risks: string[];
  success_indicators: string[];
  created_at: string;
  updated_at: string;
}

// AI Analysis and Insights
export interface SystemAnalysis {
  id: string;
  user_id: string;
  analysis_type: AnalysisType;
  insights: {
    key_findings: string[];
    hidden_patterns: string[];
    system_interconnections: string[];
    blind_spots: string[];
  };
  connections: {
    from_system: LifeSystemType;
    to_system: LifeSystemType;
    connection_type: string;
    strength: number;
    description: string;
  }[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
    expected_outcome: string;
    timeframe: string;
  }[];
  created_at: string;
}

export interface SocraticConversation {
  id: string;
  user_id: string;
  conversation_thread: {
    message_id: string;
    role: 'ai' | 'user';
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }[];
  depth_level: number;
  revelations: string[];
  follow_ups: string[];
  phase_progression_indicators: string[];
  created_at: string;
  updated_at: string;
}

export interface ArchitecturalDesign {
  id: string;
  user_id: string;
  life_area: LifeSystemType;
  current_design: {
    description: string;
    components: string[];
    effectiveness_rating: number;
    problem_areas: string[];
  };
  proposed_design: {
    vision: string;
    key_components: string[];
    system_architecture: string;
    expected_outcomes: string[];
  };
  implementation_steps: {
    step: number;
    action: string;
    timeline: string;
    resources_needed: string[];
    success_criteria: string[];
  }[];
  status: 'drafted' | 'in_progress' | 'completed' | 'needs_revision';
  created_at: string;
  updated_at: string;
}

// Helper Types for API Responses
export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  has_more: boolean;
  page: number;
}