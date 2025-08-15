import { BaseConnector } from './connectors/base-connector';
import { MongoDBConnector } from './connectors/mongodb-connector';
import { PostgreSQLConnector } from './connectors/postgresql-connector';
import {
    ConnectionInfo,
    ConnectionOptions,
    DatabaseType,
    MongoDBCredentials,
    MultiTenantConfig,
    PostgreSQLCredentials,
    TenantConfig
} from './types';

export class MultiTenantManager {
  private connections: Map<string, ConnectionInfo> = new Map();
  private config: MultiTenantConfig;
  private defaultOptions: ConnectionOptions;

  constructor(config: MultiTenantConfig = {}) {
    const defaultConfig = {
      enableConnectionPooling: true,
      enableLogging: true,
      logLevel: 'info' as const,
      defaultOptions: {
        maxConnections: 10,
        connectionTimeout: 5000,
        idleTimeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
      }
    };

    this.config = {
      ...defaultConfig,
      ...config,
      defaultOptions: {
        ...defaultConfig.defaultOptions,
        ...config.defaultOptions
      }
    };
    
    this.defaultOptions = {
      ...this.config.defaultOptions
    };
  }

  /**
   * Get or create a database connection for a tenant
   */
  public async getConnection(tenantId: string, tenantConfig: TenantConfig): Promise<any> {
    try {
      // Check if connection already exists and is active
      const existingConnection = this.connections.get(tenantId);
      if (existingConnection && existingConnection.isActive) {
        // Update last used timestamp
        existingConnection.lastUsed = new Date();
        
        // Test if connection is still alive
        if (await this.testConnection(existingConnection.connection, tenantConfig.databaseType)) {
          this.log('info', `Returning existing connection for tenant: ${tenantId}`);
          return existingConnection.connection;
        } else {
          this.log('warn', `Existing connection for tenant ${tenantId} is not responding, removing it`);
          this.connections.delete(tenantId);
        }
      }

      // Create new connection
      this.log('info', `Creating new connection for tenant: ${tenantId}`);
      const connector = await this.createConnector(tenantConfig);
      const connection = await connector.connect();

      // Store connection info
      const connectionInfo: ConnectionInfo = {
        tenantId,
        databaseType: tenantConfig.databaseType,
        connection,
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: true
      };

      this.connections.set(tenantId, connectionInfo);
      this.log('info', `Successfully created connection for tenant: ${tenantId}`);

      return connection;
    } catch (error) {
      this.log('error', `Failed to get connection for tenant ${tenantId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Create a database connector based on tenant configuration
   */
  private async createConnector(tenantConfig: TenantConfig): Promise<BaseConnector> {
    const options = {
      ...this.defaultOptions,
      ...tenantConfig.credentials.options
    };

    switch (tenantConfig.databaseType) {
      case DatabaseType.MONGODB:
        return new MongoDBConnector(tenantConfig.credentials as MongoDBCredentials, options);
      
      case DatabaseType.POSTGRESQL:
        return new PostgreSQLConnector(tenantConfig.credentials as PostgreSQLCredentials, options);
      
      default:
        throw new Error(`Unsupported database type: ${tenantConfig.databaseType}`);
    }
  }

  /**
   * Test if a connection is still alive
   */
  private async testConnection(connection: any, databaseType: DatabaseType): Promise<boolean> {
    try {
      switch (databaseType) {
        case DatabaseType.MONGODB:
          // For Mongoose connection
          if (connection && connection.db) {
            await connection.db.admin().ping();
            return true;
          }
          break;
        
        case DatabaseType.POSTGRESQL:
          // For TypeORM DataSource
          if (connection && connection.isInitialized) {
            await connection.query('SELECT 1');
            return true;
          }
          break;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a connection exists for a tenant
   */
  public hasConnection(tenantId: string): boolean {
    const connectionInfo = this.connections.get(tenantId);
    return connectionInfo !== undefined && connectionInfo.isActive;
  }

  /**
   * Get connection information for a tenant
   */
  public getConnectionInfo(tenantId: string): ConnectionInfo | undefined {
    return this.connections.get(tenantId);
  }

  /**
   * Get all active connections
   */
  public getAllConnections(): Map<string, ConnectionInfo> {
    return new Map(this.connections);
  }

  /**
   * Get active connections count
   */
  public getActiveConnectionsCount(): number {
    let count = 0;
    for (const connectionInfo of this.connections.values()) {
      if (connectionInfo.isActive) {
        count++;
      }
    }
    return count;
  }

  /**
   * Close a specific tenant connection
   */
  public async closeConnection(tenantId: string): Promise<void> {
    const connectionInfo = this.connections.get(tenantId);
    if (connectionInfo) {
      try {
        if (connectionInfo.connection) {
          // Try to disconnect based on database type
          if (connectionInfo.databaseType === DatabaseType.MONGODB) {
            if (connectionInfo.connection.close) {
              await connectionInfo.connection.close();
            }
          } else if (connectionInfo.databaseType === DatabaseType.POSTGRESQL) {
            if (connectionInfo.connection.destroy) {
              await connectionInfo.connection.destroy();
            }
          }
        }
        
        this.connections.delete(tenantId);
        this.log('info', `Closed connection for tenant: ${tenantId}`);
      } catch (error) {
        this.log('error', `Error closing connection for tenant ${tenantId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Remove from map even if disconnect fails
        this.connections.delete(tenantId);
      }
    }
  }

  /**
   * Close all connections
   */
  public async closeAllConnections(): Promise<void> {
    const tenantIds = Array.from(this.connections.keys());
    
    for (const tenantId of tenantIds) {
      await this.closeConnection(tenantId);
    }
    
    this.log('info', 'All connections closed');
  }

  /**
   * Remove inactive connections (cleanup)
   */
  public async cleanupInactiveConnections(maxIdleTime: number = 300000): Promise<void> { // 5 minutes default
    const now = new Date();
    const tenantIdsToRemove: string[] = [];

    for (const [tenantId, connectionInfo] of this.connections.entries()) {
      const idleTime = now.getTime() - connectionInfo.lastUsed.getTime();
      if (idleTime > maxIdleTime) {
        tenantIdsToRemove.push(tenantId);
      }
    }

    for (const tenantId of tenantIdsToRemove) {
      await this.closeConnection(tenantId);
    }

    if (tenantIdsToRemove.length > 0) {
      this.log('info', `Cleaned up ${tenantIdsToRemove.length} inactive connections`);
    }
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats(): {
    totalConnections: number;
    activeConnections: number;
    databaseTypes: Record<DatabaseType, number>;
    oldestConnection: Date | null;
    newestConnection: Date | null;
  } {
    const stats = {
      totalConnections: this.connections.size,
      activeConnections: this.getActiveConnectionsCount(),
      databaseTypes: {
        [DatabaseType.MONGODB]: 0,
        [DatabaseType.POSTGRESQL]: 0
      },
      oldestConnection: null as Date | null,
      newestConnection: null as Date | null
    };

    for (const connectionInfo of this.connections.values()) {
      stats.databaseTypes[connectionInfo.databaseType]++;
      
      if (!stats.oldestConnection || connectionInfo.createdAt < stats.oldestConnection) {
        stats.oldestConnection = connectionInfo.createdAt;
      }
      
      if (!stats.newestConnection || connectionInfo.createdAt > stats.newestConnection) {
        stats.newestConnection = connectionInfo.createdAt;
      }
    }

    return stats;
  }

  /**
   * Log messages based on configuration
   */
  private log(level: string, message: string): void {
    if (!this.config.enableLogging) return;

    const timestamp = new Date().toISOString();
    const logMessage = `[MultiTenantManager] [${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'info':
        console.log(logMessage);
        break;
      case 'debug':
        if (this.config.logLevel === 'debug') {
          console.log(logMessage);
        }
        break;
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MultiTenantConfig>): void {
    this.config = { 
      ...this.config, 
      ...newConfig,
      defaultOptions: {
        ...this.config.defaultOptions,
        ...newConfig.defaultOptions
      }
    };
    this.defaultOptions = { ...this.config.defaultOptions };
    this.log('info', 'Configuration updated');
  }

  /**
   * Get current configuration
   */
  public getConfig(): MultiTenantConfig {
    return { ...this.config };
  }
}
