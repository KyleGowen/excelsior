import { buildDeckUsabilityContext, isCatalogCardUsable } from '../../frontend/src/lib/deck-usability';
import type { CatalogCard, DeckCardEntry } from '../../frontend/src/lib/api/types';
import {
  buildKoDimmingContext,
  shouldDimDeckCard,
} from '../../frontend/src/lib/decks/simulateKo';
import { buildDeckValidationContext } from '../../src/services/deck-validation/deck-validation-context';
import { deckCardMapKey } from '../../src/services/deck-validation/deck-validation-utils';
import { UnusablePowerRule } from '../../src/services/deck-validation/rules/unusable-power.rule';
import type { DeckCard } from '../../src/types';

const characters: CatalogCard[] = [
  {
    id: 'alpha',
    name: 'Alpha and the Whisperers',
    energy: 2,
    combat: 4,
    brute_force: 6,
    intelligence: 5,
  },
  {
    id: 'walkers',
    name: 'Walkers: Herd',
    energy: 2,
    combat: 4,
    brute_force: 8,
    intelligence: 5,
  },
];

function frontendCharacter(cardId: string): DeckCardEntry {
  return { type: 'character', cardId, quantity: 1 };
}

function serverCharacter(cardId: string): DeckCard {
  return { id: `deck-${cardId}`, type: 'character', cardId, quantity: 1 };
}

function intelligencePower(value: number): CatalogCard {
  return {
    id: `intelligence-${value}`,
    name: `${value} - Intelligence`,
    power_type: 'Intelligence',
    value,
  };
}

function serverValidation(teamIds: string[], powerValues: number[]) {
  const characterCards = teamIds.map(serverCharacter);
  const powerCards: DeckCard[] = powerValues.map((value) => ({
    id: `deck-intelligence-${value}`,
    type: 'power',
    cardId: `intelligence-${value}`,
    quantity: 1,
  }));
  const cards = [...characterCards, ...powerCards];
  const availableCards = new Map<string, Record<string, unknown>>();

  characterCards.forEach((deckCard) => {
    const character = characters.find((candidate) => candidate.id === deckCard.cardId);
    if (character) availableCards.set(deckCardMapKey(deckCard), character);
  });
  powerCards.forEach((deckCard) => {
    const value = Number(deckCard.cardId.split('-')[1]);
    availableCards.set(deckCardMapKey(deckCard), intelligencePower(value));
  });

  const ctx = buildDeckValidationContext(cards, availableCards);
  return new UnusablePowerRule().validate(ctx);
}

describe("Alpha and the Whisperers' inherent ability", () => {
  it('allows level 6 and 7 Intelligence Power cards when Walkers: Herd starts on the team', () => {
    expect(serverValidation(['alpha', 'walkers'], [6, 7])).toEqual([]);
  });

  it('does not allow level 8 Intelligence or grant the permission without both characters', () => {
    expect(serverValidation(['alpha', 'walkers'], [8])).toHaveLength(1);
    expect(serverValidation(['alpha'], [6])).toHaveLength(1);
    expect(serverValidation(['walkers'], [6])).toHaveLength(1);
  });

  it('applies the same narrow permission in the Add Cards usability filter', () => {
    const fullTeamContext = buildDeckUsabilityContext(
      ['alpha', 'walkers'].map(frontendCharacter),
      { characters },
    );
    const alphaOnlyContext = buildDeckUsabilityContext(
      [frontendCharacter('alpha')],
      { characters },
    );

    expect(isCatalogCardUsable(intelligencePower(6), 'power-cards', fullTeamContext)).toBe(true);
    expect(isCatalogCardUsable(intelligencePower(7), 'power-cards', fullTeamContext)).toBe(true);
    expect(isCatalogCardUsable(intelligencePower(8), 'power-cards', fullTeamContext)).toBe(false);
    expect(isCatalogCardUsable(intelligencePower(6), 'power-cards', alphaOnlyContext)).toBe(false);
  });

  it('keeps the started-game permission after Walkers: Herd is simulated as KO\'d', () => {
    const deck = [
      frontendCharacter('alpha'),
      frontendCharacter('walkers'),
      { type: 'power', cardId: 'intelligence-7', quantity: 1 } satisfies DeckCardEntry,
    ];
    const cardIndex = new Map<string, CatalogCard>();
    characters.forEach((character) => {
      cardIndex.set(`character:${character.id}`, character);
    });
    cardIndex.set('power:intelligence-7', intelligencePower(7));

    const ctx = buildKoDimmingContext(deck, cardIndex, new Set(['walkers']));

    expect(shouldDimDeckCard(deck[2], intelligencePower(7), ctx)).toBe(false);
  });
});
