import { BaseConnector } from '../connectors/base-connector';
import { MongoDBConnector } from '../connectors/mongodb-connector';
import { PostgreSQLConnector } from '../connectors/postgresql-connector';
import { ConnectionOptions, DatabaseCredentials, DatabaseType } from '../types';

export class ConnectorFactory {
  /**
   * Create a database connector based on database type and credentials
   */
  public static createConnector(
    databaseType: DatabaseType,
    credentials: DatabaseCredentials,
    options: ConnectionOptions = {}
  ): BaseConnector {
    switch (databaseType) {
      case DatabaseType.MONGODB:
        return new MongoDBConnector(credentials, options);
      
      case DatabaseType.POSTGRESQL:
        return new PostgreSQLConnector(credentials, options);
      
      default:
        throw new Error(`Unsupported database type: ${databaseType}`);
    }
  }

  /**
   * Create a MongoDB connector
   */
  public static createMongoDBConnector(
    credentials: DatabaseCredentials,
    options: ConnectionOptions = {}
  ): MongoDBConnector {
    return new MongoDBConnector(credentials, options);
  }

  /**
   * Create a PostgreSQL connector
   */
  public static createPostgreSQLConnector(
    credentials: DatabaseCredentials,
    options: ConnectionOptions = {}
  ): PostgreSQLConnector {
    return new PostgreSQLConnector(credentials, options);
  }

  /**
   * Validate credentials for a specific database type
   */
  public static validateCredentials(
    _databaseType: DatabaseType,
    credentials: DatabaseCredentials
  ): boolean {
    const requiredFields = ['host', 'port', 'username', 'password', 'database'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!credentials[field as keyof DatabaseCredentials]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate port number
    if (typeof credentials.port !== 'number' || credentials.port < 1 || credentials.port > 65535) {
      throw new Error('Port must be a valid number between 1 and 65535');
    }

    // Validate host
    if (typeof credentials.host !== 'string' || credentials.host.trim() === '') {
      throw new Error('Host must be a non-empty string');
    }

    // Validate database name
    if (typeof credentials.database !== 'string' || credentials.database.trim() === '') {
      throw new Error('Database name must be a non-empty string');
    }

    return true;
  }

  /**
   * Get supported database types
   */
  public static getSupportedDatabaseTypes(): DatabaseType[] {
    return Object.values(DatabaseType);
  }

  /**
   * Check if a database type is supported
   */
  public static isDatabaseTypeSupported(databaseType: string): boolean {
    return Object.values(DatabaseType).includes(databaseType as DatabaseType);
  }
}
