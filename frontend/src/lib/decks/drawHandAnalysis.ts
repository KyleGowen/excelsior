import type { UserRole } from '../api/types';
export interface DrawHandAnalysis { ventureTotal:number; duplicateCount:number; duplicateCardIndexes:Set<number>; }
/** Presentation visibility only; the server independently enforces ADMIN authorization. */
export function canAccessDrawHandAnalysis(role:UserRole | null | undefined): boolean { return role === 'ADMIN'; }
