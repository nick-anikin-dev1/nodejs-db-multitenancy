import { ConnectorFactory } from '../factories/connector-factory';
import { ConnectionOptions, DatabaseType, TenantConfig } from '../types';

export class ConnectionValidator {
  /**
   * Validate tenant configuration
   */
  public static validateTenantConfig(config: TenantConfig): boolean {
    try {
      // Validate basic structure
      if (!config.tenantId || typeof config.tenantId !== 'string') {
        throw new Error('Tenant ID must be a non-empty string');
      }

      if (!config.databaseType) {
        throw new Error('Database type is required');
      }

      if (!config.credentials) {
        throw new Error('Database credentials are required');
      }

      // Validate database type
      if (!ConnectorFactory.isDatabaseTypeSupported(config.databaseType)) {
        throw new Error(`Unsupported database type: ${config.databaseType}`);
      }

      // Validate credentials
      ConnectorFactory.validateCredentials(config.databaseType, config.credentials);

      return true;
    } catch (error) {
      throw new Error(`Invalid tenant configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate connection options
   */
  public static validateConnectionOptions(options: ConnectionOptions): boolean {
    try {
      if (options.maxConnections !== undefined) {
        if (typeof options.maxConnections !== 'number' || options.maxConnections < 1) {
          throw new Error('maxConnections must be a positive number');
        }
      }

      if (options.connectionTimeout !== undefined) {
        if (typeof options.connectionTimeout !== 'number' || options.connectionTimeout < 0) {
          throw new Error('connectionTimeout must be a non-negative number');
        }
      }

      if (options.idleTimeout !== undefined) {
        if (typeof options.idleTimeout !== 'number' || options.idleTimeout < 0) {
          throw new Error('idleTimeout must be a non-negative number');
        }
      }

      if (options.retryAttempts !== undefined) {
        if (typeof options.retryAttempts !== 'number' || options.retryAttempts < 0) {
          throw new Error('retryAttempts must be a non-negative number');
        }
      }

      if (options.retryDelay !== undefined) {
        if (typeof options.retryDelay !== 'number' || options.retryDelay < 0) {
          throw new Error('retryDelay must be a non-negative number');
        }
      }

      return true;
    } catch (error) {
      throw new Error(`Invalid connection options: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate MongoDB-specific credentials
   */
  public static validateMongoDBCredentials(credentials: any): boolean {
    try {
      // Basic validation is handled by validateTenantConfig
      // Additional MongoDB-specific validation can be added here
      
      if (credentials.port !== 27017 && credentials.port !== 27018 && credentials.port !== 27019) {
        console.warn('Warning: Non-standard MongoDB port detected');
      }

      return true;
    } catch (error) {
      throw new Error(`Invalid MongoDB credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate PostgreSQL-specific credentials
   */
  public static validatePostgreSQLCredentials(credentials: any): boolean {
    try {
      // Basic validation is handled by validateTenantConfig
      // Additional PostgreSQL-specific validation can be added here
      
      if (credentials.port !== 5432 && credentials.port !== 5433) {
        console.warn('Warning: Non-standard PostgreSQL port detected');
      }

      return true;
    } catch (error) {
      throw new Error(`Invalid PostgreSQL credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate multiple tenant configurations
   */
  public static validateMultipleTenantConfigs(configs: TenantConfig[]): boolean {
    try {
      const tenantIds = new Set<string>();

      for (const config of configs) {
        this.validateTenantConfig(config);
        
        if (tenantIds.has(config.tenantId)) {
          throw new Error(`Duplicate tenant ID found: ${config.tenantId}`);
        }
        
        tenantIds.add(config.tenantId);
      }

      return true;
    } catch (error) {
      throw new Error(`Invalid tenant configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a connection string is valid
   */
  public static isValidConnectionString(connectionString: string, databaseType: DatabaseType): boolean {
    try {
      if (!connectionString || typeof connectionString !== 'string') {
        return false;
      }

      switch (databaseType) {
        case DatabaseType.MONGODB:
          return connectionString.startsWith('mongodb://') || connectionString.startsWith('mongodb+srv://');
        
        case DatabaseType.POSTGRESQL:
          return connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://');
        
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }
}
