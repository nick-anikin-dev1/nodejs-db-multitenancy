import { Connection, ConnectionOptions as TypeORMConnectionOptions } from 'typeorm';
import { ConnectionOptions, DatabaseType, PostgreSQLCredentials } from '../types';
import { BaseConnector } from './base-connector';

export class PostgreSQLConnector extends BaseConnector {
  private typeormConnection: Connection | null = null;
  private connectionString: string;

  constructor(
    credentials: PostgreSQLCredentials,
    options: ConnectionOptions = {}
  ) {
    super(DatabaseType.POSTGRESQL, credentials, options);
    this.connectionString = this.buildConnectionString(credentials);
  }

  /**
   * Build PostgreSQL connection string from credentials
   */
  private buildConnectionString(credentials: PostgreSQLCredentials): string {
    const { host, port, username, password, database, schema, ssl } = credentials;
    
    let connectionString = `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    
    const queryParams: string[] = [];
    
    if (schema) {
      queryParams.push(`search_path=${schema}`);
    }
    
    if (ssl) {
      if (typeof ssl === 'boolean') {
        queryParams.push('sslmode=require');
      } else {
        if (ssl.rejectUnauthorized === false) {
          queryParams.push('sslmode=require&sslmode=no-verify');
        } else {
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
  public async connect(): Promise<Connection> {
    try {
      if (this.isConnected && this.typeormConnection) {
        return this.typeormConnection;
      }

      const connectionOptions: TypeORMConnectionOptions = {
        type: 'postgres',
        host: this.credentials.host,
        port: this.credentials.port,
        username: this.credentials.username,
        password: this.credentials.password,
        database: this.credentials.database,
        schema: (this.credentials as PostgreSQLCredentials).schema || 'public',
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
      if ((this.credentials as PostgreSQLCredentials).ssl) {
        const sslConfig = (this.credentials as PostgreSQLCredentials).ssl;
        if (typeof sslConfig === 'object') {
          (connectionOptions.extra as any) = {
            ...connectionOptions.extra,
            ssl: sslConfig
          };
        } else if (sslConfig === true) {
          (connectionOptions.extra as any) = {
            ...connectionOptions.extra,
            ssl: { rejectUnauthorized: false }
          };
        }
      }

      // In older TypeORM versions, we need to use createConnection
      this.typeormConnection = await require('typeorm').createConnection(connectionOptions);
      
      (this as any).connection = this.typeormConnection!;
      this.isConnected = true;

      console.log(`PostgreSQL connected for tenant: ${this.credentials.database}`);

      return this.typeormConnection!;
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from PostgreSQL
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.typeormConnection) {
        await this.typeormConnection.close();
        this.typeormConnection = null;
      }
      this.isConnected = false;
      this.connection = null;
    } catch (error) {
      throw new Error(`Failed to disconnect from PostgreSQL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test PostgreSQL connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.typeormConnection) {
        await this.connect();
      }
      
      await this.typeormConnection!.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get PostgreSQL connection information
   */
  public async getConnectionInfo(): Promise<any> {
    if (!this.typeormConnection) {
      throw new Error('PostgreSQL connection not established');
    }

    try {
      const version = await this.typeormConnection.query('SELECT version()');
      const currentDatabase = await this.typeormConnection.query('SELECT current_database()');
      const currentSchema = await this.typeormConnection.query('SELECT current_schema()');
      
      return {
        version: version[0]?.version,
        currentDatabase: currentDatabase[0]?.current_database,
        currentSchema: currentSchema[0]?.current_schema,
        connectionString: this.connectionString,
        database: this.credentials.database,
        host: this.credentials.host,
        port: this.credentials.port,
        schema: (this.credentials as PostgreSQLCredentials).schema || 'public'
      };
    } catch (error) {
      throw new Error(`Failed to get PostgreSQL connection info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ping PostgreSQL connection
   */
  public async ping(): Promise<boolean> {
    try {
      if (!this.typeormConnection) {
        return false;
      }
      
      await this.typeormConnection.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the TypeORM Connection instance
   */
  public getDataSource(): Connection | null {
    return this.typeormConnection;
  }

  /**
   * Get the connection string (useful for debugging)
   */
  public getConnectionString(): string {
    return this.connectionString;
  }

  /**
   * Execute a raw query
   */
  public async query(sql: string, parameters?: any[]): Promise<any> {
    if (!this.typeormConnection) {
      throw new Error('PostgreSQL connection not established');
    }
    
    return this.typeormConnection.query(sql, parameters);
  }

  /**
   * Get the query runner for transactions
   */
  public getQueryRunner() {
    if (!this.typeormConnection) {
      throw new Error('PostgreSQL connection not established');
    }
    
    return this.typeormConnection.createQueryRunner();
  }
}
