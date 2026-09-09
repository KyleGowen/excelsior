import { api } from './client';
import type { DbvTabSelection } from '../catalog/catalogTypeMap';
import type { DbvFilterState } from '../../features/database/filters/dbvFilterTypes';

export const SAVED_DATABASE_VIEW_NAME_MAX_LENGTH = 80;

export interface SavedDatabaseViewStateV1 {
  schemaVersion: 1;
  tab: DbvTabSelection;
  search: string;
  setFilter: string;
  filters: DbvFilterState;
  hasFoilFilter: boolean;
  hideAltsFilter: boolean;
}

export interface SavedDatabaseView {
  id: string;
  name: string;
  viewState: SavedDatabaseViewStateV1;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedDatabaseViewList {
  views: SavedDatabaseView[];
  count: number;
  max: number;
}

export interface SavedDatabaseViewMutation {
  view: SavedDatabaseView;
  count: number;
  max: number;
}

export interface SavedDatabaseViewDeleteResult {
  deletedCount: number;
  notFoundCount: number;
  count: number;
  max: number;
}

const BASE = '/api/v1/saved-database-views';

export const fetchSavedDatabaseViews = (): Promise<SavedDatabaseViewList> => api.get(BASE);

export const createSavedDatabaseView = (
  name: string,
  viewState: SavedDatabaseViewStateV1,
): Promise<SavedDatabaseViewMutation> => api.post(BASE, { name, viewState });

export const updateSavedDatabaseView = (
  id: string,
  updates: { name?: string; isPinned?: boolean },
): Promise<SavedDatabaseViewMutation> => api.patch(`${BASE}/${id}`, updates);

export const deleteSavedDatabaseView = (id: string): Promise<SavedDatabaseViewDeleteResult> =>
  api.del(`${BASE}/${id}`);

export const bulkDeleteSavedDatabaseViews = (ids: string[]): Promise<SavedDatabaseViewDeleteResult> =>
  api.post(`${BASE}/bulk-delete`, { ids });
