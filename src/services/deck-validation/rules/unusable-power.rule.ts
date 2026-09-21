import type { DeckValidationRule } from '../deck-validation-rule';
import type { ValidationError } from '../validation-error';
import type { DeckValidationContext } from '../deck-validation-context';
import {
    deckCardMapKey,
    hasAlphaIntelligencePowerCardAllowance,
    isMultiPowerPowerCardType,
    statForPowerType
} from '../deck-validation-utils';
import { deckValidationMessages } from '../deck-validation-messages';

export class UnusablePowerRule implements DeckValidationRule {
    readonly id = 'unusable_power';

    validate(ctx: DeckValidationContext): ValidationError[] {
        const errors: ValidationError[] = [];
        const deckPowerCards = ctx.cards.filter(card => card.type === 'power');
        for (const card of deckPowerCards) {
            const availableCard = ctx.availableCardsMap.get(deckCardMapKey(card));
            if (!availableCard) continue;

            const cardName = (availableCard.name as string) || 'Unknown Card';
            const powerType = availableCard.power_type as string | undefined;
            const value = availableCard.value as number | undefined;

            if (powerType && value != null) {
                if (isMultiPowerPowerCardType(powerType)) {
                    continue;
                }
                const canUse = ctx.characterStats.some(char => {
                    const characterStat = statForPowerType(char, powerType);
                    return (
                        characterStat >= value ||
                        hasAlphaIntelligencePowerCardAllowance(
                            char.name,
                            ctx.characterNames,
                            powerType,
                            value
                        )
                    );
                });

                if (!canUse) {
                    errors.push({
                        rule: 'unusable_power',
                        message: deckValidationMessages.unusablePower(cardName, value, powerType)
                    });
                }
            }
        }
        return errors;
    }
}
