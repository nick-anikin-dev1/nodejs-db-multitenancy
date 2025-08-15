# 🚀 NestJS Setup Guide for Multi-Tenant Database Library

This guide will help you integrate the multi-tenant database library into your NestJS application.

## 📋 Prerequisites

- Node.js 14.18.3 or higher
- NestJS CLI installed: `npm i -g @nestjs/cli`
- PostgreSQL and/or MongoDB running locally (or remote instances)

## 🔧 Step 1: Install the Library

### Option A: Install from GitHub (Recommended for development)
```bash
npm install git+https://github.com/YOUR_USERNAME/nodejs-db-multitenant.git
```

### Option B: Install from npm (After publishing)
```bash
npm install nodejs-db-multitenant
```

### Option C: Local development with npm link
```bash
# In your library directory
npm link

# In your NestJS project directory
npm link nodejs-db-multitenant
```

## 🏗️ Step 2: Create Your NestJS Project

If you don't have a NestJS project yet:

```bash
# Create new NestJS project
nest new my-multitenant-app
cd my-multitenant-app

# Install required dependencies
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/mongoose mongoose
```

## 📁 Step 3: Project Structure

Your project should look like this:

```
my-multitenant-app/
├── src/
│   ├── multi-tenant/
│   │   ├── multi-tenant.module.ts
│   │   ├── multi-tenant.service.ts
│   │   └── multi-tenant.controller.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   └── users.controller.ts
│   ├── app.module.ts
│   └── main.ts
├── package.json
└── tsconfig.json
```

## 🔌 Step 4: Create Multi-Tenant Module

Create `src/multi-tenant/multi-tenant.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { 
  MultiTenantManager, 
  DatabaseType, 
  TenantConfig, 
  PostgreSQLCredentials,
  MongoDBCredentials
} from 'nodejs-db-multitenant';

@Injectable()
export class MultiTenantService implements OnModuleInit, OnModuleDestroy {
  private multiTenantManager: MultiTenantManager;
  private tenantConfigs: Map<string, TenantConfig> = new Map();

  constructor() {
    this.multiTenantManager = new MultiTenantManager({
      enableLogging: true,
      logLevel: 'info',
      enableConnectionPooling: true,
      defaultOptions: {
        maxConnections: 20,
        connectionTimeout: 10000,
        idleTimeout: 60000,
        retryAttempts: 3,
        retryDelay: 2000
      }
    });

    this.initializeTenantConfigs();
  }

  async onModuleInit() {
    await this.initializeAllConnections();
    console.log('Multi-tenant database service initialized');
  }

  async onModuleDestroy() {
    await this.multiTenantManager.closeAllConnections();
    console.log('Multi-tenant database service destroyed');
  }

  private initializeTenantConfigs(): void {
    // Configure your tenants here
    const tenants = [
      {
        id: 'company_a',
        config: {
          tenantId: 'company_a',
          databaseType: DatabaseType.POSTGRESQL,
          credentials: {
            host: 'localhost',
            port: 5432,
            username: 'company_a_user',
            password: 'company_a_password',
            database: 'company_a_db',
            schema: 'company_a_schema',
            ssl: false
          } as PostgreSQLCredentials
        }
      },
      {
        id: 'company_b',
        config: {
          tenantId: 'company_b',
          databaseType: DatabaseType.MONGODB,
          credentials: {
            host: 'localhost',
            port: 27017,
            username: 'company_b_user',
            password: 'company_b_password',
            database: 'company_b_db',
            authSource: 'admin',
            ssl: false
          } as MongoDBCredentials
        }
      }
    ];

    tenants.forEach(tenant => {
      this.tenantConfigs.set(tenant.id, tenant.config);
    });
  }

  private async initializeAllConnections(): Promise<void> {
    try {
      for (const [tenantId, config] of this.tenantConfigs) {
        await this.multiTenantManager.getConnection(tenantId, config);
        console.log(`Initialized connection for tenant: ${tenantId}`);
      }
    } catch (error) {
      console.error('Failed to initialize tenant connections:', error);
      throw error;
    }
  }

  async getTenantConnection(tenantId: string): Promise<any> {
    const config = this.tenantConfigs.get(tenantId);
    if (!config) {
      throw new Error(`Tenant configuration not found for: ${tenantId}`);
    }

    return this.multiTenantManager.getConnection(tenantId, config);
  }

  async addTenant(tenantConfig: TenantConfig): Promise<void> {
    if (this.tenantConfigs.has(tenantConfig.tenantId)) {
      throw new Error(`Tenant already exists: ${tenantConfig.tenantId}`);
    }

    this.tenantConfigs.set(tenantConfig.tenantId, tenantConfig);
    await this.multiTenantManager.getConnection(tenantConfig.tenantId, tenantConfig);
  }

  getConnectionStats() {
    return this.multiTenantManager.getConnectionStats();
  }

  hasTenantConnection(tenantId: string): boolean {
    return this.multiTenantManager.hasConnection(tenantId);
  }
}
```

Create `src/multi-tenant/multi-tenant.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MultiTenantService } from './multi-tenant.service';

@Module({
  providers: [MultiTenantService],
  exports: [MultiTenantService],
})
export class MultiTenantModule {}
```

## 👥 Step 5: Create User Service

Create `src/users/users.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { MultiTenantService } from '../multi-tenant/multi-tenant.service';

@Injectable()
export class UsersService {
  constructor(private multiTenantService: MultiTenantService) {}

  async createUser(tenantId: string, userData: any): Promise<any> {
    try {
      const connection = await this.multiTenantService.getTenantConnection(tenantId);
      
      if (connection.isInitialized) {
        // PostgreSQL connection
        const result = await connection.query(
          'INSERT INTO users (name, email, created_at) VALUES ($1, $2, $3) RETURNING *',
          [userData.name, userData.email, new Date()]
        );
        return result[0];
      } else if (connection.db) {
        // MongoDB connection
        const user = new connection.models.User({
          name: userData.name,
          email: userData.email,
          createdAt: new Date()
        });
        return await user.save();
      }
    } catch (error) {
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUsers(tenantId: string): Promise<any[]> {
    try {
      const connection = await this.multiTenantService.getTenantConnection(tenantId);
      
      if (connection.isInitialized) {
        // PostgreSQL connection
        const result = await connection.query('SELECT * FROM users ORDER BY created_at DESC');
        return result;
      } else if (connection.db) {
        // MongoDB connection
        const users = await connection.models.User.find().sort({ createdAt: -1 }).exec();
        return users;
      }
      
      return [];
    } catch (error) {
      throw new Error(`Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
```

Create `src/users/users.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post(':tenantId')
  async createUser(
    @Param('tenantId') tenantId: string,
    @Body() userData: any
  ) {
    try {
      const user = await this.usersService.createUser(tenantId, userData);
      return {
        success: true,
        data: user,
        message: 'User created successfully'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':tenantId')
  async getUsers(@Param('tenantId') tenantId: string) {
    try {
      const users = await this.usersService.getUsers(tenantId);
      return {
        success: true,
        data: users,
        count: users.length
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
```

Create `src/users/users.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MultiTenantModule } from '../multi-tenant/multi-tenant.module';

@Module({
  imports: [MultiTenantModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

## 🎯 Step 6: Update App Module

Update `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule],
})
export class AppModule {}
```

## 🚀 Step 7: Run Your Application

```bash
# Start the application
npm run start:dev
```

## 📡 Step 8: Test Your API

### Create a user for Company A (PostgreSQL):
```bash
curl -X POST http://localhost:3000/users/company_a \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@companya.com"}'
```

### Create a user for Company B (MongoDB):
```bash
curl -X POST http://localhost:3000/users/company_b \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Smith", "email": "jane@companyb.com"}'
```

### Get users for Company A:
```bash
curl http://localhost:3000/users/company_a
```

### Get users for Company B:
```bash
curl http://localhost:3000/users/company_b
```

## 🔧 Configuration Tips

1. **Environment Variables**: Store database credentials in `.env` files
2. **Tenant Management**: Consider storing tenant configurations in a database
3. **Connection Pooling**: Adjust connection pool sizes based on your needs
4. **Error Handling**: Implement proper error handling and logging
5. **Health Checks**: Add health check endpoints for monitoring

## 🚨 Troubleshooting

- **Connection Issues**: Check database credentials and network connectivity
- **Type Errors**: Ensure TypeScript is properly configured
- **Import Errors**: Verify the library is correctly installed
- **Performance**: Monitor connection pool usage and adjust settings

## 📚 Next Steps

- Add more complex database operations
- Implement tenant isolation middleware
- Add connection monitoring and metrics
- Create database migration scripts
- Add unit and integration tests
