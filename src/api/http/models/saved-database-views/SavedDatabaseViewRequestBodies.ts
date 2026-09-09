import { z } from 'zod';
import {
  SAVED_DATABASE_VIEW_LIMIT,
  SAVED_DATABASE_VIEW_NAME_MAX_LENGTH,
  savedDatabaseViewStateV1Schema
} from '../../../../savedDatabaseViews/savedDatabaseViewState';

const savedViewNameSchema = z.string()
  .trim()
  .min(1, 'Saved view name is required')
  .max(
    SAVED_DATABASE_VIEW_NAME_MAX_LENGTH,
    `Saved view name must be ${SAVED_DATABASE_VIEW_NAME_MAX_LENGTH} characters or fewer`
  );

export const CreateSavedDatabaseViewBody = z.object({
  name: savedViewNameSchema,
  viewState: savedDatabaseViewStateV1Schema
}).strict();

export const UpdateSavedDatabaseViewBody = z.object({
  name: savedViewNameSchema.optional(),
  isPinned: z.boolean().optional()
}).strict().refine((value) => value.name !== undefined || value.isPinned !== undefined, {
  message: 'At least one of name or isPinned is required'
});

export const BulkDeleteSavedDatabaseViewsBody = z.object({
  ids: z.array(z.uuid('Every saved view ID must be a UUID'))
    .min(1, 'At least one saved view ID is required')
    .max(SAVED_DATABASE_VIEW_LIMIT, `No more than ${SAVED_DATABASE_VIEW_LIMIT} IDs may be deleted at once`)
}).strict();

export const SavedDatabaseViewIdParam = z.uuid('Saved view ID must be a UUID');
