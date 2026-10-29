import { Pool } from 'pg';
import type { CardRepository } from '../../src/repository/CardRepository';
import type { DeckCard, PowerCard } from '../../src/types';
import { createDeckAddValidation } from '../../src/services/deck-add-validation/deck-add-validation';
import { buildDeckValidationContext } from '../../src/services/deck-validation/deck-validation-context';
import { OnePerDeckRule } from '../../src/services/deck-validation/rules/one-per-deck.rule';

// Read the migrated catalog so a bad seed/migration cannot hide behind mocked
// one_per_deck flags. No users, decks, or catalog records are written.
describe('migrated Power card copy limits', () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
  });
  let powers: PowerCard[];

  beforeAll(async () => {
    powers = (await pool.query<PowerCard>('SELECT * FROM power_cards')).rows;
  });
  afterAll(async () => { await pool.end(); });

  const duplicateErrors = (power: PowerCard) => {
    const cards: DeckCard[] = [{ id: 'copy-limit-fixture', type: 'power', cardId: power.id, quantity: 2 }];
    const catalog = new Map([[`power_${power.id}`, { ...power }]]);
    return new OnePerDeckRule().validate(buildDeckValidationContext(cards, catalog));
  };

  const addValidation = () => createDeckAddValidation({
    getPowerCardById: async (id: string) => powers.find(power => power.id === id)
  } as CardRepository);

  it.each(['Energy', 'Combat', 'Brute Force', 'Intelligence'])(
    'allows two copies of every level-7 %s printing, including TFCP promos', async (powerType) => {
      const printings = powers.filter(power => power.power_type === powerType && power.value === 7);
      expect(printings.length).toBeGreaterThan(0);
      expect(printings.some(power => power.set === 'TFCP')).toBe(true);
      for (const power of printings) {
        expect({ id: power.id, one_per_deck: power.one_per_deck })
          .toEqual({ id: power.id, one_per_deck: false });
        expect(duplicateErrors(power)).toEqual([]);
        expect(await addValidation().validateCardAddition(
          [{ type: 'power', cardId: power.id, quantity: 1 }], 'power', power.id, 1
        )).toBeNull();
        expect(await addValidation().validateCardAddition([], 'power', power.id, 2)).toBeNull();
      }
    }
  );

  it.each([
    ['Any-Power', 7],
    ['Multi-Power', 5]
  ] as const)('still restricts SKY %s level-%s cards to one copy', async (powerType, value) => {
    // SKY explicitly seeds these printings One Per Deck; legacy ERB
    // Any-Power printings have different flags and are outside this repair.
    const printings = powers.filter(power => power.set === 'SKY' && power.value === value &&
      power.power_type.replace(' ', '-') === powerType);
    expect(printings.length).toBeGreaterThan(0);
    for (const power of printings) {
      expect(power.one_per_deck).toBe(true);
      expect(duplicateErrors(power)).toEqual([
        expect.objectContaining({ rule: 'one_per_deck_violation' })
      ]);
      expect(await addValidation().validateCardAddition(
        [{ type: 'power', cardId: power.id, quantity: 1 }], 'power', power.id, 1
      )).toContain('limited to one per deck');
    }
  });
});
