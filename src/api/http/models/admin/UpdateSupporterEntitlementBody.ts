import { z } from 'zod';

export const UpdateSupporterEntitlementSchema = z.object({
  action: z.enum(['grant', 'revoke']),
  duration: z.enum(['30_DAYS', '90_DAYS', '1_YEAR', 'CUSTOM', 'PERMANENT']).optional(),
  customExpiresAt: z.string().datetime({ offset: true }).optional(),
  reason: z.string().trim().min(3).max(500)
}).strict().superRefine((value, ctx) => {
  if (value.action === 'grant' && !value.duration) {
    ctx.addIssue({ code: 'custom', path: ['duration'], message: 'duration is required when granting Supporter access' });
  }
  if (value.action === 'grant' && value.duration === 'CUSTOM' && !value.customExpiresAt) {
    ctx.addIssue({ code: 'custom', path: ['customExpiresAt'], message: 'customExpiresAt is required for a custom grant' });
  }
  if (value.duration !== 'CUSTOM' && value.customExpiresAt) {
    ctx.addIssue({ code: 'custom', path: ['customExpiresAt'], message: 'customExpiresAt is only allowed for a custom grant' });
  }
});

export type UpdateSupporterEntitlementBody = z.infer<typeof UpdateSupporterEntitlementSchema>;

