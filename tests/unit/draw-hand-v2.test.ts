import type { CatalogCard, DeckCardEntry } from '../../frontend/src/lib/api/types';
import {
  buildDrawPile,
  canDrawHand,
  countCardsInDeck,
  countPlayableCards,
  drawRandomHand,
  sortDrawnHandCards,
} from '../../frontend/src/lib/decks/drawHand';
import {
  analyzeDrawnHand,
  canAccessDrawHandAnalysis,
  drawHandVentureValue,
} from '../../frontend/src/lib/decks/drawHandAnalysis';
import { buildDeckCardIndex } from '../../frontend/src/lib/decks/deckCardCatalog';

function entry(
  type: DeckCardEntry['type'],
  cardId: string,
  overrides: Partial<DeckCardEntry> = {},
): DeckCardEntry {
  return { type, cardId, quantity: 1, ...overrides };
}

function power(id: string, overrides: Partial<DeckCardEntry> = {}): DeckCardEntry {
  return entry('power', id, overrides);
}

describe('drawHand (v2)', () => {
  describe('countPlayableCards / canDrawHand', () => {
    it('counts playable types only', () => {
      const cards = [
        entry('character', 'c1'),
        entry('location', 'l1'),
        entry('mission', 'm1'),
        power('p1'),
        power('p2'),
      ];
      expect(countPlayableCards(cards)).toBe(2);
    });

    it('sums quantity for enable threshold', () => {
      const cards = Array.from({ length: 7 }, (_, i) => power(`p${i}`));
      expect(canDrawHand(cards)).toBe(false);
      cards.push(power('p7'));
      expect(canDrawHand(cards)).toBe(true);
    });

    it('includes exclude_from_draw cards in enable count', () => {
      const cards = Array.from({ length: 7 }, (_, i) => power(`p${i}`));
      cards.push(power('excluded', { exclude_from_draw: true }));
      expect(countPlayableCards(cards)).toBe(8);
      expect(canDrawHand(cards)).toBe(true);
    });

    it('excludes one pre-placed copy from an aggregated row', () => {
      const cards = [
        power('p1', { quantity: 2 }),
        power('pre-placed', { quantity: 3, exclude_from_draw: true }),
        entry('location', 'l1'),
      ];

      expect(countCardsInDeck(cards)).toBe(4);
    });
  });

  describe('buildDrawPile', () => {
    it('excludes character, location, mission', () => {
      const cards = [
        entry('character', 'c1'),
        entry('location', 'l1'),
        entry('mission', 'm1'),
        power('p1'),
      ];
      expect(buildDrawPile(cards)).toHaveLength(1);
      expect(buildDrawPile(cards)[0].cardId).toBe('p1');
    });

    it('omits exclude_from_draw from pile', () => {
      const cards = [power('p1'), power('p2', { exclude_from_draw: true })];
      const pile = buildDrawPile(cards);
      expect(pile).toHaveLength(1);
      expect(pile[0].cardId).toBe('p1');
    });

    it('expands quantity into separate pile slots', () => {
      const cards = [power('p1', { quantity: 3 })];
      expect(buildDrawPile(cards)).toHaveLength(3);
    });

    it('omits only the pre-placed copy from an aggregated duplicate row', () => {
      const cards = [power('p1', { quantity: 3, exclude_from_draw: true })];
      expect(buildDrawPile(cards)).toHaveLength(2);
    });
  });

  describe('drawRandomHand', () => {
    it('returns empty array when pile is empty', () => {
      expect(drawRandomHand([entry('character', 'c1')])).toEqual([]);
    });

    it('draws at most pile size when fewer than 8 cards', () => {
      const cards = Array.from({ length: 5 }, (_, i) => power(`p${i}`));
      let call = 0;
      const hand = drawRandomHand(cards, {
        random: () => (call++ + 0.01) / 5,
      });
      expect(hand).toHaveLength(5);
    });

    it('draws exactly 8 from pile of 8+', () => {
      const cards = Array.from({ length: 12 }, (_, i) => power(`p${i}`));
      const sequence = [0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63];
      let i = 0;
      const hand = drawRandomHand(cards, {
        random: () => sequence[i++ % sequence.length],
      });
      expect(hand).toHaveLength(8);
      const ids = new Set(hand.map((c) => c.cardId));
      expect(ids.size).toBe(8);
    });

    it('draws 9th card when event in first 8 and pile > 8', () => {
      const cards = [
        entry('event', 'e1'),
        ...Array.from({ length: 10 }, (_, i) => power(`p${i}`)),
      ];
      const pileLen = 11;
      const picks = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      let i = 0;
      const hand = drawRandomHand(cards, {
        random: () => (picks[i++] + 0.01) / pileLen,
      });
      expect(hand.some((c) => c.type === 'event')).toBe(true);
      expect(hand).toHaveLength(9);
    });

    it('does not infinite loop on small piles', () => {
      const cards = [power('only')];
      expect(() => drawRandomHand(cards)).not.toThrow();
      expect(drawRandomHand(cards)).toHaveLength(1);
    });
  });

  describe('sortDrawnHandCards', () => {
    const catalogByType: CatalogCard[][] = [
      [{ id: 'sp1', name: 'Zap', character: 'Zatanna' } as CatalogCard],
      [{ id: 'pw1', name: '3 - Energy', value: 3, power_type: 'Energy' } as CatalogCard],
      [{ id: 'ev1', name: 'Big Event' } as CatalogCard],
    ];
    const index = buildDeckCardIndex(['special', 'power', 'event'], catalogByType);

    it('orders by deck section index (special before power before event)', () => {
      const drawn = [
        entry('event', 'ev1', { instanceId: 'e1' }),
        entry('power', 'pw1', { instanceId: 'p1' }),
        entry('special', 'sp1', { instanceId: 's1' }),
      ];
      const sorted = sortDrawnHandCards(drawn, index);
      expect(sorted.map((c) => c.type)).toEqual(['special', 'power', 'event']);
    });

    it('groups duplicate instances of the same card adjacent', () => {
      const drawn = [
        power('pw1', { instanceId: 'p2' }),
        power('pw1', { instanceId: 'p1' }),
      ];
      const sorted = sortDrawnHandCards(drawn, index);
      expect(sorted.map((c) => c.instanceId)).toEqual(['p1', 'p2']);
    });
  });

  describe('admin hand analysis', () => {
    const buildAnalysisIndex = (input: {
      characters?: CatalogCard[];
      specials?: CatalogCard[];
      powers?: CatalogCard[];
      teamwork?: CatalogCard[];
      allies?: CatalogCard[];
      training?: CatalogCard[];
      basic?: CatalogCard[];
    }) =>
      buildDeckCardIndex(
        ['character', 'special', 'power', 'teamwork', 'ally-universe', 'training', 'basic-universe'],
        [
          input.characters,
          input.specials,
          input.powers,
          input.teamwork,
          input.allies,
          input.training,
          input.basic,
        ],
      );

    it('shows the enhancement only to admins and entitled Supporter users', () => {
      expect(canAccessDrawHandAnalysis('ADMIN')).toBe(true);
      expect(canAccessDrawHandAnalysis('ADMIN', true)).toBe(true);
      expect(canAccessDrawHandAnalysis('USER', true)).toBe(true);
      expect(canAccessDrawHandAnalysis('USER')).toBe(false);
      expect(canAccessDrawHandAnalysis('GUEST')).toBe(false);
      expect(canAccessDrawHandAnalysis('GUEST', true)).toBe(false);
      expect(canAccessDrawHandAnalysis(null)).toBe(false);
      expect(canAccessDrawHandAnalysis(null, true)).toBe(false);
      expect(canAccessDrawHandAnalysis(undefined)).toBe(false);
    });

    it('totals the first screenshot values from catalog data', () => {
      const specials = [
        { id: 'allen-3', name: 'Bred for Battle', character: 'Allen the Alien', value: 3 },
        { id: 'pals', name: 'Pals', character: 'Billy the Kid', value: null },
        { id: 'charge-4', name: 'Charge into Battle!', character: 'Any Character', value: 4 },
        { id: 'merlin', name: "Merlin's Magic", character: 'Any Character', value: null },
      ] as CatalogCard[];
      const powers = [1, 4, 6, 7].map(
        (value) =>
          ({ id: `power-${value}`, name: `${value} Power`, value, power_type: 'Energy' }) as CatalogCard,
      );
      const index = buildAnalysisIndex({ specials, powers });
      const hand = [
        entry('special', 'allen-3'),
        entry('special', 'pals'),
        entry('special', 'charge-4'),
        entry('special', 'merlin'),
        ...powers.map((card) => power(card.id)),
      ];

      const result = analyzeDrawnHand(hand, hand, index);

      expect(result.ventureTotal).toBe(25);
      expect(result.duplicateCount).toBe(0);
      expect(result.duplicateCardIndexes.size).toBe(0);
    });

    it('returns 14 when same-value Power cards duplicate but a level-5 Special does not', () => {
      const special = {
        id: 'billy-5',
        name: "I'll Make You Famous",
        character: 'Billy the Kid',
        value: 5,
      } as CatalogCard;
      const powers = [
        { id: 'one-energy', name: '1 Energy', value: 1, power_type: 'Energy' },
        { id: 'one-brute', name: '1 Brute Force', value: 1, power_type: 'Brute Force' },
        { id: 'three-any', name: '3 Any-Power', value: 3, power_type: 'Any-Power' },
        { id: 'five-multi', name: '5 MultiPower', value: 5, power_type: 'Multi Power' },
        { id: 'five-brute', name: '5 Brute Force', value: 5, power_type: 'Brute Force' },
      ] as CatalogCard[];
      const index = buildAnalysisIndex({ specials: [special], powers });
      const hand = [entry('special', special.id), ...powers.map((card) => power(card.id))];

      const result = analyzeDrawnHand(hand, hand, index);

      expect(result.ventureTotal).toBe(14);
      expect(result.duplicateCount).toBe(2);
      expect([...result.duplicateCardIndexes]).toEqual([1, 2, 4, 5]);
    });

    it('returns 26 and one duplicate for the third screenshot pattern', () => {
      const specials = [
        { id: 'billy-5', name: "I'll Make You Famous", character: 'Billy the Kid', value: 5 },
        { id: 'billy-4', name: 'Quick Draw', character: 'Billy the Kid', value: 4 },
      ] as CatalogCard[];
      const powers = [
        { id: 'two-any', name: '2 Any-Power', value: 2, power_type: 'Any-Power' },
        { id: 'three-multi', name: '3 MultiPower', value: 3, power_type: 'Multi Power' },
        { id: 'three-brute', name: '3 Brute Force', value: 3, power_type: 'Brute Force' },
        { id: 'five-any', name: '5 Any-Power', value: 5, power_type: 'Any-Power' },
        { id: 'seven-brute', name: '7 Brute Force', value: 7, power_type: 'Brute Force' },
      ] as CatalogCard[];
      const index = buildAnalysisIndex({ specials, powers });
      const hand = [
        ...specials.map((card) => entry('special', card.id)),
        ...powers.map((card) => power(card.id)),
      ];

      const result = analyzeDrawnHand(hand, hand, index);

      expect(result.ventureTotal).toBe(26);
      expect(result.duplicateCount).toBe(1);
      expect([...result.duplicateCardIndexes]).toEqual([3, 4]);
    });

    it("returns 20 when Lilith's Swarm metadata is missing its printed level 5", () => {
      const lilithsSwarm = {
        id: 'liliths-swarm',
        name: "Lilith's Swarm",
        character: 'Any Character',
        value: null,
        card_effect:
          '**Assist!** Acts as a level 5 Any-Power attack. May make 1 additional attack.',
      } as CatalogCard;
      const powers = [2, 6, 7].map(
        (value) =>
          ({ id: `power-${value}`, name: `${value} Power`, value, power_type: 'Any-Power' }) as CatalogCard,
      );
      const index = buildAnalysisIndex({ specials: [lilithsSwarm], powers });
      const hand = [
        entry('special', lilithsSwarm.id),
        ...powers.map((card) => power(card.id)),
      ];

      expect(analyzeDrawnHand(hand, hand, index)).toEqual({
        ventureTotal: 20,
        duplicateCount: 0,
        duplicateCardIndexes: new Set(),
      });
    });

    it('does not infer a missing Special value when its text excludes it from Venture Total', () => {
      const excludedSpecial = {
        id: 'excluded-special',
        name: 'Excluded Special',
        value: null,
        card_effect: 'Acts as a level 8 attack. Does not count to Venture Total.',
      } as CatalogCard;
      const index = buildAnalysisIndex({ specials: [excludedSpecial] });

      expect(drawHandVentureValue(entry('special', excludedSpecial.id), index)).toBe(0);
    });

    it('counts every unkeepable copy across duplicate pairs and triples', () => {
      const powers = [
        { id: 'five-energy', name: '5 Energy', value: 5, power_type: 'Energy' },
        { id: 'five-brute', name: '5 Brute Force', value: 5, power_type: 'Brute Force' },
        { id: 'three-energy', name: '3 Energy', value: 3, power_type: 'Energy' },
        { id: 'three-brute', name: '3 Brute Force', value: 3, power_type: 'Brute Force' },
        { id: 'three-any', name: '3 Any-Power', value: 3, power_type: 'Any-Power' },
      ] as CatalogCard[];
      const index = buildAnalysisIndex({ powers });
      const hand = powers.map((card) => power(card.id));

      const result = analyzeDrawnHand(hand, hand, index);

      expect(result.ventureTotal).toBe(8);
      expect(result.duplicateCount).toBe(3);
      expect([...result.duplicateCardIndexes]).toEqual([0, 1, 2, 3, 4]);
    });

    it('honors named-Special duplicate allowances from character inherent abilities', () => {
      const zeus = {
        id: 'zeus',
        name: 'Zeus',
        special_abilities: 'May have 1 duplicate "Thunderbolt" Special; may not play Energy Teamwork cards.',
      } as CatalogCard;
      const thunderbolt = {
        id: 'thunderbolt',
        name: 'Thunderbolt',
        character: 'Zeus',
        value: 9,
      } as CatalogCard;
      const index = buildAnalysisIndex({ characters: [zeus], specials: [thunderbolt] });
      const deck = [entry('character', zeus.id)];
      const twoCopies = [
        entry('special', thunderbolt.id, { instanceId: 't1' }),
        entry('special', thunderbolt.id, { instanceId: 't2' }),
      ];

      expect(analyzeDrawnHand(twoCopies, deck, index)).toEqual({
        ventureTotal: 18,
        duplicateCount: 0,
        duplicateCardIndexes: new Set(),
      });

      const threeCopies = [
        ...twoCopies,
        entry('special', thunderbolt.id, { instanceId: 't3' }),
      ];
      const result = analyzeDrawnHand(threeCopies, deck, index);
      expect(result.ventureTotal).toBe(18);
      expect(result.duplicateCount).toBe(1);
      expect([...result.duplicateCardIndexes]).toEqual([0, 1, 2]);
    });

    it('honors unlimited named-Special duplicate wording from older character abilities', () => {
      const gambit = {
        id: 'gambit',
        name: 'Gambit',
        special_abilities: 'May have duplicate "Charge Object" Specials.',
      } as CatalogCard;
      const chargeObject = {
        id: 'charge-object',
        name: 'Charge Object',
        character: 'Gambit',
        value: 4,
      } as CatalogCard;
      const index = buildAnalysisIndex({ characters: [gambit], specials: [chargeObject] });
      const deck = [entry('character', gambit.id)];
      const hand = Array.from({ length: 3 }, (_, index) =>
        entry('special', chargeObject.id, { instanceId: `charge-${index}` }),
      );

      expect(analyzeDrawnHand(hand, deck, index)).toEqual({
        ventureTotal: 12,
        duplicateCount: 0,
        duplicateCardIndexes: new Set(),
      });
    });

    it('honors a Special card that lets the player keep one duplicate of itself', () => {
      const swarmThem = {
        id: 'swarm-them',
        name: 'Swarm Them!',
        character: 'Angry Mob',
        value: 0,
        card_effect: 'Angry Mob may keep 1 duplicate of this Special.',
      } as CatalogCard;
      const index = buildAnalysisIndex({ specials: [swarmThem] });
      const hand = Array.from({ length: 3 }, (_, index) =>
        entry('special', swarmThem.id, { instanceId: `swarm-${index}` }),
      );

      const result = analyzeDrawnHand(hand, hand, index);

      expect(result.duplicateCount).toBe(1);
      expect([...result.duplicateCardIndexes]).toEqual([0, 1, 2]);
    });

    it('reads attack values while excluding Basic and Training Universe bonuses', () => {
      const teamwork = { id: 'tw', name: 'Teamwork', acts_as: '6 Attack' } as CatalogCard;
      const ally = { id: 'ally', card_name: 'Ally', attack_value: 3 } as CatalogCard;
      const training = { id: 'training', card_name: 'Training', bonus: '+4' } as CatalogCard;
      const basic = { id: 'basic', card_name: 'Basic', bonus: '+3' } as CatalogCard;
      const index = buildAnalysisIndex({
        teamwork: [teamwork],
        allies: [ally],
        training: [training],
        basic: [basic],
      });

      expect(drawHandVentureValue(entry('teamwork', 'tw'), index)).toBe(6);
      expect(drawHandVentureValue(entry('ally-universe', 'ally'), index)).toBe(3);
      expect(drawHandVentureValue(entry('training', 'training'), index)).toBe(0);
      expect(drawHandVentureValue(entry('basic-universe', 'basic'), index)).toBe(0);

      expect(analyzeDrawnHand(
        [
          entry('teamwork', 'tw'),
          entry('ally-universe', 'ally'),
          entry('training', 'training'),
          entry('basic-universe', 'basic'),
        ],
        [],
        index,
      ).ventureTotal).toBe(9);
    });

    it('returns 17 for the reported hand instead of adding its +4 Training and +2 Basic bonuses', () => {
      const specials = [
        {
          id: 'pitchforks-and-torches',
          name: 'Pitchforks and Torches',
          value: 7,
        },
        {
          id: 'online-cyber-attack',
          name: 'Online Cyber Attack',
          value: 7,
        },
      ] as CatalogCard[];
      const ally = {
        id: 'ally-attack-3',
        card_name: 'Ally attack',
        attack_value: 3,
      } as CatalogCard;
      const training = {
        id: 'training-plus-4',
        card_name: 'Training +4',
        bonus: '+4',
      } as CatalogCard;
      const basic = {
        id: 'basic-plus-2',
        card_name: 'Basic +2',
        bonus: '+2',
      } as CatalogCard;
      const index = buildAnalysisIndex({
        specials,
        allies: [ally],
        training: [training],
        basic: [basic],
      });
      const hand = [
        ...specials.map((card) => entry('special', card.id)),
        entry('ally-universe', ally.id),
        entry('training', training.id),
        entry('basic-universe', basic.id),
      ];

      expect(analyzeDrawnHand(hand, hand, index).ventureTotal).toBe(17);
    });
  });
});
