import type { DeckValidationRule } from '../deck-validation-rule';
import type { DeckValidationContext } from '../deck-validation-context';
import type { ValidationError } from '../validation-error';
import { deckValidationMessages } from '../deck-validation-messages';
import {
    deckCardMapKey,
    deckHasBattlegroundNamed,
    isRainbowBridgeAnyCharacterSpecial,
    RAINBOW_BRIDGE_BATTLEGROUND_NAME
} from '../deck-validation-utils';

export class RainbowBridgeAnyCharacterBattlegroundRule implements DeckValidationRule {
    readonly id = 'erb_any_character_requires_battleground';

    validate(ctx: DeckValidationContext): ValidationError[] {
        const needsRainbowBridge = ctx.cards.some(card => {
            if (card.type !== 'special' || card.quantity <= 0) return false;
            const special = ctx.availableCardsMap.get(deckCardMapKey(card));
            return Boolean(special && isRainbowBridgeAnyCharacterSpecial(special));
        });
        if (!needsRainbowBridge || deckHasBattlegroundNamed(ctx, RAINBOW_BRIDGE_BATTLEGROUND_NAME)) {
            return [];
        }
        return [{ rule: this.id, message: deckValidationMessages.erbAnyCharacterNeedsBattleground() }];
    }
}
