// Main Services Barrel Export
// Provides clean, organized access to all services in the application

// Core Services
export * from './base/BaseService';
export * from './interfaces/ServiceInterfaces';

// AI Services
export * from './ai/unifiedAIService';
export * from './ai/aiServiceFactory';
export { default as UnifiedAIService, unifiedAIService } from './ai/unifiedAIService';
export { default as AIServiceFactory, aiServiceFactory } from './ai/aiServiceFactory';

// Database Services
export * from './database/SupabaseRepository';
export * from './database/DatabaseService';
export { 
  default as DatabaseService, 
  databaseService,
  userService,
  reflectionService,
  patternService,
} from './database/DatabaseService';

// Legacy Compatibility Exports (for gradual migration)
export { 
  aiOrchestrator,
  aiUtils,
  aiPatterns,
} from './ai/aiServiceFactory';

export { 
  legacySupabaseService as supabaseService,
} from './database/DatabaseService';

// Re-export commonly used types
export type {
  AIContext,
  AIResponse,
  AIServiceConfig,
  AISystemType,
  ContemplativeState,
  AIRoutingDecision,
  ServiceResult,
  ServiceMetrics,
  ServiceConfig,
  ServiceError,
} from '@/types/ai';

// Service container for dependency injection
class ServiceContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  registerFactory<T>(name: string, factory: () => T): void {
    this.factories.set(name, factory);
  }

  resolve<T>(name: string): T {
    // Check if service is already instantiated
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }

    // Check if factory exists
    if (this.factories.has(name)) {
      const factory = this.factories.get(name)!;
      const service = factory();
      this.services.set(name, service);
      return service as T;
    }

    throw new Error(`Service '${name}' not found in container`);
  }

  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }

  clear(): void {
    this.services.clear();
    this.factories.clear();
  }

  listServices(): string[] {
    return [...new Set([...this.services.keys(), ...this.factories.keys()])];
  }
}

// Export singleton container
export const serviceContainer = new ServiceContainer();

// Register core services
serviceContainer.register('databaseService', databaseService);
serviceContainer.register('userService', userService);
serviceContainer.register('reflectionService', reflectionService);
serviceContainer.register('patternService', patternService);
serviceContainer.register('aiServiceFactory', aiServiceFactory);
serviceContainer.register('unifiedAIService', unifiedAIService);

// Utility function for service initialization
export async function initializeServices(): Promise<{
  initialized: string[];
  failed: string[];
  errors: { service: string; error: string }[];
}> {
  const initialized: string[] = [];
  const failed: string[] = [];
  const errors: { service: string; error: string }[] = [];

  const services = [
    { name: 'databaseService', instance: databaseService },
    { name: 'userService', instance: userService },
    { name: 'reflectionService', instance: reflectionService },
    { name: 'patternService', instance: patternService },
  ];

  for (const { name, instance } of services) {
    try {
      await instance.initialize();
      initialized.push(name);
    } catch (error) {
      failed.push(name);
      errors.push({
        service: name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { initialized, failed, errors };
}

// Utility function for service shutdown
export async function shutdownServices(): Promise<void> {
  const services = [
    databaseService,
    userService,
    reflectionService,
    patternService,
  ];

  const shutdownPromises = services.map(async (service) => {
    try {
      await service.shutdown();
    } catch (error) {
      console.error(`Error shutting down service:`, error);
    }
  });

  await Promise.all(shutdownPromises);
}

// Health check for all services
export async function checkServicesHealth(): Promise<{
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      metrics?: any;
      issues?: string[];
    };
  };
}> {
  const services = {
    databaseService,
    userService,
    reflectionService,
    patternService,
    aiServiceFactory,
  };

  const healthChecks = await Promise.allSettled(
    Object.entries(services).map(async ([name, service]) => {
      const health = await service.healthCheck();
      return { name, health };
    })
  );

  const results: any = {};
  let healthyCount = 0;
  let degradedCount = 0;
  let unhealthyCount = 0;

  healthChecks.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { name, health } = result.value;
      results[name] = health;
      
      switch (health.status) {
        case 'healthy':
          healthyCount++;
          break;
        case 'degraded':
          degradedCount++;
          break;
        case 'unhealthy':
          unhealthyCount++;
          break;
      }
    } else {
      const name = 'unknown';
      results[name] = {
        status: 'unhealthy',
        issues: ['Health check failed'],
      };
      unhealthyCount++;
    }
  });

  let overall_status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (unhealthyCount > 0) {
    overall_status = 'unhealthy';
  } else if (degradedCount > 0) {
    overall_status = 'degraded';
  }

  return {
    overall_status,
    services: results,
  };
}

// Service factory functions for easier testing and customization
export const ServiceFactory = {
  createDatabaseService: () => new DatabaseService(),
  createUserService: (dbService?: DatabaseService) => new UserService(dbService || databaseService),
  createReflectionService: (dbService?: DatabaseService) => new ReflectionService(dbService || databaseService),
  createPatternService: (dbService?: DatabaseService) => new PatternService(dbService || databaseService),
  createAIServiceFactory: (config?: any) => new AIServiceFactory(config),
  createUnifiedAIService: (config?: any) => new UnifiedAIService(config),
};

// Export default container for convenience
export default serviceContainer;