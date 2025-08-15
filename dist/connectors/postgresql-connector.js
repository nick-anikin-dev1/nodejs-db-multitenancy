"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgreSQLConnector = void 0;
const base_connector_1 = require("./base-connector");
const types_1 = require("../types");
class PostgreSQLConnector extends base_connector_1.BaseConnector {
    constructor(credentials, options = {}) {
        super(types_1.DatabaseType.POSTGRESQL, credentials, options);
        this.typeormConnection = null;
        this.connectionString = this.buildConnectionString(credentials);
    }
    /**
     * Build PostgreSQL connection string from credentials
     */
    buildConnectionString(credentials) {
        const { host, port, username, password, database, schema, ssl } = credentials;
        let connectionString = `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
        const queryParams = [];
        if (schema) {
            queryParams.push(`search_path=${schema}`);
        }
        if (ssl) {
            if (typeof ssl === 'boolean') {
                queryParams.push('sslmode=require');
            }
            else {
                if (ssl.rejectUnauthorized === false) {
                    queryParams.push('sslmode=require&sslmode=no-verify');
                }
                else {
                    queryParams.push('sslmode=require');
                }
            }
        }
        if (queryParams.length > 0) {
            connectionString += `?${queryParams.join('&')}`;
        }
        return connectionString;
    }
    /**
     * Connect to PostgreSQL using TypeORM
     */
    async connect() {
        try {
            if (this.isConnected && this.typeormConnection) {
                return this.typeormConnection;
            }
            const connectionOptions = {
                type: 'postgres',
                host: this.credentials.host,
                port: this.credentials.port,
                username: this.credentials.username,
                password: this.credentials.password,
                database: this.credentials.database,
                schema: this.credentials.schema || 'public',
                synchronize: false,
                logging: false,
                entities: [],
                migrations: [],
                subscribers: [],
                extra: {
                    max: this.options.maxConnections || 10,
                    connectionTimeoutMillis: this.options.connectionTimeout || 5000,
                    idleTimeoutMillis: this.options.idleTimeout || 30000,
                    ...this.credentials.options
                }
            };
            // Handle SSL configuration
            if (this.credentials.ssl) {
                const sslConfig = this.credentials.ssl;
                if (typeof sslConfig === 'object') {
                    connectionOptions.extra = {
                        ...connectionOptions.extra,
                        ssl: sslConfig
                    };
                }
                else if (sslConfig === true) {
                    connectionOptions.extra = {
                        ...connectionOptions.extra,
                        ssl: { rejectUnauthorized: false }
                    };
                }
            }
            // In older TypeORM versions, we need to use createConnection
            this.typeormConnection = await require('typeorm').createConnection(connectionOptions);
            this.connection = this.typeormConnection;
            this.isConnected = true;
            console.log(`PostgreSQL connected for tenant: ${this.credentials.database}`);
            return this.typeormConnection;
        }
        catch (error) {
            this.isConnected = false;
            throw new Error(`Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Disconnect from PostgreSQL
     */
    async disconnect() {
        try {
            if (this.typeormConnection) {
                await this.typeormConnection.close();
                this.typeormConnection = null;
            }
            this.isConnected = false;
            this.connection = null;
        }
        catch (error) {
            throw new Error(`Failed to disconnect from PostgreSQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Test PostgreSQL connection
     */
    async testConnection() {
        try {
            if (!this.typeormConnection) {
                await this.connect();
            }
            await this.typeormConnection.query('SELECT 1');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get PostgreSQL connection information
     */
    async getConnectionInfo() {
        var _a, _b, _c;
        if (!this.typeormConnection) {
            throw new Error('PostgreSQL connection not established');
        }
        try {
            const version = await this.typeormConnection.query('SELECT version()');
            const currentDatabase = await this.typeormConnection.query('SELECT current_database()');
            const currentSchema = await this.typeormConnection.query('SELECT current_schema()');
            return {
                version: (_a = version[0]) === null || _a === void 0 ? void 0 : _a.version,
                currentDatabase: (_b = currentDatabase[0]) === null || _b === void 0 ? void 0 : _b.current_database,
                currentSchema: (_c = currentSchema[0]) === null || _c === void 0 ? void 0 : _c.current_schema,
                connectionString: this.connectionString,
                database: this.credentials.database,
                host: this.credentials.host,
                port: this.credentials.port,
                schema: this.credentials.schema || 'public'
            };
        }
        catch (error) {
            throw new Error(`Failed to get PostgreSQL connection info: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Ping PostgreSQL connection
     */
    async ping() {
        try {
            if (!this.typeormConnection) {
                return false;
            }
            await this.typeormConnection.query('SELECT 1');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get the TypeORM Connection instance
     */
    getDataSource() {
        return this.typeormConnection;
    }
    /**
     * Get the connection string (useful for debugging)
     */
    getConnectionString() {
        return this.connectionString;
    }
    /**
     * Execute a raw query
     */
    async query(sql, parameters) {
        if (!this.typeormConnection) {
            throw new Error('PostgreSQL connection not established');
        }
        return this.typeormConnection.query(sql, parameters);
    }
    /**
     * Get the query runner for transactions
     */
    getQueryRunner() {
        if (!this.typeormConnection) {
            throw new Error('PostgreSQL connection not established');
        }
        return this.typeormConnection.createQueryRunner();
    }
}
exports.PostgreSQLConnector = PostgreSQLConnector;
//# sourceMappingURL=postgresql-connector.js.map