import type { V1ErrorBody } from '../../v1Envelope';

const MAX_CARD_QTY = 100;
const MAX_BULK = 100;

export type ReplaceCardInput = {
  cardType: string;
  cardId: string;
  quantity: number;
  displayOrder?: number;
  exclude_from_draw?: boolean;
};

/** Validated PUT /api/v1/decks/:id/cards body (`{ cards: [...] }`). */
export class DeckCardsPutBody {
  static readonly MAX_BULK_CARDS = MAX_BULK;

  private constructor(readonly cards: ReplaceCardInput[]) {}

  static parse(body: unknown): { ok: true; value: DeckCardsPutBody } | { ok: false; errors: V1ErrorBody[] } {
    if (body === null || typeof body !== 'object') {
      return { ok: false, errors: [{ code: 'VALIDATION_ERROR', message: 'JSON body is required' }] };
    }
    const o = body as Record<string, unknown>;
    const cardsRaw = o.cards;
    const errors: V1ErrorBody[] = [];

    if (!Array.isArray(cardsRaw)) {
      return { ok: false, errors: [{ code: 'VALIDATION_ERROR', message: 'Cards must be an array' }] };
    }

    if (cardsRaw.length > MAX_BULK) {
      return {
        ok: false,
        errors: [{ code: 'VALIDATION_ERROR', message: `Cannot replace more than ${MAX_BULK} cards at once` }]
      };
    }

    const cards: ReplaceCardInput[] = [];

    for (let i = 0; i < cardsRaw.length; i++) {
      const card = cardsRaw[i];
      if (!card || typeof card !== 'object') {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `Card at index ${i} must be an object`
        });
        break;
      }
      const c = card as Record<string, unknown>;

      const cardType = c.cardType;
      if (!cardType || typeof cardType !== 'string' || cardType.trim().length === 0) {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `Card at index ${i}: cardType is required and must be a non-empty string`
        });
        break;
      }

      const cardId = c.cardId;
      if (!cardId || typeof cardId !== 'string' || cardId.trim().length === 0) {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `Card at index ${i}: cardId is required and must be a non-empty string`
        });
        break;
      }

      const quantityRaw = c.quantity;
      let quantity = 1;
      if (quantityRaw !== undefined) {
        if (!Number.isInteger(quantityRaw) || typeof quantityRaw !== 'number' || quantityRaw < 1 || quantityRaw > MAX_CARD_QTY) {
          errors.push({
            code: 'VALIDATION_ERROR',
            message: `Card at index ${i}: quantity must be a number between 1 and ${MAX_CARD_QTY}`
          });
          break;
        }
        quantity = quantityRaw;
      }

      const entry: ReplaceCardInput = {
        cardType: cardType.trim(),
        cardId: cardId.trim(),
        quantity
      };

      if (c.displayOrder !== undefined) {
        if (!Number.isInteger(c.displayOrder) || (c.displayOrder as number) < 0 || (c.displayOrder as number) >= MAX_BULK) {
          errors.push({
            code: 'VALIDATION_ERROR',
            message: `Card at index ${i}: displayOrder must be an integer between 0 and ${MAX_BULK - 1}`
          });
          break;
        }
        entry.displayOrder = c.displayOrder as number;
      }

      if (c.exclude_from_draw !== undefined) {
        if (typeof c.exclude_from_draw !== 'boolean') {
          errors.push({
            code: 'VALIDATION_ERROR',
            message: `Card at index ${i}: exclude_from_draw must be a boolean when present`
          });
          break;
        }
        entry.exclude_from_draw = c.exclude_from_draw;
      }

      cards.push(entry);
    }

    if (errors.length) return { ok: false, errors };

    return { ok: true, value: new DeckCardsPutBody(cards) };
  }
}
