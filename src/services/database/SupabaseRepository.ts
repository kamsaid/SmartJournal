// Consolidated Supabase Repository with Repository Pattern
// Provides standardized database operations for all entities

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '@/constants/config';
import { BaseDatabaseService, ServiceResult, ServiceError } from '../base/BaseService';
import { IRepository } from '../interfaces/ServiceInterfaces';

// Repository-specific error types
export class DatabaseError extends ServiceError {
  constructor(message: string, code: string, context?: any) {
    super(message, code, 'supabase_repository', false, context);
    this.name = 'DatabaseError';
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR');
    this.name = 'ConnectionError';
  }
}

export class QueryError extends DatabaseError {
  constructor(message: string, query?: string, params?: any) {
    super(message, 'QUERY_ERROR', { query, params });
    this.name = 'QueryError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string, validation_errors: string[]) {
    super(message, 'VALIDATION_ERROR', { validation_errors });
    this.name = 'ValidationError';
  }
}

// Base Supabase Repository
export abstract class BaseSupabaseRepository<TEntity, TKey = string> 
  extends BaseDatabaseService 
  implements IRepository<TEntity, TKey> {
  
  protected client: SupabaseClient;
  protected abstract tableName: string;

  constructor(tableName?: string) {
    super({
      name: `supabase_repository_${tableName || 'base'}`,
      version: '1.0.0',
      timeout_ms: 30000,
      retry_attempts: 3,
      cache_enabled: true,
      logging_enabled: true,
    });

    this.client = createClient(config.supabase.url, config.supabase.anonKey);
    if (tableName) {
      this.tableName = tableName;
    }
  }

  async initialize(): Promise<void> {
    // Test connection
    const isConnected = await this.validateConnection();
    if (!isConnected) {
      throw new ConnectionError('Failed to connect to Supabase');
    }
    this.log('info', `Initialized repository for table: ${this.tableName}`);
  }

  async shutdown(): Promise<void> {
    // Supabase client doesn't need explicit shutdown
    this.log('info', `Shutdown repository for table: ${this.tableName}`);
  }

  protected async validateConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .limit(1);
      
      return !error;
    } catch (error) {
      this.log('error', 'Connection validation failed', error);
      return false;
    }
  }

  // Repository interface implementation
  async findById(id: TKey): Promise<ServiceResult<TEntity | null>> {
    return this.executeQuery(
      async () => {
        const { data, error } = await this.client
          .from(this.tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
          throw new QueryError(`Failed to find record by id: ${error.message}`, 'findById', { id });
        }

        return data as TEntity | null;
      },
      {
        cache_key: `${this.tableName}_find_${String(id)}`,
        cache_ttl_ms: 5 * 60 * 1000, // 5 minutes
      }
    );
  }

  async findMany(criteria: Partial<TEntity>): Promise<ServiceResult<TEntity[]>> {
    return this.executeQuery(
      async () => {
        let query = this.client.from(this.tableName).select('*');

        // Apply criteria
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        const { data, error } = await query;

        if (error) {
          throw new QueryError(`Failed to find records: ${error.message}`, 'findMany', criteria);
        }

        return (data as TEntity[]) || [];
      },
      {
        cache_key: `${this.tableName}_find_many_${JSON.stringify(criteria).slice(0, 50)}`,
        cache_ttl_ms: 2 * 60 * 1000, // 2 minutes
      }
    );
  }

  async create(entity: Omit<TEntity, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResult<TEntity>> {
    return this.executeQuery(
      async () => {
        const now = new Date().toISOString();
        const entityWithTimestamps = {
          ...entity,
          created_at: now,
          updated_at: now,
        };

        const { data, error } = await this.client
          .from(this.tableName)
          .insert([entityWithTimestamps])
          .select()
          .single();

        if (error) {
          throw new QueryError(`Failed to create record: ${error.message}`, 'create', entity);
        }

        // Clear related cache
        this.clearCache(this.tableName);

        return data as TEntity;
      },
      {
        validate_input: () => this.validateEntity(entity),
      }
    );
  }

  async update(id: TKey, updates: Partial<TEntity>): Promise<ServiceResult<TEntity>> {
    return this.executeQuery(
      async () => {
        const updatesWithTimestamp = {
          ...updates,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await this.client
          .from(this.tableName)
          .update(updatesWithTimestamp)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw new QueryError(`Failed to update record: ${error.message}`, 'update', { id, updates });
        }

        // Clear related cache
        this.clearCache(this.tableName);

        return data as TEntity;
      },
      {
        validate_input: () => this.validatePartialEntity(updates),
      }
    );
  }

  async delete(id: TKey): Promise<ServiceResult<boolean>> {
    return this.executeQuery(
      async () => {
        const { error } = await this.client
          .from(this.tableName)
          .delete()
          .eq('id', id);

        if (error) {
          throw new QueryError(`Failed to delete record: ${error.message}`, 'delete', { id });
        }

        // Clear related cache
        this.clearCache(this.tableName);

        return true;
      }
    );
  }

  async exists(id: TKey): Promise<ServiceResult<boolean>> {
    return this.executeQuery(
      async () => {
        const { data, error } = await this.client
          .from(this.tableName)
          .select('id')
          .eq('id', id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw new QueryError(`Failed to check existence: ${error.message}`, 'exists', { id });
        }

        return !!data;
      },
      {
        cache_key: `${this.tableName}_exists_${String(id)}`,
        cache_ttl_ms: 30 * 1000, // 30 seconds
      }
    );
  }

  // Additional utility methods
  async count(criteria?: Partial<TEntity>): Promise<ServiceResult<number>> {
    return this.executeQuery(
      async () => {
        let query = this.client
          .from(this.tableName)
          .select('*', { count: 'exact', head: true });

        if (criteria) {
          Object.entries(criteria).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }

        const { count, error } = await query;

        if (error) {
          throw new QueryError(`Failed to count records: ${error.message}`, 'count', criteria);
        }

        return count || 0;
      },
      {
        cache_key: `${this.tableName}_count_${JSON.stringify(criteria || {}).slice(0, 50)}`,
        cache_ttl_ms: 60 * 1000, // 1 minute
      }
    );
  }

  async findWithPagination(
    criteria: Partial<TEntity>,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ServiceResult<{
    data: TEntity[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>> {
    return this.executeQuery(
      async () => {
        const offset = (page - 1) * pageSize;
        
        let query = this.client
          .from(this.tableName)
          .select('*', { count: 'exact' })
          .range(offset, offset + pageSize - 1);

        // Apply criteria
        Object.entries(criteria).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        const { data, count, error } = await query;

        if (error) {
          throw new QueryError(`Failed to paginate records: ${error.message}`, 'findWithPagination', {
            criteria,
            page,
            pageSize,
          });
        }

        const total = count || 0;
        const totalPages = Math.ceil(total / pageSize);

        return {
          data: (data as TEntity[]) || [],
          total,
          page,
          pageSize,
          totalPages,
        };
      }
    );
  }

  async executeRawQuery<T>(
    query: string,
    params?: any[]
  ): Promise<ServiceResult<T>> {
    return this.executeQuery(
      async () => {
        const { data, error } = await this.client.rpc('execute_sql', {
          query_text: query,
          query_params: params || [],
        });

        if (error) {
          throw new QueryError(`Raw query failed: ${error.message}`, query, params);
        }

        return data as T;
      }
    );
  }

  // Batch operations
  async createMany(entities: Omit<TEntity, 'id' | 'created_at' | 'updated_at'>[]): Promise<ServiceResult<TEntity[]>> {
    return this.executeQuery(
      async () => {
        const now = new Date().toISOString();
        const entitiesWithTimestamps = entities.map(entity => ({
          ...entity,
          created_at: now,
          updated_at: now,
        }));

        const { data, error } = await this.client
          .from(this.tableName)
          .insert(entitiesWithTimestamps)
          .select();

        if (error) {
          throw new QueryError(`Failed to create records: ${error.message}`, 'createMany', entities);
        }

        // Clear related cache
        this.clearCache(this.tableName);

        return (data as TEntity[]) || [];
      },
      {
        validate_input: () => {
          entities.forEach(entity => this.validateEntity(entity));
        },
      }
    );
  }

  async deleteMany(ids: TKey[]): Promise<ServiceResult<boolean>> {
    return this.executeQuery(
      async () => {
        const { error } = await this.client
          .from(this.tableName)
          .delete()
          .in('id', ids);

        if (error) {
          throw new QueryError(`Failed to delete records: ${error.message}`, 'deleteMany', { ids });
        }

        // Clear related cache
        this.clearCache(this.tableName);

        return true;
      }
    );
  }

  // Transaction support
  async withTransaction<T>(
    operations: (client: SupabaseClient) => Promise<T>
  ): Promise<ServiceResult<T>> {
    return this.executeQuery(async () => {
      // Supabase doesn't have explicit transactions, but we can use RPC for atomic operations
      // For now, we'll execute the operations directly
      return await operations(this.client);
    });
  }

  // Validation methods (to be overridden by specific repositories)
  protected validateEntity(entity: any): void {
    // Base validation - override in specific repositories
    if (!entity || typeof entity !== 'object') {
      throw new ValidationError('Entity must be a valid object', ['Invalid entity structure']);
    }
  }

  protected validatePartialEntity(entity: any): void {
    // Base validation for partial updates
    if (!entity || typeof entity !== 'object') {
      throw new ValidationError('Entity updates must be a valid object', ['Invalid update structure']);
    }
  }

  // Utility methods
  protected buildCacheKey(operation: string, params?: any): string {
    const paramString = params ? JSON.stringify(params).slice(0, 100) : '';
    return `${this.tableName}_${operation}_${paramString}`;
  }

  protected handleSupabaseError(error: any, operation: string, context?: any): never {
    const errorMessage = error?.message || 'Unknown database error';
    
    if (error?.code === 'PGRST301') {
      throw new ValidationError('Invalid request format', [errorMessage]);
    }
    
    if (error?.code?.startsWith('23')) { // PostgreSQL constraint violations
      throw new ValidationError('Database constraint violation', [errorMessage]);
    }
    
    throw new QueryError(`${operation} failed: ${errorMessage}`, operation, context);
  }
}

// Specific repository implementations

// User Repository
export class UserRepository extends BaseSupabaseRepository<any, string> {
  protected tableName = 'users';

  async findByEmail(email: string): Promise<ServiceResult<any | null>> {
    return this.executeQuery(
      async () => {
        const { data, error } = await this.client
          .from(this.tableName)
          .select('*')
          .eq('email', email)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw new QueryError(`Failed to find user by email: ${error.message}`, 'findByEmail', { email });
        }

        return data;
      },
      {
        cache_key: `users_by_email_${email}`,
        cache_ttl_ms: 5 * 60 * 1000,
      }
    );
  }

  async findByPhase(phase: number): Promise<ServiceResult<any[]>> {
    return this.executeQuery(
      async () => {
        const { data, error } = await this.client
          .from(this.tableName)
          .select('*')
          .eq('current_phase', phase);

        if (error) {
          throw new QueryError(`Failed to find users by phase: ${error.message}`, 'findByPhase', { phase });
        }

        return data || [];
      },
      {
        cache_key: `users_by_phase_${phase}`,
        cache_ttl_ms: 10 * 60 * 1000,
      }
    );
  }

  protected validateEntity(entity: any): void {
    super.validateEntity(entity);
    
    const errors: string[] = [];
    
    if (!entity.email || typeof entity.email !== 'string') {
      errors.push('Email is required and must be a string');
    }
    
    if (!entity.current_phase || typeof entity.current_phase !== 'number') {
      errors.push('Current phase is required and must be a number');
    }
    
    if (errors.length > 0) {
      throw new ValidationError('User validation failed', errors);
    }
  }
}

// Daily Reflection Repository
export class DailyReflectionRepository extends BaseSupabaseRepository<any, string> {
  protected tableName = 'daily_reflections';

  async findByUserAndDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<any[]>> {
    return this.executeQuery(
      async () => {
        const { data, error } = await this.client
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false });

        if (error) {
          throw new QueryError(`Failed to find reflections by date range: ${error.message}`, 'findByUserAndDateRange', {
            userId,
            startDate,
            endDate,
          });
        }

        return data || [];
      },
      {
        cache_key: `reflections_${userId}_${startDate}_${endDate}`,
        cache_ttl_ms: 2 * 60 * 1000,
      }
    );
  }

  async findRecentByUser(userId: string, limit: number = 10): Promise<ServiceResult<any[]>> {
    return this.executeQuery(
      async () => {
        const { data, error } = await this.client
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          throw new QueryError(`Failed to find recent reflections: ${error.message}`, 'findRecentByUser', {
            userId,
            limit,
          });
        }

        return data || [];
      },
      {
        cache_key: `recent_reflections_${userId}_${limit}`,
        cache_ttl_ms: 1 * 60 * 1000,
      }
    );
  }
}

// Pattern Repository
export class PatternRepository extends BaseSupabaseRepository<any, string> {
  protected tableName = 'patterns';

  async findByUserAndType(userId: string, patternType: string): Promise<ServiceResult<any[]>> {
    return this.executeQuery(
      async () => {
        const { data, error } = await this.client
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId)
          .eq('pattern_type', patternType)
          .order('created_at', { ascending: false });

        if (error) {
          throw new QueryError(`Failed to find patterns by type: ${error.message}`, 'findByUserAndType', {
            userId,
            patternType,
          });
        }

        return data || [];
      }
    );
  }
}

// Export repository instances
export const userRepository = new UserRepository();
export const dailyReflectionRepository = new DailyReflectionRepository();
export const patternRepository = new PatternRepository();

// Export factory function for creating custom repositories
export function createRepository<T, K = string>(tableName: string): BaseSupabaseRepository<T, K> {
  return new (class extends BaseSupabaseRepository<T, K> {
    protected tableName = tableName;
  })();
}

export default BaseSupabaseRepository;