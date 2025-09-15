import { UserRepository } from '../repository/UserRepository';
import { DeckRepository } from '../repository/DeckRepository';
import { CardRepository } from '../repository/CardRepository';
import { InMemoryUserRepository } from '../database/InMemoryUserRepository';
import { InMemoryDeckRepository } from '../database/InMemoryDeckRepository';
import { InMemoryCardRepository } from '../database/InMemoryCardRepository';

export class DataSourceConfig {
  private static instance: DataSourceConfig;
  private userRepository: UserRepository;
  private deckRepository: DeckRepository;
  private cardRepository: CardRepository;

  private constructor() {
    // Only the DataSourceConfig knows which implementations we're using
    this.userRepository = new InMemoryUserRepository();
    this.deckRepository = new InMemoryDeckRepository();
    this.cardRepository = new InMemoryCardRepository();
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
}
