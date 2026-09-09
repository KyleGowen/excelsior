import type { SavedDatabaseViewStateV1 } from '../../../savedDatabaseViews/savedDatabaseViewState';

export interface SavedDatabaseViewDto {
  id: string;
  name: string;
  viewState: SavedDatabaseViewStateV1;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedDatabaseViewListDto {
  views: SavedDatabaseViewDto[];
  count: number;
  max: number;
}

export interface SavedDatabaseViewMutationDto {
  view: SavedDatabaseViewDto;
  count: number;
  max: number;
}

export interface SavedDatabaseViewDeleteDto {
  deletedCount: number;
  notFoundCount: number;
  count: number;
  max: number;
}
