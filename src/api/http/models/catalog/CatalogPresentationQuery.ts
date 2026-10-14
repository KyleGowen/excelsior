import type { Request } from 'express';

/** Only an explicit scalar opt-in changes the legacy response representation. */
export function wantsCompactPresentation(req: Request): boolean {
  return req.query.compact === '1';
}
