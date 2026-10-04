import { ServiceAccessService } from './serviceAccessService';
import { readServiceAccessConfig } from './serviceAccessConfig';
import { getLogger } from '../../middleware/logging';

/** One per-process client limiter, shared by token issuance and request authentication. */
export const configuredServiceAccess = new ServiceAccessService(readServiceAccessConfig, Date.now, event => {
  getLogger().info(event, 'service_access');
});
