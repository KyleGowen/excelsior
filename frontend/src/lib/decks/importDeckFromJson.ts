import { api, ApiError } from '../api/client';
import type { ImportDeckJson } from './importTypes';


export const DEFAULT_IMPORTED_DECK_NAME = 'Imported Deck';

export const UNRESOLVED_DISPLAY_LIMIT = 10;

export interface ImportDeckSuccess {
  ok: true;
  deckId: string;
  userId: string;
  cardsAdded: number;
}

export type ImportDeckFailure =
  | { ok: false; code: 'empty'; message: string }
  | { ok: false; code: 'parse'; message: string }
  | { ok: false; code: 'structure'; message: string }
  | { ok: false; code: 'no_cards'; message: string }
  | { ok: false; code: 'unresolved'; message: string; unresolved: Array<{ name: string; type: string }> }
  | { ok: false; code: 'api'; message: string };

export type ImportDeckResult = ImportDeckSuccess | ImportDeckFailure;

export function parseImportDeckJson(raw: string): ImportDeckJson {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('Please paste JSON data into the text area');
  }
  const data = JSON.parse(trimmed) as unknown;
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid import format: JSON must be an object');
  }
  const record = data as Record<string, unknown>;
  if (!record.cards || typeof record.cards !== 'object') {
    throw new Error('Invalid import format: Missing "cards" section');
  }
  return data as ImportDeckJson;
}

export function deckNameFromImportJson(
  exportData: ImportDeckJson,
  overrideName?: string,
): string {
  const trimmedOverride = overrideName?.trim();
  if (trimmedOverride) return trimmedOverride;
  const fromJson = exportData.name?.trim();
  if (fromJson) return fromJson;
  return DEFAULT_IMPORTED_DECK_NAME;
}

export async function importDeckFromJson(params:{exportData:ImportDeckJson;deckName:string;isGuest:boolean}):Promise<ImportDeckResult> {
 try {return await api.post<ImportDeckResult>(params.isGuest ? '/api/v1/guest/decks/import' : '/api/v1/decks/import',{exportData:params.exportData,name:params.deckName});}
 catch(error) {
  if (error instanceof ApiError && error.data && typeof error.data === 'object' && 'unresolved' in error.data) return error.data as ImportDeckFailure;
  return {ok:false,code:'api',message:(error as Error).message || 'Could not import deck'};
 }
}

export function formatUnresolvedImportError(
  unresolved: Array<{ name: string; type: string }>,
): string {
  const shown = unresolved.slice(0, UNRESOLVED_DISPLAY_LIMIT);
  const lines = shown.map((u) => `${u.name} (${u.type})`);
  const remainder = unresolved.length - shown.length;
  if (remainder > 0) {
    lines.push(`…and ${remainder} more`);
  }
  return `Unresolved cards:\n${lines.join('\n')}`;
}
