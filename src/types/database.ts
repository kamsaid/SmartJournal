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
  // New simplified fields
  daily_notification_time?: string; // When user wants daily check-in reminder
  current_challenge_id?: string; // Current active challenge
  consecutive_completions: number; // Streak of completed daily check-ins
  total_memories: number; // Total stored memories for this user
  ai_readiness_score: number; // 0-1, AI's assessment of phase progression readiness
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

export interface WisdomConversation {
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

// Simplified Memory System Types
export interface UserMemory {
  id: string;
  user_id: string;
  content: string; // User's response text
  response_date: string;
  embeddings?: number[]; // OpenAI embeddings for semantic search
  emotional_resonance: number; // 1-10 scale
  depth_score: number; // 1-10 scale  
  patterns_mentioned: string[]; // Detected patterns in response
  breakthrough_indicators: string[]; // AI-detected breakthrough moments
  context_tags: string[]; // Topics, emotions, life areas mentioned
  importance_score: number; // 0-1, calculated importance
  created_at: string;
}

// Daily Challenge System
export type ChallengeType = 'experiment' | 'observation' | 'action' | 'reflection' | 'great_day_focused';

export interface DailyChallenge {
  id: string;
  user_id: string;
  challenge_text: string;
  challenge_type: ChallengeType;
  assigned_date: string;
  completed_at?: string;
  completion_notes?: string;
  swap_count: number; // How many times user swapped (max 1)
  difficulty_level: number; // 1-5 scale
  growth_area_focus: string; // What area this targets
  created_at: string;
}

// Adaptive Question Bank
export type QuestionInputType = 'slider' | 'yes_no' | 'short_text' | 'scale';

export interface QuestionTemplate {
  id: string;
  question_text: string;
  input_type: QuestionInputType;
  depth_level: number; // 1-10, unlocked as user progresses
  required_phase: TransformationPhase; // Minimum phase to see this question
  prerequisite_patterns?: string[]; // Patterns user must have mentioned
  scientific_method: string; // CBT, motivational interviewing, etc.
  expected_insights: string[];
  context_triggers: string[]; // When this question is most relevant
}

// Anti-gaming Callback Questions
export interface CallbackQuestion {
  id: string;
  user_id: string;
  original_insight: string; // What they claimed to realize
  callback_question: string; // Question to verify understanding
  asked_date: string;
  response?: string;
  verification_score?: number; // 0-1, how well they demonstrated understanding
  created_at: string;
}

// Check-in type for different check-in flows
export type CheckInType = 'morning' | 'nightly' | 'daily';

// Daily Check-in Session (simplified)
export interface DailyCheckIn {
  id: string;
  user_id: string;
  date: string;
  check_in_type: CheckInType;
  questions: {
    question_id: string;
    question_text: string;
    input_type: QuestionInputType;
    response: string | number; // Slider gives number, text gives string
  }[];
  total_depth_score: number; // Average depth across all responses
  breakthrough_detected: boolean;
  patterns_revealed: string[];
  memory_references: string[]; // Which past memories AI referenced
  challenge_assigned?: string; // Challenge ID assigned after this check-in
  duration_minutes: number; // How long the check-in took
  created_at: string;
}

// Morning Check-in with specific questions
export interface MorningCheckIn {
  id: string;
  user_id: string;
  date: string;
  thoughts_anxieties: string; // "Write out all your thoughts and anxieties"
  great_day_vision: string; // "What would make today a great day?"
  affirmations: string; // "Daily affirmations. I am..."
  gratitude: string; // "I am grateful for..."
  challenge_generated?: string; // Challenge ID generated from this morning check-in
  duration_minutes: number;
  created_at: string;
}

// Nightly Check-in with specific questions
export interface NightlyCheckIn {
  id: string;
  user_id: string;
  date: string;
  improvements: string; // "How could I have made today better?"
  amazing_things: string[]; // "3 amazing things that happened today"
  accomplishments: string[]; // "3 things you accomplished"
  emotions: string; // "What made you happy/sad today"
  morning_checkin_id?: string; // Reference to morning check-in for same date
  great_day_reflection?: string; // AI analysis of how morning vision compared to reality
  duration_minutes: number;
  created_at: string;
}

// Simplified User Progress
export interface UserProgress {
  user_id: string;
  current_phase: TransformationPhase;
  consecutive_completions: number;
  total_check_ins: number;
  average_depth_score: number;
  patterns_discovered: string[];
  breakthrough_count: number;
  ai_readiness_score: number; // 0-1, AI's assessment of growth readiness
  pattern_recognition_depth: number; // How well they recognize their patterns
  insight_authenticity_score: number; // How genuine their insights seem
  last_check_in_date?: string;
  phase_start_date: string;
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

// AI assistance modes for journaling
export type AIAssistanceMode = 'solo' | 'guided' | 'wisdom' | 'pattern';

// Journal entry for long-form writing
export interface JournalEntry {
  id: string;
  user_id: string;
  date: string;
  content: string;
  ai_assistance_used: AIAssistanceMode;
  word_count: number;
  writing_session_duration: number; // in minutes
  patterns_identified: string[];
  ai_insights: string[];
  ai_conversation_thread?: {
    message_id: string;
    role: 'ai' | 'user';
    content: string;
    timestamp: string;
  }[];
  created_at: string;
  updated_at: string;
}

// Enhanced check-ins with AI follow-ups
export interface EnhancedCheckIn {
  id: string;
  user_id: string;
  date: string;
  check_in_type: CheckInType;
  core_responses: {
    question_key: string;
    question_text: string;
    response: string | string[];
  }[];
  ai_followup_questions?: {
    question_id: string;
    question_text: string;
    response: string;
    ai_insight?: string;
  }[];
  ai_insights_generated: string[];
  total_session_time: number; // in minutes
  contemplative_state?: 'resistant' | 'curious' | 'ready' | 'overwhelmed' | 'breakthrough';
  wisdom_level_applied?: number; // 1-10 scale
  created_at: string;
  updated_at: string;
}

// Calendar insights and metadata
export interface CalendarInsight {
  id: string;
  user_id: string;
  month_year: string; // Format: "2024-01"
  total_checkins: number;
  morning_checkins: number;
  nightly_checkins: number;
  journal_entries: number;
  current_streak: number;
  longest_streak: number;
  monthly_patterns: string[];
  ai_monthly_summary: string;
  growth_indicators: string[];
  recommended_focus_areas: string[];
  created_at: string;
  updated_at: string;
}

// Daily summary for calendar view
export interface DailySummary {
  date: string;
  morning_completed: boolean;
  nightly_completed: boolean;
  journal_entries_count: number;
  ai_insights_count: number;
  contemplative_state?: string;
  key_themes: string[];
  streak_day?: number;
}

// Follow-up question context
export interface FollowUpContext {
  user_id: string;
  check_in_type: CheckInType;
  core_responses: Record<string, any>;
  recent_patterns: string[];
  current_phase: TransformationPhase;
  contemplative_state?: string;
  previous_insights: string[];
}