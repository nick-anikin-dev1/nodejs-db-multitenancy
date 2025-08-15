// Main exports
export { ConnectorFactory } from './factories/connector-factory';
export { MultiTenantManager } from './multi-tenant-manager';

// Connector exports
export { BaseConnector } from './connectors/base-connector';
export { MongoDBConnector } from './connectors/mongodb-connector';
export { PostgreSQLConnector } from './connectors/postgresql-connector';

// Type exports
export {
    ConnectionInfo,
    ConnectionOptions, DatabaseCredentials, DatabaseType, MongoDBCredentials, MultiTenantConfig, PostgreSQLCredentials,
    TenantConfig
} from './types';

// Note: For mongoose Connection and typeorm DataSource types, 
// import them directly from their respective packages in your project
