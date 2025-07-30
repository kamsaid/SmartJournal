// Consolidated Database Service
// Provides high-level database operations using the repository pattern

import { 
  BaseSupabaseRepository,
  UserRepository,
  DailyReflectionRepository,
  PatternRepository,
  userRepository,
  dailyReflectionRepository,
  patternRepository,
  createRepository,
} from './SupabaseRepository';

import { BaseService, ServiceResult } from '../base/BaseService';
import { 
  IDatabaseService,
  IUserService,
  IReflectionService,
  IPatternService,
  ILifeSystemsService,
  ICheckInService,
  IMemoryService,
} from '../interfaces/ServiceInterfaces';

import {
  User,
  DailyReflection,
  Pattern,
  LifeSystem,
  MorningCheckIn,
  NightlyCheckIn,
  DailyCheckIn,
  UserMemory,
  TransformationPhase,
  LifeSystemType,
} from '@/types/database';

// Main Database Service
export class DatabaseService extends BaseService implements IDatabaseService {
  private repositories: Map<string, BaseSupabaseRepository<any, any>> = new Map();

  constructor() {
    super({
      name: 'database_service',
      version: '1.0.0',
      timeout_ms: 30000,
      retry_attempts: 3,
      cache_enabled: true,
      logging_enabled: true,
    });

    this.initializeRepositories();
  }

  async initialize(): Promise<void> {
    // Initialize all repositories
    const initPromises = Array.from(this.repositories.values()).map(repo => repo.initialize());
    await Promise.all(initPromises);
    this.log('info', 'Database service initialized with all repositories');
  }

  async shutdown(): Promise<void> {
    // Shutdown all repositories
    const shutdownPromises = Array.from(this.repositories.values()).map(repo => repo.shutdown());
    await Promise.all(shutdownPromises);
    this.log('info', 'Database service shutdown completed');
  }

  getConnection(): any {
    // Return the Supabase client from any repository (they all use the same client)
    const firstRepo = Array.from(this.repositories.values())[0];
    return firstRepo ? (firstRepo as any).client : null;
  }

  async executeQuery<T>(query: string, params?: any[]): Promise<ServiceResult<T>> {
    return this.execute(
      async () => {
        const client = this.getConnection();
        if (!client) {
          throw new Error('No database connection available');
        }

        const { data, error } = await client.rpc('execute_sql', {
          query_text: query,
          query_params: params || [],
        });

        if (error) {
          throw new Error(`Query execution failed: ${error.message}`);
        }

        return data as T;
      }
    );
  }

  async beginTransaction(): Promise<any> {
    // Supabase doesn't have explicit transaction support in the client
    // Return a mock transaction object for compatibility
    return { id: Date.now(), active: true };
  }

  async commitTransaction(transaction: any): Promise<void> {
    // Mock implementation
    if (transaction) {
      transaction.active = false;
    }
  }

  async rollbackTransaction(transaction: any): Promise<void> {
    // Mock implementation
    if (transaction) {
      transaction.active = false;
    }
  }

  // Repository access methods
  getUserRepository(): UserRepository {
    return this.repositories.get('users') as UserRepository;
  }

  getReflectionRepository(): DailyReflectionRepository {
    return this.repositories.get('daily_reflections') as DailyReflectionRepository;
  }

  getPatternRepository(): PatternRepository {
    return this.repositories.get('patterns') as PatternRepository;
  }

  getRepository<T>(tableName: string): BaseSupabaseRepository<T, any> | null {
    return this.repositories.get(tableName) || null;
  }

  createRepository<T>(tableName: string): BaseSupabaseRepository<T, any> {
    if (this.repositories.has(tableName)) {
      return this.repositories.get(tableName)!;
    }

    const repo = createRepository<T>(tableName);
    this.repositories.set(tableName, repo);
    return repo;
  }

  private initializeRepositories(): void {
    this.repositories.set('users', userRepository);
    this.repositories.set('daily_reflections', dailyReflectionRepository);
    this.repositories.set('patterns', patternRepository);

    // Create additional repositories for other tables
    this.repositories.set('life_systems', createRepository<LifeSystem>('life_systems'));
    this.repositories.set('morning_check_ins', createRepository<MorningCheckIn>('morning_check_ins'));
    this.repositories.set('nightly_check_ins', createRepository<NightlyCheckIn>('nightly_check_ins'));
    this.repositories.set('daily_check_ins', createRepository<DailyCheckIn>('daily_check_ins'));
    this.repositories.set('user_memories', createRepository<UserMemory>('user_memories'));
    this.repositories.set('phases', createRepository<any>('phases'));
    this.repositories.set('system_analyses', createRepository<any>('system_analyses'));
    this.repositories.set('wisdom_conversations', createRepository<any>('wisdom_conversations'));
    this.repositories.set('architectural_designs', createRepository<any>('architectural_designs'));
    this.repositories.set('leverage_points', createRepository<any>('leverage_points'));
    this.repositories.set('daily_challenges', createRepository<any>('daily_challenges'));
    this.repositories.set('question_templates', createRepository<any>('question_templates'));
    this.repositories.set('callback_questions', createRepository<any>('callback_questions'));
  }
}

// User Service Implementation
export class UserService extends BaseService implements IUserService {
  constructor(private databaseService: DatabaseService) {
    super({
      name: 'user_service',
      version: '1.0.0',
    });
  }

  async initialize(): Promise<void> {
    this.log('info', 'User service initialized');
  }

  async shutdown(): Promise<void> {
    this.log('info', 'User service shutdown');
  }

  async getCurrentUser(): Promise<ServiceResult<User | null>> {
    // This would typically get the current user from session/auth
    // For now, return a mock implementation
    return { success: true, data: null };
  }

  async getUserById(id: string): Promise<ServiceResult<User | null>> {
    const userRepo = this.databaseService.getUserRepository();
    return userRepo.findById(id);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<ServiceResult<User>> {
    const userRepo = this.databaseService.getUserRepository();
    return userRepo.update(id, updates);
  }

  async getUserProgress(id: string): Promise<ServiceResult<{
    current_phase: TransformationPhase;
    phase_progress: number;
    consecutive_completions: number;
    total_memories: number;
    ai_readiness_score: number;
  }>> {
    return this.execute(async () => {
      const userResult = await this.getUserById(id);
      if (!userResult.success || !userResult.data) {
        throw new Error('User not found');
      }

      const user = userResult.data;
      
      // Calculate phase progress (simplified)
      const daysSinceStart = Math.floor(
        (Date.now() - new Date(user.transformation_start_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      const phase_progress = Math.min(1, daysSinceStart / 30); // Assuming 30 days per phase

      return {
        current_phase: user.current_phase,
        phase_progress,
        consecutive_completions: user.consecutive_completions || 0,
        total_memories: user.total_memories || 0,
        ai_readiness_score: user.ai_readiness_score || 0.5,
      };
    });
  }

  async updateUserPhase(id: string, phase: TransformationPhase): Promise<ServiceResult<User>> {
    return this.updateUser(id, { current_phase: phase });
  }
}

// Reflection Service Implementation
export class ReflectionService extends BaseService implements IReflectionService {
  constructor(private databaseService: DatabaseService) {
    super({
      name: 'reflection_service',
      version: '1.0.0',
    });
  }

  async initialize(): Promise<void> {
    this.log('info', 'Reflection service initialized');
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Reflection service shutdown');
  }

  async createReflection(
    userId: string, 
    reflection: Omit<DailyReflection, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<ServiceResult<DailyReflection>> {
    const reflectionRepo = this.databaseService.getReflectionRepository();
    return reflectionRepo.create({ ...reflection, user_id: userId });
  }

  async getRecentReflections(userId: string, limit: number = 10): Promise<ServiceResult<DailyReflection[]>> {
    const reflectionRepo = this.databaseService.getReflectionRepository();
    return reflectionRepo.findRecentByUser(userId, limit);
  }

  async analyzeReflection(reflectionId: string): Promise<ServiceResult<any>> {
    return this.execute(async () => {
      const reflectionRepo = this.databaseService.getReflectionRepository();
      const reflectionResult = await reflectionRepo.findById(reflectionId);
      
      if (!reflectionResult.success || !reflectionResult.data) {
        throw new Error('Reflection not found');
      }

      // Here we would typically call the AI service for analysis
      // For now, return a mock analysis
      return {
        patterns_identified: [],
        insights: [],
        depth_score: 5,
        breakthrough_detected: false,
      };
    });
  }

  async getReflectionsByDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ServiceResult<DailyReflection[]>> {
    const reflectionRepo = this.databaseService.getReflectionRepository();
    return reflectionRepo.findByUserAndDateRange(userId, startDate, endDate);
  }
}

// Pattern Service Implementation
export class PatternService extends BaseService implements IPatternService {
  constructor(private databaseService: DatabaseService) {
    super({
      name: 'pattern_service',
      version: '1.0.0',
    });
  }

  async initialize(): Promise<void> {
    this.log('info', 'Pattern service initialized');
  }

  async shutdown(): Promise<void> {
    this.log('info', 'Pattern service shutdown');
  }

  async identifyPatterns(userId: string, focusArea?: LifeSystemType): Promise<ServiceResult<Pattern[]>> {
    return this.execute(async () => {
      const patternRepo = this.databaseService.getPatternRepository();
      
      if (focusArea) {
        // Find patterns related to specific life system
        const result = await patternRepo.findMany({ user_id: userId });
        if (result.success && result.data) {
          const filteredPatterns = result.data.filter(pattern => 
            pattern.impact_areas && pattern.impact_areas.includes(focusArea)
          );
          return filteredPatterns;
        }
        return [];
      } else {
        const result = await patternRepo.findMany({ user_id: userId });
        return result.success ? result.data || [] : [];
      }
    });
  }

  async createPattern(
    userId: string, 
    pattern: Omit<Pattern, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<ServiceResult<Pattern>> {
    const patternRepo = this.databaseService.getPatternRepository();
    return patternRepo.create({ ...pattern, user_id: userId });
  }

  async updatePattern(patternId: string, updates: Partial<Pattern>): Promise<ServiceResult<Pattern>> {
    const patternRepo = this.databaseService.getPatternRepository();
    return patternRepo.update(patternId, updates);
  }

  async getUserPatterns(userId: string): Promise<ServiceResult<Pattern[]>> {
    const patternRepo = this.databaseService.getPatternRepository();
    return patternRepo.findMany({ user_id: userId });
  }

  async analyzePatternEvolution(userId: string, patternId: string): Promise<ServiceResult<any>> {
    return this.execute(async () => {
      // This would analyze how a pattern has evolved over time
      // Mock implementation for now
      return {
        pattern_id: patternId,
        evolution_trend: 'improving',
        strength_change: 0.2,
        recent_occurrences: 5,
        impact_change: 'positive',
      };
    });
  }
}

// Export singleton instances
export const databaseService = new DatabaseService();
export const userService = new UserService(databaseService);
export const reflectionService = new ReflectionService(databaseService);
export const patternService = new PatternService(databaseService);

// Export classes for custom instances
export {
  DatabaseService,
  UserService,
  ReflectionService,
  PatternService,
};

// Export legacy compatibility (for gradual migration)
export const legacySupabaseService = {
  // User operations
  user: {
    create: (data: any) => userService.updateUser(data.id, data),
    findById: (id: string) => userService.getUserById(id),
    update: (id: string, updates: any) => userService.updateUser(id, updates),
  },
  
  // Reflection operations
  reflection: {
    create: (userId: string, data: any) => reflectionService.createReflection(userId, data),
    findRecent: (userId: string, limit?: number) => reflectionService.getRecentReflections(userId, limit),
    findByDateRange: (userId: string, start: string, end: string) => 
      reflectionService.getReflectionsByDateRange(userId, start, end),
  },
  
  // Pattern operations
  pattern: {
    create: (userId: string, data: any) => patternService.createPattern(userId, data),
    findByUser: (userId: string) => patternService.getUserPatterns(userId),
    update: (id: string, updates: any) => patternService.updatePattern(id, updates),
  },
  
  // Generic operations
  query: <T>(tableName: string) => ({
    select: () => ({
      eq: (field: string, value: any) => databaseService.getRepository<T>(tableName)?.findMany({ [field]: value } as any),
    }),
    insert: (data: any) => databaseService.getRepository<T>(tableName)?.create(data),
    update: (data: any) => databaseService.getRepository<T>(tableName)?.update(data.id, data),
    delete: () => ({
      eq: (field: string, value: any) => databaseService.getRepository<T>(tableName)?.delete(value),
    }),
  }),
};

export default databaseService;