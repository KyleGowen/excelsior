import {
  AdminService,
  classifyUserAnalyticsEndpoint,
  type AdminServiceDeps
} from '../../../../src/api/services/adminService';
import type { UserAnalyticsCounts, UserAnalyticsQuery } from '../../../../src/repository/UserRepository';

function buildDeps(counts: UserAnalyticsCounts): AdminServiceDeps {
  return {
    now: () => new Date('2026-08-24T12:00:00.000Z'),
    userRepository: {
      getAllUsers: jest.fn().mockResolvedValue([]),
      getUserByUsername: jest.fn().mockResolvedValue(undefined),
      createUser: jest.fn(),
      getUserAnalytics: jest.fn().mockResolvedValue(counts)
    },
    deckRepository: {},
    cardRepository: {},
    databaseInit: {
      validateDatabase: jest.fn().mockResolvedValue(true),
      checkDatabaseStatus: jest.fn().mockResolvedValue(true)
    }
  };
}

describe('AdminService user analytics', () => {
  it('builds rolling aggregate analytics and excludes utility accounts', async () => {
    const counts: UserAnalyticsCounts = {
      standardUserAccounts: 90,
      newStandardAccounts: 40,
      loggedInLast24Hours: 7,
      loggedInLast30Days: 49,
      inactiveOver30Days: 41,
      googleAuthUsers: 44,
      recordedLoginUsers: 77,
      signupMonths: [
        { month: '2026-06', count: 2 },
        { month: '2026-07', count: 27 },
        { month: '2026-08', count: 13 }
      ],
      loginRecency: {
        days0To7: 15,
        days8To30: 34,
        days31To60: 7,
        days61To90: 5,
        days90Plus: 16
      },
      deckStatistics: {
        totalDecks: 247,
        legalDecks: 184,
        limitedDecks: 32,
        nonStarterDecks: 157,
        nonStarterLegalDecks: 126
      },
      collectionStatistics: {
        usersWithNonZeroCollections: 38,
        totalOwnedCards: 4822
      },
      endpointHits: [
        { endpointKey: 'GET /api/v1/recent-updates', hitCount: 10 },
        { endpointKey: 'GET /api/v1/catalog/characters', hitCount: 100 },
        { endpointKey: 'GET /api/v1/dbv/sets', hitCount: 20 },
        { endpointKey: 'GET /api/v1/decks', hitCount: 80 },
        { endpointKey: 'GET /api/v1/community/decks', hitCount: 20 },
        { endpointKey: 'GET /api/v1/collections/me/cards', hitCount: 30 },
        { endpointKey: 'POST /api/v1/auth/login', hitCount: 999 }
      ],
      loginTimeDistribution: {
        hours: [
          { hour: 0, count: 2, allTimeCount: 20 },
          { hour: 13, count: 6, allTimeCount: 60 }
        ]
      }
    };
    const deps = buildDeps(counts);
    const service = new AdminService(deps);

    const result = await service.getUserAnalytics();

    expect(result).toMatchObject({
      generatedAt: '2026-08-24T12:00:00.000Z',
      acquisitionPeriodStart: '2026-07-01T00:00:00.000Z',
      standardUserAccounts: 90,
      newStandardAccounts: 40,
      loggedInLast24Hours: 7,
      loggedInLast30Days: { count: 49, percentage: 54 },
      inactiveOver30Days: 41,
      googleAuthUsers: { count: 44, percentage: 49 },
      deckStatistics: {
        totalDecks: 247,
        legalDecks: 184,
        legalPercentage: 74.5,
        limitedDecks: 32,
        limitedPercentage: 13,
        averageDecksPerUser: 1.7,
        averageLegalDecksPerUser: 1.4
      },
      collectionStatistics: {
        usersWithNonZeroCollections: 38,
        adoptionPercentage: 42.2,
        averageCardsPerUser: 53.6,
        averageCardsPerCollector: 126.9
      },
      siteSectionUsage: {
        totalRequests: 260,
        sections: [
          { key: 'home', label: 'Home', requests: 10, percentage: 3.8 },
          { key: 'database', label: 'Database', requests: 120, percentage: 46.2 },
          { key: 'decks', label: 'Decks', requests: 100, percentage: 38.5 },
          { key: 'collection', label: 'Collection', requests: 30, percentage: 11.5 }
        ]
      },
      loginTimeDistribution: {
        timeZone: 'America/Los_Angeles',
        windowStart: '2026-08-23T12:00:00.000Z',
        totalLogins: 8,
        allTimeTotalLogins: 80
      }
    });
    expect(result.loginTimeDistribution.hours).toHaveLength(24);
    expect(result.loginTimeDistribution.hours[0]).toEqual({
      hour: 0,
      label: '12 AM',
      count: 2,
      allTimeCount: 20
    });
    expect(result.loginTimeDistribution.hours[13]).toEqual({
      hour: 13,
      label: '1 PM',
      count: 6,
      allTimeCount: 60
    });
    expect(result.signupMonths).toEqual([
      { month: '2026-06', count: 2, recent: false, partial: false },
      { month: '2026-07', count: 27, recent: true, partial: false },
      { month: '2026-08', count: 13, recent: true, partial: true }
    ]);

    const repositoryCall = (deps.userRepository.getUserAnalytics as jest.Mock)
      .mock.calls[0][0] as UserAnalyticsQuery;
    expect(repositoryCall.acquisitionStart.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(repositoryCall.signupChartStart.toISOString()).toBe('2025-09-01T00:00:00.000Z');
    expect(repositoryCall.signupChartEnd.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(repositoryCall.excludedUsernames).toEqual(['community_decks', 'tournament_decks']);
  });

  it('returns zero percentages when there are no standard users', async () => {
    const deps = buildDeps({
      standardUserAccounts: 0,
      newStandardAccounts: 0,
      loggedInLast24Hours: 0,
      loggedInLast30Days: 0,
      inactiveOver30Days: 0,
      googleAuthUsers: 0,
      recordedLoginUsers: 0,
      signupMonths: [],
      loginRecency: {
        days0To7: 0,
        days8To30: 0,
        days31To60: 0,
        days61To90: 0,
        days90Plus: 0
      },
      deckStatistics: {
        totalDecks: 0,
        legalDecks: 0,
        limitedDecks: 0,
        nonStarterDecks: 0,
        nonStarterLegalDecks: 0
      },
      collectionStatistics: {
        usersWithNonZeroCollections: 0,
        totalOwnedCards: 0
      },
      endpointHits: [],
      loginTimeDistribution: {
        hours: []
      }
    });
    const result = await new AdminService(deps).getUserAnalytics();
    expect(result.loggedInLast30Days.percentage).toBe(0);
    expect(result.googleAuthUsers.percentage).toBe(0);
    expect(result.deckStatistics).toMatchObject({
      legalPercentage: 0,
      limitedPercentage: 0,
      averageDecksPerUser: 0,
      averageLegalDecksPerUser: 0
    });
    expect(result.collectionStatistics).toMatchObject({
      adoptionPercentage: 0,
      averageCardsPerUser: 0,
      averageCardsPerCollector: 0
    });
    expect(result.siteSectionUsage.totalRequests).toBe(0);
    expect(result.siteSectionUsage.sections.every((section) => section.percentage === 0)).toBe(true);
    expect(result.loginTimeDistribution.hours).toHaveLength(24);
    expect(result.loginTimeDistribution.windowStart).toBe('2026-08-23T12:00:00.000Z');
    expect(result.loginTimeDistribution.allTimeTotalLogins).toBe(0);
  });

  it('classifies only API families that represent the four requested site sections', () => {
    expect(classifyUserAnalyticsEndpoint('GET /api/v1/recent-updates')).toBe('home');
    expect(classifyUserAnalyticsEndpoint('GET /api/v1/catalog/characters')).toBe('database');
    expect(classifyUserAnalyticsEndpoint('PUT /api/v1/decks/:id')).toBe('decks');
    expect(classifyUserAnalyticsEndpoint('DELETE /api/v1/collections/me/cards/:cardId')).toBe('collection');
    expect(classifyUserAnalyticsEndpoint('POST /api/v1/auth/login')).toBeNull();
    expect(classifyUserAnalyticsEndpoint('GET /api/v1/admin/user-analytics')).toBeNull();
  });
});
