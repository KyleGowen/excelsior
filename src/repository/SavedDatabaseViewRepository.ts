import type { SavedDatabaseViewDto } from '../api/dto/v1/SavedDatabaseViewDto';
import type { SavedDatabaseViewStateV1 } from '../savedDatabaseViews/savedDatabaseViewState';

export type SavedDatabaseViewCreateResult =
  | { kind: 'created'; view: SavedDatabaseViewDto; count: number }
  | { kind: 'limit'; count: number };

export interface SavedDatabaseViewRepository {
  listForUser(userId: string): Promise<SavedDatabaseViewDto[]>;
  countForUser(userId: string): Promise<number>;
  createForUser(
    userId: string,
    name: string,
    viewState: SavedDatabaseViewStateV1,
    max: number
  ): Promise<SavedDatabaseViewCreateResult>;
  updateMetadataForUser(
    userId: string,
    id: string,
    updates: { name?: string; isPinned?: boolean }
  ): Promise<SavedDatabaseViewDto | null>;
  deleteForUser(userId: string, id: string): Promise<boolean>;
  bulkDeleteForUser(userId: string, ids: string[]): Promise<number>;
}
