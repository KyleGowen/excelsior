import { buildDeckUsabilityContext, isCatalogCardUsable } from '../../tests/helpers/serverCandidateCharacterization';
import type {
  CatalogCard,
  DeckCardEntry,
  DeckListItem,
} from '../../frontend/src/lib/api/types';
import {
  buildCharStatsById,
  deckMaxStats,
} from '../../tests/helpers/serverGridCharacterization';
import {
  buildKoDimmingContext,
  calculateActiveTeamStats,
} from '../../src/services/deck-preview/simulateKo';
import { buildAddCardsEffectiveCharacterStats } from '../../tests/helpers/serverGridCharacterization';
import { buildDeckValidationContext } from '../../src/services/deck-validation/deck-validation-context';
import { deckCardMapKey } from '../../src/services/deck-validation/deck-validation-utils';
import { UnusablePowerRule } from '../../src/services/deck-validation/rules/unusable-power.rule';
import type { DeckCard } from '../../src/types';

const characters: CatalogCard[] = [
  {
    id: 'michonne',
    name: 'Michonne',
    energy: 1,
    combat: 7,
    brute_force: 2,
    intelligence: 6,
  },
  {
    id: 'rick',
    name: 'Rick Grimes',
    energy: 3,
    combat: 7,
    brute_force: 3,
    intelligence: 5,
  },
  {
    id: 'alexandria',
    name: 'Alexandria',
    energy: 5,
    combat: 6,
    brute_force: 4,
    intelligence: 5,
  },
];

function frontendCharacter(cardId: string): DeckCardEntry {
  return { type: 'character', cardId, quantity: 1 };
}

function serverCharacter(cardId: string): DeckCard {
  return { id: `deck-${cardId}`, type: 'character', cardId, quantity: 1 };
}

function serverValidation(teamIds: string[]) {
  const powerCard: DeckCard = {
    id: 'deck-combat-8',
    type: 'power',
    cardId: 'combat-8',
    quantity: 1,
  };
  const cards = [...teamIds.map(serverCharacter), powerCard];
  const availableCards = new Map<string, Record<string, unknown>>();
  teamIds.forEach((cardId) => {
    const character = characters.find((candidate) => candidate.id === cardId);
    if (character) {
      availableCards.set(deckCardMapKey(serverCharacter(cardId)), character);
    }
  });
  availableCards.set(deckCardMapKey(powerCard), {
    name: '8 - Combat',
    power_type: 'Combat',
    value: 8,
  });
  const ctx = buildDeckValidationContext(cards, availableCards);
  return { ctx, errors: new UnusablePowerRule().validate(ctx) };
}

describe("Michonne's inherent ability", () => {
  const fullTeamIds = ['michonne', 'rick', 'alexandria'];

  it('treats her Combat grid as 8 for server legality with Rick Grimes and Alexandria', () => {
    const { ctx, errors } = serverValidation(fullTeamIds);

    expect(ctx.characterStats.find((character) => character.name === 'Michonne')?.combat).toBe(8);
    expect(errors).toEqual([]);
  });

  it.each([
    ['Rick Grimes', ['michonne', 'alexandria']],
    ['Alexandria', ['michonne', 'rick']],
  ])('keeps her printed Combat 7 without %s', (_missingCharacter, teamIds) => {
    const { ctx, errors } = serverValidation(teamIds);

    expect(ctx.characterStats.find((character) => character.name === 'Michonne')?.combat).toBe(7);
    expect(errors).toHaveLength(1);
    expect(errors[0].rule).toBe('unusable_power');
  });

  it('allows Combat 8 in the Add Cards usability filter only for the complete team', () => {
    const combat8: CatalogCard = {
      id: 'combat-8',
      name: '8 - Combat',
      power_type: 'Combat',
      value: 8,
    };
    const fullTeamContext = buildDeckUsabilityContext(
      fullTeamIds.map(frontendCharacter),
      { characters },
    );
    const missingAlexandriaContext = buildDeckUsabilityContext(
      ['michonne', 'rick'].map(frontendCharacter),
      { characters },
    );

    expect(isCatalogCardUsable(combat8, 'power-cards', fullTeamContext)).toBe(true);
    expect(isCatalogCardUsable(combat8, 'power-cards', missingAlexandriaContext)).toBe(false);
  });

  it('shows Combat 8 in deck max stats for the complete team', () => {
    const deck: DeckListItem = {
      metadata: {
        id: 'deck-1',
        name: 'Walking Dead',
        cardCount: 3,
        userId: 'user-1',
        isOwner: true,
      },
      cards: fullTeamIds.map(frontendCharacter),
    };

    expect(deckMaxStats(deck, buildCharStatsById(characters))?.combat).toBe(8);
  });

  it('shows Combat 8 in the Add Cards Team pane only for the complete team', () => {
    const deckCatalogIndex = new Map<string, CatalogCard>();
    characters.forEach((character) => {
      deckCatalogIndex.set(`character:${character.id}`, character);
    });

    const fullTeamStats = buildAddCardsEffectiveCharacterStats(
      fullTeamIds.map(frontendCharacter),
      deckCatalogIndex,
    );
    const missingRickStats = buildAddCardsEffectiveCharacterStats(
      ['michonne', 'alexandria'].map(frontendCharacter),
      deckCatalogIndex,
    );

    expect(fullTeamStats.get('michonne')?.combat).toBe(8);
    expect(missingRickStats.get('michonne')?.combat).toBe(7);
  });

  it('keeps the started-game condition when an enabling teammate is simulated as KO\'d', () => {
    const deck = fullTeamIds.map(frontendCharacter);
    const cardIndex = new Map<string, CatalogCard>();
    characters.forEach((character) => {
      cardIndex.set(`character:${character.id}`, character);
    });

    const ctx = buildKoDimmingContext(deck, cardIndex, new Set(['rick']));
    expect(calculateActiveTeamStats(ctx).combat).toBe(8);
  });
});
