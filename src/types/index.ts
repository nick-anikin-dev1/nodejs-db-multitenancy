export enum DatabaseType {
  MONGODB = 'mongodb',
  POSTGRESQL = 'postgresql'
}

export interface DatabaseCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  options?: Record<string, any>;
}

export interface MongoDBCredentials extends DatabaseCredentials {
  authSource?: string;
  replicaSet?: string;
  ssl?: boolean;
  sslCA?: string;
  sslCert?: string;
  sslKey?: string;
}

export interface PostgreSQLCredentials extends DatabaseCredentials {
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
}

export interface TenantConfig {
  tenantId: string;
  databaseType: DatabaseType;
  credentials: MongoDBCredentials | PostgreSQLCredentials;
  connectionName?: string;
}

export interface ConnectionInfo {
  tenantId: string;
  databaseType: DatabaseType;
  connection: any;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
}

export interface ConnectionOptions {
  maxConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface MultiTenantConfig {
  defaultOptions?: ConnectionOptions;
  enableConnectionPooling?: boolean;
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
