import { DraftStructureError, type DeckDraftEvaluationService } from './deckDraftEvaluationService';
import type { Deck, DeckCard } from '../../types';
import type { ValidationError } from '../../services/deckValidationService';
import { transformDeckDetail } from '../deckTransform';
import type { DeckDetailView } from './deckDetailService';

/** Repository surface for deck card CRUD (PostgreSQL deck repository). */
export interface DeckCardsRepository {
  getDeckSummaryWithAllCards?: (id: string) => Promise<Deck | undefined>;
  getDeckCards?: (deckId: string) => Promise<Array<{ type: string; cardId: string; quantity?: number }>>;
  getDeckById: (id: string) => Promise<Deck | undefined>;
  userOwnsDeck: (deckId: string, userId: string) => Promise<boolean>;
  addCardToDeck: (deckId: string, cardType: string, cardId: string, quantity: number) => Promise<boolean>;
  replaceAllCardsInDeck: (
    deckId: string,
    cards: Array<{
      cardType: string;
      cardId: string;
      quantity: number;
      displayOrder?: number;
      selectedAlternateImage?: string;
      exclude_from_draw?: boolean;
    }>
  ) => Promise<void>;
  removeCardFromDeck: (deckId: string, cardType: string, cardId: string, quantity: number) => Promise<boolean>;
  removeAllCardsFromDeck: (deckId: string) => Promise<boolean>;
  doesCardExistInDeck: (deckId: string, cardType: string, cardId: string) => Promise<boolean>;
  updateDeck: (deckId: string, updates: Partial<Deck>) => Promise<Deck | undefined>;
}

export interface DeckCardsValidationDeps {
  validateCardAddition: (
    currentCards: { type: string; cardId: string; quantity: number }[],
    cardType: string,
    cardId: string,
    quantity: number
  ) => Promise<string | null>;
  checkIfCardIsOnePerDeck: (cardType: string, cardId: string) => Promise<boolean>;
  checkIfCardIsCataclysm: (cardType: string, cardId: string) => Promise<boolean>;
  checkIfCardIsAssist: (cardType: string, cardId: string) => Promise<boolean>;
  checkIfCardIsAmbush: (cardType: string, cardId: string) => Promise<boolean>;
  checkIfCardIsFortification: (cardType: string, cardId: string) => Promise<boolean>;
  /** Full-deck legality check, used to keep decks.is_valid in sync after card changes. */
  validateDeck: (cards: DeckCard[]) => Promise<ValidationError[]>;
}

type CardRow = { type: string; cardId: string; quantity: number };

export class DeckCardsService {
  private static readonly MAX_QTY = 100;
  private static readonly MAX_BULK = 100;

  constructor(
    private readonly repo: DeckCardsRepository,
    private readonly validators: DeckCardsValidationDeps,
    private readonly evaluator?: Pick<DeckDraftEvaluationService, 'attach'>
  ) {}

  private readDeck(deckId: string): Promise<Deck | undefined> {
    return this.repo.getDeckSummaryWithAllCards ? this.repo.getDeckSummaryWithAllCards(deckId) : this.repo.getDeckById(deckId);
  }

  /**
   * Recompute the deck's full legality from its current cards and persist it to
   * `decks.is_valid` when it changed. Mutates `deck.is_valid` in place so the
   * detail response (via `transformDeckDetail`) reflects the fresh value —
   * `getDeckById` does not copy `is_valid` onto the returned row.
   */
  private async syncDeckValidity(deck: Deck): Promise<void> {
    try {
      const errors = await this.validators.validateDeck(deck.cards ?? []);
      const isValid = errors.length === 0;
      if ((deck.is_valid ?? false) !== isValid) {
        await this.repo.updateDeck(deck.id, { is_valid: isValid });
      }
      deck.is_valid = isValid;
    } catch (error) {
      deck.is_valid = false;
      await this.repo.updateDeck(deck.id, { is_valid: false });
      throw error;
    }
  }

  /**
   * GET deck cards — matches legacy: no ownership check; any authenticated user.
   */
  async getDeckCards(deckId: string): Promise<
    | { ok: true; data: Array<{ type: string; cardId: string; quantity?: number }> }
    | { ok: false; kind: 'not_implemented' | 'server_error' }
  > {
    if (!this.repo.getDeckCards) {
      return { ok: false, kind: 'not_implemented' };
    }
    try {
      const cards = await this.repo.getDeckCards(deckId);
      return { ok: true, data: cards };
    } catch (error) {
      console.error('Error fetching deck cards:', error);
      return { ok: false, kind: 'server_error' };
    }
  }

  async postCard(
    deckId: string,
    ownerUserId: string,
    cardType: string,
    cardId: string,
    quantity: number
  ): Promise<
    | { ok: true; data: DeckDetailView }
    | { ok: false; kind: 'bad_request' | 'forbidden' | 'not_found' | 'server_error'; message: string }
  > {
    try {
      const currentDeck = (await this.readDeck(deckId)) as Deck | undefined;
      if (!currentDeck) {
        return { ok: false, kind: 'not_found', message: 'Deck not found' };
      }
      if (currentDeck.user_id !== ownerUserId && !(await this.repo.userOwnsDeck(deckId, ownerUserId))) {
        return { ok: false, kind: 'forbidden', message: 'Access denied. You do not own this deck.' };
      }

      const currentCards = (currentDeck.cards || []) as CardRow[];
      const validationError = await this.validators.validateCardAddition(
        currentCards,
        cardType,
        cardId,
        quantity
      );
      if (validationError) {
        return { ok: false, kind: 'bad_request', message: validationError };
      }

      const isOnePerDeck = await this.validators.checkIfCardIsOnePerDeck(cardType, cardId);
      if (isOnePerDeck) {
        const cardExists = await this.repo.doesCardExistInDeck(deckId, cardType, cardId);
        if (cardExists) {
          return {
            ok: false,
            kind: 'bad_request',
            message: 'Cannot add more copies of this card - it is limited to one per deck'
          };
        }
      }

      const isCataclysm = await this.validators.checkIfCardIsCataclysm(cardType, cardId);
      if (isCataclysm) {
        for (const card of currentCards) {
          if (await this.validators.checkIfCardIsCataclysm(card.type, card.cardId)) {
            return {
              ok: false,
              kind: 'bad_request',
              message: 'Cannot add more than 1 Cataclysm to a deck'
            };
          }
        }
      }

      const isAssist = await this.validators.checkIfCardIsAssist(cardType, cardId);
      if (isAssist) {
        for (const card of currentCards) {
          if (await this.validators.checkIfCardIsAssist(card.type, card.cardId)) {
            return {
              ok: false,
              kind: 'bad_request',
              message: 'Cannot add more than 1 Assist to a deck'
            };
          }
        }
      }

      const isAmbush = await this.validators.checkIfCardIsAmbush(cardType, cardId);
      if (isAmbush) {
        for (const card of currentCards) {
          if (await this.validators.checkIfCardIsAmbush(card.type, card.cardId)) {
            return {
              ok: false,
              kind: 'bad_request',
              message: 'Cannot add more than 1 Ambush to a deck'
            };
          }
        }
      }

      const isFortification = await this.validators.checkIfCardIsFortification(cardType, cardId);
      if (isFortification) {
        for (const card of currentCards) {
          if (await this.validators.checkIfCardIsFortification(card.type, card.cardId)) {
            return {
              ok: false,
              kind: 'bad_request',
              message: 'Cannot add more than 1 Fortification to a deck'
            };
          }
        }
      }

      const success = await this.repo.addCardToDeck(deckId, cardType, cardId, quantity);
      if (!success) {
        return { ok: false, kind: 'not_found', message: 'Deck not found or failed to add card' };
      }

      const updatedDeck = await this.readDeck(deckId);
      if (!updatedDeck) {
        return { ok: false, kind: 'not_found', message: 'Deck not found' };
      }
      await this.syncDeckValidity(updatedDeck);
      return { ok: true, data: this.evaluator ? await this.evaluator.attach(transformDeckDetail(updatedDeck, ownerUserId)) : transformDeckDetail(updatedDeck, ownerUserId) };
    } catch {
      return { ok: false, kind: 'server_error', message: 'Failed to add card to deck' };
    }
  }

  async putReplaceCards(
    deckId: string,
    ownerUserId: string,
    cards: Array<{ cardType: string; cardId: string; quantity: number; displayOrder?: number; exclude_from_draw?: boolean }>
  ): Promise<
    | { ok: true; data: DeckDetailView }
    | { ok: false; kind: 'forbidden'; message: string }
    | { ok: false; kind: 'replace_failed'; status: 400 | 500; message: string; details?: string }
    | { ok: false; kind: 'server_error'; message: string }
  > {
    try {
      const currentDeck = await this.readDeck(deckId);
      if (!currentDeck) {
        return { ok: false, kind: 'replace_failed', status: 400, message: 'Deck not found' };
      }
      if (currentDeck.user_id !== ownerUserId && !(await this.repo.userOwnsDeck(deckId, ownerUserId))) {
        return { ok: false, kind: 'forbidden', message: 'Access denied. You do not own this deck.' };
      }

      // Structural/catalog resolution must finish before writing. Legality errors
      // remain editable: an invalid draft is saved with server-owned is_valid=false.
      await this.validators.validateDeck(cards.map((c, i) => ({ id: `replacement-${i}`, type: c.cardType as DeckCard['type'], cardId: c.cardId, quantity: c.quantity, exclude_from_draw: c.exclude_from_draw === true })));
      try {
        await this.repo.replaceAllCardsInDeck(deckId, cards);
      } catch (error: unknown) {
        const err = error as { message?: string };
        const details = err?.message || String(error);
        const isValidation = details.includes('does not exist');
        return {
          ok: false,
          kind: 'replace_failed',
          status: isValidation ? 400 : 500,
          message: 'Failed to replace cards in deck',
          details
        };
      }

      const updatedDeck = await this.readDeck(deckId);
      if (!updatedDeck) {
        return { ok: false, kind: 'server_error', message: 'Deck not found after replace' };
      }
      await this.syncDeckValidity(updatedDeck);
      return { ok: true, data: this.evaluator ? await this.evaluator.attach(transformDeckDetail(updatedDeck, ownerUserId)) : transformDeckDetail(updatedDeck, ownerUserId) };
    } catch (error) {
      if (error instanceof DraftStructureError) return { ok: false, kind: 'replace_failed', status: 400, message: error.message };
      console.error('Error replacing cards in deck:', error);
      return { ok: false, kind: 'server_error', message: 'Failed to replace cards in deck' };
    }
  }

  async deleteCards(
    deckId: string,
    ownerUserId: string,
    cardType: string,
    cardId: string,
    quantity: number
  ): Promise<
    | { ok: true; data: DeckDetailView }
    | { ok: false; kind: 'bad_request' | 'forbidden' | 'not_found' | 'server_error'; message: string }
  > {
    try {
      let success: boolean;
      const currentDeck = await this.readDeck(deckId);
      if (!currentDeck) {
        return { ok: false, kind: 'not_found', message: 'Deck not found' };
      }
      if (currentDeck.user_id !== ownerUserId && !(await this.repo.userOwnsDeck(deckId, ownerUserId))) {
        return { ok: false, kind: 'forbidden', message: 'Access denied. You do not own this deck.' };
      }

      if (cardType === 'all' && cardId === 'all') {
        success = await this.repo.removeAllCardsFromDeck(deckId);
      } else {
        success = await this.repo.removeCardFromDeck(deckId, cardType, cardId, quantity);
      }

      if (!success) {
        return { ok: false, kind: 'not_found', message: 'Deck not found or failed to remove card' };
      }

      const updatedDeck = await this.readDeck(deckId);
      if (!updatedDeck) {
        return { ok: false, kind: 'not_found', message: 'Deck not found' };
      }
      await this.syncDeckValidity(updatedDeck);
      return { ok: true, data: this.evaluator ? await this.evaluator.attach(transformDeckDetail(updatedDeck, ownerUserId)) : transformDeckDetail(updatedDeck, ownerUserId) };
    } catch {
      return { ok: false, kind: 'server_error', message: 'Failed to remove card from deck' };
    }
  }

  static maxQuantityPerEntry(): number {
    return DeckCardsService.MAX_QTY;
  }

  static maxBulkCards(): number {
    return DeckCardsService.MAX_BULK;
  }
}
