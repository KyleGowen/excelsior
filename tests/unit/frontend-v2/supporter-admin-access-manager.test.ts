import fs from 'fs';
import path from 'path';

const manager = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/admin-user-analytics/SupporterAccessManager.tsx'),
  'utf8',
);
const adminApi = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/lib/api/adminUsers.ts'),
  'utf8',
);
const styles = fs.readFileSync(
  path.join(__dirname, '../../../frontend/src/features/admin-user-analytics/UserAnalyticsPage.css'),
  'utf8',
);

describe('Supporter admin access manager', () => {
  it('supports the approved complimentary grant durations and a required reason', () => {
    expect(manager).toContain("'30_DAYS': '30 days'");
    expect(manager).toContain("'90_DAYS': '90 days'");
    expect(manager).toContain("'1_YEAR': 'One year'");
    expect(manager).toContain("CUSTOM: 'Custom expiration'");
    expect(manager).toContain("PERMANENT: 'Permanent'");
    expect(manager).toContain('reason.trim().length < 3');
    expect(manager).toContain('required for the audit record');
  });

  it('shows effective source status while mutating only complimentary access', () => {
    expect(manager).toContain("source === 'COMPLIMENTARY' ? 'complimentary' : 'Stripe'");
    expect(manager).toContain("selectedUser?.supporterSources.includes('COMPLIMENTARY')");
    expect(adminApi).toContain('/api/v1/admin/users/${userId}/supporter');
    expect(adminApi).toContain("action: 'grant' | 'revoke'");
  });

  it('uses the existing responsive admin surface and button patterns', () => {
    expect(manager).toContain('className={`btn ${hasComplimentaryGrant ? \'btn-secondary\' : \'btn-primary\'}`}');
    expect(styles).toMatch(/\.supporter-access__form[\s\S]*grid-template-columns/);
    expect(styles).toMatch(/@media \(max-width: 640px\)[\s\S]*\.supporter-access__form \{ grid-template-columns: 1fr; \}/);
  });
});
