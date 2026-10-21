import { z } from 'zod';

// Accept PostgreSQL UUIDs, including the existing version-zero utility accounts.
export const PublicUserProfileParams = z.object({
  userId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
});
