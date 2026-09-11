import { User, UserRole } from '../types';

export interface UserAnalyticsQuery {
  asOf: Date;
  acquisitionStart: Date;
  signupChartStart: Date;
  signupChartEnd: Date;
  excludedUsernames: readonly string[];
}

export interface UserAnalyticsCounts {
  standardUserAccounts: number;
  newStandardAccounts: number;
  loggedInLast24Hours: number;
  loggedInLast30Days: number;
  inactiveOver30Days: number;
  googleAuthUsers: number;
  recordedLoginUsers: number;
  signupMonths: Array<{ month: string; count: number }>;
  loginRecency: {
    days0To7: number;
    days8To30: number;
    days31To60: number;
    days61To90: number;
    days90Plus: number;
  };
  deckStatistics: {
    totalDecks: number;
    legalDecks: number;
    limitedDecks: number;
    nonStarterDecks: number;
    nonStarterLegalDecks: number;
  };
  collectionStatistics: {
    usersWithNonZeroCollections: number;
    totalOwnedCards: number;
  };
  endpointHits: Array<{
    endpointKey: string;
    hitCount: number;
  }>;
  loginTimeDistribution: {
    hours: Array<{
      hour: number;
      count: number;
      allTimeCount: number;
    }>;
  };
}

export interface UserRepository {
  // Initialization
  initialize(): Promise<void>;

  // User management
  createUser(name: string, email: string, password: string, role?: UserRole): Promise<User>;
  getUserById(id: string): Promise<User | undefined>;
  /** Returns auth_provider for self-service account checks (e.g. Google email lock). */
  getUserAuthMeta(id: string): Promise<{ auth_provider: string | null } | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  authenticateUser(username: string, password: string): Promise<User | undefined>;
  createGoogleUser(email: string, name: string, firebaseUid: string): Promise<User>;
  linkGoogleToUser(userId: string, firebaseUid: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  /** Batch lookup for enriching lists with owner display names. */
  getUsersByIds(ids: string[]): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateLastLoginAt(id: string): Promise<void>;
  // Security
  updateUserPassword(id: string, newPlainPassword: string): Promise<boolean>;
  deleteUser(id: string): Promise<boolean>;

  // Statistics
  getUserStats(): Promise<{
    users: number;
  }>;
  getUserAnalytics(query: UserAnalyticsQuery): Promise<UserAnalyticsCounts>;
}
