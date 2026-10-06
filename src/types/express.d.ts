import { User } from './index';
import type { ServicePrincipal } from '../api/access/serviceAccessService';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      serviceClient?: ServicePrincipal;
      serviceIdentity?: { clientId: string };
      databaseCanonicalPath?: string;
    }
  }
}
