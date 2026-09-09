import { PrePlacedBasicUniverseRule } from '../../src/services/deck-validation/rules/pre-placed-basic-universe.rule';
import { buildDeckValidationContext } from '../../src/services/deck-validation/deck-validation-context';
import type { DeckCard } from '../../src/types';

const DRACULAS_ARMORY_KEY = 'location_draculas_armory';

function makeCtx(cards: DeckCard[], withArmory = true) {
    const availableCardsMap = new Map<string, Record<string, unknown>>();
    if (withArmory) {
        availableCardsMap.set(DRACULAS_ARMORY_KEY, { name: "Dracula's Armory" });
    }
    return buildDeckValidationContext(cards, availableCardsMap);
}

function makeSanctuaryCtx(cards: DeckCard[]) {
    return buildDeckValidationContext(cards, new Map([
        ['location_the_sanctuary', { name: 'The Sanctuary' }]
    ]));
}

function armory(): DeckCard {
    return { id: 'loc', type: 'location', cardId: 'draculas_armory', quantity: 1 };
}

function prePlacedBU(cardId: string, quantity = 1): DeckCard {
    return { id: `bu_${cardId}`, type: 'basic-universe', cardId, quantity, exclude_from_draw: true };
}

describe('PrePlacedBasicUniverseRule', () => {
    const rule = new PrePlacedBasicUniverseRule();

    it('passes with 3 unique pre-placed Basic Universe cards', () => {
        const cards: DeckCard[] = [
            armory(),
            prePlacedBU('bu1'),
            prePlacedBU('bu2'),
            prePlacedBU('bu3')
        ];
        expect(rule.validate(makeCtx(cards))).toEqual([]);
    });

    it('flags more than 3 total pre-placed Basic Universe cards (limit)', () => {
        const cards: DeckCard[] = [
            armory(),
            prePlacedBU('bu1'),
            prePlacedBU('bu2'),
            prePlacedBU('bu3'),
            prePlacedBU('bu4')
        ];
        const errors = rule.validate(makeCtx(cards));
        expect(errors.map(e => e.rule)).toContain('pre_placed_basic_universe_limit');
        const limit = errors.find(e => e.rule === 'pre_placed_basic_universe_limit');
        expect(limit?.message).toContain('found 4');
    });

    it('flags a duplicate pre-placed Basic Universe cardId (uniqueness)', () => {
        const cards: DeckCard[] = [
            armory(),
            prePlacedBU('bu1'),
            prePlacedBU('bu1')
        ];
        const errors = rule.validate(makeCtx(cards));
        expect(errors.map(e => e.rule)).toContain('pre_placed_basic_universe_unique');
    });

    it('treats a grouped duplicate row as one pre-placed copy', () => {
        const cards: DeckCard[] = [armory(), prePlacedBU('bu1', 2)];
        expect(rule.validate(makeCtx(cards))).toEqual([]);
    });

    it('returns no errors when Dracula\'s Armory is absent', () => {
        const cards: DeckCard[] = [
            prePlacedBU('bu1'),
            prePlacedBU('bu2'),
            prePlacedBU('bu3'),
            prePlacedBU('bu4')
        ];
        expect(rule.validate(makeCtx(cards, false))).toEqual([]);
    });

    it('ignores Basic Universe cards that are not pre-placed', () => {
        const cards: DeckCard[] = [
            armory(),
            { id: 'bu_a', type: 'basic-universe', cardId: 'bu1', quantity: 5 }
        ];
        expect(rule.validate(makeCtx(cards))).toEqual([]);
    });

    it('applies the same cap and uniqueness rules with The Sanctuary', () => {
        const cards: DeckCard[] = [
            { id: 'loc', type: 'location', cardId: 'the_sanctuary', quantity: 1 },
            prePlacedBU('bu1'),
            prePlacedBU('bu1'),
            prePlacedBU('bu2'),
            prePlacedBU('bu3')
        ];
        const errors = rule.validate(makeSanctuaryCtx(cards));
        expect(errors.map(e => e.rule)).toEqual(expect.arrayContaining([
            'pre_placed_basic_universe_limit',
            'pre_placed_basic_universe_unique'
        ]));
        expect(errors.every(e => e.message.includes('The Sanctuary'))).toBe(true);
    });
});
