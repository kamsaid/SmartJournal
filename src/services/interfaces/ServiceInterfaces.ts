// Service Interfaces for Life Systems Architect
// Defines contracts for all service types to ensure consistency and testability

import { 
  AIContext, 
  AIResponse, 
  AIRequestType,
  AIRoutingDecision,
  AIPerformanceMetrics,
  QuestionGenerationRequest,
  ReflectionAnalysisRequest,
  PatternAnalysisRequest,
  LifeDesignRequest,
  ServiceResult,
  ServiceMetrics
} from '@/types/ai';

import {
  User,
  DailyReflection,
  Pattern,
  LifeSystem,
  TransformationPhase,
  LifeSystemType,
  AnalysisType,
  DailyChallenge,
  UserMemory,
  CheckInType,
  MorningCheckIn,
  NightlyCheckIn,
  DailyCheckIn,
  CalendarInsight,
  DailySummary,
} from '@/types/database';

// Core Service Interfaces

export interface IService {
  readonly name: string;
  readonly version: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: ServiceMetrics;
    issues: string[];
  }>;
  getMetrics(): ServiceMetrics;
}

// AI Service Interfaces

export interface IAIService extends IService {
  processRequest(request: AIRequestType, context: AIContext, payload: any): Promise<ServiceResult<AIResponse>>;
  validateResponse(response: AIResponse): Promise<boolean>;
  getCapabilities(): string[];
}

export interface IAIOrchestrator extends IService {
  generateWisdomQuestion(context: AIContext, userResponse?: string): Promise<AIResponse>;
  analyzeReflection(request: ReflectionAnalysisRequest): Promise<AIResponse>;
  analyzeLifeSystems(context: AIContext, analysisType: AnalysisType): Promise<AIResponse>;
  recognizePatterns(request: PatternAnalysisRequest): Promise<AIResponse>;
  identifyLeveragePoints(context: AIContext): Promise<AIResponse>;
  generateLifeDesign(request: LifeDesignRequest): Promise<AIResponse>;
  routeToOptimalSystem(context: AIContext, userInput: string): Promise<AIRoutingDecision>;
}

export interface IAIFactory extends IService {
  createAIService(type: string, config?: any): Promise<IAIService>;
  getAIService(type: string): IAIService | null;
  processAIRequest(request: any): Promise<ServiceResult<AIResponse>>;
  getPerformanceMetrics(): Promise<AIPerformanceMetrics>;
}

// Database Service Interfaces

export interface IRepository<TEntity, TKey = string> {
  findById(id: TKey): Promise<ServiceResult<TEntity | null>>;
  findMany(criteria: Partial<TEntity>): Promise<ServiceResult<TEntity[]>>;
  create(entity: Omit<TEntity, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResult<TEntity>>;
  update(id: TKey, updates: Partial<TEntity>): Promise<ServiceResult<TEntity>>;
  delete(id: TKey): Promise<ServiceResult<boolean>>;
  exists(id: TKey): Promise<ServiceResult<boolean>>;
}

export interface IDatabaseService extends IService {
  getConnection(): any;
  executeQuery<T>(query: string, params?: any[]): Promise<ServiceResult<T>>;
  beginTransaction(): Promise<any>;
  commitTransaction(transaction: any): Promise<void>;
  rollbackTransaction(transaction: any): Promise<void>;
}

// User Management Interfaces

export interface IUserService extends IService {
  getCurrentUser(): Promise<ServiceResult<User | null>>;
  getUserById(id: string): Promise<ServiceResult<User | null>>;
  updateUser(id: string, updates: Partial<User>): Promise<ServiceResult<User>>;
  getUserProgress(id: string): Promise<ServiceResult<{
    current_phase: TransformationPhase;
    phase_progress: number;
    consecutive_completions: number;
    total_memories: number;
    ai_readiness_score: number;
  }>>;
  updateUserPhase(id: string, phase: TransformationPhase): Promise<ServiceResult<User>>;
}

export interface IUserRepository extends IRepository<User, string> {
  findByEmail(email: string): Promise<ServiceResult<User | null>>;
  findByPhase(phase: TransformationPhase): Promise<ServiceResult<User[]>>;
  updateProgress(id: string, progress: any): Promise<ServiceResult<User>>;
}

// Reflection and Check-in Interfaces

export interface ICheckInService extends IService {
  createMorningCheckIn(userId: string, data: Omit<MorningCheckIn, 'id' | 'user_id' | 'created_at'>): Promise<ServiceResult<MorningCheckIn>>;
  createNightlyCheckIn(userId: string, data: Omit<NightlyCheckIn, 'id' | 'user_id' | 'created_at'>): Promise<ServiceResult<NightlyCheckIn>>;
  createDailyCheckIn(userId: string, data: Omit<DailyCheckIn, 'id' | 'user_id' | 'created_at'>): Promise<ServiceResult<DailyCheckIn>>;
  getCheckInStatus(userId: string, date: string): Promise<ServiceResult<{
    morning_completed: boolean;
    nightly_completed: boolean;
    daily_completed: boolean;
  }>>;
  getTodaysCheckIns(userId: string): Promise<ServiceResult<{
    morning?: MorningCheckIn;
    nightly?: NightlyCheckIn;
    daily?: DailyCheckIn;
  }>>;
}

export interface IReflectionService extends IService {
  createReflection(userId: string, reflection: Omit<DailyReflection, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ServiceResult<DailyReflection>>;
  getRecentReflections(userId: string, limit?: number): Promise<ServiceResult<DailyReflection[]>>;
  analyzeReflection(reflectionId: string): Promise<ServiceResult<any>>;
  getReflectionsByDateRange(userId: string, startDate: string, endDate: string): Promise<ServiceResult<DailyReflection[]>>;
}

// Memory and Pattern Interfaces

export interface IMemoryService extends IService {
  storeMemory(userId: string, content: string, metadata: any): Promise<ServiceResult<UserMemory>>;
  retrieveRelevantMemories(userId: string, query: string, limit?: number): Promise<ServiceResult<UserMemory[]>>;
  searchMemories(userId: string, searchTerm: string): Promise<ServiceResult<UserMemory[]>>;
  getMemoryInsights(userId: string): Promise<ServiceResult<{
    total_memories: number;
    average_depth: number;
    breakthrough_count: number;
    top_patterns: string[];
  }>>;
  deleteMemory(memoryId: string): Promise<ServiceResult<boolean>>;
}

export interface IPatternService extends IService {
  identifyPatterns(userId: string, focusArea?: LifeSystemType): Promise<ServiceResult<Pattern[]>>;
  createPattern(userId: string, pattern: Omit<Pattern, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ServiceResult<Pattern>>;
  updatePattern(patternId: string, updates: Partial<Pattern>): Promise<ServiceResult<Pattern>>;
  getUserPatterns(userId: string): Promise<ServiceResult<Pattern[]>>;
  analyzePatternEvolution(userId: string, patternId: string): Promise<ServiceResult<any>>;
}

// Life Systems Interfaces

export interface ILifeSystemsService extends IService {
  getUserLifeSystems(userId: string): Promise<ServiceResult<LifeSystem[]>>;
  updateLifeSystem(userId: string, systemType: LifeSystemType, updates: any): Promise<ServiceResult<LifeSystem>>;
  analyzeLifeSystem(userId: string, systemType: LifeSystemType): Promise<ServiceResult<any>>;
  getSystemConnections(userId: string): Promise<ServiceResult<{
    from_system: LifeSystemType;
    to_system: LifeSystemType;
    connection_strength: number;
    description: string;
  }[]>>;
  calculateSystemSatisfaction(userId: string): Promise<ServiceResult<{
    overall_satisfaction: number;
    system_scores: Record<LifeSystemType, number>;
  }>>;
}

// Challenge and Question Interfaces

export interface IChallengeService extends IService {
  generateDailyChallenge(userId: string, focusArea?: string): Promise<ServiceResult<DailyChallenge>>;
  getUserChallenges(userId: string, status?: string): Promise<ServiceResult<DailyChallenge[]>>;
  completeChallenge(challengeId: string, completionNotes: string): Promise<ServiceResult<DailyChallenge>>;
  swapChallenge(challengeId: string): Promise<ServiceResult<DailyChallenge>>;
  getChallengeSuggestions(userId: string): Promise<ServiceResult<string[]>>;
}

export interface IQuestionService extends IService {
  generateQuestion(request: QuestionGenerationRequest): Promise<ServiceResult<{
    question: string;
    depth_level: number;
    category: string;
    expected_insights: string[];
  }>>;
  getAdaptiveQuestions(userId: string, context: any): Promise<ServiceResult<any[]>>;
  validateQuestionResponse(questionId: string, response: string): Promise<ServiceResult<{
    depth_score: number;
    insight_quality: number;
    follow_up_needed: boolean;
  }>>;
}

// Calendar and History Interfaces

export interface ICalendarService extends IService {
  getDailySummary(userId: string, date: string): Promise<ServiceResult<DailySummary>>;
  getMonthlyInsights(userId: string, monthYear: string): Promise<ServiceResult<CalendarInsight>>;
  getStreakInfo(userId: string): Promise<ServiceResult<{
    current_streak: number;
    longest_streak: number;
    streak_type: 'daily' | 'weekly';
  }>>;
  generateCalendarView(userId: string, monthYear: string): Promise<ServiceResult<DailySummary[]>>;
}

export interface IHistoryService extends IService {
  getUserHistory(userId: string, limit?: number): Promise<ServiceResult<any[]>>;
  getProgressHistory(userId: string): Promise<ServiceResult<{
    date: string;
    phase: TransformationPhase;
    depth_score: number;
    insights_count: number;
  }[]>>;
  exportUserData(userId: string): Promise<ServiceResult<any>>;
}

// Transformation and Phase Interfaces

export interface ITransformationService extends IService {
  assessPhaseReadiness(userId: string): Promise<ServiceResult<{
    current_phase: TransformationPhase;
    readiness_score: number;
    next_phase_requirements: string[];
    estimated_time_to_next: string;
  }>>;
  advanceUserPhase(userId: string): Promise<ServiceResult<{
    old_phase: TransformationPhase;
    new_phase: TransformationPhase;
    advancement_date: string;
  }>>;
  getPhaseGuidance(userId: string): Promise<ServiceResult<{
    current_focus: string[];
    recommended_actions: string[];
    milestone_progress: Record<string, number>;
  }>>;
}

// Authentication Interfaces

export interface IAuthService extends IService {
  signUp(email: string, password: string): Promise<ServiceResult<{ user: User; session: any }>>;
  signIn(email: string, password: string): Promise<ServiceResult<{ user: User; session: any }>>;
  signOut(): Promise<ServiceResult<boolean>>;
  getCurrentSession(): Promise<ServiceResult<any>>;
  refreshSession(): Promise<ServiceResult<any>>;
}

// Notification and Communication Interfaces

export interface INotificationService extends IService {
  sendDailyReminder(userId: string): Promise<ServiceResult<boolean>>;
  sendBreakthroughCelebration(userId: string, breakthrough: string): Promise<ServiceResult<boolean>>;
  sendPhaseAdvancement(userId: string, newPhase: TransformationPhase): Promise<ServiceResult<boolean>>;
  updateNotificationPreferences(userId: string, preferences: any): Promise<ServiceResult<any>>;
}

// Analytics and Insights Interfaces

export interface IAnalyticsService extends IService {
  getUserInsights(userId: string): Promise<ServiceResult<{
    transformation_velocity: number;
    pattern_recognition_score: number;
    life_system_balance: number;
    breakthrough_frequency: number;
    engagement_consistency: number;
  }>>;
  getSystemAnalytics(): Promise<ServiceResult<{
    total_users: number;
    active_users: number;
    average_phase: number;
    breakthrough_rate: number;
    retention_rate: number;
  }>>;
  generatePersonalizedInsights(userId: string): Promise<ServiceResult<string[]>>;
}

// Service Factory and Dependency Injection

export interface IServiceContainer {
  register<T>(name: string, service: T): void;
  resolve<T>(name: string): T;
  registerFactory<T>(name: string, factory: () => T): void;
  has(name: string): boolean;
  clear(): void;
}

export interface IServiceFactory {
  createUserService(): IUserService;
  createAIService(): IAIService;
  createMemoryService(): IMemoryService;
  createPatternService(): IPatternService;
  createLifeSystemsService(): ILifeSystemsService;
  createChallengeService(): IChallengeService;
  createCheckInService(): ICheckInService;
  createCalendarService(): ICalendarService;
  createTransformationService(): ITransformationService;
  createAuthService(): IAuthService;
  createAnalyticsService(): IAnalyticsService;
}

// Configuration Interfaces

export interface IConfigService extends IService {
  get<T>(key: string, defaultValue?: T): T;
  set(key: string, value: any): void;
  has(key: string): boolean;
  getEnvironment(): 'development' | 'staging' | 'production';
  validateConfiguration(): Promise<{ valid: boolean; errors: string[] }>;
}

// Cache Interfaces

export interface ICacheService extends IService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(pattern?: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  increment(key: string, by?: number): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<boolean>;
}

// Event and Messaging Interfaces

export interface IEventService extends IService {
  emit(eventName: string, data: any): Promise<void>;
  on(eventName: string, handler: (data: any) => void): void;
  off(eventName: string, handler: (data: any) => void): void;
  once(eventName: string, handler: (data: any) => void): void;
  listEvents(): string[];
}

// Storage Interfaces

export interface IStorageService extends IService {
  store(key: string, data: any): Promise<ServiceResult<string>>;
  retrieve(key: string): Promise<ServiceResult<any>>;
  delete(key: string): Promise<ServiceResult<boolean>>;
  list(prefix?: string): Promise<ServiceResult<string[]>>;
  exists(key: string): Promise<ServiceResult<boolean>>;
}

// Validation Interfaces

export interface IValidationService extends IService {
  validateUser(user: Partial<User>): Promise<{ valid: boolean; errors: string[] }>;
  validateCheckIn(checkIn: any): Promise<{ valid: boolean; errors: string[] }>;
  validatePattern(pattern: Partial<Pattern>): Promise<{ valid: boolean; errors: string[] }>;
  validateLifeSystem(lifeSystem: Partial<LifeSystem>): Promise<{ valid: boolean; errors: string[] }>;
  sanitizeInput(input: string): string;
}

// All interfaces are already exported inline above