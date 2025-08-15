"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseType = exports.PostgreSQLConnector = exports.MongoDBConnector = exports.BaseConnector = exports.MultiTenantManager = exports.ConnectorFactory = void 0;
// Main exports
var connector_factory_1 = require("./factories/connector-factory");
Object.defineProperty(exports, "ConnectorFactory", { enumerable: true, get: function () { return connector_factory_1.ConnectorFactory; } });
var multi_tenant_manager_1 = require("./multi-tenant-manager");
Object.defineProperty(exports, "MultiTenantManager", { enumerable: true, get: function () { return multi_tenant_manager_1.MultiTenantManager; } });
// Connector exports
var base_connector_1 = require("./connectors/base-connector");
Object.defineProperty(exports, "BaseConnector", { enumerable: true, get: function () { return base_connector_1.BaseConnector; } });
var mongodb_connector_1 = require("./connectors/mongodb-connector");
Object.defineProperty(exports, "MongoDBConnector", { enumerable: true, get: function () { return mongodb_connector_1.MongoDBConnector; } });
var postgresql_connector_1 = require("./connectors/postgresql-connector");
Object.defineProperty(exports, "PostgreSQLConnector", { enumerable: true, get: function () { return postgresql_connector_1.PostgreSQLConnector; } });
// Type exports
var types_1 = require("./types");
Object.defineProperty(exports, "DatabaseType", { enumerable: true, get: function () { return types_1.DatabaseType; } });
// Note: For mongoose Connection and typeorm DataSource types, 
// import them directly from their respective packages in your project
//# sourceMappingURL=index.js.map