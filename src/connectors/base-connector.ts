import { ConnectionOptions, DatabaseCredentials, DatabaseType } from '../types';

export abstract class BaseConnector {
  protected databaseType: DatabaseType;
  protected credentials: DatabaseCredentials;
  protected options: ConnectionOptions;
  protected connection: any;
  protected isConnected: boolean = false;

  constructor(
    databaseType: DatabaseType,
    credentials: DatabaseCredentials,
    options: ConnectionOptions = {}
  ) {
    this.databaseType = databaseType;
    this.credentials = credentials;
    this.options = options;
  }

  /**
   * Get the database type
   */
  public getDatabaseType(): DatabaseType {
    return this.databaseType;
  }

  /**
   * Get the current connection
   */
  public getConnection(): any {
    return this.connection;
  }

  /**
   * Check if the connection is active
   */
  public isConnectionActive(): boolean {
    return this.isConnected && this.connection !== null;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): { isConnected: boolean; databaseType: DatabaseType } {
    return {
      isConnected: this.isConnected,
      databaseType: this.databaseType
    };
  }

  /**
   * Abstract method to create connection
   */
  public abstract connect(): Promise<any>;

  /**
   * Abstract method to disconnect
   */
  public abstract disconnect(): Promise<void>;

  /**
   * Abstract method to test connection
   */
  public abstract testConnection(): Promise<boolean>;

  /**
   * Abstract method to get connection info
   */
  public abstract getConnectionInfo(): Promise<any>;

  /**
   * Abstract method to ping connection
   */
  public abstract ping(): Promise<boolean>;
}
