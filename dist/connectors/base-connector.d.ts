import { ConnectionOptions, DatabaseCredentials, DatabaseType } from '../types';
export declare abstract class BaseConnector {
    protected databaseType: DatabaseType;
    protected credentials: DatabaseCredentials;
    protected options: ConnectionOptions;
    protected connection: any;
    protected isConnected: boolean;
    constructor(databaseType: DatabaseType, credentials: DatabaseCredentials, options?: ConnectionOptions);
    /**
     * Get the database type
     */
    getDatabaseType(): DatabaseType;
    /**
     * Get the current connection
     */
    getConnection(): any;
    /**
     * Check if the connection is active
     */
    isConnectionActive(): boolean;
    /**
     * Get connection status
     */
    getConnectionStatus(): {
        isConnected: boolean;
        databaseType: DatabaseType;
    };
    /**
     * Abstract method to create connection
     */
    abstract connect(): Promise<any>;
    /**
     * Abstract method to disconnect
     */
    abstract disconnect(): Promise<void>;
    /**
     * Abstract method to test connection
     */
    abstract testConnection(): Promise<boolean>;
    /**
     * Abstract method to get connection info
     */
    abstract getConnectionInfo(): Promise<any>;
    /**
     * Abstract method to ping connection
     */
    abstract ping(): Promise<boolean>;
}
//# sourceMappingURL=base-connector.d.ts.map