import { BaseConnector } from '../connectors/base-connector';
import { MongoDBConnector } from '../connectors/mongodb-connector';
import { PostgreSQLConnector } from '../connectors/postgresql-connector';
import { ConnectionOptions, DatabaseCredentials, DatabaseType } from '../types';
export declare class ConnectorFactory {
    /**
     * Create a database connector based on database type and credentials
     */
    static createConnector(databaseType: DatabaseType, credentials: DatabaseCredentials, options?: ConnectionOptions): BaseConnector;
    /**
     * Create a MongoDB connector
     */
    static createMongoDBConnector(credentials: DatabaseCredentials, options?: ConnectionOptions): MongoDBConnector;
    /**
     * Create a PostgreSQL connector
     */
    static createPostgreSQLConnector(credentials: DatabaseCredentials, options?: ConnectionOptions): PostgreSQLConnector;
    /**
     * Validate credentials for a specific database type
     */
    static validateCredentials(_databaseType: DatabaseType, credentials: DatabaseCredentials): boolean;
    /**
     * Get supported database types
     */
    static getSupportedDatabaseTypes(): DatabaseType[];
    /**
     * Check if a database type is supported
     */
    static isDatabaseTypeSupported(databaseType: string): boolean;
}
//# sourceMappingURL=connector-factory.d.ts.map