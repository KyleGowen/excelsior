import fs from 'fs';
import path from 'path';

describe('V351 saved database views migration', () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '../../migrations/V351__Create_saved_database_views.sql'),
    'utf8',
  );

  it('creates ownership, state, quota-supporting ordering, and cascade contracts', () => {
    expect(sql).toMatch(/CREATE TABLE saved_database_views/i);
    expect(sql).toMatch(/user_id UUID NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/i);
    expect(sql).toMatch(/name VARCHAR\(80\) NOT NULL/i);
    expect(sql).toMatch(/view_state JSONB NOT NULL/i);
    expect(sql).toMatch(/is_pinned BOOLEAN NOT NULL DEFAULT FALSE/i);
    expect(sql).toMatch(/created_at TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)/i);
    expect(sql).toMatch(/updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW\(\)/i);
    expect(sql).toMatch(/BTRIM\(name\)/i);
    expect(sql).toMatch(/user_id, is_pinned DESC, created_at DESC, id DESC/i);
    expect(sql).not.toMatch(/UNIQUE\s*\(\s*user_id\s*,\s*name/i);
  });
});
