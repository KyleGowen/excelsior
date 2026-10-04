import type { V1ErrorBody } from '../../v1Envelope';

const MAX_CARD_QTY = 100;

/** Validated POST /api/v1/decks/:id/cards body (legacy POST /api/decks/:id/cards). */
export class DeckCardsPostBody {
  static readonly MAX_QTY = MAX_CARD_QTY;

  private constructor(
    readonly cardType: string,
    readonly cardId: string,
    readonly quantity: number
  ) {}

  static parse(body: unknown): { ok: true; value: DeckCardsPostBody } | { ok: false; errors: V1ErrorBody[] } {
    if (body === null || typeof body !== 'object') {
      return { ok: false, errors: [{ code: 'VALIDATION_ERROR', message: 'JSON body is required' }] };
    }
    const o = body as Record<string, unknown>;
    const errors: V1ErrorBody[] = [];

    const cardType = o.cardType;
    if (!cardType || typeof cardType !== 'string' || cardType.trim().length === 0) {
      errors.push({
        code: 'VALIDATION_ERROR',
        message: 'Card type is required and must be a non-empty string',
        field: 'cardType'
      });
    } else if (cardType.length > 50) {
      errors.push({
        code: 'VALIDATION_ERROR',
        message: 'Card type must be 50 characters or less',
        field: 'cardType'
      });
    }

    const cardId = o.cardId;
    if (!cardId || typeof cardId !== 'string' || cardId.trim().length === 0) {
      errors.push({
        code: 'VALIDATION_ERROR',
        message: 'Card ID is required and must be a non-empty string',
        field: 'cardId'
      });
    } else if (cardId.length > 100) {
      errors.push({
        code: 'VALIDATION_ERROR',
        message: 'Card ID must be 100 characters or less',
        field: 'cardId'
      });
    }

    const quantityRaw = o.quantity;
    let quantity = 1;
    if (quantityRaw !== undefined) {
      if (!Number.isInteger(quantityRaw) || typeof quantityRaw !== 'number' || quantityRaw < 1 || quantityRaw > MAX_CARD_QTY) {
        errors.push({
          code: 'VALIDATION_ERROR',
          message: `Quantity must be a number between 1 and ${MAX_CARD_QTY}`,
          field: 'quantity'
        });
      } else {
        quantity = quantityRaw;
      }
    }

    if (errors.length) return { ok: false, errors };

    return {
      ok: true,
      value: new DeckCardsPostBody(
        (cardType as string).trim(),
        (cardId as string).trim(),
        quantity
      )
    };
  }
}
