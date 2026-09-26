import { http, HttpResponse } from 'msw';
import type { UserAnalyticsData } from '../lib/api/adminAnalytics';
import type { BizOpsDashboardData } from '../lib/api/adminBizOps';
import { exampleUser } from './StorybookAuthProvider';

/** Demonstration figures only. These are invented and unrelated to production. */
export const exampleAdminUser = { ...exampleUser, role: 'ADMIN' as const };

export const exampleUserAnalytics: UserAnalyticsData = {
  generatedAt: '2026-09-01T12:00:00Z',
  acquisitionPeriodStart: '2026-07-01T00:00:00Z',
  standardUserAccounts: 40,
  newStandardAccounts: 12,
  loggedInLast24Hours: 5,
  loggedInLast30Days: { count: 24, percentage: 60 },
  inactiveOver30Days: 16,
  googleAuthUsers: { count: 10, percentage: 25 },
  recordedLoginUsers: 32,
  signupMonths: [
    { month: '2026-06', count: 6, recent: false, partial: false },
    { month: '2026-07', count: 9, recent: false, partial: false },
    { month: '2026-08', count: 11, recent: true, partial: false },
    { month: '2026-09', count: 3, recent: true, partial: true },
  ],
  loginRecency: [
    { key: 'days0To7', label: '0–7 days', count: 12 },
    { key: 'days8To30', label: '8–30 days', count: 12 },
    { key: 'days31To60', label: '31–60 days', count: 6 },
    { key: 'days61To90', label: '61–90 days', count: 4 },
    { key: 'days90Plus', label: '90+ days', count: 6 },
  ],
  deckStatistics: {
    totalDecks: 60,
    legalDecks: 42,
    legalPercentage: 70,
    limitedDecks: 9,
    limitedPercentage: 15,
    averageDecksPerUser: 1.5,
    averageLegalDecksPerUser: 1.1,
  },
  collectionStatistics: {
    usersWithNonZeroCollections: 16,
    adoptionPercentage: 40,
    averageCardsPerUser: 18,
    averageCardsPerCollector: 45,
  },
  siteSectionUsage: {
    totalRequests: 1000,
    sections: [
      { key: 'home', label: 'Home', requests: 350, percentage: 35 },
      { key: 'database', label: 'Database', requests: 300, percentage: 30 },
      { key: 'decks', label: 'Decks', requests: 250, percentage: 25 },
      { key: 'collection', label: 'Collection', requests: 100, percentage: 10 },
    ],
  },
  loginTimeDistribution: {
    timeZone: 'America/Los_Angeles',
    windowStart: '2026-08-01T00:00:00Z',
    totalLogins: 100,
    allTimeTotalLogins: 300,
    hours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${hour}:00`,
      count: hour >= 9 && hour <= 21 ? 4 : 1,
      allTimeCount: hour >= 9 && hour <= 21 ? 12 : 3,
    })),
  },
};

export const exampleBizOps: BizOpsDashboardData = {
  generatedAt: '2026-09-15T12:00:00Z',
  currency: 'USD',
  coverage: {
    finalizedInvoiceCount: 3,
    finalizedPeriodStart: '2026-06',
    finalizedPeriodEnd: '2026-08',
  },
  currentMonth: {
    month: '2026-09',
    throughDate: '2026-09-15',
    estimatedTotal: 48,
    dailyAverage: 3.2,
    projectedTotal: 96,
    previousFinalizedMonth: '2026-08',
    previousFinalizedTotal: 90,
    percentOfPrevious: 53.3,
    projectedDeltaPercentage: 6.7,
    previousIsHistoricHigh: true,
  },
  yearToDate: {
    year: 2026,
    finalizedTotal: 240,
    estimatedTotal: 48,
    trackedTotal: 288,
  },
  monthlyCosts: [
    { month: '2026-06', amount: 70, estimated: false },
    { month: '2026-07', amount: 80, estimated: false },
    { month: '2026-08', amount: 90, estimated: false },
    { month: '2026-09', amount: 48, estimated: true },
  ],
  serviceCosts: [
    { service: 'Amazon CloudFront', amount: 28, percentage: 58.3 },
    { service: 'Amazon Simple Storage Service', amount: 20, percentage: 41.7 },
  ],
  serviceTrends: [
    {
      service: 'Amazon CloudFront',
      currentAmount: 28,
      points: [
        { month: '2026-06', amount: 18, estimated: false },
        { month: '2026-07', amount: 24, estimated: false },
        { month: '2026-08', amount: 26, estimated: false },
        { month: '2026-09', amount: 28, estimated: true },
      ],
    },
  ],
  latestWeeklyDigest: {
    periodStart: '2026-09-08',
    periodEnd: '2026-09-14',
    amount: 22,
  },
};

export const adminHandlers = [
  http.get('/api/v1/admin/user-analytics', () => HttpResponse.json({ data: exampleUserAnalytics })),
  http.get('/api/v1/admin/biz-ops-dashboard', () => HttpResponse.json({ data: exampleBizOps })),
];
