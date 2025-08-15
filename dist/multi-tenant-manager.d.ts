import { ConnectionInfo, DatabaseType, MultiTenantConfig, TenantConfig } from './types';
export declare class MultiTenantManager {
    private connections;
    private config;
    private defaultOptions;
    constructor(config?: MultiTenantConfig);
    /**
     * Get or create a database connection for a tenant
     */
    getConnection(tenantId: string, tenantConfig: TenantConfig): Promise<any>;
    /**
     * Create a database connector based on tenant configuration
     */
    private createConnector;
    /**
     * Test if a connection is still alive
     */
    private testConnection;
    /**
     * Check if a connection exists for a tenant
     */
    hasConnection(tenantId: string): boolean;
    /**
     * Get connection information for a tenant
     */
    getConnectionInfo(tenantId: string): ConnectionInfo | undefined;
    /**
     * Get all active connections
     */
    getAllConnections(): Map<string, ConnectionInfo>;
    /**
     * Get active connections count
     */
    getActiveConnectionsCount(): number;
    /**
     * Close a specific tenant connection
     */
    closeConnection(tenantId: string): Promise<void>;
    /**
     * Close all connections
     */
    closeAllConnections(): Promise<void>;
    /**
     * Remove inactive connections (cleanup)
     */
    cleanupInactiveConnections(maxIdleTime?: number): Promise<void>;
    /**
     * Get connection statistics
     */
    getConnectionStats(): {
        totalConnections: number;
        activeConnections: number;
        databaseTypes: Record<DatabaseType, number>;
        oldestConnection: Date | null;
        newestConnection: Date | null;
    };
    /**
     * Log messages based on configuration
     */
    private log;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<MultiTenantConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): MultiTenantConfig;
}
//# sourceMappingURL=multi-tenant-manager.d.ts.map