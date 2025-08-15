/// <reference types="jest" />

import {
    ConnectionOptions,
    DatabaseCredentials,
    DatabaseType,
    MongoDBCredentials,
    MultiTenantConfig,
    PostgreSQLCredentials,
    TenantConfig
} from '../src/types';

describe('Types', () => {
  describe('DatabaseType enum', () => {
    it('should have correct values', () => {
      expect(DatabaseType.MONGODB).toBe('mongodb');
      expect(DatabaseType.POSTGRESQL).toBe('postgresql');
    });

    it('should have only expected keys', () => {
      const keys = Object.keys(DatabaseType);
      expect(keys).toHaveLength(2);
      expect(keys).toContain('MONGODB');
      expect(keys).toContain('POSTGRESQL');
    });
  });

  describe('DatabaseCredentials interface', () => {
    it('should allow valid credentials', () => {
      const credentials: DatabaseCredentials = {
        host: 'localhost',
        port: 27017,
        username: 'user',
        password: 'pass',
        database: 'testdb'
      };

      expect(credentials.host).toBe('localhost');
      expect(credentials.port).toBe(27017);
      expect(credentials.username).toBe('user');
      expect(credentials.password).toBe('pass');
      expect(credentials.database).toBe('testdb');
    });

    it('should allow optional options', () => {
      const credentials: DatabaseCredentials = {
        host: 'localhost',
        port: 27017,
        username: 'user',
        password: 'pass',
        database: 'testdb',
        options: { ssl: true }
      };

      expect(credentials.options?.ssl).toBe(true);
    });
  });

  describe('MongoDBCredentials interface', () => {
    it('should extend DatabaseCredentials', () => {
      const mongoCredentials: MongoDBCredentials = {
        host: 'localhost',
        port: 27017,
        username: 'user',
        password: 'pass',
        database: 'testdb',
        authSource: 'admin',
        ssl: false
      };

      expect(mongoCredentials.host).toBe('localhost');
      expect(mongoCredentials.authSource).toBe('admin');
      expect(mongoCredentials.ssl).toBe(false);
    });

    it('should allow all MongoDB-specific options', () => {
      const mongoCredentials: MongoDBCredentials = {
        host: 'localhost',
        port: 27017,
        username: 'user',
        password: 'pass',
        database: 'testdb',
        authSource: 'admin',
        replicaSet: 'rs0',
        ssl: true,
        sslCA: 'ca.pem',
        sslCert: 'cert.pem',
        sslKey: 'key.pem'
      };

      expect(mongoCredentials.replicaSet).toBe('rs0');
      expect(mongoCredentials.sslCA).toBe('ca.pem');
      expect(mongoCredentials.sslCert).toBe('cert.pem');
      expect(mongoCredentials.sslKey).toBe('key.pem');
    });
  });

  describe('PostgreSQLCredentials interface', () => {
    it('should extend DatabaseCredentials', () => {
      const postgresCredentials: PostgreSQLCredentials = {
        host: 'localhost',
        port: 5432,
        username: 'user',
        password: 'pass',
        database: 'testdb',
        schema: 'public'
      };

      expect(postgresCredentials.host).toBe('localhost');
      expect(postgresCredentials.schema).toBe('public');
    });

    it('should allow SSL configuration as boolean', () => {
      const postgresCredentials: PostgreSQLCredentials = {
        host: 'localhost',
        port: 5432,
        username: 'user',
        password: 'pass',
        database: 'testdb',
        ssl: true
      };

      expect(postgresCredentials.ssl).toBe(true);
    });

    it('should allow SSL configuration as object', () => {
      const postgresCredentials: PostgreSQLCredentials = {
        host: 'localhost',
        port: 5432,
        username: 'user',
        password: 'pass',
        database: 'testdb',
        ssl: {
          rejectUnauthorized: false,
          ca: 'ca.pem',
          cert: 'cert.pem',
          key: 'key.pem'
        }
      };

      expect((postgresCredentials.ssl as any).rejectUnauthorized).toBe(false);
      expect((postgresCredentials.ssl as any).ca).toBe('ca.pem');
    });

    it('should allow connection pool options', () => {
      const postgresCredentials: PostgreSQLCredentials = {
        host: 'localhost',
        port: 5432,
        username: 'user',
        password: 'pass',
        database: 'testdb',
        poolSize: 20,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 60000
      };

      expect(postgresCredentials.poolSize).toBe(20);
      expect(postgresCredentials.connectionTimeoutMillis).toBe(10000);
      expect(postgresCredentials.idleTimeoutMillis).toBe(60000);
    });
  });

  describe('TenantConfig interface', () => {
    it('should allow valid tenant configuration', () => {
      const tenantConfig: TenantConfig = {
        tenantId: 'tenant1',
        databaseType: DatabaseType.MONGODB,
        credentials: {
          host: 'localhost',
          port: 27017,
          username: 'user',
          password: 'pass',
          database: 'testdb'
        }
      };

      expect(tenantConfig.tenantId).toBe('tenant1');
      expect(tenantConfig.databaseType).toBe(DatabaseType.MONGODB);
      expect(tenantConfig.credentials.host).toBe('localhost');
    });

    it('should allow optional connection name', () => {
      const tenantConfig: TenantConfig = {
        tenantId: 'tenant1',
        databaseType: DatabaseType.POSTGRESQL,
        credentials: {
          host: 'localhost',
          port: 5432,
          username: 'user',
          password: 'pass',
          database: 'testdb'
        },
        connectionName: 'custom_connection'
      };

      expect(tenantConfig.connectionName).toBe('custom_connection');
    });
  });

  describe('ConnectionOptions interface', () => {
    it('should allow all connection options', () => {
      const connectionOptions: ConnectionOptions = {
        maxConnections: 25,
        connectionTimeout: 15000,
        idleTimeout: 90000,
        retryAttempts: 5,
        retryDelay: 3000
      };

      expect(connectionOptions.maxConnections).toBe(25);
      expect(connectionOptions.connectionTimeout).toBe(15000);
      expect(connectionOptions.idleTimeout).toBe(90000);
      expect(connectionOptions.retryAttempts).toBe(5);
      expect(connectionOptions.retryDelay).toBe(3000);
    });

    it('should allow partial options', () => {
      const connectionOptions: ConnectionOptions = {
        maxConnections: 10
      };

      expect(connectionOptions.maxConnections).toBe(10);
      expect(connectionOptions.connectionTimeout).toBeUndefined();
    });
  });

  describe('MultiTenantConfig interface', () => {
    it('should allow all configuration options', () => {
      const config: MultiTenantConfig = {
        enableConnectionPooling: true,
        enableLogging: true,
        logLevel: 'debug',
        defaultOptions: {
          maxConnections: 20,
          connectionTimeout: 10000
        }
      };

      expect(config.enableConnectionPooling).toBe(true);
      expect(config.enableLogging).toBe(true);
      expect(config.logLevel).toBe('debug');
      expect(config.defaultOptions?.maxConnections).toBe(20);
    });

    it('should allow partial configuration', () => {
      const config: MultiTenantConfig = {
        enableLogging: false
      };

      expect(config.enableLogging).toBe(false);
      expect(config.enableConnectionPooling).toBeUndefined();
    });
  });
});
