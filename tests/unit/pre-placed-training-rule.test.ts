import { PrePlacedTrainingRule } from '../../src/services/deck-validation/rules/pre-placed-training.rule';
import { buildDeckValidationContext } from '../../src/services/deck-validation/deck-validation-context';
import type { DeckCard } from '../../src/types';

const SPARTAN_KEY = 'location_spartan_training_ground';

function makeCtx(cards: DeckCard[], withGround = true) {
    const availableCardsMap = new Map<string, Record<string, unknown>>();
    if (withGround) {
        availableCardsMap.set(SPARTAN_KEY, { name: 'Spartan Training Ground' });
    }
    return buildDeckValidationContext(cards, availableCardsMap);
}

function makeTeenTeamCtx(cards: DeckCard[]) {
    return buildDeckValidationContext(cards, new Map([
        ['location_teen_team_headquarters', { name: 'Teen Team Headquarters' }]
    ]));
}

function ground(): DeckCard {
    return { id: 'loc', type: 'location', cardId: 'spartan_training_ground', quantity: 1 };
}

function prePlacedTraining(cardId: string, quantity = 1): DeckCard {
    return { id: `tr_${cardId}`, type: 'training', cardId, quantity, exclude_from_draw: true };
}

describe('PrePlacedTrainingRule', () => {
    const rule = new PrePlacedTrainingRule();

    it('passes with 3 unique pre-placed Training cards', () => {
        const cards: DeckCard[] = [
            ground(),
            prePlacedTraining('tr1'),
            prePlacedTraining('tr2'),
            prePlacedTraining('tr3')
        ];
        expect(rule.validate(makeCtx(cards))).toEqual([]);
    });

    it('flags more than 3 total pre-placed Training cards (limit)', () => {
        const cards: DeckCard[] = [
            ground(),
            prePlacedTraining('tr1'),
            prePlacedTraining('tr2'),
            prePlacedTraining('tr3'),
            prePlacedTraining('tr4')
        ];
        const errors = rule.validate(makeCtx(cards));
        expect(errors.map(e => e.rule)).toContain('pre_placed_training_limit');
        const limit = errors.find(e => e.rule === 'pre_placed_training_limit');
        expect(limit?.message).toContain('found 4');
    });

    it('flags a duplicate pre-placed Training cardId (uniqueness)', () => {
        const cards: DeckCard[] = [
            ground(),
            prePlacedTraining('tr1'),
            prePlacedTraining('tr1')
        ];
        const errors = rule.validate(makeCtx(cards));
        expect(errors.map(e => e.rule)).toContain('pre_placed_training_unique');
    });

    it('treats a grouped duplicate row as one pre-placed copy', () => {
        const cards: DeckCard[] = [ground(), prePlacedTraining('tr1', 2)];
        expect(rule.validate(makeCtx(cards))).toEqual([]);
    });

    it('returns no errors when Spartan Training Ground is absent', () => {
        const cards: DeckCard[] = [
            prePlacedTraining('tr1'),
            prePlacedTraining('tr2'),
            prePlacedTraining('tr3'),
            prePlacedTraining('tr4')
        ];
        expect(rule.validate(makeCtx(cards, false))).toEqual([]);
    });

    it('ignores Training cards that are not pre-placed', () => {
        const cards: DeckCard[] = [
            ground(),
            { id: 'tr_a', type: 'training', cardId: 'tr1', quantity: 5 }
        ];
        expect(rule.validate(makeCtx(cards))).toEqual([]);
    });

    it('applies the same cap and uniqueness rules with Teen Team Headquarters', () => {
        const cards: DeckCard[] = [
            { id: 'loc', type: 'location', cardId: 'teen_team_headquarters', quantity: 1 },
            prePlacedTraining('tr1'),
            prePlacedTraining('tr1'),
            prePlacedTraining('tr2'),
            prePlacedTraining('tr3')
        ];
        const errors = rule.validate(makeTeenTeamCtx(cards));
        expect(errors.map(e => e.rule)).toEqual(expect.arrayContaining([
            'pre_placed_training_limit',
            'pre_placed_training_unique'
        ]));
        expect(errors.every(e => e.message.includes('Teen Team Headquarters'))).toBe(true);
    });
});
