import request from 'supertest';
import { app, initializeTestServer } from '../../src/test-server';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';
import { PostgreSQLSavedDatabaseViewRepository } from '../../src/database/savedDatabaseViewRepository';
import { integrationTestUtils } from '../setup-integration';

const state = {
  schemaVersion: 1 as const,
  tab: 'characters' as const,
  search: 'invincible',
  setFilter: '',
  filters: { numeric: [{ field: 'energy', op: 'gte' as const, value: 5 }], powerTypes: [], functionIcons: [], missionSet: '' },
  hasFoilFilter: false,
  hideAltsFilter: true,
};

describe('Saved database views v1 integration', () => {
  const pool = DataSourceConfig.getInstance().getPool();
  let admin1: { id: string };
  let admin2: { id: string };
  let user: { id: string };
  let guest: { id: string };

  beforeAll(async () => {
    await initializeTestServer();
    admin1 = await integrationTestUtils.createTestUser({ name: 'saved-views-admin-a', email: 'saved-a@example.com', role: 'ADMIN' });
    admin2 = await integrationTestUtils.createTestUser({ name: 'saved-views-admin-b', email: 'saved-b@example.com', role: 'ADMIN' });
    user = await integrationTestUtils.createTestUser({ name: 'saved-views-user', email: 'saved-user@example.com', role: 'USER' });
    guest = await integrationTestUtils.createTestUser({ name: 'saved-views-guest', email: 'saved-guest@example.com', role: 'GUEST' });
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM saved_database_views WHERE user_id = ANY($1::uuid[])', [[admin1.id, admin2.id, user.id, guest.id]]);
  });

  const as = (userId: string) => ({ 'x-test-user-id': userId });

  it('creates the expected schema, constraints, timestamps, indexes, and cascade behavior', async () => {
    const columns = await pool.query<{ column_name: string; is_nullable: string; column_default: string | null }>(
      `SELECT column_name, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_name = 'saved_database_views'`
    );
    expect(columns.rows.map((row) => row.column_name)).toEqual(expect.arrayContaining([
      'id', 'user_id', 'name', 'view_state', 'is_pinned', 'created_at', 'updated_at',
    ]));
    expect(columns.rows.find((row) => row.column_name === 'created_at')?.column_default).toMatch(/now\(\)/i);

    const indexes = await pool.query<{ indexdef: string }>(
      "SELECT indexdef FROM pg_indexes WHERE tablename = 'saved_database_views'"
    );
    expect(indexes.rows.some((row) => /user_id, is_pinned DESC, created_at DESC, id DESC/i.test(row.indexdef))).toBe(true);

    const cascadeUser = await integrationTestUtils.createTestUser({ name: 'saved-views-cascade', email: 'saved-cascade@example.com', role: 'ADMIN' });
    await pool.query(
      'INSERT INTO saved_database_views (user_id, name, view_state) VALUES ($1, $2, $3::jsonb)',
      [cascadeUser.id, 'Cascade', JSON.stringify(state)],
    );
    await pool.query('DELETE FROM users WHERE id = $1', [cascadeUser.id]);
    const remaining = await pool.query('SELECT id FROM saved_database_views WHERE user_id = $1', [cascadeUser.id]);
    expect(remaining.rowCount).toBe(0);
  });

  it('allows ADMIN only and requires authentication', async () => {
    await request(app).get('/api/v1/saved-database-views').expect(401);
    for (const principal of [user, guest]) {
      const response = await request(app).get('/api/v1/saved-database-views').set(as(principal.id)).expect(403);
      expect(response.body.errors[0].code).toBe('SAVED_DATABASE_VIEW_FORBIDDEN');
    }
    const allowed = await request(app).get('/api/v1/saved-database-views').set(as(admin1.id)).expect(200);
    expect(allowed.body.data).toEqual({ views: [], count: 0, max: 50 });
  });

  it('creates duplicate names, lists deterministically, renames, and pins without mutating state', async () => {
    const first = await request(app).post('/api/v1/saved-database-views').set(as(admin1.id)).send({ name: ' Same ', viewState: state }).expect(201);
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await request(app).post('/api/v1/saved-database-views').set(as(admin1.id)).send({ name: 'Same', viewState: state }).expect(201);
    expect(second.body.data.view.id).not.toBe(first.body.data.view.id);

    const originalCreatedAt = first.body.data.view.createdAt;
    const renamed = await request(app).patch(`/api/v1/saved-database-views/${first.body.data.view.id}`).set(as(admin1.id)).send({ name: 'Renamed', isPinned: true }).expect(200);
    expect(renamed.body.data.view.createdAt).toBe(originalCreatedAt);
    expect(renamed.body.data.view.updatedAt >= originalCreatedAt).toBe(true);
    expect(renamed.body.data.view.isPinned).toBe(true);

    const listed = await request(app).get('/api/v1/saved-database-views').set(as(admin1.id)).expect(200);
    expect(listed.body.data.views[0].id).toBe(first.body.data.view.id);
    expect(listed.body.data.views.slice(1).map((item: { id: string }) => item.id)).toEqual([second.body.data.view.id]);
  });

  it('uses non-enumerating 404s for cross-user IDs and keeps bulk delete scoped and de-duplicated', async () => {
    const own = await request(app).post('/api/v1/saved-database-views').set(as(admin1.id)).send({ name: 'Own', viewState: state }).expect(201);
    const other = await request(app).post('/api/v1/saved-database-views').set(as(admin2.id)).send({ name: 'Other', viewState: state }).expect(201);
    const otherId = other.body.data.view.id;

    await request(app).patch(`/api/v1/saved-database-views/${otherId}`).set(as(admin1.id)).send({ isPinned: true }).expect(404);
    await request(app).delete(`/api/v1/saved-database-views/${otherId}`).set(as(admin1.id)).expect(404);

    const bulk = await request(app).post('/api/v1/saved-database-views/bulk-delete').set(as(admin1.id)).send({
      ids: [own.body.data.view.id, own.body.data.view.id, otherId],
    }).expect(200);
    expect(bulk.body.data).toMatchObject({ deletedCount: 1, notFoundCount: 1, count: 0, max: 50 });
    const otherStillExists = await pool.query('SELECT id FROM saved_database_views WHERE id = $1', [otherId]);
    expect(otherStillExists.rowCount).toBe(1);
  });

  it('rejects invalid names and state at the API boundary', async () => {
    const empty = await request(app).post('/api/v1/saved-database-views').set(as(admin1.id)).send({ name: '  ', viewState: state }).expect(400);
    expect(empty.body.errors[0].code).toBe('SAVED_DATABASE_VIEW_INVALID_NAME');
    await request(app).post('/api/v1/saved-database-views').set(as(admin1.id)).send({ name: 'x'.repeat(81), viewState: state }).expect(400);
    const invalid = await request(app).post('/api/v1/saved-database-views').set(as(admin1.id)).send({ name: 'Bad', viewState: { ...state, schemaVersion: 2 } }).expect(400);
    expect(invalid.body.errors[0].code).toBe('SAVED_DATABASE_VIEW_UNSUPPORTED_SCHEMA_VERSION');
  });

  it('allows the 50th row, blocks a concurrent 51st create, and reopens capacity after delete', async () => {
    const repository = new PostgreSQLSavedDatabaseViewRepository(pool);
    const rows = Array.from({ length: 49 }, (_, index) => [admin2.id, `View ${index}`, JSON.stringify(state)]);
    for (const [userId, name, viewState] of rows) {
      await pool.query(
        'INSERT INTO saved_database_views (user_id, name, view_state) VALUES ($1, $2, $3::jsonb)',
        [userId, name, viewState],
      );
    }
    const attempts = await Promise.all([
      repository.createForUser(admin2.id, 'Concurrent A', state, 50),
      repository.createForUser(admin2.id, 'Concurrent B', state, 50),
    ]);
    expect(attempts.filter((result) => result.kind === 'created')).toHaveLength(1);
    expect(attempts.filter((result) => result.kind === 'limit')).toHaveLength(1);
    expect(await repository.countForUser(admin2.id)).toBe(50);

    const sourceId = (await repository.listForUser(admin2.id))[0].id;
    await repository.deleteForUser(admin2.id, sourceId);
    await expect(repository.createForUser(admin2.id, 'After delete', state, 50)).resolves.toMatchObject({ kind: 'created' });
    expect(await repository.countForUser(admin2.id)).toBe(50);
  });
});
