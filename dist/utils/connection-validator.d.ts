import { ConnectionOptions, DatabaseType, TenantConfig } from '../types';
export declare class ConnectionValidator {
    /**
     * Validate tenant configuration
     */
    static validateTenantConfig(config: TenantConfig): boolean;
    /**
     * Validate connection options
     */
    static validateConnectionOptions(options: ConnectionOptions): boolean;
    /**
     * Validate MongoDB-specific credentials
     */
    static validateMongoDBCredentials(credentials: any): boolean;
    /**
     * Validate PostgreSQL-specific credentials
     */
    static validatePostgreSQLCredentials(credentials: any): boolean;
    /**
     * Validate multiple tenant configurations
     */
    static validateMultipleTenantConfigs(configs: TenantConfig[]): boolean;
    /**
     * Check if a connection string is valid
     */
    static isValidConnectionString(connectionString: string, databaseType: DatabaseType): boolean;
}
//# sourceMappingURL=connection-validator.d.ts.map