import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
    DatabaseType,
    MultiTenantManager,
    PostgreSQLCredentials,
    TenantConfig
} from 'nodejs-db-multitenant';

@Injectable()
export class MultiTenantDatabaseService implements OnModuleInit, OnModuleDestroy {
  private multiTenantManager: MultiTenantManager;
  private tenantConfigs: Map<string, TenantConfig> = new Map();

  constructor() {
    // Initialize the multi-tenant manager with configuration
    this.multiTenantManager = new MultiTenantManager({
      enableLogging: true,
      logLevel: 'info',
      enableConnectionPooling: true,
      defaultOptions: {
        maxConnections: 20,
        connectionTimeout: 10000,
        idleTimeout: 60000,
        retryAttempts: 3,
        retryDelay: 2000
      }
    });

    // Initialize tenant configurations
    this.initializeTenantConfigs();
  }

  async onModuleInit() {
    // Initialize connections for all tenants
    await this.initializeAllConnections();
  }

  async onModuleDestroy() {
    // Close all connections when the module is destroyed
    await this.multiTenantManager.closeAllConnections();
  }

  /**
   * Initialize tenant configurations
   */
  private initializeTenantConfigs(): void {
    // Example tenant configurations
    const tenants = [
      {
        id: 'tenant1',
        config: {
          tenantId: 'tenant1',
          databaseType: DatabaseType.POSTGRESQL,
          credentials: {
            host: 'localhost',
            port: 5432,
            username: 'tenant1_user',
            password: 'tenant1_password',
            database: 'tenant1_db',
            schema: 'tenant1_schema',
            ssl: false
          } as PostgreSQLCredentials
        }
      },
      {
        id: 'tenant2',
        config: {
          tenantId: 'tenant2',
          databaseType: DatabaseType.POSTGRESQL,
          credentials: {
            host: 'localhost',
            port: 5432,
            username: 'tenant2_user',
            password: 'tenant2_password',
            database: 'tenant2_db',
            schema: 'tenant2_schema',
            ssl: false
          } as PostgreSQLCredentials
        }
      }
    ];

    tenants.forEach(tenant => {
      this.tenantConfigs.set(tenant.id, tenant.config);
    });
  }

  /**
   * Initialize connections for all tenants
   */
  private async initializeAllConnections(): Promise<void> {
    try {
      for (const [tenantId, config] of this.tenantConfigs) {
        await this.multiTenantManager.getConnection(tenantId, config);
        console.log(`Initialized connection for tenant: ${tenantId}`);
      }
    } catch (error) {
      console.error('Failed to initialize tenant connections:', error);
      throw error;
    }
  }

  /**
   * Get database connection for a specific tenant
   */
  async getTenantConnection(tenantId: string): Promise<any> {
    const config = this.tenantConfigs.get(tenantId);
    if (!config) {
      throw new Error(`Tenant configuration not found for: ${tenantId}`);
    }

    return this.multiTenantManager.getConnection(tenantId, config);
  }

  /**
   * Add a new tenant configuration
   */
  async addTenant(tenantConfig: TenantConfig): Promise<void> {
    // Validate the configuration
    if (this.tenantConfigs.has(tenantConfig.tenantId)) {
      throw new Error(`Tenant already exists: ${tenantConfig.tenantId}`);
    }

    // Store the configuration
    this.tenantConfigs.set(tenantConfig.tenantId, tenantConfig);

    // Initialize the connection
    await this.multiTenantManager.getConnection(tenantConfig.tenantId, tenantConfig);
  }

  /**
   * Remove a tenant and close its connection
   */
  async removeTenant(tenantId: string): Promise<void> {
    if (!this.tenantConfigs.has(tenantId)) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Close the connection
    await this.multiTenantManager.closeConnection(tenantId);

    // Remove the configuration
    this.tenantConfigs.delete(tenantId);
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return this.multiTenantManager.getConnectionStats();
  }

  /**
   * Check if a tenant connection exists
   */
  hasTenantConnection(tenantId: string): boolean {
    return this.multiTenantManager.hasConnection(tenantId);
  }

  /**
   * Get all tenant IDs
   */
  getAllTenantIds(): string[] {
    return Array.from(this.tenantConfigs.keys());
  }

  /**
   * Update tenant configuration
   */
  async updateTenant(tenantId: string, newConfig: Partial<TenantConfig>): Promise<void> {
    const existingConfig = this.tenantConfigs.get(tenantId);
    if (!existingConfig) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Close existing connection
    await this.multiTenantManager.closeConnection(tenantId);

    // Update configuration
    const updatedConfig = { ...existingConfig, ...newConfig };
    this.tenantConfigs.set(tenantId, updatedConfig);

    // Initialize new connection
    await this.multiTenantManager.getConnection(tenantId, updatedConfig);
  }

  /**
   * Test connection for a specific tenant
   */
  async testTenantConnection(tenantId: string): Promise<boolean> {
    try {
      const connection = await this.getTenantConnection(tenantId);
      if (connection && connection.isInitialized) {
        await connection.query('SELECT 1');
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup inactive connections
   */
  async cleanupInactiveConnections(): Promise<void> {
    await this.multiTenantManager.cleanupInactiveConnections();
  }
}

// Example usage in a NestJS controller or service
@Injectable()
export class UserService {
  constructor(private multiTenantDbService: MultiTenantDatabaseService) {}

  async createUser(tenantId: string, userData: any): Promise<any> {
    try {
      const connection = await this.multiTenantDbService.getTenantConnection(tenantId);
      
      // Use the connection to create a user
      const result = await connection.query(
        'INSERT INTO users (name, email, created_at) VALUES ($1, $2, $3) RETURNING *',
        [userData.name, userData.email, new Date()]
      );

      return result[0];
    } catch (error) {
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUsers(tenantId: string): Promise<any[]> {
    try {
      const connection = await this.multiTenantDbService.getTenantConnection(tenantId);
      
      // Use the connection to get users
      const result = await connection.query('SELECT * FROM users ORDER BY created_at DESC');
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
