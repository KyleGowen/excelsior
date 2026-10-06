import { cardCharacterName, cardDisplayName } from './catalog';
import type { CatalogCard, DeckCardEntry } from './types';
import {
  normalizeDeckCardType,
  resolveDeckCatalogCard,
  type DeckCardIndex,
} from './catalog';
import type { DeckIconTotals } from '../deck-evaluation/iconTotals';

import type { ExportDeckJsonFull } from '../../api/dto/v1/DeckExportDto';
export type { ExportDeckJsonFull } from '../../api/dto/v1/DeckExportDto';
export interface BuildDeckExportJsonInput {
  name: string;
  description: string;
  cards: DeckCardEntry[];
  cardIndex: DeckCardIndex;
  reserveCharacterId: string | null;
  maxStats: {
    energy: number;
    combat: number;
    bruteForce: number;
    intelligence: number;
  };
  iconTotals: DeckIconTotals;
  totalThreat: number;
  totalCards: number;
  legal: boolean;
  limited: boolean;
  exportedBy: string;
  exportTimestamp?: string;
}

function catalogForCard(card: DeckCardEntry, cardIndex: DeckCardIndex): CatalogCard | undefined {
  return resolveDeckCatalogCard(card, cardIndex);
}

function exportNameFromCatalog(catalog: CatalogCard | undefined): string {
  if (!catalog) return 'Unknown Card';
  return cardDisplayName(catalog) || 'Unknown Card';
}

function pushRepeated(result: string[], value: string, quantity: number): void {
  const qty = quantity > 0 ? quantity : 1;
  for (let i = 0; i < qty; i++) {
    result.push(value);
  }
}

function createRepeatedCards(
  cards: DeckCardEntry[],
  cardType: string,
  cardIndex: DeckCardIndex,
): string[] {
  const result: string[] = [];
  cards
    .filter((card) => normalizeDeckCardType(card.type) === normalizeDeckCardType(cardType))
    .forEach((card) => {
      const catalog = catalogForCard(card, cardIndex);
      pushRepeated(result, exportNameFromCatalog(catalog), card.quantity);
    });
  return result;
}

function createTeamworkCards(cards: DeckCardEntry[], cardIndex: DeckCardIndex): string[] {
  const result: string[] = [];
  cards
    .filter((card) => card.type === 'teamwork')
    .forEach((card) => {
      const catalog = catalogForCard(card, cardIndex);
      if (!catalog) return;

      const baseName =
        String(catalog.to_use ?? '').trim() ||
        cardDisplayName(catalog) ||
        'Unknown Card';
      const followupTypes =
        catalog.followup_attack_types ?? catalog.follow_up_attack_types;
      const formattedName =
        followupTypes && typeof followupTypes === 'string' && followupTypes.trim()
          ? `${baseName} - ${followupTypes}`
          : baseName;

      pushRepeated(result, formattedName, card.quantity);
    });
  return result;
}

function createAllyCards(cards: DeckCardEntry[], cardIndex: DeckCardIndex): string[] {
  const result: string[] = [];
  cards
    .filter((card) => {
      const t = normalizeDeckCardType(card.type);
      return t === 'ally-universe';
    })
    .forEach((card) => {
      const catalog = catalogForCard(card, cardIndex);
      if (!catalog) return;

      const cardName = cardDisplayName(catalog) || 'Unknown Card';
      const statToUse = catalog.stat_to_use;
      const statTypeToUse = catalog.stat_type_to_use;

      const validStatTypeToUse =
        statTypeToUse && typeof statTypeToUse === 'string' && statTypeToUse.trim();
      const trimmedStatTypeToUse = validStatTypeToUse ? String(statTypeToUse).trim() : null;

      let formattedName = cardName;
      if (statToUse != null && trimmedStatTypeToUse) {
        formattedName = `${cardName} - ${statToUse} ${trimmedStatTypeToUse}`;
      } else if (trimmedStatTypeToUse) {
        formattedName = `${cardName} - ${trimmedStatTypeToUse}`;
      } else if (statToUse != null) {
        formattedName = `${cardName} - ${statToUse}`;
      }

      pushRepeated(result, formattedName, card.quantity);
    });
  return result;
}

function createBasicUniverseCards(cards: DeckCardEntry[], cardIndex: DeckCardIndex): string[] {
  const result: string[] = [];
  cards
    .filter((card) => card.type === 'basic-universe')
    .forEach((card) => {
      const catalog = catalogForCard(card, cardIndex);
      if (!catalog) return;

      const cardName = cardDisplayName(catalog) || 'Unknown Card';
      const typeField = catalog.type;
      const valueToUse = catalog.value_to_use;
      const bonus = catalog.bonus;

      const trimmedType =
        typeField && typeof typeField === 'string' && typeField.trim()
          ? typeField.trim()
          : null;
      const trimmedValueToUse =
        valueToUse && typeof valueToUse === 'string' && valueToUse.trim()
          ? valueToUse.trim()
          : null;
      const trimmedBonus =
        bonus && typeof bonus === 'string' && bonus.trim() ? bonus.trim() : null;

      const suffixParts: string[] = [];
      if (trimmedType && trimmedValueToUse) {
        suffixParts.push(`${trimmedType} ${trimmedValueToUse}`);
      } else if (trimmedType) {
        suffixParts.push(trimmedType);
      } else if (trimmedValueToUse) {
        suffixParts.push(trimmedValueToUse);
      }
      if (trimmedBonus) {
        suffixParts.push(trimmedBonus);
      }

      const formattedName =
        suffixParts.length > 0 ? `${cardName} - ${suffixParts.join(' ')}` : cardName;

      pushRepeated(result, formattedName, card.quantity);
    });
  return result;
}

function createTrainingCards(cards: DeckCardEntry[], cardIndex: DeckCardIndex): string[] {
  const result: string[] = [];
  cards
    .filter((card) => card.type === 'training')
    .forEach((card) => {
      const catalog = catalogForCard(card, cardIndex);
      if (!catalog) return;

      const cardName = cardDisplayName(catalog) || 'Unknown Card';
      const type1 = catalog.type_1;
      const type2 = catalog.type_2;
      const bonus = catalog.bonus;

      const trimmedType1 =
        type1 && typeof type1 === 'string' && type1.trim() ? type1.trim() : null;
      const trimmedType2 =
        type2 && typeof type2 === 'string' && type2.trim() ? type2.trim() : null;
      const trimmedBonus =
        bonus && typeof bonus === 'string' && bonus.trim() ? bonus.trim() : null;

      const suffixParts: string[] = [];
      if (trimmedType1 && trimmedType2) {
        suffixParts.push(`${trimmedType1} ${trimmedType2}`);
      } else if (trimmedType1) {
        suffixParts.push(trimmedType1);
      } else if (trimmedType2) {
        suffixParts.push(trimmedType2);
      }
      if (trimmedBonus) {
        suffixParts.push(trimmedBonus);
      }

      const formattedName =
        suffixParts.length > 0 ? `${cardName} - ${suffixParts.join(' ')}` : cardName;

      pushRepeated(result, formattedName, card.quantity);
    });
  return result;
}

const POWER_TYPE_ORDER: Record<string, number> = {
  Energy: 1,
  Combat: 2,
  'Brute Force': 3,
  Intelligence: 4,
  'Multi Power': 5,
  'Multi-Power': 5,
  'Any-Power': 6,
  'Any Power': 6,
};

function parsePowerCardName(name: string): { value: number; type: string } {
  const match = name.match(/^(\d+)\s*-\s*(.+)$/);
  if (match) {
    return { value: parseInt(match[1], 10), type: match[2].trim() };
  }
  return { value: 999, type: name };
}

function createSortedPowerCards(cards: DeckCardEntry[], cardIndex: DeckCardIndex): string[] {
  const result: string[] = [];
  cards
    .filter((card) => card.type === 'power')
    .forEach((card) => {
      const catalog = catalogForCard(card, cardIndex);
      pushRepeated(result, exportNameFromCatalog(catalog), card.quantity);
    });

  result.sort((a, b) => {
    const aParsed = parsePowerCardName(a);
    const bParsed = parsePowerCardName(b);
    if (aParsed.value !== bParsed.value) {
      return aParsed.value - bParsed.value;
    }
    const aTypeOrder = POWER_TYPE_ORDER[aParsed.type] ?? 99;
    const bTypeOrder = POWER_TYPE_ORDER[bParsed.type] ?? 99;
    return aTypeOrder - bTypeOrder;
  });

  return result;
}

function createCharactersArray(cards: DeckCardEntry[], cardIndex: DeckCardIndex): string[] {
  const result: string[] = [];
  cards
    .filter((card) => card.type === 'character')
    .forEach((card) => {
      const catalog = catalogForCard(card, cardIndex);
      pushRepeated(result, exportNameFromCatalog(catalog), card.quantity);
    });
  return result;
}

function createSpecialCardsByCharacter(
  cards: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  cards
    .filter((card) => card.type === 'special')
    .forEach((card) => {
      const catalog = catalogForCard(card, cardIndex);
      if (!catalog) return;

      const characterName = cardCharacterName(catalog) || 'Any Character';
      const cardName = cardDisplayName(catalog) || 'Unknown Card';
      if (!result[characterName]) {
        result[characterName] = [];
      }
      pushRepeated(result[characterName], cardName, card.quantity);
    });
  return result;
}

function createMissionsByMissionSet(
  cards: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  cards
    .filter((card) => card.type === 'mission')
    .forEach((card) => {
      const catalog = catalogForCard(card, cardIndex);
      if (!catalog) return;

      const missionSet = String(catalog.mission_set ?? '').trim() || 'Unknown Mission Set';
      const cardName = cardDisplayName(catalog) || 'Unknown Card';
      if (!result[missionSet]) {
        result[missionSet] = [];
      }
      pushRepeated(result[missionSet], cardName, card.quantity);
    });
  return result;
}

function createEventsByMissionSet(
  cards: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  cards
    .filter((card) => card.type === 'event')
    .forEach((card) => {
      const catalog = catalogForCard(card, cardIndex);
      if (!catalog) return;

      const missionSet = String(catalog.mission_set ?? '').trim() || 'Unknown Mission Set';
      const cardName = cardDisplayName(catalog) || 'Unknown Card';
      if (!result[missionSet]) {
        result[missionSet] = [];
      }
      pushRepeated(result[missionSet], cardName, card.quantity);
    });
  return result;
}

function createAdvancedUniverseByCharacter(
  cards: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  cards
    .filter((card) => card.type === 'advanced-universe')
    .forEach((card) => {
      const catalog = catalogForCard(card, cardIndex);
      if (!catalog) return;

      const characterName = String(catalog.character ?? '').trim() || 'Unknown Character';
      const cardName = cardDisplayName(catalog) || 'Unknown Card';
      if (!result[characterName]) {
        result[characterName] = [];
      }
      pushRepeated(result[characterName], cardName, card.quantity);
    });
  return result;
}

function resolveReserveCharacterName(
  cards: DeckCardEntry[],
  reserveCharacterId: string | null,
  cardIndex: DeckCardIndex,
): string | null {
  if (!reserveCharacterId) return null;
  const reserveCard = cards.find(
    (card) => card.type === 'character' && card.cardId === reserveCharacterId,
  );
  if (!reserveCard) return null;
  const catalog = catalogForCard(reserveCard, cardIndex);
  const name = exportNameFromCatalog(catalog);
  return name === 'Unknown Card' ? null : name;
}

function collectSpecialRootFields(
  cards: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): {
  cataclysm_special: string | null;
  assist_special: string | null;
  ambush_special: string | null;
} {
  let cataclysmSpecial: string | null = null;
  let assistSpecial: string | null = null;
  let ambushSpecial: string | null = null;

  cards
    .filter((card) => card.type === 'special')
    .forEach((card) => {
      const catalog = catalogForCard(card, cardIndex);
      if (!catalog) return;

      const cardName = cardDisplayName(catalog) || 'Unknown Card';
      const isCataclysm = catalog.is_cataclysm === true || catalog.cataclysm === true;
      const isAssist = catalog.is_assist === true || catalog.assist === true;
      const isAmbush = catalog.is_ambush === true || catalog.ambush === true;

      if (isCataclysm && !cataclysmSpecial) cataclysmSpecial = cardName;
      if (isAssist && !assistSpecial) assistSpecial = cardName;
      if (isAmbush && !ambushSpecial) ambushSpecial = cardName;
    });

  return {
    cataclysm_special: cataclysmSpecial,
    assist_special: assistSpecial,
    ambush_special: ambushSpecial,
  };
}

/** Build v2.0 deck export JSON (matches legacy `deck-export.js` contract). */
export function buildDeckExportJson(input: BuildDeckExportJsonInput): ExportDeckJsonFull {
  const { cards, cardIndex, reserveCharacterId } = input;
  const specialRoots = collectSpecialRootFields(cards, cardIndex);

  return {
    name: input.name,
    description: input.description,
    total_cards: input.totalCards,
    max_energy: input.maxStats.energy,
    max_combat: input.maxStats.combat,
    max_brute_force: input.maxStats.bruteForce,
    max_intelligence: input.maxStats.intelligence,
    total_energy_icons: input.iconTotals.energy,
    total_combat_icons: input.iconTotals.combat,
    total_brute_force_icons: input.iconTotals.bruteForce,
    total_intelligence_icons: input.iconTotals.intelligence,
    total_threat: input.totalThreat,
    legal: input.legal,
    limited: input.limited,
    export_timestamp: input.exportTimestamp ?? new Date().toISOString(),
    exported_by: input.exportedBy,
    reserve_character: resolveReserveCharacterName(cards, reserveCharacterId, cardIndex),
    cataclysm_special: specialRoots.cataclysm_special,
    assist_special: specialRoots.assist_special,
    ambush_special: specialRoots.ambush_special,
    cards: {
      characters: createCharactersArray(cards, cardIndex),
      special_cards: createSpecialCardsByCharacter(cards, cardIndex),
      locations: createRepeatedCards(cards, 'location', cardIndex),
      battlegrounds: createRepeatedCards(cards, 'battleground', cardIndex),
      missions: createMissionsByMissionSet(cards, cardIndex),
      events: createEventsByMissionSet(cards, cardIndex),
      aspects: createRepeatedCards(cards, 'aspect', cardIndex),
      advanced_universe: createAdvancedUniverseByCharacter(cards, cardIndex),
      teamwork: createTeamworkCards(cards, cardIndex),
      allies: createAllyCards(cards, cardIndex),
      training: createTrainingCards(cards, cardIndex),
      basic_universe: createBasicUniverseCards(cards, cardIndex),
      power_cards: createSortedPowerCards(cards, cardIndex),
    },
  };
}
