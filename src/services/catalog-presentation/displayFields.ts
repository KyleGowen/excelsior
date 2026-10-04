import type { CatalogCard } from './types';
export function cardDisplayName(card: Partial<CatalogCard> | null | undefined): string {
  if (!card) return '';
  return (card.name as string) || (card.card_name as string) || '(Unnamed card)';
}
export function cardCharacterName(card: Partial<CatalogCard> | null | undefined): string {
  if (!card) return '';
  return String(card.character ?? card.character_name ?? '').trim();
}
const DBV_SEARCH_TEXT_FIELDS: (keyof CatalogCard)[] = [
  'mission_set',
  'special_abilities',
  'special_ability',
  'card_effect',
  'card_text',
  'card_description',
  'aspect_description',
  'game_effect',
  'stat_to_use',
  'stat_type_to_use',
  'attack_type',
];

function cardSearchTextFields(card: Partial<CatalogCard>): string[] {
  return DBV_SEARCH_TEXT_FIELDS.map((key) => String(card[key] ?? '').trim()).filter(Boolean);
}

export function cardSearchAliases(card: Partial<CatalogCard>): string[] {
  // Skybound #379 prints "The Green Farm"; its canonical linked location is "The Greene Farm".
  if (card.set === 'SKY' && card.set_number === '379' && cardDisplayName(card) === 'Hidden Danger') {
    return ['The Green Farm', 'The Greene Farm'];
  }
  return [];
}

/** Lowercase haystack for catalog search across name, character, mission set, and card text/abilities. */
export function cardSearchHaystack(card: Partial<CatalogCard> | null | undefined): string {
  if (!card) return '';
  return [
    cardDisplayName(card),
    cardCharacterName(card),
    ...cardSearchTextFields(card),
    ...cardSearchAliases(card),
  ]
    .join(' ')
    .toLowerCase();
}
