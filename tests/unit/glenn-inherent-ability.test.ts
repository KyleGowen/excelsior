import fs from 'fs';
import path from 'path';
import { calculateDeckTotalThreat } from '../../src/services/deck-preview/../deck-evaluation/deckThreat';
import { isCatalogCardUsable } from '../../tests/helpers/serverCandidateCharacterization';
import type { CatalogCard, DeckCardEntry } from '../../frontend/src/lib/api/types';
import type { DeckUsabilityContext } from '../../tests/helpers/serverCandidateCharacterization';

describe('Glenn inherent ability', () => {
    const glenn: CatalogCard = {
        id: 'glenn',
        name: 'Glenn',
        energy: 2,
        combat: 3,
        brute_force: 3,
        intelligence: 5,
        threat_level: 15
    };

    it('uses 16 threat only when Glenn starts in Reserve', () => {
        const cards: DeckCardEntry[] = [
            { type: 'character', cardId: 'glenn', quantity: 1 }
        ];
        const lookup = (_type: string, id: string) => id === 'glenn' ? glenn : undefined;

        expect(calculateDeckTotalThreat(cards, null, lookup)).toBe(15);
        expect(calculateDeckTotalThreat(cards, 'glenn', lookup)).toBe(16);
    });

    it('allows Basic Universe cards regardless of Glenn\'s printed grid', () => {
        const ctx: DeckUsabilityContext = {
            characterNames: ['Glenn'],
            characterStats: [glenn as Required<Pick<CatalogCard, 'name' | 'energy' | 'combat' | 'brute_force' | 'intelligence'>>],
            angryMobCharacterNames: [],
            missionSets: new Set(),
            homebaseName: '',
            battlegroundName: '',
            hasGdaAnyCharacterSpecial: false,
            hasNonGdaAnyCharacterSpecial: false,
            characterCount: 1
        };
        const basicUniverse: CatalogCard = {
            id: 'basic-8-energy',
            type: 'Energy',
            value_to_use: '8 or greater'
        };

        expect(isCatalogCardUsable(basicUniverse, 'basic-universe', ctx)).toBe(true);
    });

    it('persists the reserve override and recalculates existing Glenn reserve decks', () => {
        const migration = fs.readFileSync(
            path.join(process.cwd(), 'migrations/V322__Apply_Glenn_inherent_ability.sql'),
            'utf8'
        );

        expect(migration).toContain("WHEN c.name = 'Glenn' AND c.id = reserve_character_id THEN 16");
        expect(migration).toContain('CREATE OR REPLACE FUNCTION update_deck_threat()');
        expect(migration).toContain('CREATE OR REPLACE FUNCTION update_deck_threat_on_reserve_change()');
        expect(migration).toContain("AND c.name = 'Glenn'");
    });
});
