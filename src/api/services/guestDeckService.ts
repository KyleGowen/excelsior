import type { Deck, DeckCard, DeckData } from '../../types';
import { transformDeckList, transformGuestDeckToListItem } from '../deckTransform';

const MAX_CARD_QUANTITY_PER_ENTRY = 100;
const NON_DECK_CARD_TYPES = new Set(['character', 'location', 'battleground', 'mission']);

type CardCountInput = {
  cardType?: string;
  type?: string;
  quantity?: number;
  exclude_from_draw?: boolean;
};

/** Keep session-deck metadata aligned with the persisted deck-count rule. */
function countCardsInDeck(cards: readonly CardCountInput[]): number {
  return cards
    .filter((card) => {
      const type = card.type ?? card.cardType;
      return !NON_DECK_CARD_TYPES.has(type ?? '');
    })
    .reduce(
      (sum, card) => sum + Math.max(0, (card.quantity ?? 1) - (card.exclude_from_draw === true ? 1 : 0)),
      0,
    );
}

export type GuestDeckPersistencePort = {
  createDeck: (sessionId: string, deckData: DeckData) => string;
  getDeck: (sessionId: string, deckId: string) => DeckData | null | undefined;
  getAllDecksForSession: (sessionId: string) => DeckData[];
  updateDeck: (sessionId: string, deckId: string, deckData: DeckData) => boolean;
  deleteDeck: (sessionId: string, deckId: string) => boolean;
};

export type GuestDeckRepositoryPort = {
  getDecksByUserId: (userId: string) => Promise<Deck[]>;
};

export interface GuestDeckServiceDeps {
  guestDeckPersistence: GuestDeckPersistencePort;
  deckRepository: GuestDeckRepositoryPort;
  validateCardAddition: (
    currentCards: { type: string; cardId: string; quantity: number }[],
    cardType: string,
    cardId: string,
    quantity: number
  ) => Promise<string | null>;
  checkIfCardIsOnePerDeck: (cardType: string, cardId: string) => Promise<boolean>;
  checkIfCardIsCataclysm: (cardType: string, cardId: string) => Promise<boolean>;
}

type Fail = { ok: false; status: number; code: string; message: string };
type Ok<T> = { ok: true; status: number; data: T };

function fail(status: number, code: string, message: string): Fail {
  return { ok: false, status, code, message };
}

function ok<T>(status: number, data: T): Ok<T> {
  return { ok: true, status, data };
}

export class GuestDeckService {
  constructor(private readonly deps: GuestDeckServiceDeps) {}

  createDeck(
    sessionId: string,
    input: { name: string; description: string }
  ): Ok<{ id: string; name: string; description: string; created_at: string; updated_at: string }> | Fail {
    const { name, description } = input;
    if (name.length > 100) {
      return fail(400, 'VALIDATION_ERROR', 'Deck name must be 100 characters or less');
    }
    if (description.length > 500) {
      return fail(400, 'VALIDATION_ERROR', 'Description must be 500 characters or less');
    }
    const now = new Date().toISOString();
    const deckData: DeckData = {
      metadata: {
        id: '',
        name,
        description,
        created: now,
        lastModified: now,
        cardCount: 0,
        userId: sessionId
      },
      cards: []
    };
    const deckId = this.deps.guestDeckPersistence.createDeck(sessionId, deckData);
    const created = this.deps.guestDeckPersistence.getDeck(sessionId, deckId)!;
    return ok(201, {
      id: deckId,
      name: created.metadata.name,
      description: created.metadata.description ?? '',
      created_at: created.metadata.created,
      updated_at: created.metadata.lastModified
    });
  }

  async listDecks(sessionId: string, userId: string): Promise<Ok<unknown[]> | Fail> {
    try {
      const dbDecks = await this.deps.deckRepository.getDecksByUserId(userId);
      const dbTransformed = transformDeckList(dbDecks);
      const sessionDecks = this.deps.guestDeckPersistence.getAllDecksForSession(sessionId);
      const sessionTransformed = sessionDecks.map(transformGuestDeckToListItem);
      return ok(200, [...dbTransformed, ...sessionTransformed]);
    } catch (error) {
      console.error('Error fetching guest decks:', error);
      return fail(500, 'GUEST_DECK_LIST_ERROR', 'Failed to fetch guest decks');
    }
  }

  getDeck(sessionId: string, deckId: string): Ok<{ metadata: Record<string, unknown>; cards: DeckCard[] }> | Fail {
    const deckData = this.deps.guestDeckPersistence.getDeck(sessionId, deckId);
    if (!deckData) {
      return fail(404, 'DECK_NOT_FOUND', 'Deck not found');
    }
    return ok(200, {
      metadata: {
        ...deckData.metadata,
        isOwner: true
      },
      cards: deckData.cards || []
    });
  }

  updateDeckMetadata(
    sessionId: string,
    deckId: string,
    body: { name?: string; description?: string | null; reserve_character?: string | null }
  ): Ok<ReturnType<typeof transformGuestDeckToListItem>> | Fail {
    const existing = this.deps.guestDeckPersistence.getDeck(sessionId, deckId);
    if (!existing) {
      return fail(404, 'DECK_NOT_FOUND', 'Deck not found');
    }
    const name =
      body.name !== undefined
        ? typeof body.name === 'string'
          ? body.name.trim()
          : existing.metadata.name
        : existing.metadata.name;
    const description =
      body.description !== undefined
        ? typeof body.description === 'string'
          ? body.description
          : existing.metadata.description
        : existing.metadata.description;
    let reserveCharacter = existing.metadata.reserve_character ?? null;
    if (body.reserve_character !== undefined) {
      if (body.reserve_character === null) {
        reserveCharacter = null;
      } else {
        const inDeck = (existing.cards ?? []).some(
          (c) => c.type === 'character' && c.cardId === body.reserve_character,
        );
        if (!inDeck) {
          return fail(400, 'VALIDATION_ERROR', 'Reserve character must be a character in the deck');
        }
        reserveCharacter = body.reserve_character;
      }
    }
    if (name.length > 100) {
      return fail(400, 'VALIDATION_ERROR', 'Deck name must be 100 characters or less');
    }
    if (description && description.length > 500) {
      return fail(400, 'VALIDATION_ERROR', 'Description must be 500 characters or less');
    }
    const updated: DeckData = {
      metadata: {
        ...existing.metadata,
        name,
        description: description ?? '',
        reserve_character: reserveCharacter,
        lastModified: new Date().toISOString()
      },
      cards: existing.cards
    };
    const success = this.deps.guestDeckPersistence.updateDeck(sessionId, deckId, updated);
    if (!success) {
      return fail(404, 'DECK_NOT_FOUND', 'Deck not found');
    }
    const result = this.deps.guestDeckPersistence.getDeck(sessionId, deckId)!;
    return ok(200, transformGuestDeckToListItem(result));
  }

  replaceCards(
    sessionId: string,
    deckId: string,
    cards: Array<{ cardType: string; cardId: string; quantity?: number; displayOrder?: number; exclude_from_draw?: boolean }>
  ): Ok<DeckData> | Fail {
    const existing = this.deps.guestDeckPersistence.getDeck(sessionId, deckId);
    if (!existing) {
      return fail(404, 'DECK_NOT_FOUND', 'Deck not found');
    }
    if (!Array.isArray(cards)) {
      return fail(400, 'VALIDATION_ERROR', 'Cards must be an array');
    }
    if (cards.length > 100) {
      return fail(400, 'VALIDATION_ERROR', 'Cannot replace more than 100 cards at once');
    }
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card || typeof card !== 'object') {
        return fail(400, 'VALIDATION_ERROR', `Card at index ${i} must be an object`);
      }
      if (!card.cardType || typeof card.cardType !== 'string' || card.cardType.trim().length === 0) {
        return fail(400, 'VALIDATION_ERROR', `Card at index ${i}: cardType is required`);
      }
      if (!card.cardId || typeof card.cardId !== 'string' || card.cardId.trim().length === 0) {
        return fail(400, 'VALIDATION_ERROR', `Card at index ${i}: cardId is required`);
      }
      if (
        card.quantity !== undefined &&
        (typeof card.quantity !== 'number' ||
          card.quantity < 1 ||
          card.quantity > MAX_CARD_QUANTITY_PER_ENTRY)
      ) {
        return fail(
          400,
          'VALIDATION_ERROR',
          `Card at index ${i}: quantity must be between 1 and ${MAX_CARD_QUANTITY_PER_ENTRY}`
        );
      }
      if (
        card.displayOrder !== undefined &&
        (!Number.isInteger(card.displayOrder) || card.displayOrder < 0 || card.displayOrder >= MAX_CARD_QUANTITY_PER_ENTRY)
      ) {
        return fail(
          400,
          'VALIDATION_ERROR',
          `Card at index ${i}: displayOrder must be an integer between 0 and ${MAX_CARD_QUANTITY_PER_ENTRY - 1}`
        );
      }
    }
    const cardCount = countCardsInDeck(cards);
    const mappedCards: DeckCard[] = cards.map((c, i) => ({
      id: `guest-${deckId}-${i}`,
      type: c.cardType as DeckCard['type'],
      cardId: c.cardId,
      quantity: c.quantity ?? 1,
      ...(c.displayOrder !== undefined && { displayOrder: c.displayOrder }),
      ...(c.exclude_from_draw !== undefined && { exclude_from_draw: c.exclude_from_draw })
    }));
    const updated: DeckData = {
      metadata: {
        ...existing.metadata,
        lastModified: new Date().toISOString(),
        cardCount
      },
      cards: mappedCards
    };
    const updateOk = this.deps.guestDeckPersistence.updateDeck(sessionId, deckId, updated);
    if (!updateOk) {
      return fail(404, 'DECK_NOT_FOUND', 'Deck not found');
    }
    const result = this.deps.guestDeckPersistence.getDeck(sessionId, deckId)!;
    return ok(200, result);
  }

  async addCard(
    sessionId: string,
    deckId: string,
    input: { cardType: string; cardId: string; quantity: number }
  ): Promise<Ok<DeckData> | Fail> {
    const existing = this.deps.guestDeckPersistence.getDeck(sessionId, deckId);
    if (!existing) {
      return fail(404, 'DECK_NOT_FOUND', 'Deck not found');
    }
    const { cardType, cardId, quantity: qty } = input;
    const currentCards = existing.cards || [];
    const validationError = await this.deps.validateCardAddition(currentCards, cardType, cardId, qty);
    if (validationError) {
      return fail(400, 'VALIDATION_ERROR', validationError);
    }
    const isOnePerDeck = await this.deps.checkIfCardIsOnePerDeck(cardType, cardId);
    if (isOnePerDeck && currentCards.some((c: DeckCard) => c.type === cardType && c.cardId === cardId)) {
      return fail(
        400,
        'VALIDATION_ERROR',
        'Cannot add more copies of this card - it is limited to one per deck'
      );
    }
    const isCataclysm = await this.deps.checkIfCardIsCataclysm(cardType, cardId);
    if (isCataclysm) {
      let hasExisting = false;
      for (const c of currentCards) {
        if (await this.deps.checkIfCardIsCataclysm(c.type, c.cardId)) {
          hasExisting = true;
          break;
        }
      }
      if (hasExisting) {
        return fail(400, 'VALIDATION_ERROR', 'Cannot add more than 1 Cataclysm to a deck');
      }
    }
    const newCard: DeckCard = {
      id: `guest-${deckId}-${currentCards.length}`,
      type: cardType as DeckCard['type'],
      cardId,
      quantity: qty
    };
    const updatedCards = [...currentCards, newCard];
    const cardCount = countCardsInDeck(updatedCards);
    const updated: DeckData = {
      metadata: {
        ...existing.metadata,
        lastModified: new Date().toISOString(),
        cardCount
      },
      cards: updatedCards
    };
    const updateOk = this.deps.guestDeckPersistence.updateDeck(sessionId, deckId, updated);
    if (!updateOk) {
      return fail(404, 'DECK_NOT_FOUND', 'Deck not found');
    }
    const result = this.deps.guestDeckPersistence.getDeck(sessionId, deckId)!;
    return ok(200, result);
  }

  deleteDeck(sessionId: string, deckId: string): Ok<Record<string, never>> | Fail {
    const deleted = this.deps.guestDeckPersistence.deleteDeck(sessionId, deckId);
    if (!deleted) {
      return fail(404, 'DECK_NOT_FOUND', 'Deck not found');
    }
    return ok(200, {});
  }
}
