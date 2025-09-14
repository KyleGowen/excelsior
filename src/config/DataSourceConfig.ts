import { OverPowerRepository } from '../repository/OverPowerRepository';
import { InMemoryDatabase } from '../database/inMemoryDatabase';

export class DataSourceConfig {
  private static instance: DataSourceConfig;
  private repository: OverPowerRepository;

  private constructor() {
    // Only the DataSourceConfig knows which implementation we're using
    this.repository = new InMemoryDatabase();
  }

  public static getInstance(): DataSourceConfig {
    if (!DataSourceConfig.instance) {
      DataSourceConfig.instance = new DataSourceConfig();
    }
    return DataSourceConfig.instance;
  }

  public getRepository(): OverPowerRepository {
    return this.repository;
  }
}
