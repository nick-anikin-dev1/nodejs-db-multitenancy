"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseConnector = void 0;
class BaseConnector {
    constructor(databaseType, credentials, options = {}) {
        this.isConnected = false;
        this.databaseType = databaseType;
        this.credentials = credentials;
        this.options = options;
    }
    /**
     * Get the database type
     */
    getDatabaseType() {
        return this.databaseType;
    }
    /**
     * Get the current connection
     */
    getConnection() {
        return this.connection;
    }
    /**
     * Check if the connection is active
     */
    isConnectionActive() {
        return this.isConnected && this.connection !== null;
    }
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            databaseType: this.databaseType
        };
    }
}
exports.BaseConnector = BaseConnector;
//# sourceMappingURL=base-connector.js.map