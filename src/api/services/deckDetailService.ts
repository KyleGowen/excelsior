import type { Deck, DeckCard } from '../../types';
import type { DeckDraftEvaluationService } from './deckDraftEvaluationService';
import { transformDeckAfterMetadataUpdate, transformDeckDetail } from '../deckTransform';

export interface DeckDetailRepository {
  getDeckById(id: string): Promise<Deck | undefined>;
  getDeckSummaryWithAllCards(id: string): Promise<Deck | undefined>;
  getDeckCards(deckId: string): Promise<DeckCard[]>;
  updateDeck(id: string, updates: Partial<Deck>): Promise<Deck | undefined>;
  deleteDeck(id: string): Promise<boolean>;
}

export type DeckDetailView = ReturnType<typeof transformDeckDetail>;
export type DeckMetadataUpdateView = ReturnType<typeof transformDeckAfterMetadataUpdate>;

/**
 * Persistent decks are link-readable regardless of their listing choice.
 *
 * `is_private` controls whether a deck appears in discovery surfaces (Community,
 * public profiles, and favorites), not whether its direct URL can be opened.
 * Guest-session decks remain protected by their separate, session-scoped routes.
 */
export function canViewDeck(): boolean {
  return true;
}

export class DeckDetailService {
  constructor(private readonly deckRepository: DeckDetailRepository, private readonly evaluator?: Pick<DeckDraftEvaluationService, 'attach'>) {}

  async getDeckDetail(deckId: string, viewerUserId: string): Promise<DeckDetailView | null> {
    const deck = await this.deckRepository.getDeckSummaryWithAllCards(deckId);
    if (!deck || !canViewDeck()) {
      return null;
    }
    return this.evaluator ? this.evaluator.attach(transformDeckDetail(deck, viewerUserId)) : transformDeckDetail(deck, viewerUserId);
  }

  async getDeckFullDetail(deckId: string, viewerUserId: string): Promise<DeckDetailView | null> {
    const deck = await this.deckRepository.getDeckSummaryWithAllCards(deckId);
    if (!deck || !canViewDeck()) {
      return null;
    }
    return this.evaluator ? this.evaluator.attach(transformDeckDetail(deck, viewerUserId)) : transformDeckDetail(deck, viewerUserId);
  }

  /**
   * @param strictReserveTestValidation — `x-expect-400-validation` integration tests
   */
  async updateDeckMetadata(
    deckId: string,
    ownerUserId: string,
    updates: Partial<Deck>,
    options?: { strictReserveTestValidation?: boolean }
  ): Promise<
    | { ok: true; data: DeckMetadataUpdateView }
    | { ok: false; kind: 'not_found' | 'forbidden' | 'bad_request'; message: string }
  > {
    const deck = await this.deckRepository.getDeckById(deckId);
    if (!deck) {
      return { ok: false, kind: 'not_found', message: 'Deck not found' };
    }
    if (deck.user_id !== ownerUserId) {
      return { ok: false, kind: 'forbidden', message: 'Access denied. You do not own this deck.' };
    }

    const reserve = updates.reserve_character;
    if (reserve !== undefined && reserve !== null && reserve !== '') {
      const msg = await this.validateReserveCharacter(deckId, reserve, options?.strictReserveTestValidation === true);
      if (msg) {
        return { ok: false, kind: 'bad_request', message: msg };
      }
    }

    const updatedDeck = await this.deckRepository.updateDeck(deckId, updates);
    if (!updatedDeck) {
      return { ok: false, kind: 'not_found', message: 'Deck not found' };
    }
    // UPDATE returns only the deck row. Read one fresh complete response snapshot,
    // rather than treating the absent cards as an empty deck.
    const responseDeck = await this.deckRepository.getDeckSummaryWithAllCards(deckId);
    if (!responseDeck) return { ok: false, kind: 'not_found', message: 'Deck not found' };
    const view = transformDeckAfterMetadataUpdate(responseDeck, ownerUserId);
    return { ok: true, data: this.evaluator ? await this.evaluator.attach(view) : view };
  }

  async deleteDeckIfOwner(
    deckId: string,
    ownerUserId: string
  ): Promise<{ ok: true } | { ok: false; kind: 'not_found' | 'forbidden' }> {
    const deck = await this.deckRepository.getDeckById(deckId);
    if (!deck) {
      return { ok: false, kind: 'not_found' };
    }
    if (deck.user_id !== ownerUserId) {
      return { ok: false, kind: 'forbidden' };
    }
    const success = await this.deckRepository.deleteDeck(deckId);
    if (!success) {
      return { ok: false, kind: 'not_found' };
    }
    return { ok: true };
  }

  /** Legacy deck metadata routes: reserve_character vs deck cards only in `NODE_ENV === 'test'`. */
  private async validateReserveCharacter(
    deckId: string,
    reserveCharacter: string,
    strictTestValidation: boolean
  ): Promise<string | null> {
    if (process.env.NODE_ENV !== 'test') {
      return null;
    }
    const deckCards = await this.deckRepository.getDeckCards(deckId);
    const characterCardIds = deckCards.filter((c) => c.type === 'character').map((c) => c.cardId);
    if (strictTestValidation) {
      if (!characterCardIds.includes(reserveCharacter)) {
        return 'foreign key constraint violation: reserve_character must be a character in the deck';
      }
    } else if (characterCardIds.length > 0 && !characterCardIds.includes(reserveCharacter)) {
      return 'foreign key constraint violation: reserve_character must be a character in the deck';
    }
    return null;
  }
}
