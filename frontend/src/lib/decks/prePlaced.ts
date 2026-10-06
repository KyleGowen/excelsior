import type { DeckCardEntry } from '../api/types';
/** Presentation state only; eligibility is part of the server evaluation. */
export function isPrePlaced(entry:DeckCardEntry):boolean { return entry.exclude_from_draw === true; }
