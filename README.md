# Node.js Multi-Tenant Database Connector

A flexible and robust multi-tenant database connector library for Node.js applications, supporting both MongoDB (via Mongoose) and PostgreSQL (via TypeORM). Perfect for NestJS and Strapi applications that need to manage multiple database connections for different tenants.

## Features

- 🚀 **Multi-Database Support**: MongoDB (Mongoose) and PostgreSQL (TypeORM)
- 🔄 **Connection Pooling**: Efficient connection management with configurable pools
- 🎯 **Tenant Isolation**: Secure separation of tenant data and connections
- ⚡ **Performance Optimized**: Connection reuse and intelligent connection management
- 🛡️ **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🔧 **Flexible Configuration**: Easy-to-use configuration system
- 📊 **Monitoring**: Built-in connection statistics and health checks
- 🧹 **Auto-Cleanup**: Automatic cleanup of inactive connections
- 🔌 **Framework Agnostic**: Works with any Node.js framework

## Installation

```bash
npm install nodejs-db-multitenant
```

## Quick Start

### Basic Usage

```typescript
import { 
  MultiTenantManager, 
  DatabaseType, 
  TenantConfig 
} from 'nodejs-db-multitenant';

// Initialize the multi-tenant manager
const manager = new MultiTenantManager({
  enableLogging: true,
  logLevel: 'info'
});

// Define tenant configuration
const tenantConfig: TenantConfig = {
  tenantId: 'tenant1',
  databaseType: DatabaseType.POSTGRESQL,
  credentials: {
    host: 'localhost',
    port: 5432,
    username: 'user',
    password: 'password',
    database: 'tenant1_db'
  }
};

// Get or create connection
const connection = await manager.getConnection('tenant1', tenantConfig);
```

### MongoDB Example

```typescript
import { 
  MultiTenantManager, 
  DatabaseType, 
  MongoDBCredentials 
} from 'nodejs-db-multitenant';

const manager = new MultiTenantManager();

const mongoConfig: TenantConfig = {
  tenantId: 'mongo_tenant',
  databaseType: DatabaseType.MONGODB,
  credentials: {
    host: 'localhost',
    port: 27017,
    username: 'mongo_user',
    password: 'mongo_pass',
    database: 'tenant_db',
    authSource: 'admin'
  } as MongoDBCredentials
};

const mongoConnection = await manager.getConnection('mongo_tenant', mongoConfig);
```

### PostgreSQL Example

```typescript
import { 
  MultiTenantManager, 
  DatabaseType, 
  PostgreSQLCredentials 
} from 'nodejs-db-multitenant';

const manager = new MultiTenantManager();

const postgresConfig: TenantConfig = {
  tenantId: 'postgres_tenant',
  databaseType: DatabaseType.POSTGRESQL,
  credentials: {
    host: 'localhost',
    port: 5432,
    username: 'postgres_user',
    password: 'postgres_pass',
    database: 'tenant_db',
    schema: 'tenant_schema'
  } as PostgreSQLCredentials
};

const postgresConnection = await manager.getConnection('postgres_tenant', postgresConfig);
```

## API Reference

### MultiTenantManager

The main class for managing multi-tenant database connections.

#### Constructor

```typescript
new MultiTenantManager(config?: MultiTenantConfig)
```

#### Configuration Options

```typescript
interface MultiTenantConfig {
  enableConnectionPooling?: boolean;    // Default: true
  enableLogging?: boolean;              // Default: true
  logLevel?: 'debug' | 'info' | 'warn' | 'error'; // Default: 'info'
  defaultOptions?: ConnectionOptions;   // Default connection options
}
```

#### Methods

##### getConnection(tenantId: string, tenantConfig: TenantConfig): Promise<any>

Gets or creates a database connection for a specific tenant.

```typescript
const connection = await manager.getConnection('tenant1', config);
```

##### hasConnection(tenantId: string): boolean

Checks if a connection exists for a tenant.

```typescript
if (manager.hasConnection('tenant1')) {
  // Connection exists
}
```

##### closeConnection(tenantId: string): Promise<void>

Closes a specific tenant connection.

```typescript
await manager.closeConnection('tenant1');
```

##### closeAllConnections(): Promise<void>

Closes all active connections.

```typescript
await manager.closeAllConnections();
```

##### getConnectionStats(): ConnectionStats

Gets connection statistics.

```typescript
const stats = manager.getConnectionStats();
console.log(`Active connections: ${stats.activeConnections}`);
```

##### cleanupInactiveConnections(maxIdleTime?: number): Promise<void>

Cleans up inactive connections.

```typescript
// Clean up connections idle for more than 5 minutes
await manager.cleanupInactiveConnections(300000);
```

### ConnectorFactory

Factory class for creating database connectors.

#### Methods

##### createConnector(databaseType: DatabaseType, credentials: DatabaseCredentials, options?: ConnectionOptions): BaseConnector

Creates a connector for the specified database type.

```typescript
const connector = ConnectorFactory.createConnector(
  DatabaseType.MONGODB,
  credentials,
  options
);
```

##### validateCredentials(databaseType: DatabaseType, credentials: DatabaseCredentials): boolean

Validates credentials for a specific database type.

```typescript
try {
  ConnectorFactory.validateCredentials(DatabaseType.POSTGRESQL, credentials);
  // Credentials are valid
} catch (error) {
  // Handle validation error
}
```

### ConnectionValidator

Utility class for validating connections and configurations.

#### Methods

##### validateTenantConfig(config: TenantConfig): boolean

Validates a tenant configuration.

```typescript
try {
  ConnectionValidator.validateTenantConfig(tenantConfig);
  // Configuration is valid
} catch (error) {
  // Handle validation error
}
```

## Framework Integration

### NestJS Integration

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MultiTenantManager, DatabaseType, TenantConfig } from 'nodejs-db-multitenant';

@Injectable()
export class MultiTenantDatabaseService implements OnModuleInit, OnModuleDestroy {
  private manager: MultiTenantManager;

  constructor() {
    this.manager = new MultiTenantManager({
      enableLogging: true,
      logLevel: 'info'
    });
  }

  async onModuleInit() {
    // Initialize connections
  }

  async onModuleDestroy() {
    await this.manager.closeAllConnections();
  }

  async getTenantConnection(tenantId: string): Promise<any> {
    const config = this.getTenantConfig(tenantId);
    return this.manager.getConnection(tenantId, config);
  }
}
```

### Strapi Integration

```typescript
export default {
  register({ strapi }) {
    const manager = new MultiTenantManager();
    
    // Add to strapi context
    strapi.multiTenantManager = manager;
    
    // Add utility methods
    strapi.getTenantConnection = async (tenantId) => {
      // Implementation
    };
  }
};
```

## Configuration

### Database Credentials

#### MongoDB Credentials

```typescript
interface MongoDBCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  authSource?: string;
  replicaSet?: string;
  ssl?: boolean;
  sslCA?: string;
  sslCert?: string;
  sslKey?: string;
  options?: Record<string, any>;
}
```

#### PostgreSQL Credentials

```typescript
interface PostgreSQLCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema?: string;
  ssl?: boolean | {
    rejectUnauthorized?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
  poolSize?: number;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  options?: Record<string, any>;
}
```

### Connection Options

```typescript
interface ConnectionOptions {
  maxConnections?: number;        // Default: 10
  connectionTimeout?: number;     // Default: 5000ms
  idleTimeout?: number;          // Default: 30000ms
  retryAttempts?: number;        // Default: 3
  retryDelay?: number;           // Default: 1000ms
}
```

## Error Handling

The library provides comprehensive error handling with descriptive error messages:

```typescript
try {
  const connection = await manager.getConnection('tenant1', config);
} catch (error) {
  if (error.message.includes('Failed to connect')) {
    // Handle connection error
  } else if (error.message.includes('Invalid tenant configuration')) {
    // Handle configuration error
  }
}
```

## Best Practices

1. **Connection Reuse**: The library automatically reuses existing connections when possible.
2. **Proper Cleanup**: Always close connections when they're no longer needed.
3. **Configuration Validation**: Use the provided validators to ensure configuration correctness.
4. **Error Handling**: Implement proper error handling for connection failures.
5. **Monitoring**: Use connection statistics to monitor connection health.
6. **Resource Management**: Implement proper cleanup in your application lifecycle.

## Examples

See the `examples/` directory for complete working examples:

- `nestjs-example.ts` - NestJS integration example
- `strapi-example.ts` - Strapi integration example

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please open an issue on GitHub.
