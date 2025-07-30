// Base Service Class with Common Patterns
// Provides standardized patterns for error handling, logging, caching, and validation

import { EventEmitter } from 'events';

// Base interfaces
export interface ServiceConfig {
  name: string;
  version: string;
  timeout_ms?: number;
  retry_attempts?: number;
  cache_enabled?: boolean;
  logging_enabled?: boolean;
  metrics_enabled?: boolean;
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

export class ValidationError extends ServiceError {
  constructor(message: string, service: string, public validation_errors: string[]) {
    super(message, 'VALIDATION_ERROR', service, false, { validation_errors });
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends ServiceError {
  constructor(message: string, service: string, public timeout_ms: number) {
    super(message, 'TIMEOUT_ERROR', service, true, { timeout_ms });
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends ServiceError {
  constructor(message: string, service: string, public retry_after_ms: number) {
    super(message, 'RATE_LIMIT_ERROR', service, true, { retry_after_ms });
    this.name = 'RateLimitError';
  }
}

// Base Service Abstract Class
export abstract class BaseService extends EventEmitter {
  protected config: ServiceConfig;
  protected metrics: ServiceMetrics;
  protected cache: Map<string, { data: any; expiry: number }> = new Map();
  private retryDelays = [1000, 2000, 4000, 8000]; // Exponential backoff

  constructor(config: ServiceConfig) {
    super();
    this.config = {
      timeout_ms: 30000,
      retry_attempts: 3,
      cache_enabled: true,
      logging_enabled: true,
      metrics_enabled: true,
      ...config,
    };

    this.metrics = {
      calls_total: 0,
      calls_successful: 0,
      calls_failed: 0,
      average_response_time_ms: 0,
    };

    // Set up periodic cache cleanup
    if (this.config.cache_enabled) {
      setInterval(() => this.cleanupExpiredCache(), 5 * 60 * 1000); // Every 5 minutes
    }
  }

  // Main execution wrapper with common patterns
  protected async execute<T>(
    operation: () => Promise<T>,
    options: {
      cache_key?: string;
      cache_ttl_ms?: number;
      validate_input?: () => void;
      validate_output?: (result: T) => void;
      retryable?: boolean;
    } = {}
  ): Promise<ServiceResult<T>> {
    const startTime = Date.now();
    let retryCount = 0;
    let cacheHit = false;

    try {
      // Input validation
      if (options.validate_input) {
        options.validate_input();
      }

      // Check cache first
      if (options.cache_key && this.config.cache_enabled) {
        const cached = this.getFromCache(options.cache_key);
        if (cached) {
          cacheHit = true;
          this.updateMetrics(true, Date.now() - startTime);
          this.log('debug', `Cache hit for key: ${options.cache_key}`);
          
          return {
            success: true,
            data: cached,
            metadata: {
              execution_time_ms: Date.now() - startTime,
              cache_hit: true,
              retry_count: 0,
              timestamp: new Date().toISOString(),
            },
          };
        }
      }

      // Execute with retry logic
      let lastError: Error | null = null;
      const maxRetries = options.retryable !== false ? this.config.retry_attempts! : 0;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        retryCount = attempt;

        try {
          if (attempt > 0) {
            const delay = this.retryDelays[Math.min(attempt - 1, this.retryDelays.length - 1)];
            await this.delay(delay);
            this.log('info', `Retrying operation (attempt ${attempt + 1}/${maxRetries + 1})`);
          }

          // Execute with timeout
          const result = await this.withTimeout(operation(), this.config.timeout_ms!);

          // Output validation
          if (options.validate_output) {
            options.validate_output(result);
          }

          // Cache successful result
          if (options.cache_key && this.config.cache_enabled && options.cache_ttl_ms) {
            this.setCache(options.cache_key, result, options.cache_ttl_ms);
          }

          // Update metrics and emit success event
          const executionTime = Date.now() - startTime;
          this.updateMetrics(true, executionTime);
          this.emit('operation_success', {
            service: this.config.name,
            execution_time_ms: executionTime,
            retry_count: retryCount,
          });

          return {
            success: true,
            data: result,
            metadata: {
              execution_time_ms: executionTime,
              cache_hit: cacheHit,
              retry_count: retryCount,
              timestamp: new Date().toISOString(),
            },
          };

        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          
          // Don't retry for certain error types
          if (lastError instanceof ValidationError || 
              lastError instanceof ServiceError && !lastError.retryable) {
            break;
          }

          this.log('warn', `Operation attempt ${attempt + 1} failed: ${lastError.message}`);
        }
      }

      // All retries exhausted
      const executionTime = Date.now() - startTime;
      this.updateMetrics(false, executionTime, lastError?.message);
      
      const serviceError = lastError instanceof ServiceError 
        ? lastError 
        : new ServiceError(
            lastError?.message || 'Operation failed',
            'EXECUTION_ERROR',
            this.config.name,
            false,
            { original_error: lastError }
          );

      this.emit('operation_failure', {
        service: this.config.name,
        error: serviceError,
        execution_time_ms: executionTime,
        retry_count: retryCount,
      });

      return {
        success: false,
        error: serviceError,
        metadata: {
          execution_time_ms: executionTime,
          cache_hit: cacheHit,
          retry_count: retryCount,
          timestamp: new Date().toISOString(),
        },
      };

    } catch (error) {
      // Catch-all for unexpected errors
      const executionTime = Date.now() - startTime;
      const serviceError = new ServiceError(
        `Unexpected error in ${this.config.name}: ${error instanceof Error ? error.message : 'Unknown'}`,
        'UNEXPECTED_ERROR',
        this.config.name,
        false,
        { original_error: error }
      );

      this.updateMetrics(false, executionTime, serviceError.message);
      this.emit('operation_failure', {
        service: this.config.name,
        error: serviceError,
        execution_time_ms: executionTime,
        retry_count: retryCount,
      });

      return {
        success: false,
        error: serviceError,
        metadata: {
          execution_time_ms: executionTime,
          cache_hit: cacheHit,
          retry_count: retryCount,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // Cache management
  protected setCache(key: string, data: any, ttl_ms: number): void {
    if (!this.config.cache_enabled) return;
    
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl_ms,
    });
  }

  protected getFromCache(key: string): any | null {
    if (!this.config.cache_enabled) return null;
    
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key); // Remove expired entry
    }
    
    return null;
  }

  protected clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Logging
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: any): void {
    if (!this.config.logging_enabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      service: this.config.name,
      level,
      message,
      context,
    };

    // In a real application, you'd use a proper logging library
    console.log(`[${level.toUpperCase()}] ${this.config.name}: ${message}`, context || '');
    
    this.emit('log', logEntry);
  }

  // Metrics management
  private updateMetrics(success: boolean, executionTime: number, error?: string): void {
    if (!this.config.metrics_enabled) return;

    this.metrics.calls_total++;
    
    if (success) {
      this.metrics.calls_successful++;
      this.metrics.last_success_at = new Date().toISOString();
    } else {
      this.metrics.calls_failed++;
      this.metrics.last_failure_at = new Date().toISOString();
      if (error) {
        this.metrics.last_error = error;
      }
    }

    // Update average response time (simple moving average)
    const totalTime = this.metrics.average_response_time_ms * (this.metrics.calls_total - 1) + executionTime;
    this.metrics.average_response_time_ms = totalTime / this.metrics.calls_total;
  }

  // Utility methods
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(
          `Operation timed out after ${timeoutMs}ms`,
          this.config.name,
          timeoutMs
        ));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public interface methods
  public getMetrics(): ServiceMetrics {
    return { ...this.metrics };
  }

  public getConfig(): ServiceConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('config_updated', this.config);
  }

  public async healthCheck(): Promise<{
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: ServiceMetrics;
    issues: string[];
  }> {
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check error rate
    const errorRate = this.metrics.calls_total > 0 
      ? this.metrics.calls_failed / this.metrics.calls_total 
      : 0;

    if (errorRate > 0.5) {
      status = 'unhealthy';
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
    } else if (errorRate > 0.2) {
      status = 'degraded';
      issues.push(`Elevated error rate: ${(errorRate * 100).toFixed(1)}%`);
    }

    // Check response time
    if (this.metrics.average_response_time_ms > 10000) {
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
      issues.push(`Slow response time: ${this.metrics.average_response_time_ms.toFixed(0)}ms`);
    }

    // Check cache size (if enabled)
    if (this.config.cache_enabled && this.cache.size > 10000) {
      issues.push(`Large cache size: ${this.cache.size} entries`);
    }

    return {
      service: this.config.name,
      status,
      metrics: this.getMetrics(),
      issues,
    };
  }

  // Abstract methods that subclasses must implement
  public abstract initialize(): Promise<void>;
  public abstract shutdown(): Promise<void>;
}

// Specialized base classes for common patterns

// Database Service Base
export abstract class BaseDatabaseService extends BaseService {
  protected abstract validateConnection(): Promise<boolean>;
  
  protected async executeQuery<T>(
    query: () => Promise<T>,
    options: {
      cache_key?: string;
      cache_ttl_ms?: number;
      validate_result?: (result: T) => void;
    } = {}
  ): Promise<ServiceResult<T>> {
    return this.execute(query, {
      ...options,
      validate_input: async () => {
        const isConnected = await this.validateConnection();
        if (!isConnected) {
          throw new ServiceError('Database connection not available', 'CONNECTION_ERROR', this.config.name, true);
        }
      },
    });
  }
}

// API Service Base
export abstract class BaseAPIService extends BaseService {
  protected abstract getBaseUrl(): string;
  protected abstract getDefaultHeaders(): Record<string, string>;
  
  protected async makeRequest<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
      cache_key?: string;
      cache_ttl_ms?: number;
    } = {}
  ): Promise<ServiceResult<T>> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const headers = { ...this.getDefaultHeaders(), ...options.headers };
    
    return this.execute(
      async () => {
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
          throw new ServiceError(
            `HTTP ${response.status}: ${response.statusText}`,
            'HTTP_ERROR',
            this.config.name,
            response.status >= 500 // Server errors are retryable
          );
        }

        return response.json();
      },
      {
        cache_key: options.cache_key,
        cache_ttl_ms: options.cache_ttl_ms,
      }
    );
  }
}

export default BaseService;