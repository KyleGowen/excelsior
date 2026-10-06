import type { ImportCardEntry, ImportDeckCardsJson } from './importTypes';

function addCard(result: ImportCardEntry[], cardName: string, cardType: string): void {
  if (cardName && typeof cardName === 'string') {
    result.push({ name: cardName.trim(), type: cardType });
  }
}

function pushObjectArrayCards(
  result: ImportCardEntry[],
  grouped: Record<string, string[]> | undefined,
  cardType: string,
): void {
  if (!grouped || typeof grouped !== 'object') return;
  for (const cards of Object.values(grouped)) {
    if (Array.isArray(cards)) {
      cards.forEach((cardName) => addCard(result, cardName, cardType));
    }
  }
}

const STAT_TYPES = ['Brute Force', 'Energy', 'Combat', 'Intelligence'];
const BASIC_STAT_TYPES = ['Brute Force', 'Any-Power', 'Energy', 'Combat', 'Intelligence'];

/**
 * Flatten v2.0 deck export JSON `cards` object into typed card entries.
 * Ported from src/services/deckExportImport/extractCardsFromExportJson.ts.
 */
export function extractCardsFromImportJson(cardsData: ImportDeckCardsJson): ImportCardEntry[] {
  const result: ImportCardEntry[] = [];

  if (Array.isArray(cardsData.characters)) {
    cardsData.characters.forEach((cardName) => addCard(result, cardName, 'character'));
  }

  pushObjectArrayCards(result, cardsData.special_cards, 'special');

  if (Array.isArray(cardsData.locations)) {
    cardsData.locations.forEach((cardName) => addCard(
      result,
      cardName,
      cardName.trim() === 'Global Defense Agency' ? 'battleground' : 'location',
    ));
  }

  if (Array.isArray(cardsData.battlegrounds)) {
    cardsData.battlegrounds.forEach((cardName) => addCard(result, cardName, 'battleground'));
  }

  pushObjectArrayCards(result, cardsData.missions, 'mission');
  pushObjectArrayCards(result, cardsData.events, 'event');

  if (Array.isArray(cardsData.aspects)) {
    cardsData.aspects.forEach((cardName) => addCard(result, cardName, 'aspect'));
  }

  pushObjectArrayCards(result, cardsData.advanced_universe, 'advanced-universe');

  if (Array.isArray(cardsData.teamwork)) {
    for (const cardName of cardsData.teamwork) {
      if (!cardName || typeof cardName !== 'string') continue;
      const trimmedName = cardName.trim();
      const dashIndex = trimmedName.indexOf(' - ');
      if (dashIndex > 0) {
        result.push({
          name: trimmedName.substring(0, dashIndex).trim(),
          type: 'teamwork',
          followup_attack_types: trimmedName.substring(dashIndex + 3).trim(),
        });
      } else {
        result.push({ name: trimmedName, type: 'teamwork' });
      }
    }
  }

  if (Array.isArray(cardsData.allies)) {
    for (const cardName of cardsData.allies) {
      if (!cardName || typeof cardName !== 'string') continue;
      const trimmedName = cardName.trim();
      const dashIndex = trimmedName.indexOf(' - ');
      if (dashIndex > 0) {
        const baseName = trimmedName.substring(0, dashIndex).trim();
        const statInfo = trimmedName.substring(dashIndex + 3).trim();
        let statTypeToUse: string | null = null;
        let statToUse: string | null = null;
        for (const statType of STAT_TYPES) {
          if (statInfo.endsWith(` ${statType}`) || statInfo === statType) {
            statTypeToUse = statType;
            statToUse = statInfo.substring(0, statInfo.length - statType.length).trim() || null;
            break;
          }
        }
        if (!statTypeToUse) {
          if (STAT_TYPES.includes(statInfo)) {
            statTypeToUse = statInfo;
          } else {
            statToUse = statInfo;
          }
        }
        result.push({
          name: baseName,
          type: 'ally-universe',
          stat_to_use: statToUse,
          stat_type_to_use: statTypeToUse,
        });
      } else {
        result.push({ name: trimmedName, type: 'ally-universe' });
      }
    }
  }

  if (Array.isArray(cardsData.training)) {
    for (const cardName of cardsData.training) {
      if (!cardName || typeof cardName !== 'string') continue;
      const trimmedName = cardName.trim();
      const dashIndex = trimmedName.indexOf(' - ');
      if (dashIndex > 0) {
        const baseName = trimmedName.substring(0, dashIndex).trim();
        const suffix = trimmedName.substring(dashIndex + 3).trim();
        const bonusMatch = suffix.match(/^(.+?)\s*([+-]\d+)$/);
        let typesString = suffix;
        let bonus: string | null = null;
        if (bonusMatch) {
          typesString = bonusMatch[1].trim();
          bonus = bonusMatch[2].trim();
        } else if (/^[+-]\d+$/.test(suffix.trim())) {
          typesString = '';
          bonus = suffix.trim();
        }
        let type1: string | null = null;
        let type2: string | null = null;
        if (typesString.trim()) {
          const trimmedTypes = typesString.trim();
          if (trimmedTypes.startsWith('Brute Force')) {
            type1 = 'Brute Force';
            const remaining = trimmedTypes.substring(12).trim();
            if (remaining) {
              for (const statType of STAT_TYPES) {
                if (remaining === statType || remaining.startsWith(`${statType} `)) {
                  type2 = statType;
                  break;
                }
              }
            }
          } else {
            const words = trimmedTypes.split(/\s+/);
            if (words.length > 0 && STAT_TYPES.includes(words[0])) {
              type1 = words[0];
              const afterFirst = trimmedTypes.substring(type1.length).trim();
              if (afterFirst.startsWith('Brute Force')) {
                type2 = 'Brute Force';
              } else {
                for (const statType of STAT_TYPES) {
                  if (afterFirst === statType || afterFirst.startsWith(`${statType} `)) {
                    type2 = statType;
                    break;
                  }
                }
              }
            }
          }
        }
        result.push({ name: baseName, type: 'training', type_1: type1, type_2: type2, bonus });
      } else {
        result.push({ name: trimmedName, type: 'training' });
      }
    }
  }

  if (Array.isArray(cardsData.basic_universe)) {
    for (const cardName of cardsData.basic_universe) {
      if (!cardName || typeof cardName !== 'string') continue;
      const trimmedName = cardName.trim();
      const dashIndex = trimmedName.indexOf(' - ');
      if (dashIndex > 0) {
        const baseName = trimmedName.substring(0, dashIndex).trim();
        const suffix = trimmedName.substring(dashIndex + 3).trim();
        const bonusMatch = suffix.match(/^(.+?)\s*([+-]\d+)$/);
        let statInfo = suffix;
        let bonus: string | null = null;
        if (bonusMatch) {
          statInfo = bonusMatch[1].trim();
          bonus = bonusMatch[2].trim();
        } else if (/^[+-]\d+$/.test(suffix.trim())) {
          statInfo = '';
          bonus = suffix.trim();
        }
        let typeField: string | null = null;
        let valueToUse: string | null = null;
        if (statInfo.trim()) {
          const trimmedStatInfo = statInfo.trim();
          for (const statType of BASIC_STAT_TYPES) {
            if (trimmedStatInfo.startsWith(statType)) {
              typeField = statType;
              valueToUse = trimmedStatInfo.substring(statType.length).trim() || null;
              break;
            }
          }
          if (!typeField && BASIC_STAT_TYPES.includes(trimmedStatInfo)) {
            typeField = trimmedStatInfo;
          } else if (!typeField) {
            valueToUse = trimmedStatInfo;
          }
        }
        result.push({
          name: baseName,
          type: 'basic-universe',
          type_field: typeField,
          value_to_use: valueToUse,
          bonus,
        });
      } else {
        result.push({ name: trimmedName, type: 'basic-universe' });
      }
    }
  }

  if (Array.isArray(cardsData.power_cards)) {
    for (const cardName of cardsData.power_cards) {
      if (typeof cardName !== 'string' || !cardName.trim()) continue;
      const trimmed = cardName.trim();
      const m = trimmed.match(/^(\d+)\s*-\s*(.+)$/);
      if (m) {
        result.push({ name: `${parseInt(m[1], 10)} - ${m[2].trim()}`, type: 'power' });
      } else {
        result.push({ name: trimmed, type: 'power' });
      }
    }
  }

  return result;
}
