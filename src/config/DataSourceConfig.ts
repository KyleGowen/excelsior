import { Pool } from 'pg';
import { UserRepository } from '../repository/UserRepository';
import { DeckRepository } from '../repository/DeckRepository';
import { CardRepository } from '../repository/CardRepository';
import { InMemoryUserRepository } from '../database/InMemoryUserRepository';
import { InMemoryDeckRepository } from '../database/InMemoryDeckRepository';
import { InMemoryCardRepository } from '../database/InMemoryCardRepository';
import { PostgreSQLUserRepository } from '../database/PostgreSQLUserRepository';
import { PostgreSQLDeckRepository } from '../database/PostgreSQLDeckRepository';
import { PostgreSQLCardRepository } from '../database/PostgreSQLCardRepository';

export type DataSourceType = 'in-memory' | 'postgresql';

export class DataSourceConfig {
  private static instance: DataSourceConfig;
  private userRepository!: UserRepository;
  private deckRepository!: DeckRepository;
  private cardRepository!: CardRepository;
  private dataSourceType: DataSourceType;
  private pool?: Pool;

  private constructor() {
    // Determine data source type from environment variable
    this.dataSourceType = (process.env.DATA_SOURCE_TYPE as DataSourceType) || 'in-memory';
    
    if (this.dataSourceType === 'postgresql') {
      this.initializePostgreSQL();
    } else {
      this.initializeInMemory();
    }
  }

  private initializeInMemory(): void {
    console.log('🗄️ Initializing in-memory repositories...');
    this.userRepository = new InMemoryUserRepository();
    this.deckRepository = new InMemoryDeckRepository();
    this.cardRepository = new InMemoryCardRepository();
  }

  private initializePostgreSQL(): void {
    console.log('🐘 Initializing PostgreSQL repositories...');
    
    // Create PostgreSQL connection pool
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '1337'),
      database: process.env.DB_NAME || 'overpower',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Initialize repositories with the pool
    this.userRepository = new PostgreSQLUserRepository(this.pool);
    this.deckRepository = new PostgreSQLDeckRepository(this.pool);
    this.cardRepository = new PostgreSQLCardRepository(this.pool);
  }

  public static getInstance(): DataSourceConfig {
    if (!DataSourceConfig.instance) {
      DataSourceConfig.instance = new DataSourceConfig();
    }
    return DataSourceConfig.instance;
  }

  public getUserRepository(): UserRepository {
    return this.userRepository;
  }

  public getDeckRepository(): DeckRepository {
    return this.deckRepository;
  }

  public getCardRepository(): CardRepository {
    return this.cardRepository;
  }

  public getDataSourceType(): DataSourceType {
    return this.dataSourceType;
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 PostgreSQL connection pool closed');
    }
  }
}
