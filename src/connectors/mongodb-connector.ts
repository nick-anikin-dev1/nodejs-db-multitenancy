import mongoose, { Connection, ConnectOptions as MongooseConnectionOptions } from 'mongoose';
import { ConnectionOptions, DatabaseType, MongoDBCredentials } from '../types';
import { BaseConnector } from './base-connector';

export class MongoDBConnector extends BaseConnector {
  private mongooseConnection: Connection | null = null;
  private connectionString: string;

  constructor(
    credentials: MongoDBCredentials,
    options: ConnectionOptions = {}
  ) {
    super(DatabaseType.MONGODB, credentials, options);
    this.connectionString = this.buildConnectionString(credentials);
  }

  /**
   * Build MongoDB connection string from credentials
   */
  private buildConnectionString(credentials: MongoDBCredentials): string {
    const { host, port, username, password, database, authSource, replicaSet, ssl } = credentials;
    
    let connectionString = 'mongodb://';
    
    if (username && password) {
      connectionString += `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
    }
    
    connectionString += `${host}:${port}/${database}`;
    
    const queryParams: string[] = [];
    
    if (authSource) {
      queryParams.push(`authSource=${authSource}`);
    }
    
    if (replicaSet) {
      queryParams.push(`replicaSet=${replicaSet}`);
    }
    
    if (ssl) {
      queryParams.push('ssl=true');
    }
    
    if (queryParams.length > 0) {
      connectionString += `?${queryParams.join('&')}`;
    }
    
    return connectionString;
  }

  /**
   * Connect to MongoDB using Mongoose
   */
  public async connect(): Promise<Connection> {
    try {
      if (this.isConnected && this.mongooseConnection) {
        return this.mongooseConnection;
      }

      const mongooseOptions: MongooseConnectionOptions = {
        maxPoolSize: this.options.maxConnections || 10,
        serverSelectionTimeoutMS: this.options.connectionTimeout || 5000,
        socketTimeoutMS: this.options.idleTimeout || 30000,
        bufferCommands: false,
        ...this.credentials.options
      };

      this.mongooseConnection = await mongoose.createConnection(
        this.connectionString,
        mongooseOptions
      ) as Connection;

      this.mongooseConnection.on('connected', () => {
        this.isConnected = true;
        console.log(`MongoDB connected for tenant: ${this.credentials.database}`);
      });

      this.mongooseConnection.on('disconnected', () => {
        this.isConnected = false;
        console.log(`MongoDB disconnected for tenant: ${this.credentials.database}`);
      });

      this.mongooseConnection.on('error', (error) => {
        console.error(`MongoDB connection error for tenant ${this.credentials.database}:`, error);
        this.isConnected = false;
      });

      (this as any).connection = this.mongooseConnection;
      this.isConnected = true;

      return this.mongooseConnection;
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.mongooseConnection) {
        await this.mongooseConnection.close();
        this.mongooseConnection = null;
      }
      this.isConnected = false;
      this.connection = null;
    } catch (error) {
      throw new Error(`Failed to disconnect from MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test MongoDB connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.mongooseConnection) {
        await this.connect();
      }
      
      await this.mongooseConnection!.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get MongoDB connection information
   */
  public async getConnectionInfo(): Promise<any> {
    if (!this.mongooseConnection) {
      throw new Error('MongoDB connection not established');
    }

    try {
      const adminDb = this.mongooseConnection.db.admin();
      const serverInfo = await adminDb.serverInfo();
      const dbStats = await this.mongooseConnection.db.stats();
      
      return {
        serverInfo,
        dbStats,
        connectionString: this.connectionString,
        database: this.credentials.database,
        host: this.credentials.host,
        port: this.credentials.port
      };
    } catch (error) {
      throw new Error(`Failed to get MongoDB connection info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Ping MongoDB connection
   */
  public async ping(): Promise<boolean> {
    try {
      if (!this.mongooseConnection) {
        return false;
      }
      
      await this.mongooseConnection.db.admin().ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the Mongoose connection instance
   */
  public getMongooseConnection(): Connection | null {
    return this.mongooseConnection;
  }

  /**
   * Get the connection string (useful for debugging)
   */
  public getConnectionString(): string {
    return this.connectionString;
  }
}
