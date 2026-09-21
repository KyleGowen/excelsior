import { z } from 'zod';

export const CreateSupporterCheckoutBody = z.object({
  monthlyContributionUsd: z.number({ error: 'monthlyContributionUsd is required' })
    .int('monthlyContributionUsd must be a whole dollar amount')
    .safe('monthlyContributionUsd must be a safe integer')
}).strict();
