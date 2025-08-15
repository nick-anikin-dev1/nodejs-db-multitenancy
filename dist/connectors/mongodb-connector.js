"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBConnector = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const types_1 = require("../types");
const base_connector_1 = require("./base-connector");
class MongoDBConnector extends base_connector_1.BaseConnector {
    constructor(credentials, options = {}) {
        super(types_1.DatabaseType.MONGODB, credentials, options);
        this.mongooseConnection = null;
        this.connectionString = this.buildConnectionString(credentials);
    }
    /**
     * Build MongoDB connection string from credentials
     */
    buildConnectionString(credentials) {
        const { host, port, username, password, database, authSource, replicaSet, ssl } = credentials;
        let connectionString = 'mongodb://';
        if (username && password) {
            connectionString += `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
        }
        connectionString += `${host}:${port}/${database}`;
        const queryParams = [];
        if (authSource) {
            queryParams.push(`authSource=${authSource}`);
        }
        if (replicaSet) {
            queryParams.push(`replicaSet=${replicaSet}`);
        }
        if (ssl) {
            queryParams.push('ssl=true');
        }
        if (queryParams.length > 0) {
            connectionString += `?${queryParams.join('&')}`;
        }
        return connectionString;
    }
    /**
     * Connect to MongoDB using Mongoose
     */
    async connect() {
        try {
            if (this.isConnected && this.mongooseConnection) {
                return this.mongooseConnection;
            }
            const mongooseOptions = {
                maxPoolSize: this.options.maxConnections || 10,
                serverSelectionTimeoutMS: this.options.connectionTimeout || 5000,
                socketTimeoutMS: this.options.idleTimeout || 30000,
                bufferCommands: false,
                ...this.credentials.options
            };
            this.mongooseConnection = await mongoose_1.default.createConnection(this.connectionString, mongooseOptions);
            this.mongooseConnection.on('connected', () => {
                this.isConnected = true;
                console.log(`MongoDB connected for tenant: ${this.credentials.database}`);
            });
            this.mongooseConnection.on('disconnected', () => {
                this.isConnected = false;
                console.log(`MongoDB disconnected for tenant: ${this.credentials.database}`);
            });
            this.mongooseConnection.on('error', (error) => {
                console.error(`MongoDB connection error for tenant ${this.credentials.database}:`, error);
                this.isConnected = false;
            });
            this.connection = this.mongooseConnection;
            this.isConnected = true;
            return this.mongooseConnection;
        }
        catch (error) {
            this.isConnected = false;
            throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Disconnect from MongoDB
     */
    async disconnect() {
        try {
            if (this.mongooseConnection) {
                await this.mongooseConnection.close();
                this.mongooseConnection = null;
            }
            this.isConnected = false;
            this.connection = null;
        }
        catch (error) {
            throw new Error(`Failed to disconnect from MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Test MongoDB connection
     */
    async testConnection() {
        try {
            if (!this.mongooseConnection) {
                await this.connect();
            }
            await this.mongooseConnection.db.admin().ping();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get MongoDB connection information
     */
    async getConnectionInfo() {
        if (!this.mongooseConnection) {
            throw new Error('MongoDB connection not established');
        }
        try {
            const adminDb = this.mongooseConnection.db.admin();
            const serverInfo = await adminDb.serverInfo();
            const dbStats = await this.mongooseConnection.db.stats();
            return {
                serverInfo,
                dbStats,
                connectionString: this.connectionString,
                database: this.credentials.database,
                host: this.credentials.host,
                port: this.credentials.port
            };
        }
        catch (error) {
            throw new Error(`Failed to get MongoDB connection info: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Ping MongoDB connection
     */
    async ping() {
        try {
            if (!this.mongooseConnection) {
                return false;
            }
            await this.mongooseConnection.db.admin().ping();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get the Mongoose connection instance
     */
    getMongooseConnection() {
        return this.mongooseConnection;
    }
    /**
     * Get the connection string (useful for debugging)
     */
    getConnectionString() {
        return this.connectionString;
    }
}
exports.MongoDBConnector = MongoDBConnector;
//# sourceMappingURL=mongodb-connector.js.map