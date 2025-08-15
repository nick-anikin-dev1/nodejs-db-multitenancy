import { Connection } from 'typeorm';
import { BaseConnector } from './base-connector';
import { ConnectionOptions, PostgreSQLCredentials } from '../types';
export declare class PostgreSQLConnector extends BaseConnector {
    private typeormConnection;
    private connectionString;
    constructor(credentials: PostgreSQLCredentials, options?: ConnectionOptions);
    /**
     * Build PostgreSQL connection string from credentials
     */
    private buildConnectionString;
    /**
     * Connect to PostgreSQL using TypeORM
     */
    connect(): Promise<Connection>;
    /**
     * Disconnect from PostgreSQL
     */
    disconnect(): Promise<void>;
    /**
     * Test PostgreSQL connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Get PostgreSQL connection information
     */
    getConnectionInfo(): Promise<any>;
    /**
     * Ping PostgreSQL connection
     */
    ping(): Promise<boolean>;
    /**
     * Get the TypeORM Connection instance
     */
    getDataSource(): Connection | null;
    /**
     * Get the connection string (useful for debugging)
     */
    getConnectionString(): string;
    /**
     * Execute a raw query
     */
    query(sql: string, parameters?: any[]): Promise<any>;
    /**
     * Get the query runner for transactions
     */
    getQueryRunner(): import("typeorm").QueryRunner;
}
//# sourceMappingURL=postgresql-connector.d.ts.map