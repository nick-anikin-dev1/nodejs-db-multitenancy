"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorFactory = void 0;
const mongodb_connector_1 = require("../connectors/mongodb-connector");
const postgresql_connector_1 = require("../connectors/postgresql-connector");
const types_1 = require("../types");
class ConnectorFactory {
    /**
     * Create a database connector based on database type and credentials
     */
    static createConnector(databaseType, credentials, options = {}) {
        switch (databaseType) {
            case types_1.DatabaseType.MONGODB:
                return new mongodb_connector_1.MongoDBConnector(credentials, options);
            case types_1.DatabaseType.POSTGRESQL:
                return new postgresql_connector_1.PostgreSQLConnector(credentials, options);
            default:
                throw new Error(`Unsupported database type: ${databaseType}`);
        }
    }
    /**
     * Create a MongoDB connector
     */
    static createMongoDBConnector(credentials, options = {}) {
        return new mongodb_connector_1.MongoDBConnector(credentials, options);
    }
    /**
     * Create a PostgreSQL connector
     */
    static createPostgreSQLConnector(credentials, options = {}) {
        return new postgresql_connector_1.PostgreSQLConnector(credentials, options);
    }
    /**
     * Validate credentials for a specific database type
     */
    static validateCredentials(_databaseType, credentials) {
        const requiredFields = ['host', 'port', 'username', 'password', 'database'];
        // Check required fields
        for (const field of requiredFields) {
            if (!credentials[field]) {
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
    static getSupportedDatabaseTypes() {
        return Object.values(types_1.DatabaseType);
    }
    /**
     * Check if a database type is supported
     */
    static isDatabaseTypeSupported(databaseType) {
        return Object.values(types_1.DatabaseType).includes(databaseType);
    }
}
exports.ConnectorFactory = ConnectorFactory;
//# sourceMappingURL=connector-factory.js.map