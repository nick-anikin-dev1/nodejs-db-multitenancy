/// <reference types="jest" />

import { MultiTenantManager } from '../src/multi-tenant-manager';
import { DatabaseType, MongoDBCredentials, PostgreSQLCredentials, TenantConfig } from '../src/types';

// Mock the connector classes to avoid actual database connections
jest.mock('../src/connectors/mongodb-connector');
jest.mock('../src/connectors/postgresql-connector');

describe('MultiTenantManager', () => {
  let manager: MultiTenantManager;
  let mockMongoConnector: any;
  let mockPostgresConnector: any;

  const mockMongoConnection = {
    db: {
      admin: () => ({
        ping: jest.fn().mockResolvedValue(true)
      })
    },
    close: jest.fn().mockResolvedValue(undefined)
  };

  const mockPostgresConnection = {
    isInitialized: true,
    query: jest.fn().mockResolvedValue([{ result: 'ok' }]),
    destroy: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create manager instance
    manager = new MultiTenantManager({
      enableLogging: false, // Disable logging for tests
      enableConnectionPooling: true
    });

    // Mock connector constructors
    const { MongoDBConnector } = require('../src/connectors/mongodb-connector');
    const { PostgreSQLConnector } = require('../src/connectors/postgresql-connector');

    mockMongoConnector = {
      connect: jest.fn().mockResolvedValue(mockMongoConnection),
      disconnect: jest.fn().mockResolvedValue(undefined),
      testConnection: jest.fn().mockResolvedValue(true),
      getConnectionInfo: jest.fn().mockResolvedValue({}),
      ping: jest.fn().mockResolvedValue(true)
    };

    mockPostgresConnector = {
      connect: jest.fn().mockResolvedValue(mockPostgresConnection),
      disconnect: jest.fn().mockResolvedValue(undefined),
      testConnection: jest.fn().mockResolvedValue(true),
      getConnectionInfo: jest.fn().mockResolvedValue({}),
      ping: jest.fn().mockResolvedValue(true)
    };

    MongoDBConnector.mockImplementation(() => mockMongoConnector);
    PostgreSQLConnector.mockImplementation(() => mockPostgresConnector);
  });

  describe('Constructor', () => {
    it('should create instance with default configuration', () => {
      const defaultManager = new MultiTenantManager();
      const config = defaultManager.getConfig();
      
      expect(config.enableConnectionPooling).toBe(true);
      expect(config.enableLogging).toBe(true);
      expect(config.logLevel).toBe('info');
      expect(config.defaultOptions?.maxConnections).toBe(10);
    });

    it('should create instance with custom configuration', () => {
      const customManager = new MultiTenantManager({
        enableLogging: false,
        logLevel: 'debug',
        defaultOptions: {
          maxConnections: 25,
          connectionTimeout: 15000
        }
      });
      
      const config = customManager.getConfig();
      expect(config.enableLogging).toBe(false);
      expect(config.logLevel).toBe('debug');
      expect(config.defaultOptions?.maxConnections).toBe(25);
      expect(config.defaultOptions?.connectionTimeout).toBe(15000);
    });
  });

  describe('getConnection', () => {
    const mongoConfig: TenantConfig = {
      tenantId: 'mongo_tenant',
      databaseType: DatabaseType.MONGODB,
      credentials: {
        host: 'localhost',
        port: 27017,
        username: 'user',
        password: 'pass',
        database: 'testdb'
      } as MongoDBCredentials
    };

    const postgresConfig: TenantConfig = {
      tenantId: 'postgres_tenant',
      databaseType: DatabaseType.POSTGRESQL,
      credentials: {
        host: 'localhost',
        port: 5432,
        username: 'user',
        password: 'pass',
        database: 'testdb'
      } as PostgreSQLCredentials
    };

    it('should create new MongoDB connection', async () => {
      const connection = await manager.getConnection('mongo_tenant', mongoConfig);
      
      expect(connection).toBe(mockMongoConnection);
      expect(mockMongoConnector.connect).toHaveBeenCalledTimes(1);
      expect(manager.hasConnection('mongo_tenant')).toBe(true);
    });

    it('should create new PostgreSQL connection', async () => {
      const connection = await manager.getConnection('postgres_tenant', postgresConfig);
      
      expect(connection).toBe(mockPostgresConnection);
      expect(mockPostgresConnector.connect).toHaveBeenCalledTimes(1);
      expect(manager.hasConnection('postgres_tenant')).toBe(true);
    });

    it('should return existing connection if available and active', async () => {
      // Create initial connection
      await manager.getConnection('mongo_tenant', mongoConfig);
      
      // Mock the connection test to return true (active)
      jest.spyOn(manager as any, 'testConnection').mockResolvedValue(true);
      
      // Get connection again
      const connection = await manager.getConnection('mongo_tenant', mongoConfig);
      
      expect(connection).toBe(mockMongoConnection);
      expect(mockMongoConnector.connect).toHaveBeenCalledTimes(1); // Should not create new connection
    });

    it('should create new connection if existing connection is inactive', async () => {
      // Create initial connection
      await manager.getConnection('mongo_tenant', mongoConfig);
      
      // Mock the connection test to return false (inactive)
      jest.spyOn(manager as any, 'testConnection').mockResolvedValue(false);
      
      // Get connection again
      const connection = await manager.getConnection('mongo_tenant', mongoConfig);
      
      expect(connection).toBe(mockMongoConnection);
      expect(mockMongoConnector.connect).toHaveBeenCalledTimes(2); // Should create new connection
    });

    it('should throw error for unsupported database type', async () => {
      const invalidConfig = {
        ...mongoConfig,
        databaseType: 'invalid' as DatabaseType
      };

      await expect(manager.getConnection('invalid_tenant', invalidConfig))
        .rejects.toThrow('Unsupported database type: invalid');
    });
  });

  describe('Connection Management', () => {
    const mongoConfig: TenantConfig = {
      tenantId: 'test_tenant',
      databaseType: DatabaseType.MONGODB,
      credentials: {
        host: 'localhost',
        port: 27017,
        username: 'user',
        password: 'pass',
        database: 'testdb'
      } as MongoDBCredentials
    };

    beforeEach(async () => {
      await manager.getConnection('test_tenant', mongoConfig);
    });

    it('should check if connection exists', () => {
      expect(manager.hasConnection('test_tenant')).toBe(true);
      expect(manager.hasConnection('non_existent')).toBe(false);
    });

    it('should get connection info', () => {
      const info = manager.getConnectionInfo('test_tenant');
      expect(info).toBeDefined();
      expect(info?.tenantId).toBe('test_tenant');
      expect(info?.databaseType).toBe(DatabaseType.MONGODB);
      expect(info?.isActive).toBe(true);
    });

    it('should get all connections', () => {
      const connections = manager.getAllConnections();
      expect(connections.size).toBe(1);
      expect(connections.has('test_tenant')).toBe(true);
    });

    it('should get active connections count', () => {
      expect(manager.getActiveConnectionsCount()).toBe(1);
    });

    it('should close specific connection', async () => {
      await manager.closeConnection('test_tenant');
      
      expect(manager.hasConnection('test_tenant')).toBe(false);
      expect(manager.getActiveConnectionsCount()).toBe(0);
    });

    it('should close all connections', async () => {
      await manager.closeAllConnections();
      
      expect(manager.getActiveConnectionsCount()).toBe(0);
    });
  });

  describe('Statistics and Monitoring', () => {
    const mongoConfig: TenantConfig = {
      tenantId: 'mongo_tenant',
      databaseType: DatabaseType.MONGODB,
      credentials: {
        host: 'localhost',
        port: 27017,
        username: 'user',
        password: 'pass',
        database: 'testdb'
      } as MongoDBCredentials
    };

    const postgresConfig: TenantConfig = {
      tenantId: 'postgres_tenant',
      databaseType: DatabaseType.POSTGRESQL,
      credentials: {
        host: 'localhost',
        port: 5432,
        username: 'user',
        password: 'pass',
        database: 'testdb'
      } as PostgreSQLCredentials
    };

    beforeEach(async () => {
      await manager.getConnection('mongo_tenant', mongoConfig);
      await manager.getConnection('postgres_tenant', postgresConfig);
    });

    it('should get connection statistics', () => {
      const stats = manager.getConnectionStats();
      
      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(2);
      expect(stats.databaseTypes[DatabaseType.MONGODB]).toBe(1);
      expect(stats.databaseTypes[DatabaseType.POSTGRESQL]).toBe(1);
      expect(stats.oldestConnection).toBeInstanceOf(Date);
      expect(stats.newestConnection).toBeInstanceOf(Date);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const initialConfig = manager.getConfig();
      expect(initialConfig.logLevel).toBe('info');

      manager.updateConfig({ logLevel: 'debug' });
      
      const updatedConfig = manager.getConfig();
      expect(updatedConfig.logLevel).toBe('debug');
    });

    it('should merge configuration options', () => {
      manager.updateConfig({
        defaultOptions: {
          maxConnections: 50,
          connectionTimeout: 20000
        }
      });

      const config = manager.getConfig();
      expect(config.defaultOptions?.maxConnections).toBe(50);
      expect(config.defaultOptions?.connectionTimeout).toBe(20000);
      expect(config.defaultOptions?.idleTimeout).toBe(30000); // Should keep default value
    });
  });

  describe('Cleanup', () => {
    const mongoConfig: TenantConfig = {
      tenantId: 'test_tenant',
      databaseType: DatabaseType.MONGODB,
      credentials: {
        host: 'localhost',
        port: 27017,
        username: 'user',
        password: 'pass',
        database: 'testdb'
      } as MongoDBCredentials
    };

    beforeEach(async () => {
      await manager.getConnection('test_tenant', mongoConfig);
    });

    it('should cleanup inactive connections', async () => {
      // Mock the lastUsed to be old
      const connectionInfo = manager.getConnectionInfo('test_tenant');
      if (connectionInfo) {
        connectionInfo.lastUsed = new Date(Date.now() - 400000); // 6+ minutes ago
      }

      await manager.cleanupInactiveConnections(300000); // 5 minutes threshold
      
      expect(manager.hasConnection('test_tenant')).toBe(false);
    });

    it('should not cleanup active connections', async () => {
      await manager.cleanupInactiveConnections(300000);
      
      expect(manager.hasConnection('test_tenant')).toBe(true);
    });
  });
});
