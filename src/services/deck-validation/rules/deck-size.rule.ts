import type { DeckValidationRule } from '../deck-validation-rule';
import type { ValidationError } from '../validation-error';
import type { DeckValidationContext } from '../deck-validation-context';
import { deckValidationMessages } from '../deck-validation-messages';

export class DeckSizeRule implements DeckValidationRule {
    readonly id = 'deck_size';

    validate(ctx: DeckValidationContext): ValidationError[] {
        const requiredSize = ctx.eventCards.length > 0 ? 56 : 51;
        // Only the draw pile counts toward the deck-size minimum. Characters,
        // missions, locations, and Battlegrounds are structural cards and are excluded
        // (matches the rulebook and the legacy client validator).
        const nonDrawPileTypes = new Set(['character', 'mission', 'location', 'battleground']);
        const totalCards = ctx.cards
            .filter(card => !nonDrawPileTypes.has(card.type))
            .reduce(
                (sum, card) => sum + Math.max(0, card.quantity - (card.exclude_from_draw === true ? 1 : 0)),
                0
            );
        if (totalCards < requiredSize) {
            return [
                {
                    rule: 'deck_size',
                    message: deckValidationMessages.deckSize(requiredSize, totalCards)
                }
            ];
        }
        return [];
    }
}
