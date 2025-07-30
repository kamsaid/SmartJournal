// Database Services Barrel Export
// Clean interface for all database-related services

// Core Database Services
export { 
  default as DatabaseService,
  databaseService,
  UserService,
  userService,
  ReflectionService,
  reflectionService,
  PatternService,
  patternService,
} from './DatabaseService';

// Repository Pattern
export {
  default as BaseSupabaseRepository,
  BaseSupabaseRepository,
  UserRepository,
  DailyReflectionRepository,
  PatternRepository,
  userRepository,
  dailyReflectionRepository,
  patternRepository,
  createRepository,
} from './SupabaseRepository';

// Database Errors
export {
  DatabaseError,
  ConnectionError,
  QueryError,
  ValidationError,
} from './SupabaseRepository';

// Legacy Compatibility
export { legacySupabaseService as supabaseService } from './DatabaseService';

// Types
export type { ServiceResult } from '../base/BaseService';

// Database Utilities
export const DatabaseUtils = {
  // Create a new repository for any table
  createRepository: <T>(tableName: string) => createRepository<T>(tableName),
  
  // Health check all database services
  healthCheck: async () => {
    const services = [databaseService, userService, reflectionService, patternService];
    const results = await Promise.allSettled(
      services.map(service => service.healthCheck())
    );
    
    return results.map((result, index) => ({
      service: services[index].getConfig().name,
      status: result.status === 'fulfilled' ? result.value : { status: 'unhealthy', error: 'Health check failed' },
    }));
  },
  
  // Initialize all database services
  initialize: async () => {
    const services = [databaseService, userService, reflectionService, patternService];
    await Promise.all(services.map(service => service.initialize()));
  },
  
  // Shutdown all database services
  shutdown: async () => {
    const services = [databaseService, userService, reflectionService, patternService];
    await Promise.all(services.map(service => service.shutdown()));
  },
  
  // Get metrics from all database services
  getMetrics: () => {
    return {
      databaseService: databaseService.getMetrics(),
      userService: userService.getMetrics(),
      reflectionService: reflectionService.getMetrics(),
      patternService: patternService.getMetrics(),
    };
  },
};

// Service Factory Functions
export const DatabaseServiceFactory = {
  createDatabaseService: () => new DatabaseService(),
  createUserService: (dbService?: DatabaseService) => new UserService(dbService || databaseService),
  createReflectionService: (dbService?: DatabaseService) => new ReflectionService(dbService || databaseService),
  createPatternService: (dbService?: DatabaseService) => new PatternService(dbService || databaseService),
};

// Repository Factory Functions
export const RepositoryFactory = {
  createUserRepository: () => new UserRepository(),
  createReflectionRepository: () => new DailyReflectionRepository(),
  createPatternRepository: () => new PatternRepository(),
  createCustomRepository: <T>(tableName: string) => createRepository<T>(tableName),
};

// Database Migration Utilities (for future use)
export const MigrationUtils = {
  // Check if tables exist
  checkTablesExist: async (tableNames: string[]) => {
    const results: { [tableName: string]: boolean } = {};
    
    for (const tableName of tableNames) {
      try {
        const repo = createRepository(tableName);
        await repo.initialize();
        results[tableName] = true;
      } catch (error) {
        results[tableName] = false;
      }
    }
    
    return results;
  },
  
  // Get table schemas (mock implementation)
  getTableSchemas: async (tableNames: string[]) => {
    // This would typically query the database for schema information
    // For now, return mock data
    return tableNames.reduce((acc, tableName) => {
      acc[tableName] = {
        columns: [],
        indexes: [],
        constraints: [],
      };
      return acc;
    }, {} as { [tableName: string]: any });
  },
};

// Database Connection Pool (future enhancement)
export const ConnectionPool = {
  // Get current connection status
  getStatus: () => ({
    active_connections: 1, // Supabase handles this internally
    max_connections: 100,
    health: 'healthy',
  }),
  
  // Test connection
  testConnection: async () => {
    try {
      const result = await databaseService.getConnection();
      return !!result;
    } catch (error) {
      return false;
    }
  },
};

// Export commonly used repository instances for convenience
export const repositories = {
  user: userRepository,
  reflection: dailyReflectionRepository,
  pattern: patternRepository,
};

// Export commonly used service instances for convenience
export const services = {
  database: databaseService,
  user: userService,
  reflection: reflectionService,
  pattern: patternService,
};

// Default export
export default {
  services,
  repositories,
  utils: DatabaseUtils,
  factory: DatabaseServiceFactory,
  repositoryFactory: RepositoryFactory,
  migration: MigrationUtils,
  connection: ConnectionPool,
};