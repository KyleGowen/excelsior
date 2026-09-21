import fs from 'fs';
import path from 'path';

describe('User Analytics rolling acquisition window', () => {
  const page = fs.readFileSync(
    path.join(__dirname, '../../../frontend/src/features/admin-user-analytics/UserAnalyticsPage.tsx'),
    'utf8',
  );

  it('labels new standard accounts with the calculated rolling-window start date', () => {
    expect(page).toContain('new standard accounts<br />since {formatDate(analytics.acquisitionPeriodStart)}');
    expect(page).toContain('were created since {formatDate(analytics.acquisitionPeriodStart)}. The latest month is month-to-date.');
    expect(page).not.toContain('in the previous 30 days');
  });
});
