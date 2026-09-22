import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Logo } from '../../components/Logo';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { fetchUserAnalytics } from '../../lib/api/adminAnalytics';
import { useScrollToTopOnMount } from '../../lib/layout/useScrollToTopOnMount';
import './UserAnalyticsPage.css';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function formatMonth(value: string): string {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year ?? 2000, (month ?? 1) - 1, 1)));
}

function formatDecimal(value: number): string {
  return value.toFixed(1);
}

function formatClockTick(hour: number): string {
  if (hour % 3 !== 0) return '';
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

const RECENCY_COLORS = ['#00d6e8', '#f6a623', '#3aa0ff', '#3aa0ff', '#61749a'];

export default function UserAnalyticsPage() {
  useScrollToTopOnMount();
  const analyticsQuery = useQuery({
    queryKey: ['admin', 'user-analytics'],
    queryFn: ({ signal }) => fetchUserAnalytics(signal),
    staleTime: 5 * 60 * 1000,
  });

  if (analyticsQuery.isLoading) {
    return <LoadingState label="Loading user analytics..." />;
  }

  const analytics = analyticsQuery.data;
  if (!analytics || analyticsQuery.isError) {
    return (
      <EmptyState
        title="Analytics unavailable"
        message="Excelsior could not load the user analytics snapshot."
      />
    );
  }

  const maxMonthlyCount = Math.max(...analytics.signupMonths.map((month) => month.count), 1);
  const chartMaximum = Math.max(5, Math.ceil(maxMonthlyCount / 5) * 5);
  const acquisitionPercentage = analytics.standardUserAccounts === 0
    ? 0
    : Math.round((analytics.newStandardAccounts / analytics.standardUserAccounts) * 100);
  const maxRecencyCount = Math.max(...analytics.loginRecency.map((bucket) => bucket.count), 1);
  const maxLoginHourCount = Math.max(
    ...analytics.loginTimeDistribution.hours.map((hour) => hour.allTimeCount),
    1,
  );

  return (
    <div className="user-analytics-page">
      <article className="user-analytics-panel">
        <header className="user-analytics-hero">
          <div>
            <div className="user-analytics-eyebrow">ADMIN SNAPSHOT</div>
            <h1>Excelsior user pulse</h1>
            <p>Account acquisition, authentication, product usage, and login timing.</p>
          </div>
          <div className="user-analytics-snapshot">
            <Logo variant="emblem" height={38} />
            <span>Live users table</span>
            <strong>{formatDate(analytics.generatedAt)}</strong>
          </div>
        </header>

        <section className="user-analytics-kpis" aria-label="User account highlights">
          <div className="user-analytics-kpi">
            <strong>{analytics.standardUserAccounts}</strong>
            <span>standard user accounts<br />in the current snapshot</span>
          </div>
          <div className="user-analytics-kpi user-analytics-kpi--accent">
            <strong>{analytics.newStandardAccounts}</strong>
            <span>new standard accounts<br />since {formatDate(analytics.acquisitionPeriodStart)}</span>
          </div>
          <div className="user-analytics-kpi user-analytics-kpi--accent">
            <strong>{analytics.loggedInLast24Hours}</strong>
            <span>unique standard accounts<br />signed in during the last 24 hours</span>
          </div>
          <div className="user-analytics-kpi user-analytics-kpi--warning">
            <strong>{analytics.inactiveOver30Days}</strong>
            <span>accounts inactive for over 30 days<br />including accounts that never signed in</span>
          </div>
          <div className="user-analytics-kpi user-analytics-kpi--warning">
            <strong>{analytics.loggedInLast30Days.percentage}%</strong>
            <span>logged in during the<br />last 30 days ({analytics.loggedInLast30Days.count} of {analytics.standardUserAccounts})</span>
          </div>
          <div className="user-analytics-kpi">
            <strong>{analytics.googleAuthUsers.percentage}%</strong>
            <span>use Google as their<br />authentication provider</span>
          </div>
        </section>

        <section className="user-analytics-charts">
          <div className="user-analytics-chart user-analytics-chart--acquisition">
            <div className="user-analytics-section-heading">
              <h2>Acquisition momentum</h2>
              <p>
                {analytics.newStandardAccounts} of {analytics.standardUserAccounts} standard accounts ({acquisitionPercentage}%)
                were created since {formatDate(analytics.acquisitionPeriodStart)}. The latest month is month-to-date.
              </p>
            </div>
            <div className="user-analytics-bar-chart" role="img" aria-label="Standard user signups by month">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.signupMonths} margin={{ top: 24, right: 8, left: -12, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke="#1d2c47" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(month: string, index: number) => `${formatMonth(month)}${analytics.signupMonths[index]?.partial ? '*' : ''}`}
                    axisLine={{ stroke: '#1d2c47' }}
                    tickLine={false}
                    tick={{ fill: '#8aa0c2', fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, chartMaximum]}
                    allowDecimals={false}
                    tickCount={4}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8aa0c2', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 200, 232, 0.06)' }}
                    content={({ active, payload }) => active && payload?.[0] ? (
                      <div className="user-analytics-tooltip">
                        <strong>{payload[0].payload.month}</strong>
                        <span>{payload[0].value} new accounts</span>
                      </div>
                    ) : null}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48} minPointSize={3}>
                    {analytics.signupMonths.map((month) => (
                      <Cell key={month.month} fill={month.recent ? '#00d6e8' : '#3a9df5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="user-analytics-legend" aria-hidden="true">
              <span><i className="is-earlier" /> Earlier acquisition</span>
              <span><i className="is-recent" /> Recent acquisition</span>
            </div>
          </div>

          <div className="user-analytics-chart user-analytics-chart--recency">
            <div className="user-analytics-section-heading">
              <h2>Login recency</h2>
              <p>{analytics.recordedLoginUsers} standard accounts have a recorded login.</p>
            </div>
            <div className="user-analytics-recency">
              {analytics.loginRecency.map((bucket, index) => (
                <div className="user-analytics-recency-row" key={bucket.key}>
                  <span>{bucket.label}</span>
                  <div className="user-analytics-recency-track">
                    <i
                      style={{
                        backgroundColor: RECENCY_COLORS[index],
                        width: `${Math.max(bucket.count > 0 ? 4 : 0, (bucket.count / maxRecencyCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <strong>{bucket.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="user-analytics-divider" role="separator" />

        <section className="user-analytics-engagement" aria-labelledby="user-analytics-engagement-title">
          <header className="user-analytics-inventory-heading">
            <div className="user-analytics-eyebrow">USAGE &amp; TIMING</div>
            <h2 id="user-analytics-engagement-title">Engagement signals</h2>
            <p>Feature-area API demand and the Pacific-time distribution of successful sign-ins.</p>
          </header>

          <div className="user-analytics-engagement-grid">
            <article className="user-analytics-engagement-card">
              <div className="user-analytics-section-heading">
                <h3>Site-section API usage</h3>
                <p>
                  {analytics.siteSectionUsage.totalRequests.toLocaleString()} classified requests from the
                  lifetime endpoint counters.
                </p>
              </div>
              <div className="user-analytics-section-usage">
                {analytics.siteSectionUsage.sections.map((section) => (
                  <div className="user-analytics-section-usage-row" key={section.key}>
                    <div>
                      <strong>{section.label}</strong>
                      <span>{section.requests.toLocaleString()} requests</span>
                    </div>
                    <div className="user-analytics-section-usage-track" aria-hidden="true">
                      <i style={{ width: `${section.percentage}%` }} />
                    </div>
                    <strong>{formatDecimal(section.percentage)}%</strong>
                  </div>
                ))}
              </div>
              <p className="user-analytics-method-note">
                This is request share, not time or unique-user share. Home uses recent-updates traffic;
                Database uses catalog and set traffic; Decks uses deck, community, and background traffic;
                Collection uses collection traffic. Shared APIs can serve more than one screen.
              </p>
            </article>

            <article className="user-analytics-engagement-card">
              <div className="user-analytics-section-heading">
                <h3>Sign-ins by Pacific hour</h3>
                <p>
                  {analytics.loginTimeDistribution.allTimeTotalLogins.toLocaleString()} successful session starts
                  across tracked history.
                </p>
              </div>
              <div
                className="user-analytics-login-radar"
                role="img"
                aria-label="Twenty-four-point radar chart of tracked standard-user sign-ins by Pacific hour"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={analytics.loginTimeDistribution.hours}
                    startAngle={90}
                    endAngle={-270}
                    outerRadius="72%"
                  >
                    <PolarGrid gridType="circle" stroke="#2a3e63" />
                    <PolarAngleAxis
                      dataKey="hour"
                      tickFormatter={formatClockTick}
                      tick={{ fill: '#8aa0c2', fontSize: 11 }}
                      tickLine={false}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, maxLoginHourCount]}
                      axisLine={false}
                      tick={false}
                      tickCount={5}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        const hour = payload?.[0]?.payload as {
                          label: string;
                          allTimeCount: number;
                        } | undefined;
                        return active && hour ? (
                          <div className="user-analytics-tooltip">
                            <strong>{hour.label}</strong>
                            <span>{hour.allTimeCount.toLocaleString()} tracked sign-ins</span>
                          </div>
                        ) : null;
                      }}
                    />
                    <Radar
                      name="Tracked sign-ins"
                      dataKey="allTimeCount"
                      stroke="#3a7bd5"
                      strokeWidth={2.5}
                      fill="#3a7bd5"
                      fillOpacity={0.12}
                      dot={false}
                      activeDot={{ r: 5, fill: '#e8edf7', stroke: '#3a7bd5', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="user-analytics-radar-guide">
                Distance from center represents tracked sign-in count; hover for the exact hour.
              </div>
              <p className="user-analytics-method-note">
                Counts include successful standard-user session starts, including the session created at signup.
                Guest, admin, and utility accounts are excluded. Pacific conversion uses America/Los_Angeles,
                including daylight-saving transitions. Tracked history includes each account&apos;s known latest login
                plus every successful session start recorded after counters began; it cannot reconstruct additional
                earlier sign-ins from before telemetry existed.
              </p>
            </article>
          </div>
        </section>

        <div className="user-analytics-divider" role="separator" />

        <section className="user-analytics-inventory" aria-labelledby="user-analytics-inventory-title">
          <header className="user-analytics-inventory-heading">
            <div className="user-analytics-eyebrow">DECKS &amp; COLLECTIONS</div>
            <h2 id="user-analytics-inventory-title">Site inventory pulse</h2>
            <p>Saved deck legality, per-user deck averages, and collection adoption.</p>
          </header>

          <div className="user-analytics-inventory-kpis" aria-label="Deck totals">
            <article className="user-analytics-kpi">
              <strong>{analytics.deckStatistics.totalDecks}</strong>
              <span>total decks<br />saved by standard users</span>
            </article>
            <article className="user-analytics-kpi user-analytics-kpi--accent">
              <strong>{analytics.deckStatistics.legalDecks}</strong>
              <span>legal decks<br />({formatDecimal(analytics.deckStatistics.legalPercentage)}% of all decks)</span>
              <div
                className="user-analytics-inventory-meter"
                role="progressbar"
                aria-label="Legal decks"
                aria-valuenow={analytics.deckStatistics.legalPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <i style={{ width: `${analytics.deckStatistics.legalPercentage}%` }} />
              </div>
            </article>
            <article className="user-analytics-kpi user-analytics-kpi--warning">
              <strong>{analytics.deckStatistics.limitedDecks}</strong>
              <span>Limited decks<br />({formatDecimal(analytics.deckStatistics.limitedPercentage)}% of all decks)</span>
            </article>
          </div>

          <div className="user-analytics-inventory-subheading">
            <h3>Decks per user</h3>
            <span />
          </div>
          <div className="user-analytics-average-grid" aria-label="Average decks per user">
            <article className="user-analytics-average-card">
              <strong>{formatDecimal(analytics.deckStatistics.averageDecksPerUser)}</strong>
              <div>
                <h4>Average decks per user</h4>
                <p>Includes legal and non-legal decks; excludes signup starter copies</p>
              </div>
            </article>
            <article className="user-analytics-average-card">
              <strong>{formatDecimal(analytics.deckStatistics.averageLegalDecksPerUser)}</strong>
              <div>
                <h4>Average legal decks per user</h4>
                <p>Excludes non-legal decks and signup starter copies</p>
              </div>
            </article>
          </div>

          <div className="user-analytics-inventory-subheading">
            <h3>Collection adoption</h3>
            <span />
          </div>
          <div className="user-analytics-average-grid" aria-label="Collection statistics">
            <article className="user-analytics-average-card user-analytics-average-card--collection">
              <strong>{analytics.collectionStatistics.usersWithNonZeroCollections}</strong>
              <div>
                <h4>Users with a non-zero collection</h4>
                <p>{formatDecimal(analytics.collectionStatistics.adoptionPercentage)}% of standard users</p>
              </div>
            </article>
            <article className="user-analytics-average-card user-analytics-average-card--collection">
              <strong>{formatDecimal(analytics.collectionStatistics.averageCardsPerCollector)}</strong>
              <div>
                <h4>Average cards per collector</h4>
                <p>Includes only users with non-zero collection counts</p>
              </div>
            </article>
          </div>

          <p className="user-analytics-inventory-footnote">
            Collection totals sum card quantities, not unique card entries. Legal and Limited are independent deck attributes and may overlap.
          </p>
        </section>
      </article>
    </div>
  );
}
