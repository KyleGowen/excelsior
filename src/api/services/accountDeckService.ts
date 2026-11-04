import type { AccountDeckSnapshotInput } from '../http/models/decks/AccountDeckSnapshotRequestBody';
import type { DeckDraftEvaluationService } from './deckDraftEvaluationService';
import type { DeckCard } from '../../types';

export class AccountDeckError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); }
}
export interface AccountDeckView {
  metadata: { id: string; name: string; userId: string; isOwner: boolean; cardCount: number; is_limited: boolean; reserve_character: string | null; updatedAt: string };
  cards: DeckCard[];
  updatedAt: string;
}
export interface AccountDeckPersistence {
  list(userId: string): Promise<unknown>;
  load(id: string, viewerId: string): Promise<AccountDeckView | null>;
  save(userId: string, input: AccountDeckSnapshotInput, metrics: { valid: boolean; cardCount: number; threat: number }): Promise<AccountDeckView>;
}
/** Reuses the authoritative draft evaluator; never accepts client legality or ownership. */
export class AccountDeckService {
  constructor(private readonly repository: AccountDeckPersistence, private readonly evaluator: Pick<DeckDraftEvaluationService, 'evaluate' | 'attach'>) {}
  list(userId: string) { return this.repository.list(userId); }
  async load(id: string, viewerId: string) {
    const deck = await this.repository.load(id, viewerId);
    if (!deck) throw new AccountDeckError(404, 'DECK_NOT_FOUND');
    return this.evaluator.attach(deck);
  }
  async save(userId: string, input: AccountDeckSnapshotInput) {
    const evaluation = await this.evaluator.evaluate({ schemaVersion: 1, draftId: input.operationId, revision: 0, cards: input.cards, reserveCharacterId: input.reserveCharacterId, limited: input.limited, format: 'venture', koCharacterIds: [] });
    const saved = await this.repository.save(userId, input, { valid: evaluation.legality.valid, cardCount: evaluation.counts.drawPile, threat: evaluation.threat.editor });
    return this.evaluator.attach(saved);
  }
}
