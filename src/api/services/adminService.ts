import type { User } from '../../types';
import type { AdminUserAnalyticsDto } from '../dto/v1/AdminUserAnalyticsDto';
import type { UserAnalyticsCounts, UserAnalyticsQuery } from '../../repository/UserRepository';
import { USER_ANALYTICS_UTILITY_USERNAMES } from '../../constants/userAnalytics';
import type { AdminUserDto } from '../dto/v1/AdminUserDto';
import type {
  ComplimentaryGrantDuration,
  SupporterEntitlementService
} from './supporterEntitlementService';

type SiteSectionKey = AdminUserAnalyticsDto['siteSectionUsage']['sections'][number]['key'];

const SITE_SECTIONS: Array<{ key: SiteSectionKey; label: string }> = [
  { key: 'home', label: 'Home' },
  { key: 'database', label: 'Database' },
  { key: 'decks', label: 'Decks' },
  { key: 'collection', label: 'Collection' }
];

export function classifyUserAnalyticsEndpoint(endpointKey: string): SiteSectionKey | null {
  const separator = endpointKey.indexOf(' ');
  const path = separator >= 0 ? endpointKey.slice(separator + 1) : endpointKey;

  if (path === '/api/v1/recent-updates') return 'home';
  if (path === '/api/v1/dbv/sets' || path.startsWith('/api/v1/catalog/')) return 'database';
  if (path === '/api/v1/collections/me' || path.startsWith('/api/v1/collections/')) return 'collection';
  if (
    path === '/api/v1/decks'
    || path.startsWith('/api/v1/decks/')
    || path === '/api/v1/guest/decks'
    || path.startsWith('/api/v1/guest/decks/')
    || path === '/api/v1/community/decks'
    || path === '/api/v1/users/:userId/public-decks'
    || path === '/api/v1/dbv/deck-backgrounds'
  ) return 'decks';

  return null;
}

function formatPacificHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

export interface AdminServiceUserRepository {
  getAllUsers: () => Promise<User[]>;
  getUserById: (id: string) => Promise<User | undefined>;
  getUserByUsername: (username: string) => Promise<User | undefined>;
  createUser: (username: string, email: string, password: string, role: 'USER') => Promise<User>;
  getUserAnalytics: (query: UserAnalyticsQuery) => Promise<UserAnalyticsCounts>;
}

export interface AdminServiceDeckRepository {
  clearCache?: () => void;
}

export interface AdminServiceCardRepository {
  clearCaches?: () => void;
}

export interface AdminServiceDatabaseInit {
  validateDatabase: () => Promise<boolean>;
  checkDatabaseStatus: () => Promise<boolean>;
}

export interface AdminServiceDeps {
  userRepository: AdminServiceUserRepository;
  deckRepository: AdminServiceDeckRepository;
  cardRepository: AdminServiceCardRepository;
  databaseInit: AdminServiceDatabaseInit;
  supporterEntitlementService: SupporterEntitlementService;
  now?: () => Date;
}

export class AdminService {
  constructor(private readonly deps: AdminServiceDeps) {}

  async listUsers(): Promise<AdminUserDto[]> {
    const users = await this.deps.userRepository.getAllUsers();
    const statuses = await this.deps.supporterEntitlementService.getStatuses(users.map((user) => user.id));
    return users.map((user) => this.toAdminUser(user, statuses.get(user.id)));
  }

  private toAdminUser(
    user: User,
    status?: Awaited<ReturnType<SupporterEntitlementService['getStatus']>>
  ): AdminUserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      isSupporter: status?.isSupporter ?? false,
      supporterSources: status?.sources ?? [],
      complimentarySupporterExpiresAt: status?.complimentaryExpiresAt?.toISOString() ?? null
    };
  }

  async updateSupporterEntitlement(input: {
    userId: string;
    actorUserId: string;
    action: 'grant' | 'revoke';
    duration?: ComplimentaryGrantDuration;
    customExpiresAt?: Date;
    reason: string;
  }): Promise<
    | { ok: true; user: AdminUserDto }
    | { ok: false; kind: 'not_found' | 'invalid_role' | 'invalid_expiry'; message: string }
  > {
    const user = await this.deps.userRepository.getUserById(input.userId);
    if (!user) return { ok: false, kind: 'not_found', message: 'User not found' };
    if (user.role !== 'USER') {
      return { ok: false, kind: 'invalid_role', message: 'Supporter access can only be granted to USER accounts' };
    }

    try {
      const status = input.action === 'grant'
        ? await this.deps.supporterEntitlementService.grantComplimentary({
            userId: user.id,
            actorUserId: input.actorUserId,
            duration: input.duration!,
            ...(input.customExpiresAt ? { customExpiresAt: input.customExpiresAt } : {}),
            reason: input.reason
          })
        : await this.deps.supporterEntitlementService.revokeComplimentary({
            userId: user.id,
            actorUserId: input.actorUserId,
            reason: input.reason
          });
      return { ok: true, user: this.toAdminUser(user, status) };
    } catch (error) {
      if (error instanceof Error && error.message.includes('expiry')) {
        return { ok: false, kind: 'invalid_expiry', message: error.message };
      }
      throw error;
    }
  }

  async getUserAnalytics(): Promise<AdminUserAnalyticsDto> {
    const asOf = this.deps.now?.() ?? new Date();
    const currentMonthStart = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1));
    const acquisitionStart = new Date(asOf.getTime() - (30 * 24 * 60 * 60 * 1000));
    const signupChartStart = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - 11, 1));
    const signupChartEnd = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() + 1, 1));
    const counts = await this.deps.userRepository.getUserAnalytics({
      asOf,
      acquisitionStart,
      signupChartStart,
      signupChartEnd,
      excludedUsernames: USER_ANALYTICS_UTILITY_USERNAMES
    });
    const userPercentage = (count: number) => counts.standardUserAccounts === 0
      ? 0
      : Math.round((count / counts.standardUserAccounts) * 100);
    const percentage = (count: number, total: number) => total === 0
      ? 0
      : Math.round((count / total) * 1000) / 10;
    const average = (count: number, total: number) => total === 0
      ? 0
      : Math.round((count / total) * 10) / 10;
    const currentMonth = currentMonthStart.toISOString().slice(0, 7);
    const sectionRequestCounts = new Map<SiteSectionKey, number>(
      SITE_SECTIONS.map(({ key }) => [key, 0])
    );
    for (const endpoint of counts.endpointHits) {
      const section = classifyUserAnalyticsEndpoint(endpoint.endpointKey);
      if (section) {
        sectionRequestCounts.set(section, (sectionRequestCounts.get(section) ?? 0) + endpoint.hitCount);
      }
    }
    const totalSectionRequests = Array.from(sectionRequestCounts.values())
      .reduce((sum, count) => sum + count, 0);
    const loginCountsByHour = new Map(
      counts.loginTimeDistribution.hours.map(({ hour, count, allTimeCount }) => [
        hour,
        { count, allTimeCount }
      ])
    );
    const loginHours = Array.from({ length: 24 }, (_, hour) => {
      const countsForHour = loginCountsByHour.get(hour);
      return {
        hour,
        label: formatPacificHour(hour),
        count: countsForHour?.count ?? 0,
        allTimeCount: countsForHour?.allTimeCount ?? 0
      };
    });

    return {
      generatedAt: asOf.toISOString(),
      acquisitionPeriodStart: acquisitionStart.toISOString(),
      standardUserAccounts: counts.standardUserAccounts,
      newStandardAccounts: counts.newStandardAccounts,
      loggedInLast24Hours: counts.loggedInLast24Hours,
      loggedInLast30Days: {
        count: counts.loggedInLast30Days,
        percentage: userPercentage(counts.loggedInLast30Days)
      },
      inactiveOver30Days: counts.inactiveOver30Days,
      googleAuthUsers: {
        count: counts.googleAuthUsers,
        percentage: userPercentage(counts.googleAuthUsers)
      },
      recordedLoginUsers: counts.recordedLoginUsers,
      signupMonths: counts.signupMonths.map((month) => ({
        ...month,
        recent: month.month >= acquisitionStart.toISOString().slice(0, 7),
        partial: month.month === currentMonth
      })),
      loginRecency: [
        { key: 'days0To7', label: '0–7 days', count: counts.loginRecency.days0To7 },
        { key: 'days8To30', label: '8–30 days', count: counts.loginRecency.days8To30 },
        { key: 'days31To60', label: '31–60 days', count: counts.loginRecency.days31To60 },
        { key: 'days61To90', label: '61–90 days', count: counts.loginRecency.days61To90 },
        { key: 'days90Plus', label: '90+ days', count: counts.loginRecency.days90Plus }
      ],
      deckStatistics: {
        totalDecks: counts.deckStatistics.totalDecks,
        legalDecks: counts.deckStatistics.legalDecks,
        legalPercentage: percentage(counts.deckStatistics.legalDecks, counts.deckStatistics.totalDecks),
        limitedDecks: counts.deckStatistics.limitedDecks,
        limitedPercentage: percentage(counts.deckStatistics.limitedDecks, counts.deckStatistics.totalDecks),
        averageDecksPerUser: average(counts.deckStatistics.nonStarterDecks, counts.standardUserAccounts),
        averageLegalDecksPerUser: average(
          counts.deckStatistics.nonStarterLegalDecks,
          counts.standardUserAccounts
        )
      },
      collectionStatistics: {
        usersWithNonZeroCollections: counts.collectionStatistics.usersWithNonZeroCollections,
        adoptionPercentage: percentage(
          counts.collectionStatistics.usersWithNonZeroCollections,
          counts.standardUserAccounts
        ),
        averageCardsPerUser: average(
          counts.collectionStatistics.totalOwnedCards,
          counts.standardUserAccounts
        ),
        averageCardsPerCollector: average(
          counts.collectionStatistics.totalOwnedCards,
          counts.collectionStatistics.usersWithNonZeroCollections
        )
      },
      siteSectionUsage: {
        totalRequests: totalSectionRequests,
        sections: SITE_SECTIONS.map(({ key, label }) => {
          const requests = sectionRequestCounts.get(key) ?? 0;
          return {
            key,
            label,
            requests,
            percentage: percentage(requests, totalSectionRequests)
          };
        })
      },
      loginTimeDistribution: {
        timeZone: 'America/Los_Angeles',
        windowStart: new Date(asOf.getTime() - (24 * 60 * 60 * 1000)).toISOString(),
        totalLogins: loginHours.reduce((sum, hour) => sum + hour.count, 0),
        allTimeTotalLogins: loginHours.reduce((sum, hour) => sum + hour.allTimeCount, 0),
        hours: loginHours
      }
    };
  }

  async createUser(
    username: string,
    password: string
  ): Promise<{ ok: true; user: AdminUserDto } | { ok: false; kind: 'bad_request' | 'conflict'; message: string }> {
    const existingUser = await this.deps.userRepository.getUserByUsername(username);
    if (existingUser) {
      return { ok: false, kind: 'conflict', message: 'Username already exists' };
    }
    const newUser = await this.deps.userRepository.createUser(username, `${username}@example.com`, password, 'USER');
    return { ok: true, user: this.toAdminUser(newUser) };
  }

  clearDeckCache(): void {
    this.deps.deckRepository.clearCache?.();
  }

  clearCardCaches(): void {
    this.deps.cardRepository.clearCaches?.();
  }

  async getDatabaseStatus(): Promise<{
    status: 'OK';
    database: { valid: boolean; upToDate: boolean; migrations: string };
  }> {
    const isValid = await this.deps.databaseInit.validateDatabase();
    const isUpToDate = await this.deps.databaseInit.checkDatabaseStatus();
    return {
      status: 'OK',
      database: {
        valid: isValid,
        upToDate: isUpToDate,
        migrations: 'Flyway managed'
      }
    };
  }
}
