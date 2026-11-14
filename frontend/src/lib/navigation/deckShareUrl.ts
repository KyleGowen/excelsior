import { isGuestDeckId } from '../api/decks';
import type { DeckMetadata } from '../api/types';
import { buildDeckEditorPath } from './deckEditorReturn';

// Legacy Guest IDs embed a session credential. Only copy opaque Guest IDs.
const opaqueGuestId = /^guest_[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export function buildDeckShareUrl(origin: string, { id, userId }: Pick<DeckMetadata, 'id' | 'userId'>): string | undefined {
  if (!id || !userId || (isGuestDeckId(id) && !opaqueGuestId.test(id))) return undefined;
  return new URL(buildDeckEditorPath(userId, id), origin).href;
}
