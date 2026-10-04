import { z } from 'zod';

export const ServiceTokenRequestSchema = z.object({
  grant_type: z.literal('client_credentials'),
  client_id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
  client_secret: z.string().min(32).max(512),
  scope: z.string().max(256).optional(),
}).strict();
