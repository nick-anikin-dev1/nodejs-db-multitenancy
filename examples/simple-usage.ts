import {
    DatabaseType,
    MongoDBCredentials,
    MultiTenantManager,
    PostgreSQLCredentials,
    TenantConfig
} from '../src/index';

async function simpleExample() {
  console.log('🚀 Starting Multi-Tenant Database Example...\n');

  // Initialize the multi-tenant manager
  const manager = new MultiTenantManager({
    enableLogging: true,
    logLevel: 'info',
    enableConnectionPooling: true,
    defaultOptions: {
      maxConnections: 5,
      connectionTimeout: 5000,
      idleTimeout: 30000
    }
  });

  try {
    // Example 1: MongoDB Tenant
    console.log('📊 Setting up MongoDB tenant...');
    const mongoConfig: TenantConfig = {
      tenantId: 'company_a',
      databaseType: DatabaseType.MONGODB,
      credentials: {
        host: 'localhost',
        port: 27017,
        username: 'company_a_user',
        password: 'company_a_pass',
        database: 'company_a_db',
        authSource: 'admin'
      } as MongoDBCredentials
    };

    // Get MongoDB connection
    const mongoConnection = await manager.getConnection('company_a', mongoConfig);
    console.log('✅ MongoDB connection established for Company A');

    // Example 2: PostgreSQL Tenant
    console.log('\n🐘 Setting up PostgreSQL tenant...');
    const postgresConfig: TenantConfig = {
      tenantId: 'company_b',
      databaseType: DatabaseType.POSTGRESQL,
      credentials: {
        host: 'localhost',
        port: 5432,
        username: 'company_b_user',
        password: 'company_b_pass',
        database: 'company_b_db',
        schema: 'company_b_schema'
      } as PostgreSQLCredentials
    };

    // Get PostgreSQL connection
    const postgresConnection = await manager.getConnection('company_b', postgresConfig);
    console.log('✅ PostgreSQL connection established for Company B');

    // Example 3: Check connection status
    console.log('\n📈 Checking connection status...');
    console.log(`Active connections: ${manager.getActiveConnectionsCount()}`);
    console.log(`Company A has connection: ${manager.hasConnection('company_a')}`);
    console.log(`Company B has connection: ${manager.hasConnection('company_b')}`);

    // Example 4: Get connection statistics
    const stats = manager.getConnectionStats();
    console.log('\n📊 Connection Statistics:');
    console.log(`Total connections: ${stats.totalConnections}`);
    console.log(`Active connections: ${stats.activeConnections}`);
    console.log(`MongoDB connections: ${stats.databaseTypes[DatabaseType.MONGODB]}`);
    console.log(`PostgreSQL connections: ${stats.databaseTypes[DatabaseType.POSTGRESQL]}`);

    // Example 5: Simulate some database operations
    console.log('\n🔧 Simulating database operations...');
    
    // MongoDB operation simulation
    if (mongoConnection && mongoConnection.db) {
      console.log('📝 Performing MongoDB operation for Company A...');
      // In a real scenario, you would use the connection for actual operations
      // await mongoConnection.db.collection('users').find().toArray();
    }

    // PostgreSQL operation simulation
    if (postgresConnection && postgresConnection.isInitialized) {
      console.log('📝 Performing PostgreSQL operation for Company B...');
      // In a real scenario, you would use the connection for actual operations
      // await postgresConnection.query('SELECT * FROM users LIMIT 1');
    }

    // Example 6: Add a new tenant dynamically
    console.log('\n➕ Adding a new tenant dynamically...');
    const newTenantConfig: TenantConfig = {
      tenantId: 'company_c',
      databaseType: DatabaseType.MONGODB,
      credentials: {
        host: 'localhost',
        port: 27017,
        username: 'company_c_user',
        password: 'company_c_pass',
        database: 'company_c_db'
      } as MongoDBCredentials
    };

    await manager.getConnection('company_c', newTenantConfig);
    console.log('✅ New tenant (Company C) added successfully');

    // Example 7: Update configuration
    console.log('\n⚙️ Updating manager configuration...');
    manager.updateConfig({
      logLevel: 'debug',
      defaultOptions: {
        maxConnections: 10,
        connectionTimeout: 10000
      }
    });
    console.log('✅ Configuration updated');

    // Example 8: Cleanup inactive connections
    console.log('\n🧹 Cleaning up inactive connections...');
    await manager.cleanupInactiveConnections(60000); // 1 minute threshold
    console.log('✅ Cleanup completed');

    // Final status
    console.log('\n📊 Final Status:');
    const finalStats = manager.getConnectionStats();
    console.log(`Active connections: ${finalStats.activeConnections}`);
    console.log(`Total connections: ${finalStats.totalConnections}`);

    // Cleanup
    console.log('\n🧹 Cleaning up all connections...');
    await manager.closeAllConnections();
    console.log('✅ All connections closed');

  } catch (error) {
    console.error('❌ Error occurred:', error instanceof Error ? error.message : 'Unknown error');
  }

  console.log('\n🎉 Example completed successfully!');
}

// Run the example
if (require.main === module) {
  simpleExample().catch(console.error);
}

export { simpleExample };
