import { DeckSizeRule } from '../../src/services/deck-validation/rules/deck-size.rule';
import type { DeckValidationContext } from '../../src/services/deck-validation/deck-validation-context';
import type { DeckCard } from '../../src/types';

function makeCtx(cards: DeckCard[]): DeckValidationContext {
    return {
        cards,
        availableCardsMap: new Map(),
        characterCards: cards.filter(c => c.type === 'character'),
        missionCards: cards.filter(c => c.type === 'mission'),
        eventCards: cards.filter(c => c.type === 'event'),
        locationCards: cards.filter(c => c.type === 'location'),
        battlegroundCards: cards.filter(c => c.type === 'battleground'),
        characterNames: [],
        characterStats: [],
        angryMobCharacterNames: []
    };
}

describe('DeckSizeRule', () => {
    const rule = new DeckSizeRule();

    it('counts only the draw pile (excludes characters, missions, locations, and Battlegrounds)', () => {
        // 45 draw-pile cards + 4 characters + 7 missions + 1 Battleground = 57 total cards,
        // but only 45 are in the draw pile, which is below the 51 minimum.
        const cards: DeckCard[] = [
            { id: 'c1', type: 'character', cardId: 'char1', quantity: 1 },
            { id: 'c2', type: 'character', cardId: 'char2', quantity: 1 },
            { id: 'c3', type: 'character', cardId: 'char3', quantity: 1 },
            { id: 'c4', type: 'character', cardId: 'char4', quantity: 1 },
            { id: 'm1', type: 'mission', cardId: 'mission1', quantity: 7 },
            { id: 'b1', type: 'battleground', cardId: 'gda', quantity: 1 },
            { id: 'p1', type: 'power', cardId: 'power1', quantity: 45 }
        ];
        const errors = rule.validate(makeCtx(cards));
        expect(errors).toHaveLength(1);
        expect(errors[0].rule).toBe('deck_size');
        expect(errors[0].message).toBe('Deck must have at least 51 cards in draw pile (45/51)');
    });

    it('passes when the draw pile reaches 51 with no events', () => {
        const cards: DeckCard[] = [
            { id: 'c1', type: 'character', cardId: 'char1', quantity: 1 },
            { id: 'c2', type: 'character', cardId: 'char2', quantity: 1 },
            { id: 'c3', type: 'character', cardId: 'char3', quantity: 1 },
            { id: 'c4', type: 'character', cardId: 'char4', quantity: 1 },
            { id: 'm1', type: 'mission', cardId: 'mission1', quantity: 7 },
            { id: 'p1', type: 'power', cardId: 'power1', quantity: 51 }
        ];
        expect(rule.validate(makeCtx(cards))).toEqual([]);
    });

    it('subtracts one physical copy from a grouped pre-placed row', () => {
        const cards: DeckCard[] = [
            { id: 't1', type: 'training', cardId: 'training1', quantity: 2, exclude_from_draw: true },
            { id: 'p1', type: 'power', cardId: 'power1', quantity: 50 }
        ];

        expect(rule.validate(makeCtx(cards))).toEqual([]);
    });

    it('reports the draw-pile count after subtracting a grouped pre-placed copy', () => {
        const cards: DeckCard[] = [
            { id: 't1', type: 'training', cardId: 'training1', quantity: 2, exclude_from_draw: true }
        ];

        const errors = rule.validate(makeCtx(cards));
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toBe('Deck must have at least 51 cards in draw pile (1/51)');
    });

    it('requires 56 draw-pile cards when events are present', () => {
        const cards: DeckCard[] = [
            { id: 'm1', type: 'mission', cardId: 'mission1', quantity: 7 },
            { id: 'e1', type: 'event', cardId: 'event1', quantity: 1 },
            { id: 'p1', type: 'power', cardId: 'power1', quantity: 50 }
        ];
        // Draw pile = 1 event + 50 power = 51, below the 56 events minimum.
        const errors = rule.validate(makeCtx(cards));
        expect(errors).toHaveLength(1);
        expect(errors[0].message).toBe('Deck must have at least 56 cards in draw pile (51/56)');
    });

    it('passes when the draw pile reaches 56 with events', () => {
        const cards: DeckCard[] = [
            { id: 'm1', type: 'mission', cardId: 'mission1', quantity: 7 },
            { id: 'e1', type: 'event', cardId: 'event1', quantity: 1 },
            { id: 'p1', type: 'power', cardId: 'power1', quantity: 55 }
        ];
        expect(rule.validate(makeCtx(cards))).toEqual([]);
    });
});
