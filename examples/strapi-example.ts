import {
    DatabaseType,
    MongoDBCredentials,
    MultiTenantManager,
    TenantConfig
} from 'nodejs-db-multitenant';

// Strapi plugin for multi-tenant database management
export default {
  register({ strapi }: any) {
    // Initialize multi-tenant manager
    const multiTenantManager = new MultiTenantManager({
      enableLogging: true,
      logLevel: 'info',
      enableConnectionPooling: true,
      defaultOptions: {
        maxConnections: 15,
        connectionTimeout: 8000,
        idleTimeout: 45000,
        retryAttempts: 3,
        retryDelay: 1500
      }
    });

    // Store tenant configurations
    const tenantConfigs = new Map<string, TenantConfig>();

    // Initialize default tenant configurations
    const initializeTenantConfigs = () => {
      const tenants = [
        {
          id: 'strapi_tenant1',
          config: {
            tenantId: 'strapi_tenant1',
            databaseType: DatabaseType.MONGODB,
            credentials: {
              host: 'localhost',
              port: 27017,
              username: 'strapi_user1',
              password: 'strapi_pass1',
              database: 'strapi_tenant1_db',
              authSource: 'admin',
              ssl: false
            } as MongoDBCredentials
          }
        },
        {
          id: 'strapi_tenant2',
          config: {
            tenantId: 'strapi_tenant2',
            databaseType: DatabaseType.MONGODB,
            credentials: {
              host: 'localhost',
              port: 27017,
              username: 'strapi_user2',
              password: 'strapi_pass2',
              database: 'strapi_tenant2_db',
              authSource: 'admin',
              ssl: false
            } as MongoDBCredentials
          }
        }
      ];

      tenants.forEach(tenant => {
        tenantConfigs.set(tenant.id, tenant.config);
      });
    };

    // Initialize connections for all tenants
    const initializeAllConnections = async () => {
      try {
        for (const [tenantId, config] of tenantConfigs) {
          await multiTenantManager.getConnection(tenantId, config);
          strapi.log.info(`Initialized MongoDB connection for tenant: ${tenantId}`);
        }
      } catch (error) {
        strapi.log.error('Failed to initialize tenant connections:', error);
        throw error;
      }
    };

    // Initialize on plugin load
    initializeTenantConfigs();
    initializeAllConnections();

    // Add multi-tenant manager to strapi context
    strapi.multiTenantManager = multiTenantManager;
    strapi.tenantConfigs = tenantConfigs;

    // Add utility functions to strapi
    strapi.getTenantConnection = async (tenantId: string) => {
      const config = tenantConfigs.get(tenantId);
      if (!config) {
        throw new Error(`Tenant configuration not found for: ${tenantId}`);
      }
      return multiTenantManager.getConnection(tenantId, config);
    };

    strapi.addTenant = async (tenantConfig: TenantConfig) => {
      if (tenantConfigs.has(tenantConfig.tenantId)) {
        throw new Error(`Tenant already exists: ${tenantConfig.tenantId}`);
      }

      tenantConfigs.set(tenantConfig.tenantId, tenantConfig);
      await multiTenantManager.getConnection(tenantConfig.tenantId, tenantConfig);
    };

    strapi.removeTenant = async (tenantId: string) => {
      if (!tenantConfigs.has(tenantId)) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      await multiTenantManager.closeConnection(tenantId);
      tenantConfigs.delete(tenantId);
    };

    strapi.getConnectionStats = () => {
      return multiTenantManager.getConnectionStats();
    };

    strapi.hasTenantConnection = (tenantId: string) => {
      return multiTenantManager.hasConnection(tenantId);
    };

    strapi.getAllTenantIds = () => {
      return Array.from(tenantConfigs.keys());
    };

    // Cleanup on application shutdown
    process.on('SIGTERM', async () => {
      strapi.log.info('Shutting down multi-tenant connections...');
      await multiTenantManager.closeAllConnections();
    });

    process.on('SIGINT', async () => {
      strapi.log.info('Shutting down multi-tenant connections...');
      await multiTenantManager.closeAllConnections();
    });
  },

  bootstrap({ strapi }: any) {
    // Plugin bootstrap logic
    strapi.log.info('Multi-tenant database plugin bootstrapped');
  },

  destroy({ strapi }: any) {
    // Plugin destroy logic
    strapi.log.info('Multi-tenant database plugin destroyed');
  }
};

// Example Strapi service using multi-tenant database
export class MultiTenantUserService {
  constructor(private strapi: any) {}

  async createUser(tenantId: string, userData: any): Promise<any> {
    try {
      const connection = await this.strapi.getTenantConnection(tenantId);
      
      // Create a new user document
      const user = new connection.models.User({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'authenticated',
        created_at: new Date(),
        updated_at: new Date()
      });

      const savedUser = await user.save();
      return savedUser;
    } catch (error) {
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUsers(tenantId: string, filters: any = {}): Promise<any[]> {
    try {
      const connection = await this.strapi.getTenantConnection(tenantId);
      
      // Build query based on filters
      let query = connection.models.User.find();
      
      if (filters.username) {
        query = query.where('username', new RegExp(filters.username, 'i'));
      }
      
      if (filters.email) {
        query = query.where('email', new RegExp(filters.email, 'i'));
      }
      
      if (filters.role) {
        query = query.where('role', filters.role);
      }
      
      // Add sorting and pagination
      query = query.sort({ created_at: -1 });
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.skip(filters.offset);
      }
      
      const users = await query.exec();
      return users;
    } catch (error) {
      throw new Error(`Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserById(tenantId: string, userId: string): Promise<any> {
    try {
      const connection = await this.strapi.getTenantConnection(tenantId);
      
      const user = await connection.models.User.findById(userId).exec();
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateUser(tenantId: string, userId: string, updateData: any): Promise<any> {
    try {
      const connection = await this.strapi.getTenantConnection(tenantId);
      
      const user = await connection.models.User.findByIdAndUpdate(
        userId,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      ).exec();
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteUser(tenantId: string, userId: string): Promise<boolean> {
    try {
      const connection = await this.strapi.getTenantConnection(tenantId);
      
      const result = await connection.models.User.findByIdAndDelete(userId).exec();
      return !!result;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserCount(tenantId: string): Promise<number> {
    try {
      const connection = await this.strapi.getTenantConnection(tenantId);
      
      const count = await connection.models.User.countDocuments().exec();
      return count;
    } catch (error) {
      throw new Error(`Failed to get user count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchUsers(tenantId: string, searchTerm: string): Promise<any[]> {
    try {
      const connection = await this.strapi.getTenantConnection(tenantId);
      
      const users = await connection.models.User.find({
        $or: [
          { username: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { firstname: { $regex: searchTerm, $options: 'i' } },
          { lastname: { $regex: searchTerm, $options: 'i' } }
        ]
      }).sort({ created_at: -1 }).exec();
      
      return users;
    } catch (error) {
      throw new Error(`Failed to search users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Example Strapi controller using multi-tenant database
export class MultiTenantUserController {
  constructor(private userService: MultiTenantUserService) {}

  async create(ctx: any) {
    try {
      const { tenantId } = ctx.params;
      const userData = ctx.request.body;
      
      const user = await this.userService.createUser(tenantId, userData);
      
      ctx.send({
        success: true,
        data: user,
        message: 'User created successfully'
      });
    } catch (error) {
      ctx.badRequest('Failed to create user', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async find(ctx: any) {
    try {
      const { tenantId } = ctx.params;
      const filters = ctx.query;
      
      const users = await this.userService.getUsers(tenantId, filters);
      
      ctx.send({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      ctx.badRequest('Failed to get users', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async findOne(ctx: any) {
    try {
      const { tenantId, id } = ctx.params;
      
      const user = await this.userService.getUserById(tenantId, id);
      
      ctx.send({
        success: true,
        data: user
      });
    } catch (error) {
      ctx.notFound('User not found', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async update(ctx: any) {
    try {
      const { tenantId, id } = ctx.params;
      const updateData = ctx.request.body;
      
      const user = await this.userService.updateUser(tenantId, id, updateData);
      
      ctx.send({
        success: true,
        data: user,
        message: 'User updated successfully'
      });
    } catch (error) {
      ctx.badRequest('Failed to update user', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async delete(ctx: any) {
    try {
      const { tenantId, id } = ctx.params;
      
      const deleted = await this.userService.deleteUser(tenantId, id);
      
      if (deleted) {
        ctx.send({
          success: true,
          message: 'User deleted successfully'
        });
      } else {
        ctx.notFound('User not found');
      }
    } catch (error) {
      ctx.badRequest('Failed to delete user', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
