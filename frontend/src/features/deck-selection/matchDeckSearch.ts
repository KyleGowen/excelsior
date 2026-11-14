import type { DeckMetadata } from '../../lib/api/types';

export function normalizeDeckSearch(value: string): string {
  return value.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.join(' ') ?? '';
}

function includesWholePhrase(name: string, query: string): boolean {
  return ` ${name} `.includes(` ${query} `);
}

function matchesCardName(name: string, query: string): boolean {
  const normalized = normalizeDeckSearch(name);
  if (query.length < 3) return includesWholePhrase(normalized, query);
  return ` ${normalized}`.includes(` ${query}`);
}

export function matchDeckSearch(deck: Pick<DeckMetadata, 'name' | 'cardNames'>, query: string) {
  if (!query) return { matches: true, cards: [] };
  const title = normalizeDeckSearch(deck.name);
  const titleMatches = query.length < 3 ? includesWholePhrase(title, query) : title.includes(query);
  const cards = deck.cardNames?.filter(name => matchesCardName(name, query)) ?? [];
  return { matches: titleMatches || cards.length > 0, cards };
}
