import { Connection } from 'mongoose';
import { ConnectionOptions, MongoDBCredentials } from '../types';
import { BaseConnector } from './base-connector';
export declare class MongoDBConnector extends BaseConnector {
    private mongooseConnection;
    private connectionString;
    constructor(credentials: MongoDBCredentials, options?: ConnectionOptions);
    /**
     * Build MongoDB connection string from credentials
     */
    private buildConnectionString;
    /**
     * Connect to MongoDB using Mongoose
     */
    connect(): Promise<Connection>;
    /**
     * Disconnect from MongoDB
     */
    disconnect(): Promise<void>;
    /**
     * Test MongoDB connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Get MongoDB connection information
     */
    getConnectionInfo(): Promise<any>;
    /**
     * Ping MongoDB connection
     */
    ping(): Promise<boolean>;
    /**
     * Get the Mongoose connection instance
     */
    getMongooseConnection(): Connection | null;
    /**
     * Get the connection string (useful for debugging)
     */
    getConnectionString(): string;
}
//# sourceMappingURL=mongodb-connector.d.ts.map