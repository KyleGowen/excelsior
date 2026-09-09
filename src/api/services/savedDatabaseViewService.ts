import type {
  SavedDatabaseViewDeleteDto,
  SavedDatabaseViewListDto,
  SavedDatabaseViewMutationDto
} from '../dto/v1/SavedDatabaseViewDto';
import type { SavedDatabaseViewRepository } from '../../repository/SavedDatabaseViewRepository';
import {
  SAVED_DATABASE_VIEW_LIMIT,
  normalizeSavedDatabaseViewName,
  parseSavedDatabaseViewState,
} from '../../savedDatabaseViews/savedDatabaseViewState';

type ServiceErrorCode =
  | 'SAVED_DATABASE_VIEW_INVALID_NAME'
  | 'SAVED_DATABASE_VIEW_INVALID_STATE'
  | 'SAVED_DATABASE_VIEW_NOT_FOUND'
  | 'SAVED_DATABASE_VIEW_LIMIT_REACHED';

type SavedDatabaseViewServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 400 | 404 | 409; code: ServiceErrorCode; message: string };

const invalidName = (): SavedDatabaseViewServiceResult<never> => ({
  ok: false,
  status: 400,
  code: 'SAVED_DATABASE_VIEW_INVALID_NAME',
  message: 'Saved view name is required and must be 80 characters or fewer'
});

const notFound = (): SavedDatabaseViewServiceResult<never> => ({
  ok: false,
  status: 404,
  code: 'SAVED_DATABASE_VIEW_NOT_FOUND',
  message: 'Saved view not found'
});

const limitReached = (): SavedDatabaseViewServiceResult<never> => ({
  ok: false,
  status: 409,
  code: 'SAVED_DATABASE_VIEW_LIMIT_REACHED',
  message: `This account has reached the ${SAVED_DATABASE_VIEW_LIMIT} saved-view limit`
});

export class SavedDatabaseViewService {
  constructor(private readonly repository: SavedDatabaseViewRepository) {}

  async list(userId: string): Promise<SavedDatabaseViewListDto> {
    const views = await this.repository.listForUser(userId);
    return { views, count: views.length, max: SAVED_DATABASE_VIEW_LIMIT };
  }

  async create(
    userId: string,
    rawName: unknown,
    rawState: unknown
  ): Promise<SavedDatabaseViewServiceResult<SavedDatabaseViewMutationDto>> {
    const name = normalizeSavedDatabaseViewName(rawName);
    if (!name) return invalidName();
    const viewState = parseSavedDatabaseViewState(rawState);
    if (!viewState) {
      return {
        ok: false,
        status: 400,
        code: 'SAVED_DATABASE_VIEW_INVALID_STATE',
        message: 'Saved view state is invalid or unsupported'
      };
    }
    const result = await this.repository.createForUser(
      userId,
      name,
      viewState,
      SAVED_DATABASE_VIEW_LIMIT
    );
    if (result.kind === 'limit') return limitReached();
    return {
      ok: true,
      data: { view: result.view, count: result.count, max: SAVED_DATABASE_VIEW_LIMIT }
    };
  }

  async updateMetadata(
    userId: string,
    id: string,
    updates: { name?: unknown; isPinned?: boolean }
  ): Promise<SavedDatabaseViewServiceResult<SavedDatabaseViewMutationDto>> {
    let name: string | undefined;
    if (updates.name !== undefined) {
      const normalized = normalizeSavedDatabaseViewName(updates.name);
      if (!normalized) return invalidName();
      name = normalized;
    }
    const view = await this.repository.updateMetadataForUser(userId, id, {
      ...(name !== undefined ? { name } : {}),
      ...(updates.isPinned !== undefined ? { isPinned: updates.isPinned } : {})
    });
    if (!view) return notFound();
    const count = await this.repository.countForUser(userId);
    return { ok: true, data: { view, count, max: SAVED_DATABASE_VIEW_LIMIT } };
  }

  async delete(
    userId: string,
    id: string
  ): Promise<SavedDatabaseViewServiceResult<SavedDatabaseViewDeleteDto>> {
    const deleted = await this.repository.deleteForUser(userId, id);
    if (!deleted) return notFound();
    const count = await this.repository.countForUser(userId);
    return {
      ok: true,
      data: { deletedCount: 1, notFoundCount: 0, count, max: SAVED_DATABASE_VIEW_LIMIT }
    };
  }

  async bulkDelete(userId: string, rawIds: string[]): Promise<SavedDatabaseViewDeleteDto> {
    const ids = [...new Set(rawIds)];
    const deletedCount = await this.repository.bulkDeleteForUser(userId, ids);
    const count = await this.repository.countForUser(userId);
    return {
      deletedCount,
      notFoundCount: ids.length - deletedCount,
      count,
      max: SAVED_DATABASE_VIEW_LIMIT
    };
  }
}
