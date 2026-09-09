import { SavedDatabaseViewService } from '../../../../src/api/services/savedDatabaseViewService';
import type { SavedDatabaseViewRepository } from '../../../../src/repository/SavedDatabaseViewRepository';

const state = {
  schemaVersion: 1 as const,
  tab: 'characters' as const,
  search: '',
  setFilter: '',
  filters: { numeric: [], powerTypes: [], functionIcons: [], missionSet: '' },
  hasFoilFilter: false,
  hideAltsFilter: true,
};

const view = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Characters',
  viewState: state,
  isPinned: false,
  createdAt: '2026-09-09T00:00:00.000Z',
  updatedAt: '2026-09-09T00:00:00.000Z',
};

function repository(overrides: Partial<SavedDatabaseViewRepository> = {}): SavedDatabaseViewRepository {
  return {
    listForUser: jest.fn().mockResolvedValue([view]),
    countForUser: jest.fn().mockResolvedValue(1),
    createForUser: jest.fn().mockResolvedValue({ kind: 'created', view, count: 1 }),
    updateMetadataForUser: jest.fn().mockResolvedValue(view),
    deleteForUser: jest.fn().mockResolvedValue(true),
    bulkDeleteForUser: jest.fn().mockResolvedValue(1),
    ...overrides,
  };
}

describe('SavedDatabaseViewService', () => {
  it('lists only through the user-scoped repository and reports quota', async () => {
    const repo = repository();
    const result = await new SavedDatabaseViewService(repo).list('user-1');
    expect(repo.listForUser).toHaveBeenCalledWith('user-1');
    expect(result).toMatchObject({ views: [view], count: 1, max: 50 });
  });

  it('trims names, validates state, and accepts duplicate names', async () => {
    const repo = repository();
    const service = new SavedDatabaseViewService(repo);
    const first = await service.create('user-1', '  Same  ', state);
    const second = await service.create('user-1', 'Same', state);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(repo.createForUser).toHaveBeenNthCalledWith(1, 'user-1', 'Same', state, 50);
    expect(repo.createForUser).toHaveBeenNthCalledWith(2, 'user-1', 'Same', state, 50);
  });

  it('rejects invalid names and invalid state before persistence', async () => {
    const repo = repository();
    const service = new SavedDatabaseViewService(repo);
    await expect(service.create('user-1', '   ', state)).resolves.toMatchObject({ ok: false, code: 'SAVED_DATABASE_VIEW_INVALID_NAME' });
    await expect(service.create('user-1', 'Name', { ...state, schemaVersion: 2 })).resolves.toMatchObject({ ok: false, code: 'SAVED_DATABASE_VIEW_INVALID_STATE' });
    expect(repo.createForUser).not.toHaveBeenCalled();
  });

  it('maps create quota races to the stable limit error', async () => {
    const repo = repository({
      createForUser: jest.fn().mockResolvedValue({ kind: 'limit', count: 50 }),
    });
    const service = new SavedDatabaseViewService(repo);
    await expect(service.create('user-1', 'Name', state)).resolves.toMatchObject({ ok: false, status: 409, code: 'SAVED_DATABASE_VIEW_LIMIT_REACHED' });
  });

  it('returns non-enumerating not found for metadata and delete misses', async () => {
    const repo = repository({
      updateMetadataForUser: jest.fn().mockResolvedValue(null),
      deleteForUser: jest.fn().mockResolvedValue(false),
    });
    const service = new SavedDatabaseViewService(repo);
    await expect(service.updateMetadata('user-1', view.id, { isPinned: true })).resolves.toMatchObject({ ok: false, code: 'SAVED_DATABASE_VIEW_NOT_FOUND' });
    await expect(service.delete('user-1', view.id)).resolves.toMatchObject({ ok: false, code: 'SAVED_DATABASE_VIEW_NOT_FOUND' });
  });

  it('de-duplicates bulk IDs and reports deleted and missing counts', async () => {
    const repo = repository({ bulkDeleteForUser: jest.fn().mockResolvedValue(1), countForUser: jest.fn().mockResolvedValue(3) });
    const data = await new SavedDatabaseViewService(repo).bulkDelete('user-1', ['a', 'a', 'b']);
    expect(repo.bulkDeleteForUser).toHaveBeenCalledWith('user-1', ['a', 'b']);
    expect(data).toEqual({ deletedCount: 1, notFoundCount: 1, count: 3, max: 50 });
  });
});
